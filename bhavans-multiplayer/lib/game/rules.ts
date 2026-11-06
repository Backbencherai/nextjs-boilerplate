/* Bhavan's Multiplayer — game rules. Every number that balances the game lives here. */

export type ResKey = "coins" | "food" | "water" | "materials" | "knowledge" | "energy" | "peace";
export type Res = Record<ResKey, number>;

export const RES_META: Record<ResKey, { icon: string; label: string; color: string }> = {
  coins: { icon: "🪙", label: "Coins", color: "#e0a100" },
  food: { icon: "🌾", label: "Food", color: "#3f9b3f" },
  water: { icon: "💧", label: "Water", color: "#2a8bd8" },
  materials: { icon: "🧱", label: "Materials", color: "#b5651d" },
  knowledge: { icon: "💡", label: "Knowledge", color: "#8a4fd8" },
  energy: { icon: "⚡", label: "Energy", color: "#ff7a00" },
  peace: { icon: "☮️", label: "Peace", color: "#14a39a" },
};

export const emptyRes = (): Res => ({ coins: 0, food: 0, water: 0, materials: 0, knowledge: 0, energy: 0, peace: 0 });

/* ───────────── Real-life activities → resources ───────────── */
export type ActKind = "study" | "workout" | "meditation" | "meal" | "water" | "sleep" | "steps";
export const ACT_META: Record<ActKind, { icon: string; label: string; unit: string; cap: number; gives: string }> = {
  study: { icon: "📚", label: "Study", unit: "min", cap: 300, gives: "2 💡 + 1 🪙 per minute" },
  workout: { icon: "🏋️", label: "Workout", unit: "min", cap: 180, gives: "3 ⚡ per minute (trains soldiers)" },
  meditation: { icon: "🧘", label: "Meditate", unit: "min", cap: 60, gives: "3 ☮️ per minute (defence)" },
  meal: { icon: "🥗", label: "Meal", unit: "meal", cap: 6, gives: "healthy 40 🌾 · balanced 25 · treat 12" },
  water: { icon: "💧", label: "Water", unit: "glass", cap: 16, gives: "12 💧 per glass" },
  sleep: { icon: "🌙", label: "Sleep", unit: "h", cap: 1, gives: "7–9 h = +12 happiness today" },
  steps: { icon: "👟", label: "Steps", unit: "steps", cap: 20000, gives: "1 🧱 per 60 steps" },
};

/* ───────────── Roles ───────────── */
export type RoleId = "president" | "general" | "banker" | "scientist" | "architect" | "farmer" | "explorer";
export const ROLES: Record<RoleId, { icon: string; name: string; perk: string }> = {
  president: { icon: "🏛️", name: "President", perk: "+10% taxes, +5 happiness" },
  general: { icon: "🎖️", name: "General", perk: "+20% attack, soldiers 25% cheaper" },
  banker: { icon: "🏦", name: "Banker", perk: "3%/day savings, no transfer fee, cheaper loans" },
  scientist: { icon: "🔬", name: "Scientist", perk: "+25% knowledge" },
  architect: { icon: "👷", name: "Architect", perk: "Buildings 20% cheaper and 2× faster" },
  farmer: { icon: "🌾", name: "Farmer", perk: "+25% food and water" },
  explorer: { icon: "✈️", name: "Explorer", perk: "Flights 50% cheaper, +50% tourism income" },
};
export const ROLE_SWITCH_HOURS = 24;

/* ───────────── Buildings ───────────── */
export type BType =
  | "hall"
  | "house"
  | "farm"
  | "water"
  | "factory"
  | "market"
  | "bank"
  | "school"
  | "barracks"
  | "wall"
  | "hospital"
  | "park"
  | "airport"
  | "monument"
  | "police"
  | "bunker"
  | "station";

export interface BDef {
  name: string;
  icon: string;
  desc: string;
  cost: Partial<Res>;
  /** per hour, per level */
  makes?: Partial<Res>;
  pop?: number; // housing per level
  happy?: number; // happiness per level
  max?: number; // how many you can own
  minutes: number; // build time for level 1 (x level for upgrades)
  unlockCity?: number; // city level needed
}

export const MAX_LEVEL = 5;

