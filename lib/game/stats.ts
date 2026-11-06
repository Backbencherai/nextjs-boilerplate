import { PLAYERS, partnerOf, type Activity, type ActivityKind, type PlayerId } from "../types";
import { addDays, dayKey } from "./dates";
import { levelFromXp } from "./xp";
import { ACHIEVEMENTS, type AchievementDef } from "./achievements";

export interface DayStats {
  xp: number;
  questXp: number;
  study: number;
  workout: number;
  meditation: number;
  water: number;
  meals: number;
  healthy: number;
  sleepH: number;
  steps: number;
  moods: number[];
  coins: number;
  cheers: number;
  count: number;
}

export const emptyDay = (): DayStats => ({
  xp: 0,
  questXp: 0,
  study: 0,
  workout: 0,
  meditation: 0,
  water: 0,
  meals: 0,
  healthy: 0,
  sleepH: 0,
  steps: 0,
  moods: [],
  coins: 0,
  cheers: 0,
  count: 0,
});

export interface Record_ {
  value: number;
  at: string;
}

export interface PlayerStats {
  player: PlayerId;
  xp: number;
  level: number;
  studyMin: number;
  workoutMin: number;
  meditationMin: number;
  meals: number;
  healthyMeals: number;
  water: number;
  steps: number;
  coins: number;
  secrets: Set<string>;
  cheersSent: number;
  notesSent: number;
  questsClaimed: number;
  goodSleepNights: number;
  maxStudy: Record_ | null;
  maxWorkout: Record_ | null;
  bestDay: { key: string; xp: number } | null;
  maxWaterDay: number;
  maxStepsDay: number;
  earlyBird: boolean;
  nightOwl: boolean;
  activeDays: Set<string>;
  lastActive: string | null;
  run: number;
  bestStreak: number;
  streak: number;
  days: Map<string, DayStats>;
  xpByKind: Partial<Record<ActivityKind, number>>;
  levelUps: { level: number; at: string }[];
  claimed: Set<string>;
  firstAt: string | null;
}

export interface SharedStats {
  xp: number;
  studyMin: number;
  workoutMin: number;
  cheers: number;
  notes: number;
  syncDays: string[];
  syncRun: number;
  bestSyncStreak: number;
  syncLast: string | null;
  minLevel: number;
  healthyMeals: number;
}

export type UnlockMap = Map<string, string>; // achievementId -> ISO date unlocked

export interface Universe {
  players: Record<PlayerId, PlayerStats>;
  shared: SharedStats;
  unlocks: Record<PlayerId | "together", UnlockMap>;
  activities: Activity[];
}

const REAL_LIFE: ActivityKind[] = ["study", "workout", "meditation", "meal", "water", "sleep", "mood", "steps"];

function newPlayer(player: PlayerId): PlayerStats {
  return {
    player,
    xp: 0,
    level: 1,
    studyMin: 0,
    workoutMin: 0,
    meditationMin: 0,
    meals: 0,
    healthyMeals: 0,
    water: 0,
    steps: 0,
    coins: 0,
    secrets: new Set(),
    cheersSent: 0,
    notesSent: 0,
    questsClaimed: 0,
    goodSleepNights: 0,
    maxStudy: null,
    maxWorkout: null,
    bestDay: null,
    maxWaterDay: 0,
    maxStepsDay: 0,
    earlyBird: false,
    nightOwl: false,
    activeDays: new Set(),
    lastActive: null,
    run: 0,
    bestStreak: 0,
    streak: 0,
    days: new Map(),
    xpByKind: {},
    levelUps: [],
    claimed: new Set(),
    firstAt: null,
  };
}

function check(defs: AchievementDef[], map: UnlockMap, u: Universe, who: PlayerId | "together", at: string) {
  for (const d of defs) {
    if (map.has(d.id)) continue;
    const ok = d.scope === "shared" ? d.test(u.shared, u) : d.test(u.players[who as PlayerId], u);
    if (ok) map.set(d.id, at);
  }
}

