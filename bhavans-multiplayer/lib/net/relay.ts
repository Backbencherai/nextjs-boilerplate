"use client";
/**
 * Multiplayer over public MQTT-over-WebSocket relays. No accounts, no server, unlimited players.
 *
 *   <root>/n/<nationId>          retained · each nation's public state (map, rankings, visits, war targets)
 *   <root>/in/<nationId>/<evId>  retained · inbox events (raids, transfers, tourists, partnerships…), cleared once applied
 *   <root>/news/<slot>           retained · world news ring buffer
 *   <root>/chat/<slot>           retained · world chat ring buffer
 *   <root>/save/<saveKey>        retained · your full save, AES-GCM encrypted with a key only your email+PIN can derive
 *
 * Several relays are used at once and messages are de-duplicated, so if one relay is down the game carries on.
 */
import type { InEvent, PublicNation } from "../game/engine";

type Client = {
  on(ev: string, cb: (...a: unknown[]) => void): void;
  subscribe(t: string | string[], o?: object): void;
  unsubscribe(t: string): void;
  publish(t: string, m: string, o?: object): void;
  end(force?: boolean): void;
  connected: boolean;
};

export interface NewsItem {
  id: string;
  at: number;
  icon: string;
  text: string;
  nation?: string;
}
export interface ChatMsg {
  id: string;
  at: number;
  from: string;
  name: string;
  flag: string;
  text: string;
}
export interface Handlers {
  onNation: (p: PublicNation) => void;
  onGone: (id: string) => void;
  onInbox: (ev: InEvent) => void;
  onNews: (n: NewsItem) => void;
  onChat: (m: ChatMsg) => void;
  onStatus: (connected: number) => void;
  onSignal?: (s: unknown) => void;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function sha(text: string) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function aesKey(secret: string) {
  const ikm = await crypto.subtle.digest("SHA-256", enc.encode("bhavans-save:" + secret));
  const raw = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: enc.encode("bhavans-mp-v1"), info: enc.encode("save") }, raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
const b64 = (u: Uint8Array) => {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function seal(secret: string, obj: unknown) {
  const key = await aesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return b64(out);
}
export async function unseal<T>(secret: string, s: string): Promise<T | null> {
  try {
    const key = await aesKey(secret);
    const u = unb64(s);
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, key, u.slice(12)))) as T;
  } catch {
    return null;
  }
}

const NEWS_SLOTS = 150;
const CHAT_SLOTS = 120;
const slotOf = (id: string, n: number) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
};

export class Net {
  private clients: Client[] = [];
  private seen = new Set<string>();
  root: string;
  private me: string | null = null;
  private h: Handlers | null = null;
  private lastNation = "";

  constructor(private relays: string[], world: string) {
    this.root = `bhavans-mp/v1/${world.toLowerCase().replace(/[^a-z0-9-]/g, "") || "global"}`;
  }

  async connect(h: Handlers) {
    this.h = h;
    const mod = (await import("mqtt")) as unknown as { connect?: (u: string, o: object) => Client; default?: { connect: (u: string, o: object) => Client } };
    const connectFn = mod.connect ?? mod.default!.connect;
    for (const url of this.relays) {
      let c: Client;
      try {
        c = connectFn(url, { clientId: "bhv_" + Math.random().toString(36).slice(2, 12), clean: true, keepalive: 30, reconnectPeriod: 4000, connectTimeout: 10000 });
      } catch {
        continue;
      }
      this.clients.push(c);
      c.on("connect", () => {
        c.subscribe([`${this.root}/n/+`, `${this.root}/news/+`, `${this.root}/chat/+`], { qos: 0 });
        if (this.me) c.subscribe([`${this.root}/in/${this.me}/+`, `${this.root}/sig/${this.me}`], { qos: 1 });
        if (this.lastNation) c.publish(`${this.root}/n/${this.me}`, this.lastNation, { qos: 1, retain: true });
        this.status();
      });
      c.on("close", () => this.status());
      c.on("offline", () => this.status());
      c.on("message", (tU: unknown, mU: unknown) => this.onMessage(String(tU), mU instanceof Uint8Array ? dec.decode(mU) : String(mU ?? "")));
    }
    this.status();
  }

  private status() {
    this.h?.onStatus(this.clients.filter((c) => c.connected).length);
  }