export const BUILDINGS: Record<BType, BDef> = {
  hall: { name: "Parliament", icon: "🏛️", desc: "Seat of your government. Upgrading it raises your city level cap.", cost: { coins: 150, materials: 120 }, happy: 2, max: 1, minutes: 4 },
  house: { name: "Homes", icon: "🏠", desc: "Room for 12 citizens per level. Citizens pay taxes.", cost: { coins: 50, materials: 40 }, pop: 12, minutes: 1 },
  farm: { name: "Farm", icon: "🌾", desc: "Grows 8 food an hour per level.", cost: { coins: 60, materials: 30 }, makes: { food: 8 }, minutes: 1 },
  water: { name: "Water Tower", icon: "🚰", desc: "Pumps 8 water an hour per level.", cost: { coins: 60, materials: 30 }, makes: { water: 8 }, minutes: 1 },
  factory: { name: "Factory", icon: "🏭", desc: "+14 coins and +4 materials an hour per level. A little noisy (-2 happiness).", cost: { coins: 120, materials: 80 }, makes: { coins: 14, materials: 4 }, happy: -2, minutes: 2 },
  market: { name: "Market", icon: "🏪", desc: "+9 coins an hour, +2 happiness per level.", cost: { coins: 100, materials: 50 }, makes: { coins: 9 }, happy: 2, minutes: 2 },
  bank: { name: "National Bank", icon: "🏦", desc: "Unlocks savings with interest, loans and money transfers.", cost: { coins: 200, materials: 100 }, max: 1, minutes: 3 },
  school: {
    name: "Bhavan's BP Vidya Mandir, Civil Lines",
    icon: "🎓",
    desc: "Your country's one and only school. +5 knowledge an hour and +10% knowledge from study per level.",
    cost: { coins: 150, materials: 80 },
    makes: { knowledge: 5 },
    happy: 1,
    max: 1,
    minutes: 3,
  },
  barracks: { name: "Barracks", icon: "🎖️", desc: "Train soldiers. Holds 25 soldiers per level. Needed for war.", cost: { coins: 150, materials: 120 }, max: 2, minutes: 3 },
  wall: { name: "Great Wall", icon: "🧱", desc: "+70 defence per level. Also protects against tsunamis and storms.", cost: { coins: 80, materials: 140 }, minutes: 2 },
  hospital: { name: "Hospital", icon: "🏥", desc: "+5 happiness, faster population growth, fewer disaster casualties.", cost: { coins: 160, materials: 90 }, happy: 5, minutes: 3 },
  park: { name: "Park", icon: "🌳", desc: "+4 happiness per level.", cost: { coins: 40, materials: 20 }, happy: 4, minutes: 1 },
  airport: { name: "Airport", icon: "✈️", desc: "Flights to other countries, tourism income and more immigrants.", cost: { coins: 300, materials: 200 }, max: 1, minutes: 4, unlockCity: 4 },
  monument: { name: "Monument", icon: "🗽", desc: "A national wonder. +150 power and +6 happiness per level.", cost: { coins: 500, materials: 300 }, happy: 6, max: 1, minutes: 6, unlockCity: 8 },
  police: { name: "Police", icon: "🚓", desc: "Raiders steal 6% less per level.", cost: { coins: 120, materials: 60 }, max: 2, minutes: 2 },
  station: { name: "Railway Station", icon: "🚆", desc: "Trains bring commuters and trade: +10 coins an hour and +3 happiness per level. Trains run around your city.", cost: { coins: 220, materials: 180 }, makes: { coins: 10 }, happy: 3, max: 1, minutes: 3, unlockCity: 3 },
  bunker: { name: "Bunker", icon: "🛡️", desc: "Shelters citizens from the weekly Red Meteor and from disasters (-20% damage per level).", cost: { coins: 180, materials: 160 }, max: 1, minutes: 3 },
};

export const BUILD_ORDER: BType[] = ["house", "farm", "water", "school", "market", "factory", "park", "bank", "barracks", "wall", "hospital", "police", "bunker", "station", "airport", "monument", "hall"];

