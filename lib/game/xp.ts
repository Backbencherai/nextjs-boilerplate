import type { Activity, ActivityKind, MealQuality } from "../types";

/**
 * XP rules. XP is computed once when an activity is logged and stored on the row,
 * so later rule tweaks never rewrite history.
 */
export function xpFor(kind: ActivityKind, minutes: number | undefined, data: Record<string, unknown>): number {
  const m = Math.max(0, Math.min(minutes ?? 0, 300));
  switch (kind) {
    case "study":
      return Math.round(m * 2);
    case "workout":
      return Math.round(m * 3);
    case "meditation":
      return Math.round(m * 3);
    case "meal": {
      const q = data.quality as MealQuality;
      return 5 + (q === "healthy" ? 15 : q === "balanced" ? 8 : 0);
    }
    case "water":
      return 3 * Math.max(1, Math.min(Number(data.glasses ?? 1), 4));
    case "sleep": {
      const h = Number(data.hours ?? 0);
      return h >= 7 && h <= 9.5 ? 30 : h >= 6 ? 15 : 5;
    }
    case "mood":
      return 5;
    case "steps":
      return Math.min(60, Math.floor(Number(data.steps ?? 0) / 500));
    case "coin":
      return 5;
    case "secret":
      return 25;
    case "cheer":
      return 2;
    case "note":
      return 5;
    case "quest":
      return Number(data.reward ?? 0);
  }
}

/** Total XP needed to reach `level` (level 1 = 0 XP). L2=100, L3=300, L4=600, L5=1000 … */
export const xpForLevel = (level: number) => 50 * level * (level - 1);

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, base, next, into: xp - base, span: next - base, pct: (xp - base) / (next - base) };
}

const TITLES = [
  "Seedling",
  "Sprout",
  "Sapling",
  "Wanderer",
  "Pathfinder",
  "Trailblazer",
  "Island Keeper",
  "Lighthouse",
  "Luminary",
  "Mountain",
  "Legend",
];

export function titleForLevel(level: number) {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))];
}

export const sumXp = (acts: Activity[]) => acts.reduce((s, a) => s + a.xp, 0);
