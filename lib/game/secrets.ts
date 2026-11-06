import type { PlayerId } from "../types";
import { seeded } from "./dates";

export const SECRETS = [
  { id: "sun-tap", name: "Who Turned Off the Sun?", hint: "The sky listens if you knock five times." },
  { id: "duck", name: "The Spring Duck", hint: "Someone lives in the wellness spring." },
  { id: "mushroom", name: "Glowcap", hint: "Something glows behind a house." },
  { id: "konami", name: "Developer Console", hint: "↑ ↑ ↓ ↓ ← → ← → B A" },
  { id: "logo", name: "Seven Knocks", hint: "The A×D mark is ticklish." },
  { id: "pip", name: "Pip's Secret", hint: "Pip loves being poked. A lot." },
] as const;

export type SecretId = (typeof SECRETS)[number]["id"];

/** Walkable spawn points for today's coins — same on every device for a given player/day. */
export function coinSpawns(player: PlayerId, day: string, spots: [number, number][], count = 6) {
  const r = seeded(`coins:${player}:${day}`);
  const pool = [...spots];
  const out: { idx: number; x: number; z: number }[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const j = Math.floor(r() * pool.length);
    const [x, z] = pool.splice(j, 1)[0];
    out.push({ idx: i, x: x + (r() - 0.5) * 0.8, z: z + (r() - 0.5) * 0.8 });
  }
  return out;
}