/* ───────────── Research ───────────── */
export type TechId = "agriculture" | "engineering" | "tactics" | "fortification" | "finance" | "medicine" | "aviation";
export const TECH: Record<TechId, { icon: string; name: string; per: string; base: number }> = {
  agriculture: { icon: "🌱", name: "Agriculture", per: "+10% food and water", base: 120 },
  engineering: { icon: "📐", name: "Engineering", per: "-8% building cost", base: 150 },
  tactics: { icon: "🗡️", name: "Tactics", per: "+10% attack", base: 150 },
  fortification: { icon: "🏰", name: "Fortification", per: "+10% defence", base: 150 },
  finance: { icon: "📈", name: "Finance", per: "+0.5%/day savings, +5% coins", base: 130 },
  medicine: { icon: "💊", name: "Medicine", per: "+3 happiness, fewer disaster losses", base: 130 },
  aviation: { icon: "🛫", name: "Aviation", per: "-15% flight cost, more tourists", base: 140 },
};
export const TECH_MAX = 3;
export const techCost = (t: TechId, lvl: number) => Math.round(TECH[t].base * (lvl + 1) ** 1.6);

/* ───────────── Economy constants ───────────── */
export const TAX_PER_CITIZEN_HOUR = 0.15;
export const EAT_PER_CITIZEN_HOUR = 0.04; // food and water each
export const BASE_POP_CAP = 10;
export const SOLDIER_COST = { energy: 10, food: 4, coins: 6 };
export const SAVINGS_RATE = 0.02; // per day
export const LOAN_RATE = 0.05; // per day
export const OFFLINE_CAP_HOURS = 18;
export const START_SHIELD_HOURS = 72;
export const RAID_SHIELD_HOURS = 8;
export const MAX_LAND = 16;
export const START_LAND = 6;
export const MAX_PARTNERS = 3;
export const TRIPS_PER_DAY = 3;

export const START: { res: Res; pop: number; happiness: number } = {
  res: { coins: 400, food: 120, water: 120, materials: 300, knowledge: 20, energy: 40, peace: 10 },
  pop: 8,
  happiness: 60,
};

/* ───────────── Characters (KayKit CC0, re-dressed) ───────────── */
export type CharId = "knight" | "barbarian" | "mage" | "rogue" | "hooded" | "scholar" | "explorer";
export const CHARACTERS: Record<CharId, { name: string; file: string; blurb: string }> = {
  knight: { name: "Knight", file: "knight.glb", blurb: "Armoured and steady" },
  barbarian: { name: "Barbarian", file: "barbarian.glb", blurb: "Big beard, bigger heart" },
  mage: { name: "Mage", file: "mage.glb", blurb: "Wise, with a pointy hat" },
  rogue: { name: "Rogue", file: "rogue.glb", blurb: "Quick and clever" },
  hooded: { name: "Ranger", file: "hooded.glb", blurb: "Hood up, eyes sharp" },
  scholar: { name: "Scholar", file: "scholar.glb", blurb: "Blue jacket, always studying" },
  explorer: { name: "Explorer", file: "explorer.glb", blurb: "Red top, always travelling" },
};

/* ───────────── Daily goals ───────────── */
export const DAILY_GOALS = [
  { id: "water8", label: "Drink 8 glasses", icon: "💧", reward: 60, test: (d: DayLog) => d.water >= 8 },
  { id: "work30", label: "Work out 30 min", icon: "🏋️", reward: 70, test: (d: DayLog) => d.workout >= 30 },
  { id: "study60", label: "Study 60 min", icon: "📚", reward: 70, test: (d: DayLog) => d.study >= 60 },
  { id: "healthy2", label: "2 healthy meals", icon: "🥗", reward: 60, test: (d: DayLog) => d.healthy >= 2 },
];
export const ALL_GOALS_BONUS = 120;

export interface DayLog {
  key: string;
  study: number;
  workout: number;
  meditation: number;
  meals: number;
  healthy: number;
  water: number;
  sleep: number;
  steps: number;
  trips: number;
  claimed: string[];
}

/* ───────────── The rival: Centerpoint School (AI) ───────────── */
export const AI_ID = "ai-centerpoint";
export const AI_NAME = "Centerpoint School";
export const AI_HOME = { cc: "356", lat: 21.15, lon: 79.08 }; // Nagpur, India
export const AI_RAID_EVERY_HOURS = 52;

/* ───────────── Season ───────────── */
export const SEASON_DAYS = 30;
