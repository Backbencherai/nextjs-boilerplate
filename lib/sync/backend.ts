"use client";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { Activity, PlayerId } from "../types";
import { syncConfigSync } from "./config";

export interface WorldPos {
  player: PlayerId;
  x: number;
  z: number;
  ry: number;
  moving: boolean;
  zone?: string | null;
  t: number;
}

export interface Handlers {
  onInsert: (a: Activity) => void;
  onDelete: (id: string) => void;
  onPresence: (online: PlayerId[]) => void;
  onPos: (p: WorldPos) => void;
  onResync: (all: Activity[]) => void;
}

export interface Backend {
  mode: "cloud" | "local";
  load(): Promise<Activity[]>;
  insert(a: Activity): Promise<void>;
  remove(id: string): Promise<void>;
  connect(me: PlayerId, h: Handlers): () => void;
  sendPos(p: WorldPos): void;
}

export async function hashSpace(code: string): Promise<string> {
  const text = "adxd-universe:" + code.trim().toLowerCase();
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // non-secure-context fallback (e.g. LAN http dev): FNV-based, still deterministic
  let h1 = 0x811c9dc5,
    h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ text.charCodeAt(i), 2246822519);
  }
  return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padEnd(64, "0");
}

type Row = {
  id: string;
  space: string;
  player: PlayerId;
  kind: Activity["kind"];
  at: string;
  minutes: number | null;
  data: Record<string, unknown>;
  xp: number;
};

const toRow = (a: Activity, space: string): Row => ({
  id: a.id,
  space,
  player: a.player,
  kind: a.kind,
  at: a.at,
  minutes: a.minutes ?? null,
  data: a.data,
  xp: a.xp,
});
const fromRow = (r: Row): Activity => ({
  id: r.id,
  player: r.player,
  kind: r.kind,
  at: new Date(r.at).toISOString(),
  minutes: r.minutes ?? undefined,
  data: r.data ?? {},
  xp: r.xp,
});

const cacheKey = (space: string) => `adxd:acts:${space.slice(0, 16)}`;
const pendingKey = (space: string) => `adxd:pending:${space.slice(0, 16)}`;

function readJSON<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked */
  }
}

export function readCache(space: string): Activity[] {
  return readJSON<Activity[]>(cacheKey(space), []);
}
export function writeCache(space: string, acts: Activity[]) {
  writeJSON(cacheKey(space), acts);
}

/* ───────────────────────── Cloud (Supabase) ───────────────────────── */

class CloudBackend implements Backend {
  mode = "cloud" as const;
  private sb: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private lastPos = 0;

