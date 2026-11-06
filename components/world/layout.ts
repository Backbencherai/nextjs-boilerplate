import type { PlayerId } from "@/lib/types";

export interface IslandDef {
  id: string;
  name: string;
  x: number;
  z: number;
  r: number;
  grass: string;
}

export const ISLANDS: IslandDef[] = [
  { id: "together", name: "Together Isle", x: 0, z: 0, r: 8, grass: "#8fd162" },
  { id: "mind", name: "Mind Isle", x: 0, z: -17, r: 5.5, grass: "#9ccf6b" },
  { id: "body", name: "Body Isle", x: 0, z: 17, r: 5.5, grass: "#7fc25a" },
  { id: "adarsh", name: "Adarsh's Isle", x: -17, z: 0, r: 6, grass: "#80c7a0" },
  { id: "devanshi", name: "Devanshi's Isle", x: 17, z: 0, r: 6, grass: "#a8d36a" },
];

export const BRIDGES: { from: [number, number]; to: [number, number]; box: [number, number, number, number] }[] = [
  { from: [0, -7.6], to: [0, -11.8], box: [-0.75, 0.75, -12.2, -7.2] },
  { from: [0, 7.6], to: [0, 11.8], box: [-0.75, 0.75, 7.2, 12.2] },
  { from: [-7.6, 0], to: [-11.3, 0], box: [-11.7, -7.2, -0.75, 0.75] },
  { from: [7.6, 0], to: [11.3, 0], box: [7.2, 11.7, -0.75, 0.75] },
];

/** Solid things you can't walk through. */
export const OBSTACLES: { x: number; z: number; r: number }[] = [
  { x: -4, z: -4.4, r: 1.9 }, // hall
  { x: 3.2, z: -3.4, r: 0.8 }, // shared tree
  { x: 1.8, z: 1.8, r: 0.8 }, // bonfire
  { x: 4, z: 3.8, r: 1.2 }, // observatory
  { x: 5, z: -1.8, r: 0.7 }, // well
  { x: -1.8, z: -18, r: 1.8 }, // library
  { x: 2.4, z: -17, r: 1.7 }, // spring
  { x: -2, z: 17.2, r: 1.6 }, // gym
  { x: 2.3, z: 17.4, r: 1.6 }, // garden
  { x: -17, z: -2.2, r: 1.4 }, // adarsh house
  { x: 17, z: -2.2, r: 1.4 }, // devanshi house
];

export type ZoneAction =
  | { type: "timer"; kind: "study" | "workout" | "meditation" }
  | { type: "sheet"; tab: "meal" | "water" | "sleep" | "mood" | "steps" }
  | { type: "water" }
  | { type: "route"; href: string }
  | { type: "notes" };

export interface ZoneDef {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  door: [number, number];
  label: [number, number, number];
  action: ZoneAction;
  cta: string;
  owner?: PlayerId;
}

export const ZONES: ZoneDef[] = [
  { id: "library", name: "The Library", icon: "📚", blurb: "Books pile up with every study hour.", door: [-1.8, -15.4], label: [-1.8, 3.4, -18], action: { type: "timer", kind: "study" }, cta: "Start studying" },
  { id: "spring", name: "Wellness Spring", icon: "🧘", blurb: "Sit on the stone and breathe.", door: [2.4, -14.2], label: [2.4, 1.8, -17], action: { type: "timer", kind: "meditation" }, cta: "Start meditating" },
  { id: "gym", name: "The Forge", icon: "🏋️", blurb: "Plates are added as you train.", door: [-2, 15], label: [-2, 2.8, 17.2], action: { type: "timer", kind: "workout" }, cta: "Start workout" },
  { id: "garden", name: "Kitchen Garden", icon: "🥗", blurb: "Your garden grows with healthy meals.", door: [2.3, 15.2], label: [2.3, 1.8, 17.4], action: { type: "sheet", tab: "meal" }, cta: "Log a meal" },
  { id: "well", name: "The Well", icon: "💧", blurb: "One tap, one glass.", door: [4, -0.8], label: [5, 2.4, -1.8], action: { type: "water" }, cta: "Drink a glass  +3 XP" },
  { id: "bonfire", name: "The Bonfire", icon: "🔥", blurb: "Burns brighter on days you're both active.", door: [1.8, 3.3], label: [1.8, 2.2, 1.8], action: { type: "sheet", tab: "mood" }, cta: "Check in mood & sleep" },
  { id: "hall", name: "Hall of Fame", icon: "🏛️", blurb: "Records, medals and the shared museum.", door: [-4, -2], label: [-4, 4.2, -4.4], action: { type: "route", href: "/fame" }, cta: "Enter the Hall" },
  { id: "board", name: "Quest Board", icon: "📜", blurb: "Daily & weekly quests.", door: [-3.8, 4.7], label: [-3.8, 2.4, 3.6], action: { type: "route", href: "/quests" }, cta: "Read quests" },
  { id: "observatory", name: "Observatory", icon: "🔭", blurb: "See your growth charted across time.", door: [4, 5.6], label: [4, 3.2, 3.8], action: { type: "route", href: "/stats" }, cta: "Look at the stars" },
  { id: "dock", name: "Bottle Dock", icon: "🍾", blurb: "Send a note across the sea.", door: [5.3, -4.3], label: [6, 1.4, -4.8], action: { type: "notes" }, cta: "Open bottles" },
  { id: "home-adarsh", name: "Adarsh's Museum", icon: "🏠", blurb: "Personal trophy museum.", door: [-17, 0], label: [-17, 3.2, -2.2], action: { type: "route", href: "/museum/adarsh" }, cta: "Enter museum", owner: "adarsh" },
  { id: "home-devanshi", name: "Devanshi's Museum", icon: "🏠", blurb: "Personal trophy museum.", door: [17, 0], label: [17, 3.2, -2.2], action: { type: "route", href: "/museum/devanshi" }, cta: "Enter museum", owner: "devanshi" },
];

export const SPAWN: Record<PlayerId, [number, number]> = { adarsh: [-17, 1.6], devanshi: [17, 1.6] };

export const COIN_SPOTS: [number, number][] = [
  [-5, 2], [5.6, 0.4], [-2, 5.5], [1.2, -5.8], [-6.4, -1.4], [6, 2.5], [1.5, 6.5],
  [0, -14], [-3.5, -15], [3.8, -19.5], [-3, -19.5], [0, -20.5],
  [0, 14], [-3.5, 19.5], [3.8, 19.5], [0, 20.5], [-4, 14],
  [-20, 2], [-14, 3], [-19.5, -3.5], [-13.5, -2.5],
  [20, 2], [14, 3], [19.5, -3.5], [13.5, -2.5],
  [0, -9.5], [0, 9.5], [-9.3, 0], [9.3, 0],
];

export function walkable(x: number, z: number): boolean {
  let ok = false;
  for (const i of ISLANDS) {
    if ((x - i.x) ** 2 + (z - i.z) ** 2 < (i.r - 0.45) ** 2) {
      ok = true;
      break;
    }
  }
  if (!ok) {
    for (const b of BRIDGES) {
      const [x0, x1, z0, z1] = b.box;
      if (x > x0 && x < x1 && z > z0 && z < z1) {
        ok = true;
        break;
      }
    }
  }
  if (!ok) return false;
  for (const o of OBSTACLES) if ((x - o.x) ** 2 + (z - o.z) ** 2 < o.r ** 2) return false;
  return true;
}
