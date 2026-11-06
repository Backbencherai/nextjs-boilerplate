"use client";
import { SEASON_DAYS } from "./game/rules";
import { DAY } from "./game/world";
import type { Season } from "./game/engine";

export interface GameConfig {
  world: string;
  relays: string[];
  seasonStart: string;
  googleClientId?: string;
}
const DEFAULTS: GameConfig = {
  world: "global",
  relays: ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt"],
  seasonStart: "2026-11-06T00:00:00Z",
  googleClientId: "",
};
let cached: GameConfig | null = null;

/** /game-config.json can be edited in the upload folder (relays, world name, season start, Google client id). */
export async function loadConfig(): Promise<GameConfig> {
  if (cached) return cached;
  try {
    const r = await fetch("/game-config.json", { cache: "no-store" });
    if (r.ok) cached = { ...DEFAULTS, ...(await r.json()) };
  } catch {}
  cached = cached ?? DEFAULTS;
  return cached;
}

/** Seasons roll automatically every 30 days from the configured start. */
export function currentSeason(cfg: GameConfig, now = Date.now()): Season & { n: number; day: number; endsAt: number } {
  const s0 = Date.parse(cfg.seasonStart) || Date.UTC(2026, 10, 6);
  const len = SEASON_DAYS * DAY;
  const n = Math.max(1, Math.floor((now - s0) / len) + 1);
  const start = s0 + (n - 1) * len;
  return { id: `S${n}`, n, start, day: Math.min(SEASON_DAYS, Math.floor((now - start) / DAY) + 1), endsAt: start + len };
}