  constructor(url: string, key: string, private space: string) {
    this.sb = createClient(url, key, {
      global: { headers: { "x-space-key": space } },
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 12 } },
    });
  }

  async load(): Promise<Activity[]> {
    await this.flushPending();
    const all: Activity[] = [];
    let from = 0;
    const page = 1000;
    for (;;) {
      const { data, error } = await this.sb
        .from("activities")
        .select("*")
        .eq("space", this.space)
        .order("at", { ascending: true })
        .range(from, from + page - 1);
      if (error) throw error;
      all.push(...(data as Row[]).map(fromRow));
      if (!data || data.length < page) break;
      from += page;
    }
    // keep not-yet-uploaded rows visible
    const pending = readJSON<Activity[]>(pendingKey(this.space), []);
    const ids = new Set(all.map((a) => a.id));
    for (const p of pending) if (!ids.has(p.id)) all.push(p);
    return all;
  }

  private async flushPending() {
    const pending = readJSON<Activity[]>(pendingKey(this.space), []);
    if (!pending.length) return;
    const { error } = await this.sb.from("activities").upsert(pending.map((a) => toRow(a, this.space)));
    if (!error) {
      writeJSON(pendingKey(this.space), []);
      for (const a of pending) this.channel?.send({ type: "broadcast", event: "act", payload: a });
    }
  }

  async insert(a: Activity) {
    const { error } = await this.sb.from("activities").insert(toRow(a, this.space));
    if (error) {
      const pending = readJSON<Activity[]>(pendingKey(this.space), []);
      writeJSON(pendingKey(this.space), [...pending, a]);
      return;
    }
    this.channel?.send({ type: "broadcast", event: "act", payload: a });
  }

  async remove(id: string) {
    const pending = readJSON<Activity[]>(pendingKey(this.space), []);
    writeJSON(
      pendingKey(this.space),
      pending.filter((p) => p.id !== id)
    );
    await this.sb.from("activities").delete().eq("id", id).eq("space", this.space);
    this.channel?.send({ type: "broadcast", event: "del", payload: { id } });
  }

  connect(me: PlayerId, h: Handlers) {
    const ch = this.sb.channel(`adxd-${this.space.slice(0, 40)}`, {
      config: { broadcast: { self: false }, presence: { key: me } },
    });
    ch.on("broadcast", { event: "act" }, ({ payload }) => h.onInsert(payload as Activity))
      .on("broadcast", { event: "del" }, ({ payload }) => h.onDelete((payload as { id: string }).id))
      .on("broadcast", { event: "pos" }, ({ payload }) => h.onPos(payload as WorldPos))
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        h.onPresence(Object.keys(state) as PlayerId[]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await ch.track({ player: me, at: Date.now() });
      });
    this.channel = ch;

    // reconcile anything missed while the tab slept or offline
    const resync = () => {
      this.load().then(h.onResync).catch(() => {});
    };
    const onVis = () => document.visibilityState === "visible" && resync();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", resync);
    const iv = window.setInterval(resync, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", resync);
      clearInterval(iv);
      this.sb.removeChannel(ch);
      this.channel = null;
    };
  }

  sendPos(p: WorldPos) {
    const now = performance.now();
    if (now - this.lastPos < 120) return;
    this.lastPos = now;
    this.channel?.send({ type: "broadcast", event: "pos", payload: p });
  }
}

/* ───────────────────────── Local (this device) ───────────────────────── */

class LocalBackend implements Backend {
  mode = "local" as const;
  private bc: BroadcastChannel | null = null;
  constructor(private space: string) {}

  async load() {
    return readCache(this.space);
  }
  async insert(a: Activity) {
    // the store writes the cache; we only notify other tabs
    this.bc?.postMessage({ t: "act", a });
  }
  async remove(id: string) {
    this.bc?.postMessage({ t: "del", id });
  }
  connect(me: PlayerId, h: Handlers) {
    if (typeof BroadcastChannel === "undefined") return () => {};
    const bc = new BroadcastChannel(`adxd-${this.space.slice(0, 16)}`);
    this.bc = bc;
    const seen = new Map<PlayerId, number>();
    bc.onmessage = (e) => {
      const m = e.data;
      if (m.t === "act") h.onInsert(m.a);
      else if (m.t === "del") h.onDelete(m.id);
      else if (m.t === "pos") h.onPos(m.p);
      else if (m.t === "hb") {
        seen.set(m.player, Date.now());
      }
    };
    const beat = () => {
      bc.postMessage({ t: "hb", player: me });
      const now = Date.now();
      const online = new Set<PlayerId>([me]);
      seen.forEach((t, p) => now - t < 6000 && online.add(p));
      h.onPresence([...online]);
    };
    beat();
    const iv = window.setInterval(beat, 2500);
    return () => {
      clearInterval(iv);
      bc.close();
      this.bc = null;
    };
  }
  private lastPos = 0;
  sendPos(p: WorldPos) {
    const now = performance.now();
    if (now - this.lastPos < 100) return;
    this.lastPos = now;
    this.bc?.postMessage({ t: "pos", p });
  }
}

export function cloudConfigured() {
  return Boolean(syncConfigSync());
}

export function makeBackend(space: string): Backend {
  const cfg = syncConfigSync();
  if (cfg) return new CloudBackend(cfg.supabaseUrl, cfg.supabaseAnonKey, space);
  return new LocalBackend(space);
}
