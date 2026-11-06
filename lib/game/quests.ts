import type { PlayerId } from "../types";
import { dayKey, seeded, weekKey } from "./dates";
import { dayOf, sumDays, weekDays, type DayStats, type PlayerStats, type Universe } from "./stats";

export interface QuestDef {
  id: string;
  title: string;
  icon: string;
  period: "daily" | "weekly";
  scope: "solo" | "shared";
  target: number;
  unit: string;
  reward: number;
  /** current progress */
  metric: (d: DayStats, ctx: { p: PlayerStats; u: Universe; days: string[] }) => number;
}

const D: QuestDef[] = [
  { id: "d-study45", title: "Study for 45 minutes", icon: "📚", period: "daily", scope: "solo", target: 45, unit: "min", reward: 40, metric: (d) => d.study },
  { id: "d-study90", title: "Deep work: study 90 minutes", icon: "🎯", period: "daily", scope: "solo", target: 90, unit: "min", reward: 70, metric: (d) => d.study },
  { id: "d-work30", title: "Move for 30 minutes", icon: "🏃", period: "daily", scope: "solo", target: 30, unit: "min", reward: 40, metric: (d) => d.workout },
  { id: "d-water8", title: "Drink 8 glasses of water", icon: "💧", period: "daily", scope: "solo", target: 8, unit: "glasses", reward: 30, metric: (d) => d.water },
  { id: "d-meals3", title: "Log 3 meals", icon: "🍽️", period: "daily", scope: "solo", target: 3, unit: "meals", reward: 25, metric: (d) => d.meals },
  { id: "d-healthy2", title: "Eat 2 healthy meals", icon: "🥗", period: "daily", scope: "solo", target: 2, unit: "meals", reward: 35, metric: (d) => d.healthy },
  { id: "d-med10", title: "Meditate for 10 minutes", icon: "🧘", period: "daily", scope: "solo", target: 10, unit: "min", reward: 30, metric: (d) => d.meditation },
  { id: "d-steps7k", title: "Walk 7,000 steps", icon: "👟", period: "daily", scope: "solo", target: 7000, unit: "steps", reward: 35, metric: (d) => d.steps },
  { id: "d-mood", title: "Check in with your mood", icon: "✨", period: "daily", scope: "solo", target: 1, unit: "check-in", reward: 15, metric: (d) => d.moods.length },
  { id: "d-coins3", title: "Collect 3 coins in the world", icon: "🪙", period: "daily", scope: "solo", target: 3, unit: "coins", reward: 20, metric: (d) => d.coins },
  { id: "d-xp150", title: "Earn 150 XP from activities", icon: "⚡", period: "daily", scope: "solo", target: 150, unit: "XP", reward: 30, metric: (d) => d.xp - d.questXp },
  { id: "d-cheer", title: "Cheer your partner on", icon: "📣", period: "daily", scope: "solo", target: 1, unit: "cheer", reward: 15, metric: (d) => d.cheers },
];

const W: QuestDef[] = [
  { id: "w-study5h", title: "Study 5 hours this week", icon: "📖", period: "weekly", scope: "solo", target: 300, unit: "min", reward: 150, metric: (d) => d.study },
  { id: "w-work150", title: "Work out 150 minutes", icon: "🏋️", period: "weekly", scope: "solo", target: 150, unit: "min", reward: 150, metric: (d) => d.workout },
  { id: "w-active5", title: "Be active on 5 days", icon: "🔥", period: "weekly", scope: "solo", target: 5, unit: "days", reward: 120, metric: (_d, { p, days }) => days.filter((k) => p.activeDays.has(k)).length },
  { id: "w-healthy12", title: "Eat 12 healthy meals", icon: "🥦", period: "weekly", scope: "solo", target: 12, unit: "meals", reward: 120, metric: (d) => d.healthy },
  { id: "w-sleep4", title: "Sleep 7+ hours on 4 nights", icon: "🌙", period: "weekly", scope: "solo", target: 4, unit: "nights", reward: 110, metric: (_d, { p, days }) => days.filter((k) => (p.days.get(k)?.sleepH ?? 0) >= 7).length },
  { id: "w-steps50k", title: "Walk 50,000 steps", icon: "🗺️", period: "weekly", scope: "solo", target: 50000, unit: "steps", reward: 130, metric: (d) => d.steps },
  { id: "w-water40", title: "Drink 40 glasses of water", icon: "🌊", period: "weekly", scope: "solo", target: 40, unit: "glasses", reward: 100, metric: (d) => d.water },
];

const WS: QuestDef[] = [
  {
    id: "ws-study10h", title: "Together: study 10 hours combined", icon: "🏛️", period: "weekly", scope: "shared", target: 600, unit: "min", reward: 200,
    metric: (_d, { u, days }) => sumDays(u.players.adarsh, days).study + sumDays(u.players.devanshi, days).study,
  },
  {
    id: "ws-sync4", title: "Together: both active on the same 4 days", icon: "🔗", period: "weekly", scope: "shared", target: 4, unit: "days", reward: 200,
    metric: (_d, { u, days }) => days.filter((k) => u.players.adarsh.activeDays.has(k) && u.players.devanshi.activeDays.has(k)).length,
  },
  {
    id: "ws-work5h", title: "Together: 5 hours of workouts combined", icon: "⚒️", period: "weekly", scope: "shared", target: 300, unit: "min", reward: 200,
    metric: (_d, { u, days }) => sumDays(u.players.adarsh, days).workout + sumDays(u.players.devanshi, days).workout,
  },
];

export const ALL_QUESTS = [...D, ...W, ...WS];
export const QUEST_BY_ID = new Map(ALL_QUESTS.map((q) => [q.id, q]));

function pick<T>(arr: T[], n: number, seed: string): T[] {
  const r = seeded(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export interface QuestState {
  def: QuestDef;
  period: string;
  value: number;
  done: boolean;
  claimed: boolean;
}

export function questBoard(u: Universe, player: PlayerId, now = new Date()) {
  const today = dayKey(now);
  const wk = weekKey(now);
  const p = u.players[player];
  const wdays = weekDays(wk);
  const weekAgg = sumDays(p, wdays);
  const build = (def: QuestDef, period: string, d: DayStats, days: string[]): QuestState => {
    const value = def.metric(d, { p, u, days });
    return { def, period, value, done: value >= def.target, claimed: p.claimed.has(`${def.id}@${period}`) };
  };
  const daily = pick(D, 3, "daily:" + today).map((q) => build(q, today, dayOf(p, today), [today]));
  const weekly = pick(W, 3, "weekly:" + wk).map((q) => build(q, wk, weekAgg, wdays));
  const together = pick(WS, 1, "together:" + wk).map((q) => build(q, wk, weekAgg, wdays));
  return { daily, weekly, together, today, week: wk };
}
