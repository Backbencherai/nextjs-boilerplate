"use client";
/**
 * Zero-setup multiplayer over public MQTT relays (WebSocket).
 *
 * - Both players type the same join code (e.g. LOVE). The code -> SHA-256 "space" -> an AES-GCM key
 *   and a topic root. Relays only ever see ciphertext under an unguessable topic.
 * - Every activity is a *retained* message on its own topic, so the relay stores the shared history:
 *   a phone that was offline gets everything when it reconnects. Each phone also re-publishes what it
 *   knows on connect, so history heals itself even if a relay forgets.
 * - Positions + presence are live, non-retained messages (with a last-will "offline").
 * - Several relays are used at once; whichever is up wins. Messages are de-duplicated by id.
 */
import type { Activity, PlayerId } from "../types";
import type { Backend, Handlers, WorldPos } from "./backend";
import { readCache } from "./backend";

export const DEFAULT_RELAYS = ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt"];

type MqttClient = {
  on(ev: string, cb: (...a: unknown[]) => void): void;
  subscribe(t: string, o?: object, cb?: (e?: Error | null) => void): void;
  publish(t: string, m: string | Uint8Array, o?: object, cb?: (e?: Error) => void): void;
  end(force?: boolean): void;
  connected: boolean;
};

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function sha(text: string) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const tombKey = (space: string) => `adxd:tomb:${space.slice(0, 16)}`;

export class RelayBackend implements Backend {
  mode = "cloud" as const;
  private clients: MqttClient[] = [];
  private key: CryptoKey | null = null;
  private root = "";
  private known = new Map<string, Activity>();
  private tombs: Set<string>;
  private lastPos = 0;
  private ready: Promise<void>;
  private handlers: Handlers | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private online = new Map<PlayerId, number>();
  private me: PlayerId | null = null;

  constructor(private space: string, private relays: string[]) {
    let t: string[] = [];
    try {
      t = JSON.parse(localStorage.getItem(tombKey(space)) || "[]");
    } catch {}
    this.tombs = new Set(t);
    this.ready = this.init();
  }