  private onMessage(topic: string, msg: string) {
    const rest = topic.slice(this.root.length + 1);
    const [kind, a] = rest.split("/");
    if (kind === "n") {
      if (!msg) return this.h?.onGone(a);
      try {
        const p = JSON.parse(msg) as PublicNation;
        if (p && p.id === a) this.h?.onNation(p);
      } catch {}
    } else if (kind === "in") {
      if (!msg) return;
      try {
        const ev = JSON.parse(msg) as InEvent;
        if (this.seen.has(ev.id)) return;
        this.seen.add(ev.id);
        this.h?.onInbox(ev);
      } catch {}
    } else if (kind === "sig") {
      try {
        const j = JSON.parse(msg);
        const key = JSON.stringify(j).slice(0, 200);
        if (this.seen.has(key)) return;
        this.seen.add(key);
        this.h?.onSignal?.(j);
      } catch {}
    } else if (kind === "news" || kind === "chat") {
      if (!msg) return;
      try {
        const j = JSON.parse(msg);
        if (this.seen.has(j.id)) return;
        this.seen.add(j.id);
        if (kind === "news") this.h?.onNews(j as NewsItem);
        else this.h?.onChat(j as ChatMsg);
      } catch {}
    }
  }

  private pub(topic: string, payload: string, retain = true) {
    for (const c of this.clients) if (c.connected) c.publish(topic, payload, { qos: 1, retain });
  }

  setMe(id: string) {
    if (this.me === id) return;
    if (this.me) for (const c of this.clients) (c.unsubscribe(`${this.root}/in/${this.me}/+`), c.unsubscribe(`${this.root}/sig/${this.me}`));
    this.me = id;
    for (const c of this.clients) if (c.connected) c.subscribe([`${this.root}/in/${id}/+`, `${this.root}/sig/${id}`], { qos: 1 });
  }

  publishNation(p: PublicNation) {
    this.lastNation = JSON.stringify(p);
    this.pub(`${this.root}/n/${p.id}`, this.lastNation);
  }
  removeNation(id: string) {
    this.pub(`${this.root}/n/${id}`, "");
  }
  send(to: string, ev: InEvent) {
    this.pub(`${this.root}/in/${to}/${ev.id}`, JSON.stringify(ev));
  }
  signal(to: string, s: unknown) {
    for (const c of this.clients) if (c.connected) c.publish(`${this.root}/sig/${to}`, JSON.stringify(s), { qos: 1, retain: false });
  }
  clearInbox(evId: string) {
    if (this.me) this.pub(`${this.root}/in/${this.me}/${evId}`, "");
  }
  news(n: NewsItem) {
    this.seen.add(n.id);
    this.pub(`${this.root}/news/${slotOf(n.id, NEWS_SLOTS)}`, JSON.stringify(n));
  }
  chat(m: ChatMsg) {
    this.seen.add(m.id);
    this.pub(`${this.root}/chat/${slotOf(m.id, CHAT_SLOTS)}`, JSON.stringify(m));
  }
  saveCloud(saveKey: string, cipher: string) {
    this.pub(`${this.root}/save/${saveKey}`, cipher);
  }

  /** Fetch an encrypted cloud save (first relay that answers wins). */
  loadCloud(saveKey: string, timeoutMs = 7000): Promise<string | null> {
    const topic = `${this.root}/save/${saveKey}`;
    return new Promise((res) => {
      let done = false;
      const finish = (v: string | null) => {
        if (done) return;
        done = true;
        for (const c of this.clients) c.unsubscribe(topic);
        res(v);
      };
      const onMsg = (tU: unknown, mU: unknown) => {
        if (String(tU) !== topic) return;
        const m = mU instanceof Uint8Array ? dec.decode(mU) : String(mU ?? "");
        if (m) finish(m);
      };
      for (const c of this.clients) {
        c.on("message", onMsg);
        const sub = () => c.subscribe(topic, { qos: 1 });
        if (c.connected) sub();
        else c.on("connect", sub);
      }
      setTimeout(() => finish(null), timeoutMs);
    });
  }

  live() {
    return this.clients.filter((c) => c.connected).length;
  }

  close() {
    for (const c of this.clients) {
      try {
        c.end(true);
      } catch {}
    }
    this.clients = [];
  }
}
