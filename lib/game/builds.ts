import type { Universe } from "./stats";
import type { PlayerId } from "../types";

/**
 * Island projects — the world is built by real life.
 * Bridges start missing and appear plank by plank as you make progress;
 * later milestones add a drivable car, house upgrades, a fountain and fireworks.
 */
export interface BuildDef {
  id: string;
  name: string;
  icon: string;
  how: string;
  kind: "bridge" | "house" | "vehicle" | "decor";
  /** index into BRIDGES (world/layout.ts) for bridge builds */
  bridge?: number;
  owner?: PlayerId;
  progress: (u: Universe) => [number, number];
}

const medals = (u: Universe) => u.unlocks.adarsh.size + u.unlocks.devanshi.size + u.unlocks.together.size;

export const BUILDS: BuildDef[] = [
  { id: "bridge-adarsh", name: "Adarsh's Bridge", icon: "🌉", kind: "bridge", bridge: 2, owner: "adarsh", how: "Adarsh earns 150 XP", progress: (u) => [u.players.adarsh.xp, 150] },
  { id: "bridge-devanshi", name: "Dewanshi's Bridge", icon: "🌉", kind: "bridge", bridge: 3, owner: "devanshi", how: "Dewanshi earns 150 XP", progress: (u) => [u.players.devanshi.xp, 150] },
  { id: "bridge-mind", name: "Mind Bridge", icon: "📚", kind: "bridge", bridge: 0, how: "Study 2 hours together (combined)", progress: (u) => [Math.round(u.shared.studyMin), 120] },
  { id: "bridge-body", name: "Body Bridge", icon: "🏋️", kind: "bridge", bridge: 1, how: "Work out 90 minutes together (combined)", progress: (u) => [Math.round(u.shared.workoutMin), 90] },
  { id: "house-adarsh-1", name: "Adarsh's Cozy House", icon: "🏡", kind: "house", owner: "adarsh", how: "Adarsh reaches level 4", progress: (u) => [u.players.adarsh.level, 4] },
  { id: "house-devanshi-1", name: "Dewanshi's Cozy House", icon: "🏡", kind: "house", owner: "devanshi", how: "Dewanshi reaches level 4", progress: (u) => [u.players.devanshi.level, 4] },
  { id: "car", name: "Island Car", icon: "🚗", kind: "vehicle", how: "Win 6 medals between you", progress: (u) => [medals(u), 6] },
  { id: "fountain", name: "Wishing Fountain", icon: "⛲", kind: "decor", how: "Both be active on 5 days", progress: (u) => [u.shared.syncDays.length, 5] },
  { id: "house-adarsh-2", name: "Adarsh's Two-Storey House", icon: "🏠", kind: "house", owner: "adarsh", how: "Adarsh reaches level 7", progress: (u) => [u.players.adarsh.level, 7] },
  { id: "house-devanshi-2", name: "Dewanshi's Two-Storey House", icon: "🏠", kind: "house", owner: "devanshi", how: "Dewanshi reaches level 7", progress: (u) => [u.players.devanshi.level, 7] },
  { id: "fireworks", name: "Fireworks", icon: "🎆", kind: "decor", how: "Win 12 medals between you", progress: (u) => [medals(u), 12] },
];

export interface BuildState {
  def: BuildDef;
  cur: number;
  target: number;
  pct: number;
  done: boolean;
}

export function buildStates(u: Universe): BuildState[] {
  return BUILDS.map((def) => {
    const [cur, target] = def.progress(u);
    const pct = Math.max(0, Math.min(1, cur / target));
    return { def, cur, target, pct, done: pct >= 1 };
  });
}

export function builtSet(u: Universe) {
  return new Set(buildStates(u).filter((b) => b.done).map((b) => b.def.id));
}

export function bridgeProgress(u: Universe): number[] {
  const out = [0, 0, 0, 0];
  for (const b of buildStates(u)) if (b.def.bridge !== undefined) out[b.def.bridge] = b.pct;
  return out;
}

export function houseTier(u: Universe, p: PlayerId) {
  const s = builtSet(u);
  return s.has(`house-${p}-2`) ? 2 : s.has(`house-${p}-1`) ? 1 : 0;
}