  private async init() {
    this.root = "axd-universe/" + (await sha("topic:" + this.space)).slice(0, 40);
    const ikm = await crypto.subtle.digest("SHA-256", enc.encode("key:" + this.space));
    const raw = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
    this.key = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: enc.encode("axd-universe-v1"), info: enc.encode("activities") }, raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }

  private async seal(obj: unknown) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.key!, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(iv.length + ct.length);
    out.set(iv);
    out.set(ct, iv.length);
    return b64(out);
  }
  private async open<T>(s: string): Promise<T | null> {
    try {
      const u = unb64(s);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, this.key!, u.slice(12));
      return JSON.parse(dec.decode(pt)) as T;
    } catch {
      return null; // not ours / tampered
    }
  }

  async load(): Promise<Activity[]> {
    await this.ready;
    for (const a of readCache(this.space)) if (!this.tombs.has(a.id)) this.known.set(a.id, a);
    return [...this.known.values()];
  }

  private pub(topic: string, payload: string, retain = false) {
    for (const c of this.clients) if (c.connected) c.publish(topic, payload, { qos: retain ? 1 : 0, retain });
  }

  async insert(a: Activity) {
    await this.ready;
    this.known.set(a.id, a);
    this.pub(`${this.root}/a/${a.id}`, await this.seal(a), true);
  }

  async remove(id: string) {
    await this.ready;
    this.known.delete(id);
    this.tombs.add(id);
    try {
      localStorage.setItem(tombKey(this.space), JSON.stringify([...this.tombs].slice(-2000)));
    } catch {}
    this.pub(`${this.root}/a/${id}`, "", true); // clears the retained copy
    this.pub(`${this.root}/d`, await this.seal({ id }));
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.handlers?.onResync([...this.known.values()]);
    }, 250);
  }

  private presence() {
    const now = Date.now();
    const list = new Set<PlayerId>();
    if (this.me) list.add(this.me);
    this.online.forEach((t, p) => now - t < 25000 && list.add(p));
    this.handlers?.onPresence([...list]);
  }

  connect(me: PlayerId, h: Handlers) {
    this.handlers = h;
    this.me = me;
    let closed = false;
    const timers: ReturnType<typeof setInterval>[] = [];
    (async () => {
      await this.ready;
      const mod = await import("mqtt");
      const mqtt = (mod as unknown as { default?: { connect: (u: string, o: object) => MqttClient }; connect?: (u: string, o: object) => MqttClient });
      const connectFn = mqtt.connect ?? mqtt.default!.connect;
      if (closed) return;
      for (const url of this.relays) {
        let c: MqttClient;
        try {
          c = connectFn(url, {
            clientId: "axd_" + me.slice(0, 1) + "_" + Math.random().toString(36).slice(2, 10),
            clean: true,
            keepalive: 30,
            reconnectPeriod: 4000,
            connectTimeout: 10000,
            will: { topic: `${this.root}/on/${me}`, payload: "0", qos: 0, retain: true },
          });
        } catch {
          continue;
        }
        this.clients.push(c);
        c.on("connect", () => {
          c.subscribe(`${this.root}/#`, { qos: 1 });
          c.publish(`${this.root}/on/${me}`, String(Date.now()), { qos: 0, retain: true });
          // heal: re-publish everything this phone knows (retained) a moment after the backlog arrives
          setTimeout(async () => {
            for (const a of this.known.values()) c.publish(`${this.root}/a/${a.id}`, await this.seal(a), { qos: 1, retain: true });
          }, 3000);
        });
        c.on("message", async (topicU: unknown, msgU: unknown) => {
          const topic = String(topicU);
          const msg = msgU instanceof Uint8Array ? dec.decode(msgU) : String(msgU ?? "");
          const rest = topic.slice(this.root.length + 1);
          if (rest.startsWith("a/")) {
            const id = rest.slice(2);
            if (!msg) {
              if (this.known.has(id)) {
                this.known.delete(id);
                this.tombs.add(id);
                this.scheduleFlush();
              }
              return;
            }
            if (this.tombs.has(id) || this.known.has(id)) return;
            const a = await this.open<Activity>(msg);
            if (!a || a.id !== id) return;
            this.known.set(id, a);
            this.scheduleFlush();
            if (a.player !== me && Date.now() - new Date(a.at).getTime() < 60000) h.onInsert(a); // fresh → toasts
          } else if (rest === "d") {
            const d = await this.open<{ id: string }>(msg);
            if (d?.id && this.known.has(d.id)) {
              this.known.delete(d.id);
              this.tombs.add(d.id);
              h.onDelete(d.id);
            }
          } else if (rest.startsWith("pos/")) {
            const p = await this.open<WorldPos>(msg);
            if (p && p.player !== me) {
              this.online.set(p.player, Date.now());
              h.onPos(p);
            }
          } else if (rest.startsWith("on/")) {
            const who = rest.slice(3) as PlayerId;
            if (who === me) return;
            const t = Number(msg);
            if (t && Date.now() - t < 6 * 3600_000) this.online.set(who, Date.now());
            else this.online.delete(who);
            this.presence();
          } else if (rest.startsWith("hb/")) {
            const who = rest.slice(3) as PlayerId;
            if (who !== me) {
              this.online.set(who, Date.now());
              this.presence();
            }
          }
        });
      }
      // heartbeat for presence
      timers.push(
        setInterval(() => {
          this.pub(`${this.root}/hb/${me}`, "1");
          this.presence();
        }, 10000)
      );
      this.pub(`${this.root}/hb/${me}`, "1");
      this.presence();
    })();
    const onVis = () => {
      if (document.visibilityState === "visible") this.pub(`${this.root}/hb/${me}`, "1");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      closed = true;
      timers.forEach(clearInterval);
      document.removeEventListener("visibilitychange", onVis);
      for (const c of this.clients) {
        try {
          c.publish(`${this.root}/on/${me}`, "0", { retain: true });
          c.end(true);
        } catch {}
      }
      this.clients = [];
    };
  }

  sendPos(p: WorldPos) {
    const now = performance.now();
    if (now - this.lastPos < 150 || !this.key) return;
    this.lastPos = now;
    this.seal(p).then((s) => this.pub(`${this.root}/pos/${p.player}`, s));
  }

  /** Number of relays currently connected (for the status badge). */
  liveCount() {
    return this.clients.filter((c) => c.connected).length;
  }
}