export function computeUniverse(activities: Activity[]): Universe {
  const sorted = [...activities].sort((a, b) => a.at.localeCompare(b.at));
  const u: Universe = {
    players: { adarsh: newPlayer("adarsh"), devanshi: newPlayer("devanshi") },
    shared: {
      xp: 0,
      studyMin: 0,
      workoutMin: 0,
      cheers: 0,
      notes: 0,
      syncDays: [],
      syncRun: 0,
      bestSyncStreak: 0,
      syncLast: null,
      minLevel: 1,
      healthyMeals: 0,
    },
    unlocks: { adarsh: new Map(), devanshi: new Map(), together: new Map() },
    activities: sorted,
  };
  const solo = ACHIEVEMENTS.filter((a) => a.scope === "solo");
  const shared = ACHIEVEMENTS.filter((a) => a.scope === "shared");

  for (const a of sorted) {
    const p = u.players[a.player];
    if (!p) continue;
    const k = dayKey(a.at);
    let d = p.days.get(k);
    if (!d) {
      d = emptyDay();
      p.days.set(k, d);
    }
    if (!p.firstAt) p.firstAt = a.at;
    const m = a.minutes ?? 0;
    p.xp += a.xp;
    u.shared.xp += a.xp;
    d.xp += a.xp;
    d.count++;
    p.xpByKind[a.kind] = (p.xpByKind[a.kind] ?? 0) + a.xp;
    const hour = new Date(a.at).getHours();

    switch (a.kind) {
      case "study":
        p.studyMin += m;
        d.study += m;
        u.shared.studyMin += m;
        if (!p.maxStudy || m > p.maxStudy.value) p.maxStudy = { value: m, at: a.at };
        if (hour >= 23 || hour < 3) p.nightOwl = true;
        break;
      case "workout":
        p.workoutMin += m;
        d.workout += m;
        u.shared.workoutMin += m;
        if (!p.maxWorkout || m > p.maxWorkout.value) p.maxWorkout = { value: m, at: a.at };
        break;
      case "meditation":
        p.meditationMin += m;
        d.meditation += m;
        break;
      case "meal":
        p.meals++;
        d.meals++;
        if (a.data.quality === "healthy") {
          p.healthyMeals++;
          d.healthy++;
          u.shared.healthyMeals++;
        }
        break;
      case "water": {
        const g = Number(a.data.glasses ?? 1);
        p.water += g;
        d.water += g;
        p.maxWaterDay = Math.max(p.maxWaterDay, d.water);
        break;
      }
      case "sleep": {
        const h = Number(a.data.hours ?? 0);
        d.sleepH = Math.max(d.sleepH, h);
        if (h >= 7) p.goodSleepNights++;
        break;
      }
      case "mood":
        d.moods.push(Number(a.data.mood ?? 3));
        break;
      case "steps": {
        const s = Number(a.data.steps ?? 0);
        p.steps += s;
        d.steps += s;
        p.maxStepsDay = Math.max(p.maxStepsDay, d.steps);
        break;
      }
      case "coin":
        p.coins++;
        d.coins++;
        break;
      case "secret":
        p.secrets.add(String(a.data.secret));
        break;
      case "cheer":
        p.cheersSent++;
        d.cheers++;
        u.shared.cheers++;
        break;
      case "note":
        p.notesSent++;
        u.shared.notes++;
        break;
      case "quest":
        p.questsClaimed++;
        d.questXp += a.xp;
        p.claimed.add(`${a.data.questId}@${a.data.period}`);
        break;
    }

    if (REAL_LIFE.includes(a.kind)) {
      if (hour >= 4 && hour < 7) p.earlyBird = true;
      if (!p.activeDays.has(k)) {
        p.activeDays.add(k);
        if (p.lastActive && addDays(p.lastActive, 1) === k) p.run++;
        else if (p.lastActive !== k) p.run = 1;
        p.lastActive = k;
        p.bestStreak = Math.max(p.bestStreak, p.run);
        // shared "in sync" days: both did something real on the same day
        const other = u.players[partnerOf(a.player)];
        if (other.activeDays.has(k)) {
          const s = u.shared;
          s.syncDays.push(k);
          s.syncRun = s.syncLast && addDays(s.syncLast, 1) === k ? s.syncRun + 1 : 1;
          s.syncLast = k;
          s.bestSyncStreak = Math.max(s.bestSyncStreak, s.syncRun);
        }
      }
    }

    if (!p.bestDay || d.xp > p.bestDay.xp) p.bestDay = { key: k, xp: d.xp };
    const lv = levelFromXp(p.xp).level;
    if (lv > p.level) {
      for (let l = p.level + 1; l <= lv; l++) p.levelUps.push({ level: l, at: a.at });
      p.level = lv;
    }
    u.shared.minLevel = Math.min(u.players.adarsh.level, u.players.devanshi.level);

    check(solo, u.unlocks[a.player], u, a.player, a.at);
    check(shared, u.unlocks.together, u, "together", a.at);
  }

  const today = dayKey();
  for (const id of PLAYERS) {
    const p = u.players[id];
    p.streak = p.lastActive && (p.lastActive === today || addDays(p.lastActive, 1) === today) ? p.run : 0;
  }
  return u;
}

export function dayOf(p: PlayerStats, k = dayKey()): DayStats {
  return p.days.get(k) ?? emptyDay();
}

export function sumDays(p: PlayerStats, keys: string[]): DayStats {
  const out = emptyDay();
  for (const k of keys) {
    const d = p.days.get(k);
    if (!d) continue;
    out.xp += d.xp;
    out.questXp += d.questXp;
    out.study += d.study;
    out.workout += d.workout;
    out.meditation += d.meditation;
    out.water += d.water;
    out.meals += d.meals;
    out.healthy += d.healthy;
    out.sleepH += d.sleepH;
    out.steps += d.steps;
    out.moods.push(...d.moods);
    out.coins += d.coins;
    out.cheers += d.cheers;
    out.count += d.count;
  }
  return out;
}

export function weekDays(wk: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(wk, i));
}
