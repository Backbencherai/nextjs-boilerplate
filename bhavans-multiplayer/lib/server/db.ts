/* Server storage: Upstash Redis on Vercel (KV_* or UPSTASH_* env vars), in-memory fallback for local dev. */
import { Redis } from "@upstash/redis";

export interface DB {
  get<T>(k: string): Promise<T | null>;
  set(k: string, v: unknown, opts?: { nx?: boolean; px?: number }): Promise<boolean>;
  del(k: string): Promise<void>;
  hget<T>(k: string, f: string): Promise<T | null>;
  hset(k: string, f: string, v: unknown): Promise<void>;
  hsetnx(k: string, f: string, v: unknown): Promise<boolean>;
  hdel(k: string, f: string): Promise<void>;
  hgetall<T>(k: string): Promise<Record<string, T>>;
  lpush(k: string, v: unknown, max: number): Promise<void>;
  lrange<T>(k: string, n: number): Promise<T[]>;
  rpush(k: string, v: unknown, ttlSec: number): Promise<void>;
  drain<T>(k: string): Promise<T[]>;
  kind: "redis" | "memory";
}

function redisDB(r: Redis): DB {
  return {
    kind: "redis",
    get: (k) => r.get(k),
    async set(k, v, o) {
      const res = o?.nx ? await r.set(k, v, o.px ? { nx: true, px: o.px } : { nx: true }) : await r.set(k, v, o?.px ? { px: o.px } : undefined);
      return res === "OK";
    },
    async del(k) {
      await r.del(k);
    },
    hget: (k, f) => r.hget(k, f),
    async hset(k, f, v) {
      await r.hset(k, { [f]: v });
    },
    async hsetnx(k, f, v) {
      return (await r.hsetnx(k, f, v)) === 1;
    },
    async hdel(k, f) {
      await r.hdel(k, f);
    },
    async hgetall<T>(k: string) {
      return ((await r.hgetall(k)) ?? {}) as Record<string, T>;
    },
    async lpush(k, v, max) {
      await r.lpush(k, v);
      await r.ltrim(k, 0, max - 1);
    },
    lrange: (k, n) => r.lrange(k, 0, n - 1),
    async rpush(k, v, ttl) {
      await r.rpush(k, v);
      await r.expire(k, ttl);
    },
    async drain<T>(k: string) {
      const p = r.pipeline();
      p.lrange(k, 0, -1);
      p.del(k);
      const [items] = (await p.exec()) as [T[], number];
      return items ?? [];
    },
  };
}

type Box = { v: unknown; exp?: number };
const mem = (globalThis as unknown as { __bhvMem?: Map<string, Box> }).__bhvMem ?? new Map<string, Box>();
(globalThis as unknown as { __bhvMem?: Map<string, Box> }).__bhvMem = mem;
const live = (k: string) => {
  const b = mem.get(k);
  if (!b) return undefined;
  if (b.exp && b.exp < Date.now()) {
    mem.delete(k);
    return undefined;
  }
  return b;
};
const clone = <T,>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

function memoryDB(): DB {
  const hash = (k: string) => (live(k)?.v as Record<string, unknown>) ?? (mem.set(k, { v: {} }), mem.get(k)!.v as Record<string, unknown>);
  const list = (k: string) => (live(k)?.v as unknown[]) ?? (mem.set(k, { v: [] }), mem.get(k)!.v as unknown[]);
  return {
    kind: "memory",
    async get<T>(k: string) {
      return (clone(live(k)?.v) as T) ?? null;
    },
    async set(k, v, o) {
      if (o?.nx && live(k)) return false;
      mem.set(k, { v: clone(v), exp: o?.px ? Date.now() + o.px : undefined });
      return true;
    },
    async del(k) {
      mem.delete(k);
    },
    async hget<T>(k: string, f: string) {
      return (clone(hash(k)[f]) as T) ?? null;
    },
    async hset(k, f, v) {
      hash(k)[f] = clone(v);
    },
    async hsetnx(k, f, v) {
      const h = hash(k);
      if (f in h) return false;
      h[f] = clone(v);
      return true;
    },
    async hdel(k, f) {
      delete hash(k)[f];
    },
    async hgetall<T>(k: string) {
      return clone(hash(k)) as Record<string, T>;
    },
    async lpush(k, v, max) {
      const l = list(k);
      l.unshift(clone(v));
      l.length = Math.min(l.length, max);
    },
    async lrange<T>(k: string, n: number) {
      return clone(list(k).slice(0, n)) as T[];
    },
    async rpush(k, v, ttl) {
      list(k).push(clone(v));
      mem.get(k)!.exp = Date.now() + ttl * 1000;
    },
    async drain<T>(k: string) {
      const l = clone(list(k)) as T[];
      mem.delete(k);
      return l;
    },
  };
}

let db: DB | null = null;
export function getDB(): DB {
  if (db) return db;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  db = url && token ? redisDB(new Redis({ url, token })) : memoryDB();
  return db;
}

/** Per-nation lock so two requests never edit the same country at once. */
export async function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const d = getDB();
  const key = `lock:${id}`;
  for (let i = 0; i < 40; i++) {
    if (await d.set(key, 1, { nx: true, px: 5000 })) {
      try {
        return await fn();
      } finally {
        await d.del(key);
      }
    }
    await new Promise((r) => setTimeout(r, 75));
  }
  throw new Error("busy");
}
