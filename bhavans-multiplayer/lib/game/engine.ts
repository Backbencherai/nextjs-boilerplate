/* Bhavan's Multiplayer — the game engine. Pure functions: (nation, input) -> new nation. */
import {
  ACT_META,
  AI_ID,
  AI_NAME,
  ALL_GOALS_BONUS,
  BASE_POP_CAP,
  BUILDINGS,
  DAILY_GOALS,
  EAT_PER_CITIZEN_HOUR,
  LOAN_RATE,
  MAX_LAND,
  MAX_LEVEL,
  MAX_PARTNERS,
  OFFLINE_CAP_HOURS,
  RAID_SHIELD_HOURS,
  ROLE_SWITCH_HOURS,
  SAVINGS_RATE,
  SOLDIER_COST,
  START,
  START_LAND,
  START_SHIELD_HOURS,
  TAX_PER_CITIZEN_HOUR,
  TECH_MAX,
  TRIPS_PER_DAY,
  emptyRes,
  techCost,
  type ActKind,
  type BType,
  type CharId,
  type DayLog,
  type Res,
  type ResKey,
  type RoleId,
  type TechId,
} from "./rules";
import { CAL_META, DAY, HOUR, METEOR_WINDOW_MIN, aiRaids, aiStrength, calamitiesBetween, distanceKm, hits, meteors, rng, type Calamity } from "./world";
import { currencyRate, dayHealth, healthIndex } from "./market";

export interface Tile {
  x: number;
  y: number;
  t: BType;
  lvl: number;
  doneAt: number; // construction finishes at (ms)
  dmg?: boolean;
}
export interface March {
  id: string;
  target: string;
  targetName: string;
  sent: number;
  launchAt: number;
  arriveAt: number;
  ai?: boolean;
}
export interface Ledger {
  at: number;
  kind: string;
  text: string;
  coins?: number;
}
export interface Season {
  id: string;
  start: number;
}
export interface Home {
  cc: string; // ISO numeric country code (world-atlas id)
  country: string;
  lat: number;
  lon: number;
}

export interface Nation {
  v: 1;
  id: string;
  name: string;
  president: string;
  flag: string;
  color: string;
  character: CharId;
  role: RoleId;
  roleSince: number;
  home: Home;
  createdAt: number;
  season: string;
  res: Res;
  pop: number;
  happiness: number;
  soldiers: number;
  landBonus: number;
  tiles: Tile[];
  tech: Partial<Record<TechId, number>>;
  bank: { savings: number; loan: number };
  lastTick: number;
  day: DayLog;
  stats: {
    studyMin: number;
    workoutMin: number;
    meals: number;
    water: number;
    steps: number;
    medMin: number;
    sleepNights: number;
    wins: number;
    losses: number;
    defended: number;
    raided: number;
    aiWins: number;
    aiLosses: number;
    tourists: number;
    trips: number;
    meteorsSurvived: number;
    calamities: number;
  };
  shieldUntil: number;
  marches: March[];
  partners: { id: string; name: string; since: number }[];
  allyReqs: { id: string; name: string; at: number }[];
  stamps: { id: string; name: string; at: number }[];
  gear?: string[];
  reports?: { key: string; n: number };
  done: string[];
  ledger: Ledger[];
  log: { at: number; kind: ActKind; amount: number; note?: string }[];
  cover: string[]; // meteor ids you took cover for
  morale: number; // today's sleep bonus
  lastAiAttack: number;
  status?: { kind: string; since: number } | null;
  hist?: { key: string; score: number }[]; // daily health scores (currency strength)
  offers?: { id: string; from: string; fromName: string; res: ResKey; qty: number; price: number; at: number }[];
  timer?: { kind: "study" | "workout" | "meditation"; startedAt: number } | null;
  prep?: Record<string, PrepKind>;
  manualMin?: { key: string; min: number };
  portfolio?: Record<string, { qty: number; avg: number; name: string; flag: string }>;
}

export type PrepKind = "sandbags" | "evacuate" | "stockpile";
export const PREP: Record<PrepKind, { icon: string; name: string; cost: Partial<Res>; desc: string }> = {
  sandbags: { icon: "🧱", name: "Sandbags & shutters", cost: { materials: 120 }, desc: "-45% damage from typhoons and tsunamis" },
  evacuate: { icon: "🚌", name: "Evacuation plan", cost: { coins: 100 }, desc: "-40% losses from any disaster" },
  stockpile: { icon: "📦", name: "Emergency stockpile", cost: { coins: 60, food: 40 }, desc: "-50% whirlwind losses, +food reserve" },
};
export function prepare(n0: Nation, calId: string, kind: PrepKind): Result {
  if (n0.prep?.[calId]) return { ok: false, err: "Already prepared for this one." };
  const c = PREP[kind].cost;
  if (!canAfford(n0, c)) return { ok: false, err: "Not enough resources." };
  const n = clone(n0);
  pay(n, c);
  if (kind === "stockpile") n.res.food += 60;
  n.prep = { ...(n.prep ?? {}), [calId]: kind };
  const keys = Object.keys(n.prep);
  if (keys.length > 60) delete n.prep[keys[0]];
  return { ok: true, n };
}

/* server-measured timers: you can't fake the minutes */
export function startTimer(n0: Nation, kind: "study" | "workout" | "meditation", now: number): Result {
  if (n0.timer) return { ok: false, err: "A timer is already running." };
  const n = clone(n0);
  n.timer = { kind, startedAt: now };
  n.status = { kind, since: now };
  return { ok: true, n };
}
export function stopTimer(n0: Nation, save: boolean, now: number): Result & { minutes?: number } {
  if (!n0.timer) return { ok: false, err: "No timer running." };
  const minutes = Math.floor((now - n0.timer.startedAt) / 60_000);
  let n = clone(n0);
  const kind = n.timer!.kind;
  n.timer = null;
  n.status = null;
  if (save && minutes >= 1) n = logActivity(n, kind, minutes, now).n;
  return { ok: true, n, minutes };
}
/** Forgot the timer? Up to 60 self-reported minutes a day, total. */
export function logManual(n0: Nation, kind: "study" | "workout" | "meditation", minutes: number, now: number): Result {
  const key = dayKey(now);
  const used = n0.manualMin?.key === key ? n0.manualMin.min : 0;
  const m = Math.max(0, Math.min(Math.floor(minutes), 60 - used));
  if (m < 1) return { ok: false, err: "Daily limit for self-reported minutes reached. Use the timer." };
  const n = logActivity(n0, kind, m, now).n;
  n.manualMin = { key, min: used + m };
  return { ok: true, n };
}

export interface Note {
  icon: string;
  title: string;
  body: string;
  kind: "good" | "bad" | "info";
  news?: boolean;
}

/* ───────────── helpers ───────────── */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const r1 = (x: number) => Math.round(x * 10) / 10;
export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const freshDay = (t: number): DayLog => ({ key: dayKey(t), study: 0, workout: 0, meditation: 0, meals: 0, healthy: 0, water: 0, sleep: 0, steps: 0, trips: 0, claimed: [] });
function ensureDay(n: Nation, now: number) {
  const k = dayKey(now);
  if (n.day.key !== k) {
    n.hist = [...(n.hist ?? []), { key: n.day.key, score: dayHealth(n.day) }].slice(-14);
    n.day = freshDay(now);
    n.morale = 0;
  }
}
function pushLedger(n: Nation, l: Ledger) {
  n.ledger.unshift(l);
  if (n.ledger.length > 120) n.ledger.length = 120;
}
function markDone(n: Nation, id: string) {
  n.done.push(id);
  if (n.done.length > 600) n.done.splice(0, n.done.length - 600);
}

export const active = (t: Tile, at: number) => t.doneAt <= at && !t.dmg;
export function levels(n: Pick<Nation, "tiles">, type: BType, at = Date.now()) {
  return n.tiles.filter((t) => t.t === type && active(t, at)).reduce((s, t) => s + t.lvl, 0);
}
export const has = (n: Pick<Nation, "tiles">, type: BType, at = Date.now()) => levels(n, type, at) > 0;
const tech = (n: Nation, t: TechId) => n.tech[t] ?? 0;

export function cityLevel(n: Pick<Nation, "tiles">, at = Date.now()) {
  const total = n.tiles.filter((t) => active(t, at)).reduce((s, t) => s + t.lvl, 0);
  const hall = levels(n, "hall", at);
  const cap = hall ? hall * 4 + 2 : 2;
  return Math.min(cap, 1 + Math.floor(total / 3));
}
export function landSize(n: Nation, at = Date.now()) {
  return Math.min(MAX_LAND, START_LAND + Math.floor((cityLevel(n, at) - 1) / 2) + n.landBonus);
}
export function popCap(n: Nation, at = Date.now()) {
  return BASE_POP_CAP + levels(n, "house", at) * (BUILDINGS.house.pop ?? 12) + levels(n, "hall", at) * 6;
}
export function soldierCap(n: Nation, at = Date.now()) {
  return levels(n, "barracks", at) * 25;
}
export const completedCount = (n: Nation, at = Date.now()) => n.tiles.filter((t) => active(t, at)).length;
export const warReady = (n: Nation, at = Date.now()) => completedCount(n, at) >= 8 && has(n, "barracks", at);

export function costOf(n: Nation, type: BType, level: number): Partial<Res> {
  const base = BUILDINGS[type].cost;
  const m = level * (n.role === "architect" ? 0.8 : 1) * (1 - 0.08 * tech(n, "engineering"));
  const out: Partial<Res> = {};
  for (const k of Object.keys(base) as ResKey[]) out[k] = Math.round((base[k] ?? 0) * m * (1 + (level - 1) * 0.35));
  return out;
}
export const buildMinutes = (n: Nation, type: BType, level: number) => BUILDINGS[type].minutes * level * (n.role === "architect" ? 0.5 : 1);
export const canAfford = (n: Nation, c: Partial<Res>) => (Object.keys(c) as ResKey[]).every((k) => n.res[k] >= (c[k] ?? 0));
function pay(n: Nation, c: Partial<Res>) {
  for (const k of Object.keys(c) as ResKey[]) n.res[k] -= c[k] ?? 0;
}

/* ───────────── creation ───────────── */
export function newNation(p: { id: string; name: string; president: string; flag: string; color: string; character: CharId; role: RoleId; home: Home; season: Season }, now = Date.now()): Nation {
  const c = 3; // centre of the starting land
  const tiles: Tile[] = [
    { x: c, y: c, t: "hall", lvl: 1, doneAt: now },
    { x: c - 1, y: c, t: "house", lvl: 1, doneAt: now },
    { x: c + 1, y: c, t: "farm", lvl: 1, doneAt: now },
    { x: c, y: c + 1, t: "water", lvl: 1, doneAt: now },
  ];
  return {
    v: 1,
    id: p.id,
    name: p.name,
    president: p.president,
    flag: p.flag,
    color: p.color,
    character: p.character,
    role: p.role,
    roleSince: now,
    home: p.home,
    createdAt: now,
    season: p.season.id,
    res: { ...START.res },
    pop: START.pop,
    happiness: START.happiness,
    soldiers: 0,
    landBonus: 0,
    tiles,
    tech: {},
    bank: { savings: 0, loan: 0 },
    lastTick: now,
    day: freshDay(now),
    stats: { studyMin: 0, workoutMin: 0, meals: 0, water: 0, steps: 0, medMin: 0, sleepNights: 0, wins: 0, losses: 0, defended: 0, raided: 0, aiWins: 0, aiLosses: 0, tourists: 0, trips: 0, meteorsSurvived: 0, calamities: 0 },
    shieldUntil: now + START_SHIELD_HOURS * HOUR,
    marches: [],
    partners: [],
    allyReqs: [],
    stamps: [],
    done: [],
    ledger: [{ at: now, kind: "found", text: `${p.name} was founded`, coins: START.res.coins }],
    log: [],
    cover: [],
    morale: 0,
    lastAiAttack: 0,
    status: null,
  };
}

/* ───────────── production ───────────── */
function happyTarget(n: Nation, at: number, shortage: boolean) {
  let h = 50;
  for (const t of n.tiles) if (active(t, at)) h += (BUILDINGS[t.t].happy ?? 0) * t.lvl;
  if (n.role === "president") h += 5;
  h += 3 * tech(n, "medicine") + n.morale;
  h += Math.min(12, n.stamps.filter((s) => at - s.at < 7 * DAY).length * 2);
  if (shortage) h -= 25;
  return Math.max(0, Math.min(100, h));
}

/** Local hour in the country (from its longitude). */
export const localHour = (home: { lon: number }, at: number) => (((new Date(at).getUTCHours() + new Date(at).getUTCMinutes() / 60 + home.lon / 15) % 24) + 24) % 24;
export const isNight = (home: { lon: number }, at: number) => {
  const h = localHour(home, at);
  return h < 6 || h >= 20;
};

export function perHour(n: Nation, at: number, cals: Calamity[] = []): Res {
  const out = emptyRes();
  const night = isNight(n.home, at);
  for (const t of n.tiles) {
    if (!active(t, at)) continue;
    const mk = BUILDINGS[t.t].makes;
    if (!mk) continue;
    // at night markets, factories and the school close; farms and water keep going
    const nf = night && (t.t === "market" || t.t === "factory" || t.t === "school" || t.t === "station") ? 0.45 : 1;
    for (const k of Object.keys(mk) as ResKey[]) out[k] += (mk[k] ?? 0) * t.lvl * nf;
  }
  out.coins += n.pop * TAX_PER_CITIZEN_HOUR * (n.role === "president" ? 1.1 : 1);
  const hf = 0.6 + n.happiness / 250;
  const partnersBoost = 1 + 0.05 * Math.min(MAX_PARTNERS, n.partners.length);
  out.coins *= hf * partnersBoost * (1 + 0.05 * tech(n, "finance")) * (0.85 + 0.3 * healthIndex(n));
  const agri = (n.role === "farmer" ? 1.25 : 1) * (1 + 0.1 * tech(n, "agriculture"));
  out.food *= hf * agri;
  out.water *= hf * agri;
  out.knowledge *= hf * (n.role === "scientist" ? 1.25 : 1);
  out.materials *= hf;
  for (const c of cals) {
    if (!(c.start <= at && at < c.end) || !hits(c, n.home)) continue;
    if (c.type === "rain") {
      out.water *= 1.5;
      out.food *= 1.2;
    } else if (c.type === "thunderstorm") {
      const f = levels(n, "factory", at) * 14 * hf * 0.5;
      out.coins -= f;
    } else if (c.type === "elnino") {
      out.food *= 0.7;
      out.water *= 0.7;
    }
  }
  out.food -= n.pop * EAT_PER_CITIZEN_HOUR;
  out.water -= n.pop * EAT_PER_CITIZEN_HOUR;
  return out;
}

function mitigation(n: Nation, at: number) {
  const walls = Math.min(0.4, levels(n, "wall", at) * 0.06);
  return Math.max(0.1, 1 - levels(n, "bunker", at) * 0.2 - walls - 0.05 * tech(n, "medicine") - Math.min(0.15, levels(n, "hospital", at) * 0.03));
}

function damageBuildings(n: Nation, seed: string, count: number) {
  const r = rng(seed);
  const pool = n.tiles.filter((t) => t.t !== "hall" && !t.dmg);
  const hit: string[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const t = pool.splice(Math.floor(r() * pool.length), 1)[0];
    if (t.lvl > 1) t.lvl -= 1;
    else t.dmg = true;
    hit.push(BUILDINGS[t.t].name);
  }
  return hit;
}

/* ───────────── the tick: time passes ───────────── */
export function tick(n0: Nation, now: number, season: Season): { n: Nation; notes: Note[] } {
  const n = clone(n0);
  const notes: Note[] = [];
  ensureDay(n, now);
  if (now <= n.lastTick) return { n, notes };
  const from = n.lastTick;
  const start = Math.max(from, now - OFFLINE_CAP_HOURS * HOUR);
  const cals = calamitiesBetween(season, from, now);

  // one-off calamity hits (at their start)
  for (const c of cals) {
    if (c.start <= from || c.start > now || n.done.includes(c.id) || !hits(c, n.home)) continue;
    markDone(n, c.id);
    const prep = n.prep?.[c.id];
    const m = mitigation(n, c.start) * (prep === "sandbags" && (c.type === "typhoon" || c.type === "tsunami") ? 0.55 : prep === "evacuate" ? 0.6 : prep === "stockpile" && c.type === "whirlwind" ? 0.5 : 1);
    const meta = CAL_META[c.type];
    if (c.type === "typhoon") {
      const hit = damageBuildings(n, c.id + n.id, Math.round(2 * m));
      n.stats.calamities++;
      notes.push({ icon: meta.icon, title: `${meta.name} hit ${n.name}`, body: hit.length ? `Damaged: ${hit.join(", ")}. Repair them in your city.` : "Your walls and bunker held. No damage!", kind: hit.length ? "bad" : "good", news: true });
    } else if (c.type === "whirlwind") {
      const lostF = Math.round(n.res.food * 0.12 * m);
      const lostM = Math.round(n.res.materials * 0.12 * m);
      n.res.food -= lostF;
      n.res.materials -= lostM;
      const hit = m > 0.5 ? damageBuildings(n, c.id + n.id, 1) : [];
      n.stats.calamities++;
      notes.push({ icon: meta.icon, title: `${meta.name} swept through`, body: `Lost ${lostF} food and ${lostM} materials${hit.length ? `, damaged ${hit[0]}` : ""}.`, kind: "bad", news: true });
    } else if (c.type === "tsunami") {
      const lostP = Math.round(n.pop * 0.15 * m);
      const lostM = Math.round(n.res.materials * 0.2 * m);
      n.pop = Math.max(1, n.pop - lostP);
      n.res.materials -= lostM;
      n.stats.calamities++;
      notes.push({ icon: meta.icon, title: `Tsunami hit ${n.name}'s coast`, body: lostP ? `${lostP} citizens and ${lostM} materials were lost. Walls and a bunker reduce this.` : "Your sea walls held!", kind: lostP ? "bad" : "good", news: true });
    } else {
      notes.push({ icon: meta.icon, title: `${meta.name} over ${n.name}`, body: meta.effect, kind: c.type === "rain" ? "good" : "info" });
    }
  }

  // continuous economy, in ≤1h steps
  let t = start;
  while (t < now) {
    const step = Math.min(HOUR, now - t);
    const hrs = step / HOUR;
    const mid = t + step / 2;
    const ph = perHour(n, mid, cals);
    for (const k of Object.keys(ph) as ResKey[]) n.res[k] += ph[k] * hrs;
    let shortage = false;
    if (n.res.food < 0) {
      n.res.food = 0;
      shortage = true;
    }
    if (n.res.water < 0) {
      n.res.water = 0;
      shortage = true;
    }
    const cap = popCap(n, mid);
    if (shortage) n.pop = Math.max(1, n.pop - n.pop * 0.03 * hrs);
    else if (n.happiness >= 40 && n.pop < cap) n.pop = Math.min(cap, n.pop + Math.max(0.3, (cap - n.pop) * 0.08) * hrs * (1 + 0.15 * levels(n, "hospital", mid)));
    // immigration: happy countries attract people from the world
    if (!shortage && n.happiness > 62 && n.pop < cap) n.pop = Math.min(cap, n.pop + (n.happiness - 62) * 0.03 * hrs * (has(n, "airport", mid) ? 2 : 1) * (1 + 0.1 * tech(n, "aviation")));
    if (n.pop > cap) n.pop = Math.max(cap, n.pop - (n.pop - cap) * 0.2 * hrs);
    const target = happyTarget(n, mid, shortage);
    n.happiness += (target - n.happiness) * Math.min(1, 0.12 * hrs);
    // bank
    const sRate = (n.role === "banker" ? 0.03 : SAVINGS_RATE) + 0.005 * tech(n, "finance");
    n.bank.savings *= Math.pow(1 + sRate, hrs / 24);
    n.bank.loan *= Math.pow(1 + (n.role === "banker" ? 0.035 : LOAN_RATE), hrs / 24);
    t += step;
  }
  for (const k of Object.keys(n.res) as ResKey[]) n.res[k] = Math.max(0, r1(n.res[k]));
  n.pop = r1(n.pop);
  n.happiness = r1(n.happiness);

  // construction finished
  for (const tl of n.tiles) {
    const id = `built-${tl.x}-${tl.y}-${tl.t}-${tl.lvl}-${tl.doneAt}`;
    if (tl.doneAt > from && tl.doneAt <= now && !n.done.includes(id)) {
      markDone(n, id);
      notes.push({ icon: BUILDINGS[tl.t].icon, title: `${BUILDINGS[tl.t].name} ${tl.lvl > 1 ? `upgraded to level ${tl.lvl}` : "built"}`, body: BUILDINGS[tl.t].desc, kind: "good", news: tl.t === "airport" || tl.t === "monument" });
    }
  }

  // the Red Meteor (weekly survival event)
  for (const m of meteors(season)) {
    const resolveAt = m.at + METEOR_WINDOW_MIN * 60_000;
    if (resolveAt <= from || resolveAt > now || n.done.includes(m.id) || n.createdAt > m.at) continue;
    markDone(n, m.id);
    const tookCover = n.cover.includes(m.id);
    const protection = Math.min(1, levels(n, "bunker", m.at) * 0.22 + (tookCover ? 0.4 : 0) + Math.min(0.15, levels(n, "hospital", m.at) * 0.04));
    const loss = 1 - protection;
    const lostP = Math.round(n.pop * 0.35 * loss);
    const lostC = Math.round(n.res.coins * 0.25 * loss);
    n.pop = Math.max(1, n.pop - lostP);
    n.res.coins -= lostC;
    const hit = loss > 0.3 ? damageBuildings(n, m.id + n.id, loss > 0.7 ? 3 : 1) : [];
    const survived = protection >= 0.6;
    if (survived) {
      n.stats.meteorsSurvived++;
      n.res.coins += 150;
      n.res.knowledge += 60;
    }
    notes.push({
      icon: "☄️",
      title: survived ? `${n.name} survived the Red Meteor!` : `The Red Meteor hit ${n.name}`,
      body: survived ? `Your people were safe in the bunker. Survivor reward: +150 🪙, +60 💡.` : `${lostP} citizens and ${lostC} coins lost${hit.length ? `, damaged ${hit.join(", ")}` : ""}. Build a Bunker and take cover next week.`,
      kind: survived ? "good" : "bad",
      news: true,
    });
  }

  // Centerpoint School raids
  for (const raid of aiRaids(n.id, n.createdAt, START_SHIELD_HOURS, from, now)) {
    if (n.done.includes(raid.id)) continue;
    markDone(n, raid.id);
    if (n.shieldUntil > raid.at) {
      notes.push({ icon: "🏫", title: `${AI_NAME} turned back`, body: "Your peace shield protected you.", kind: "info" });
      continue;
    }
    const ai = aiStrength(season, raid.at);
    const r = rng(raid.id);
    const def = defensePower(n, raid.at);
    const att = Math.max(def * (0.65 + r() * 0.65), ai.soldiers * 8);
    const res = battle(raid.id, att, def);
    if (res.win) {
      const police = Math.min(0.36, levels(n, "police", raid.at) * 0.06);
      const lc = Math.round(n.res.coins * 0.18 * (1 - police));
      const lm = Math.round(n.res.materials * 0.12 * (1 - police));
      n.res.coins -= lc;
      n.res.materials -= lm;
      n.soldiers = Math.max(0, Math.round(n.soldiers * (1 - res.defLossPct)));
      n.stats.aiLosses++;
      n.shieldUntil = raid.at + RAID_SHIELD_HOURS * HOUR;
      pushLedger(n, { at: raid.at, kind: "raid", text: `${AI_NAME} raided us`, coins: -lc });
      notes.push({ icon: "🏫", title: `${AI_NAME} raided ${n.name}!`, body: `They took ${lc} coins and ${lm} materials. Train soldiers and build walls to fight back.`, kind: "bad", news: true });
    } else {
      n.soldiers = Math.max(0, Math.round(n.soldiers * (1 - res.defLossPct)));
      n.stats.aiWins++;
      n.stats.defended++;
      n.res.coins += 60;
      notes.push({ icon: "🛡️", title: `${n.name} beat back ${AI_NAME}!`, body: "Your defence held. Bhavan's +1! (+60 🪙)", kind: "good", news: true });
    }
  }

  n.lastTick = now;
  return { n, notes };
}

/* ───────────── real-life activities ───────────── */
export function logActivity(n0: Nation, kind: ActKind, amount: number, now: number, meta: { quality?: "healthy" | "balanced" | "treat"; note?: string } = {}) {
  const n = clone(n0);
  ensureDay(n, now);
  const cap = ACT_META[kind].cap;
  const d = n.day;
  const gained: Partial<Res> = {};
  let morale = 0;
  const add = (k: ResKey, v: number) => {
    v = Math.round(v);
    n.res[k] += v;
    gained[k] = (gained[k] ?? 0) + v;
  };
  const room = (used: number) => Math.max(0, Math.min(amount, cap - used));
  if (kind === "study") {
    const m = room(d.study);
    d.study += m;
    n.stats.studyMin += m;
    add("knowledge", m * 2 * (n.role === "scientist" ? 1.25 : 1) * (1 + 0.1 * levels(n, "school", now)));
    add("coins", m);
  } else if (kind === "workout") {
    const m = room(d.workout);
    d.workout += m;
    n.stats.workoutMin += m;
    add("energy", m * 3);
  } else if (kind === "meditation") {
    const m = room(d.meditation);
    d.meditation += m;
    n.stats.medMin += m;
    add("peace", m * 3);
  } else if (kind === "meal") {
    if (d.meals < cap) {
      d.meals++;
      n.stats.meals++;
      const q = meta.quality ?? "balanced";
      if (q === "healthy") d.healthy++;
      add("food", q === "healthy" ? 40 : q === "balanced" ? 25 : 12);
      add("coins", 5);
    }
  } else if (kind === "water") {
    const g = room(d.water);
    d.water += g;
    n.stats.water += g;
    add("water", g * 12);
  } else if (kind === "sleep") {
    if (d.sleep < 1) {
      d.sleep = 1;
      n.stats.sleepNights++;
      morale = amount >= 7 && amount <= 9.5 ? 12 : amount >= 6 ? 6 : 0;
      n.morale = morale;
    }
  } else if (kind === "steps") {
    const s = room(d.steps);
    d.steps += s;
    n.stats.steps += s;
    add("materials", s / 60);
  }
  n.log.unshift({ at: now, kind, amount, note: meta.note ?? meta.quality });
  if (n.log.length > 400) n.log.length = 400;
  return { n, gained, morale, capped: Object.keys(gained).length === 0 && !morale };
}

export function claimGoals(n0: Nation, now: number) {
  const n = clone(n0);
  ensureDay(n, now);
  let coins = 0;
  for (const g of DAILY_GOALS) {
    if (g.test(n.day) && !n.day.claimed.includes(g.id)) {
      n.day.claimed.push(g.id);
      coins += g.reward;
    }
  }
  if (DAILY_GOALS.every((g) => n.day.claimed.includes(g.id)) && !n.day.claimed.includes("all")) {
    n.day.claimed.push("all");
    coins += ALL_GOALS_BONUS;
  }
  n.res.coins += coins;
  if (coins) pushLedger(n, { at: now, kind: "goal", text: "Daily goals reward", coins });
  return { n, coins };
}

/* ───────────── building ───────────── */
export type Result = { ok: true; n: Nation; msg?: string } | { ok: false; err: string };

export function build(n0: Nation, type: BType, x: number, y: number, now: number): Result {
  const def = BUILDINGS[type];
  const size = landSize(n0, now);
  if (x < 0 || y < 0 || x >= size || y >= size) return { ok: false, err: "That's outside your land." };
  if (n0.tiles.some((t) => t.x === x && t.y === y)) return { ok: false, err: "Something is already built there." };
  if (def.max && n0.tiles.filter((t) => t.t === type).length >= def.max) return { ok: false, err: def.max === 1 ? `You can only have one ${def.name}.` : `Limit: ${def.max}.` };
  if (def.unlockCity && cityLevel(n0, now) < def.unlockCity) return { ok: false, err: `Needs city level ${def.unlockCity}.` };
  if (n0.tiles.filter((t) => t.doneAt > now).length >= 2) return { ok: false, err: "Two builders are busy. Wait for one to finish." };
  const cost = costOf(n0, type, 1);
  if (!canAfford(n0, cost)) return { ok: false, err: "Not enough resources." };
  const n = clone(n0);
  pay(n, cost);
  n.tiles.push({ x, y, t: type, lvl: 1, doneAt: now + buildMinutes(n, type, 1) * 60_000 });
  return { ok: true, n };
}

export function upgrade(n0: Nation, x: number, y: number, now: number): Result {
  const i = n0.tiles.findIndex((t) => t.x === x && t.y === y);
  if (i < 0) return { ok: false, err: "Nothing here." };
  const tl = n0.tiles[i];
  if (tl.doneAt > now) return { ok: false, err: "Still under construction." };
  if (tl.dmg) return { ok: false, err: "Repair it first." };
  if (tl.lvl >= MAX_LEVEL) return { ok: false, err: "Already max level." };
  if (tl.t !== "hall" && tl.lvl >= levels(n0, "hall", now) + 1) return { ok: false, err: "Upgrade your Parliament first." };
  if (n0.tiles.filter((t) => t.doneAt > now).length >= 2) return { ok: false, err: "Two builders are busy." };
  const cost = costOf(n0, tl.t, tl.lvl + 1);
  if (!canAfford(n0, cost)) return { ok: false, err: "Not enough resources." };
  const n = clone(n0);
  pay(n, cost);
  const t = n.tiles[i];
  t.lvl += 1;
  t.doneAt = now + buildMinutes(n, t.t, t.lvl) * 60_000;
  return { ok: true, n };
}

export function repairCost(n: Nation, tl: Tile) {
  const c = costOf(n, tl.t, tl.lvl);
  const out: Partial<Res> = {};
  for (const k of Object.keys(c) as ResKey[]) out[k] = Math.round((c[k] ?? 0) * 0.3);
  return out;
}
export function repair(n0: Nation, x: number, y: number): Result {
  const i = n0.tiles.findIndex((t) => t.x === x && t.y === y);
  if (i < 0 || !n0.tiles[i].dmg) return { ok: false, err: "Nothing to repair." };
  const cost = repairCost(n0, n0.tiles[i]);
  if (!canAfford(n0, cost)) return { ok: false, err: "Not enough resources." };
  const n = clone(n0);
  pay(n, cost);
  n.tiles[i].dmg = false;
  return { ok: true, n };
}

export function demolish(n0: Nation, x: number, y: number): Result {
  const i = n0.tiles.findIndex((t) => t.x === x && t.y === y);
  if (i < 0) return { ok: false, err: "Nothing here." };
  if (n0.tiles[i].t === "hall") return { ok: false, err: "You can't demolish Parliament." };
  const n = clone(n0);
  const refund = costOf(n, n.tiles[i].t, 1);
  n.res.materials += Math.round((refund.materials ?? 0) * 0.5);
  n.tiles.splice(i, 1);
  return { ok: true, n };
}

export function move(n0: Nation, from: { x: number; y: number }, to: { x: number; y: number }, now: number): Result {
  const size = landSize(n0, now);
  if (to.x < 0 || to.y < 0 || to.x >= size || to.y >= size) return { ok: false, err: "Outside your land." };
  if (n0.tiles.some((t) => t.x === to.x && t.y === to.y)) return { ok: false, err: "Occupied." };
  const n = clone(n0);
  const t = n.tiles.find((t) => t.x === from.x && t.y === from.y);
  if (!t) return { ok: false, err: "Nothing here." };
  t.x = to.x;
  t.y = to.y;
  return { ok: true, n };
}

/* ───────────── army, research, roles ───────────── */
export function soldierCost(n: Nation) {
  const m = n.role === "general" ? 0.75 : 1;
  return { energy: SOLDIER_COST.energy * m, food: SOLDIER_COST.food * m, coins: SOLDIER_COST.coins * m };
}
export function maxTrainable(n: Nation, now = Date.now()) {
  const c = soldierCost(n);
  return Math.max(0, Math.floor(Math.min(n.res.energy / c.energy, n.res.food / c.food, n.res.coins / c.coins, soldierCap(n, now) - n.soldiers)));
}
export function train(n0: Nation, count: number, now: number): Result {
  if (!has(n0, "barracks", now)) return { ok: false, err: "Build Barracks first." };
  const max = maxTrainable(n0, now);
  if (count < 1 || count > max) return { ok: false, err: max ? `You can train up to ${max}.` : "Not enough energy, food or coins — or barracks are full." };
  const n = clone(n0);
  const c = soldierCost(n);
  n.res.energy -= c.energy * count;
  n.res.food -= c.food * count;
  n.res.coins -= c.coins * count;
  n.soldiers += count;
  return { ok: true, n, msg: `Trained ${count} soldiers` };
}
export function research(n0: Nation, t: TechId): Result {
  const lvl = n0.tech[t] ?? 0;
  if (lvl >= TECH_MAX) return { ok: false, err: "Fully researched." };
  if (!has(n0, "school")) return { ok: false, err: "Build Bhavan's BP Vidya Mandir first." };
  const cost = techCost(t, lvl);
  if (n0.res.knowledge < cost) return { ok: false, err: `Needs ${cost} knowledge.` };
  const n = clone(n0);
  n.res.knowledge -= cost;
  n.tech[t] = lvl + 1;
  return { ok: true, n };
}
export function setRole(n0: Nation, role: RoleId, now: number): Result {
  if (role === n0.role) return { ok: false, err: "Already your role." };
  const left = n0.roleSince + ROLE_SWITCH_HOURS * HOUR - now;
  if (left > 0) return { ok: false, err: `You can switch role in ${Math.ceil(left / HOUR)}h.` };
  const n = clone(n0);
  n.role = role;
  n.roleSince = now;
  return { ok: true, n };
}

/* ───────────── banking ───────────── */
export function deposit(n0: Nation, amt: number): Result {
  if (!has(n0, "bank")) return { ok: false, err: "Build the National Bank first." };
  amt = Math.floor(amt);
  if (amt <= 0 || amt > n0.res.coins) return { ok: false, err: "Not enough coins." };
  const n = clone(n0);
  n.res.coins -= amt;
  n.bank.savings += amt;
  pushLedger(n, { at: Date.now(), kind: "deposit", text: "Deposit to savings", coins: -amt });
  return { ok: true, n };
}
export function withdraw(n0: Nation, amt: number): Result {
  amt = Math.floor(amt);
  if (amt <= 0 || amt > n0.bank.savings + 0.01) return { ok: false, err: "Not enough savings." };
  const n = clone(n0);
  n.bank.savings -= amt;
  n.res.coins += amt;
  pushLedger(n, { at: Date.now(), kind: "withdraw", text: "Withdraw from savings", coins: amt });
  return { ok: true, n };
}
export const loanLimit = (n: Nation) => Math.max(0, Math.round(netWorth(n) * 0.5 - n.bank.loan));
export function borrow(n0: Nation, amt: number): Result {
  if (!has(n0, "bank")) return { ok: false, err: "Build the National Bank first." };
  amt = Math.floor(amt);
  if (amt <= 0 || amt > loanLimit(n0)) return { ok: false, err: `You can borrow up to ${loanLimit(n0)}.` };
  const n = clone(n0);
  n.bank.loan += amt;
  n.res.coins += amt;
  pushLedger(n, { at: Date.now(), kind: "loan", text: `Loan at ${n.role === "banker" ? 3.5 : LOAN_RATE * 100}%/day`, coins: amt });
  return { ok: true, n };
}
export function repay(n0: Nation, amt: number): Result {
  amt = Math.floor(Math.min(amt, n0.bank.loan + 1));
  if (amt <= 0 || amt > n0.res.coins) return { ok: false, err: "Not enough coins." };
  const n = clone(n0);
  n.res.coins -= amt;
  n.bank.loan = Math.max(0, n.bank.loan - amt);
  pushLedger(n, { at: Date.now(), kind: "repay", text: "Loan repayment", coins: -amt });
  return { ok: true, n };
}
export const transferFee = (n: Nation) => (n.role === "banker" ? 0 : 0.02);
export function sendMoney(n0: Nation, amt: number, toName: string): Result {
  if (!has(n0, "bank")) return { ok: false, err: "Build the National Bank first." };
  amt = Math.floor(amt);
  const fee = Math.ceil(amt * transferFee(n0));
  if (amt <= 0 || amt + fee > n0.res.coins) return { ok: false, err: "Not enough coins." };
  const n = clone(n0);
  n.res.coins -= amt + fee;
  pushLedger(n, { at: Date.now(), kind: "transfer", text: `Sent to ${toName}${fee ? ` (fee ${fee})` : ""}`, coins: -(amt + fee) });
  return { ok: true, n };
}

/* ───────────── war ───────────── */
export function attackPower(n: Nation, sent: number) {
  return sent * 10 * (1 + 0.1 * tech(n, "tactics")) * (n.role === "general" ? 1.2 : 1);
}
export function defensePower(n: Nation, at = Date.now()) {
  return Math.round(n.soldiers * 10 * (1 + 0.1 * tech(n, "fortification")) + levels(n, "wall", at) * 70 + Math.min(400, n.res.peace * 0.25) + levels(n, "hall", at) * 40 + 30);
}
export function battle(seed: string, attack: number, defense: number) {
  const r = rng("battle:" + seed);
  const a = attack * (0.85 + r() * 0.3);
  const d = Math.max(1, defense * (0.85 + r() * 0.3));
  const win = a > d;
  const ratio = a / d;
  return {
    win,
    ratio,
    attLossPct: win ? 0.1 + 0.2 * r() * Math.min(1, 1 / ratio) : 0.5 + 0.3 * r(),
    defLossPct: win ? 0.3 + 0.2 * r() : 0.1 + 0.1 * r(),
    land: win && ratio > 1.5,
  };
}
export function marchMinutes(km: number) {
  return Math.round(Math.min(240, 20 + (km / 500) * 10));
}

export interface PublicNation {
  id: string;
  name: string;
  president: string;
  flag: string;
  color: string;
  character: CharId;
  role: RoleId;
  home: Home;
  season: string;
  pop: number;
  happiness: number;
  soldiers: number;
  defense: number;
  power: number;
  coins: number;
  materials: number;
  food: number;
  land: number;
  cityLevel: number;
  tiles: [number, number, BType, number, number][]; // x, y, type, level, damaged
  partners: string[];
  shieldUntil: number;
  airport: boolean;
  bank: boolean;
  warReady: boolean;
  stats: { wins: number; losses: number; aiWins: number; aiLosses: number; tourists: number; meteorsSurvived: number };
  status: { kind: string; since: number } | null;
  lastSeen: number;
  ai?: boolean;
  fx?: number; // currency strength
  health?: number;
}

export function launchAttack(n0: Nation, target: PublicNation, sent: number, now: number): Result & { march?: March } {
  if (!warReady(n0, now)) return { ok: false, err: "Finish your city first: 8 buildings including Barracks." };
  if (target.id === n0.id) return { ok: false, err: "That's you!" };
  if (n0.partners.some((p) => p.id === target.id)) return { ok: false, err: "You can't attack a partner." };
  if (!target.ai && target.shieldUntil > now) return { ok: false, err: `${target.name} is under a peace shield.` };
  if (target.ai && now - n0.lastAiAttack < 12 * HOUR) return { ok: false, err: `You can raid ${AI_NAME} again in ${Math.ceil((n0.lastAiAttack + 12 * HOUR - now) / HOUR)}h.` };
  sent = Math.floor(sent);
  if (sent < 1 || sent > n0.soldiers) return { ok: false, err: "Choose how many soldiers to send." };
  if (n0.marches.some((m) => m.target === target.id)) return { ok: false, err: "You already have an army marching there." };
  const n = clone(n0);
  const km = distanceKm(n.home, target.home);
  const march: March = { id: `m-${n.id.slice(0, 6)}-${now.toString(36)}`, target: target.id, targetName: target.name, sent, launchAt: now, arriveAt: now + marchMinutes(km) * 60_000, ai: !!target.ai };
  n.soldiers -= sent;
  n.marches.push(march);
  n.shieldUntil = Math.min(n.shieldUntil, now); // attacking ends your own peace shield
  if (target.ai) n.lastAiAttack = now;
  return { ok: true, n, march };
}

export interface RaidEvent {
  type: "raid";
  id: string;
  from: string;
  fromName: string;
  at: number;
  win: boolean;
  loot: { coins: number; materials: number; food: number };
  defLossPct: number;
  land: boolean;
}

/** Resolve marches whose time has come. `lookup` gives the target's latest public state. */
export function resolveMarches(n0: Nation, now: number, season: Season, lookup: (id: string) => PublicNation | null) {
  const n = clone(n0);
  const notes: Note[] = [];
  const outgoing: { to: string; ev: RaidEvent }[] = [];
  for (const m of [...n.marches]) {
    if (m.arriveAt > now) continue;
    const target = m.ai ? aiPublic(season, now) : lookup(m.target);
    if (!target) {
      if (now - m.arriveAt > 2 * DAY) {
        n.marches = n.marches.filter((x) => x.id !== m.id);
        n.soldiers += m.sent;
        notes.push({ icon: "🏳️", title: "Army came home", body: `${m.targetName} couldn't be found.`, kind: "info" });
      }
      continue;
    }
    n.marches = n.marches.filter((x) => x.id !== m.id);
    const res = battle(m.id, attackPower(n, m.sent), target.defense);
    const survivors = Math.max(0, Math.round(m.sent * (1 - res.attLossPct)));
    n.soldiers += survivors;
    if (res.win) {
      const police = 0; // defender's police are applied on their side when they receive the raid
      const loot = target.ai
        ? { coins: Math.round(Math.min(target.coins * 0.15, 400 + aiStrength(season, now).day * 40)), materials: Math.round(80 + aiStrength(season, now).day * 10), food: 40 }
        : { coins: Math.round(target.coins * 0.25 * (1 - police)), materials: Math.round(target.materials * 0.2), food: Math.round(target.food * 0.1) };
      n.res.coins += loot.coins;
      n.res.materials += loot.materials;
      n.res.food += loot.food;
      n.stats.wins++;
      if (target.ai) n.stats.aiWins++;
      if (res.land && !target.ai && n.landBonus < 6) n.landBonus++;
      pushLedger(n, { at: now, kind: "war", text: `Victory over ${target.name}`, coins: loot.coins });
      notes.push({ icon: "🏆", title: `Victory over ${target.name}!`, body: `Loot: ${loot.coins} 🪙, ${loot.materials} 🧱, ${loot.food} 🌾. ${survivors}/${m.sent} soldiers returned${res.land && !target.ai ? ". You gained land!" : "."}`, kind: "good", news: true });
    } else {
      n.stats.losses++;
      if (target.ai) n.stats.aiLosses++;
      notes.push({ icon: "💥", title: `Defeat at ${target.name}`, body: `${survivors}/${m.sent} soldiers made it home. Train more, research Tactics, or pick a weaker target.`, kind: "bad", news: true });
    }
    if (!target.ai) outgoing.push({ to: target.id, ev: { type: "raid", id: m.id, from: n.id, fromName: n.name, at: now, win: res.win, loot: res.win ? { coins: Math.round(target.coins * 0.25), materials: Math.round(target.materials * 0.2), food: Math.round(target.food * 0.1) } : { coins: 0, materials: 0, food: 0 }, defLossPct: res.defLossPct, land: res.land } });
  }
  return { n, notes, outgoing };
}

/* ───────────── inbox events from other players ───────────── */
export type InEvent =
  | RaidEvent
  | { type: "march"; id: string; from: string; fromName: string; arriveAt: number; sent: number; at: number }
  | { type: "transfer"; id: string; from: string; fromName: string; amount: number; note?: string; at: number }
  | { type: "tourist"; id: string; from: string; fromName: string; coins: number; at: number }
  | { type: "ally-req"; id: string; from: string; fromName: string; at: number }
  | { type: "ally-ok"; id: string; from: string; fromName: string; at: number }
  | { type: "ally-end"; id: string; from: string; fromName: string; at: number }
  | { type: "aid"; id: string; from: string; fromName: string; res: Partial<Res>; at: number }
  | { type: "trade-offer"; id: string; from: string; fromName: string; res: ResKey; qty: number; price: number; at: number }
  | { type: "trade-ok"; id: string; offer: string; from: string; fromName: string; coins: number; at: number }
  | { type: "trade-no"; id: string; offer: string; from: string; fromName: string; res: ResKey; qty: number; at: number }
  | { type: "invest"; id: string; from: string; fromName: string; coins: number; qty: number; at: number }
  | { type: "dm"; id: string; from: string; fromName: string; text: string; at: number };

export function applyEvent(n0: Nation, ev: InEvent, now: number): { n: Nation; note?: Note; reply?: InEvent } {
  if (n0.done.includes(ev.id)) return { n: n0 };
  const n = clone(n0);
  markDone(n, ev.id);
  switch (ev.type) {
    case "raid": {
      if (!ev.win) {
        n.soldiers = Math.max(0, Math.round(n.soldiers * (1 - ev.defLossPct)));
        n.stats.defended++;
        return { n, note: { icon: "🛡️", title: `You repelled ${ev.fromName}!`, body: "Their army was defeated at your walls.", kind: "good", news: true } };
      }
      const police = Math.min(0.36, levels(n, "police", now) * 0.06);
      const lc = Math.min(n.res.coins, Math.round(ev.loot.coins * (1 - police)));
      const lm = Math.min(n.res.materials, Math.round(ev.loot.materials * (1 - police)));
      const lf = Math.min(n.res.food, ev.loot.food);
      n.res.coins -= lc;
      n.res.materials -= lm;
      n.res.food -= lf;
      n.soldiers = Math.max(0, Math.round(n.soldiers * (1 - ev.defLossPct)));
      if (ev.land && n.landBonus > -2 && landSize(n, now) > START_LAND) n.landBonus--;
      n.stats.raided++;
      n.shieldUntil = Math.max(n.shieldUntil, now + RAID_SHIELD_HOURS * HOUR);
      pushLedger(n, { at: now, kind: "war", text: `Raided by ${ev.fromName}`, coins: -lc });
      return { n, note: { icon: "⚔️", title: `${ev.fromName} raided you`, body: `Lost ${lc} 🪙, ${lm} 🧱, ${lf} 🌾. You have an ${RAID_SHIELD_HOURS}h peace shield now.`, kind: "bad", news: true } };
    }
    case "march":
      return { n, note: { icon: "🚨", title: `${ev.fromName} is marching on you!`, body: `${ev.sent} soldiers arrive ${new Date(ev.arriveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Train soldiers, build walls, meditate for peace.`, kind: "bad" } };
    case "transfer":
      n.res.coins += ev.amount;
      pushLedger(n, { at: now, kind: "transfer", text: `From ${ev.fromName}${ev.note ? `: “${ev.note}”` : ""}`, coins: ev.amount });
      return { n, note: { icon: "💸", title: `${ev.fromName} sent you ${ev.amount} coins`, body: ev.note ?? "Check your bank statement.", kind: "good" } };
    case "tourist": {
      const c = Math.round(ev.coins * (n.role === "explorer" ? 1.5 : 1));
      n.res.coins += c;
      n.stats.tourists++;
      n.happiness = Math.min(100, n.happiness + 1);
      pushLedger(n, { at: now, kind: "tourism", text: `Tourist from ${ev.fromName}`, coins: c });
      return { n, note: { icon: "🧳", title: `A tourist from ${ev.fromName} arrived`, body: `They spent ${c} coins in ${n.name}.`, kind: "good" } };
    }
    case "ally-req":
      if (!n.partners.some((p) => p.id === ev.from) && !n.allyReqs.some((r) => r.id === ev.from)) n.allyReqs.push({ id: ev.from, name: ev.fromName, at: ev.at });
      return { n, note: { icon: "🤝", title: `${ev.fromName} wants a partnership`, body: "Accept it in World → Partnerships.", kind: "info" } };
    case "ally-ok":
      n.allyReqs = n.allyReqs.filter((r) => r.id !== ev.from);
      if (!n.partners.some((p) => p.id === ev.from) && n.partners.length < MAX_PARTNERS) n.partners.push({ id: ev.from, name: ev.fromName, since: now });
      return { n, note: { icon: "🤝", title: `Partnership with ${ev.fromName}!`, body: "+5% coin income for both of you. You can't attack each other.", kind: "good", news: true } };
    case "ally-end":
      n.partners = n.partners.filter((p) => p.id !== ev.from);
      return { n, note: { icon: "💔", title: `${ev.fromName} ended your partnership`, body: "", kind: "info" } };
    case "trade-offer":
      n.offers = [...(n.offers ?? []), { id: ev.id, from: ev.from, fromName: ev.fromName, res: ev.res, qty: ev.qty, price: ev.price, at: ev.at }];
      return { n, note: { icon: "🚢", title: `${ev.fromName} offers ${ev.qty} ${ev.res}`, body: `For ${ev.price} coins. Open 📱 Phone → Trade.`, kind: "info" } };
    case "trade-ok":
      n.res.coins += ev.coins;
      pushLedger(n, { at: now, kind: "trade", text: `Export sold to ${ev.fromName}`, coins: ev.coins });
      return { n, note: { icon: "🚢", title: `${ev.fromName} bought your export`, body: `+${ev.coins} coins`, kind: "good" } };
    case "trade-no":
      n.res[ev.res] += ev.qty;
      return { n, note: { icon: "🚢", title: `${ev.fromName} declined your offer`, body: `${ev.qty} ${ev.res} returned to your stores.`, kind: "info" } };
    case "invest":
      n.res.coins += ev.coins;
      pushLedger(n, { at: now, kind: "stocks", text: `${ev.fromName} invested (${ev.qty} shares)`, coins: ev.coins });
      return { n, note: { icon: "📈", title: `${ev.fromName} bought ${ev.qty} of your shares`, body: `+${ev.coins} coins of investment`, kind: "good" } };
    case "dm":
      return { n };
    case "aid":
      for (const k of Object.keys(ev.res) as ResKey[]) n.res[k] += ev.res[k] ?? 0;
      return { n, note: { icon: "🎁", title: `Aid from ${ev.fromName}`, body: Object.entries(ev.res).map(([k, v]) => `${v} ${k}`).join(", "), kind: "good" } };
  }
}

/* ───────────── tourism ───────────── */
export function flightCost(n: Nation, km: number) {
  return Math.round((30 + km / 100) * (n.role === "explorer" ? 0.5 : 1) * (1 - 0.15 * tech(n, "aviation")));
}
export function fly(n0: Nation, target: PublicNation, now: number): Result & { ticket?: number } {
  if (!has(n0, "airport", now)) return { ok: false, err: "Build an Airport first (city level 4)." };
  if (target.id === n0.id) return { ok: false, err: "You're already home." };
  if (n0.day.key === dayKey(now) && n0.day.trips >= TRIPS_PER_DAY) return { ok: false, err: `Max ${TRIPS_PER_DAY} trips a day.` };
  const ticket = flightCost(n0, distanceKm(n0.home, target.home));
  if (n0.res.coins < ticket) return { ok: false, err: `A ticket costs ${ticket} coins.` };
  const n = clone(n0);
  ensureDay(n, now);
  n.res.coins -= ticket;
  n.day.trips++;
  n.stats.trips++;
  n.res.knowledge += 20;
  if (!n.stamps.some((s) => s.id === target.id)) n.stamps.push({ id: target.id, name: target.name, at: now });
  else n.stamps = n.stamps.map((s) => (s.id === target.id ? { ...s, at: now } : s));
  pushLedger(n, { at: now, kind: "travel", text: `Flight to ${target.name}`, coins: -ticket });
  return { ok: true, n, ticket };
}

/** Visit a real-world landmark (needs an airport). Knowledge, happiness and a passport stamp. */
export function visitLandmark(n0: Nation, lm: { id: string; name: string; lat: number; lon: number }, now: number): Result & { ticket?: number } {
  if (!has(n0, "airport", now)) return { ok: false, err: "Build an Airport first (city level 4)." };
  if (n0.day.key === dayKey(now) && n0.day.trips >= TRIPS_PER_DAY) return { ok: false, err: `Max ${TRIPS_PER_DAY} trips a day.` };
  const ticket = flightCost(n0, distanceKm(n0.home, lm));
  if (n0.res.coins < ticket) return { ok: false, err: `A ticket costs ${ticket} coins.` };
  const n = clone(n0);
  ensureDay(n, now);
  n.res.coins -= ticket;
  n.day.trips++;
  n.stats.trips++;
  const first = !n.stamps.some((s) => s.id === "lm:" + lm.id);
  n.res.knowledge += first ? 40 : 15;
  n.stamps = [...n.stamps.filter((s) => s.id !== "lm:" + lm.id), { id: "lm:" + lm.id, name: lm.name, at: now }];
  pushLedger(n, { at: now, kind: "travel", text: `Trip to ${lm.name}`, coins: -ticket });
  return { ok: true, n, ticket };
}

/* ───────────── money flow ───────────── */
export function moneyFlow(n: Nation, at = Date.now()) {
  const inc: { label: string; v: number }[] = [];
  const hf = 0.6 + n.happiness / 250;
  const boost = hf * (1 + 0.05 * Math.min(MAX_PARTNERS, n.partners.length)) * (1 + 0.05 * tech(n, "finance"));
  inc.push({ label: `👥 Taxes from ${Math.floor(n.pop)} citizens`, v: n.pop * TAX_PER_CITIZEN_HOUR * (n.role === "president" ? 1.1 : 1) * boost });
  const byType = new Map<BType, number>();
  for (const t of n.tiles) if (active(t, at) && BUILDINGS[t.t].makes?.coins) byType.set(t.t, (byType.get(t.t) ?? 0) + (BUILDINGS[t.t].makes!.coins ?? 0) * t.lvl * boost);
  byType.forEach((v, t) => inc.push({ label: `${BUILDINGS[t].icon} ${BUILDINGS[t].name}`, v }));
  const sRate = (n.role === "banker" ? 0.03 : SAVINGS_RATE) + 0.005 * tech(n, "finance");
  if (n.bank.savings > 0) inc.push({ label: "🏦 Savings interest", v: (n.bank.savings * sRate) / 24 });
  const out: { label: string; v: number }[] = [];
  if (n.bank.loan > 0) out.push({ label: "📉 Loan interest", v: (n.bank.loan * (n.role === "banker" ? 0.035 : LOAN_RATE)) / 24 });
  const totalIn = inc.reduce((s, x) => s + x.v, 0);
  const totalOut = out.reduce((s, x) => s + x.v, 0);
  return { inc: inc.sort((a, b) => b.v - a.v), out, totalIn, totalOut, net: totalIn - totalOut };
}
export function buildingValue(n: Nation) {
  let v = 0;
  for (const t of n.tiles)
    for (let l = 1; l <= t.lvl; l++) {
      const c = BUILDINGS[t.t].cost;
      v += ((c.coins ?? 0) + (c.materials ?? 0) * 0.5) * l * (1 + (l - 1) * 0.35) * (t.dmg ? 0.5 : 1);
    }
  return Math.round(v);
}
export function balanceSheet(n: Nation) {
  const items = [
    { label: "👛 Wallet", v: n.res.coins },
    { label: "🏦 Savings", v: n.bank.savings },
    { label: "🏙️ Buildings & land", v: buildingValue(n) },
    { label: "🧱 Materials", v: n.res.materials * 0.5 },
    { label: "🌾💧 Food & water stores", v: (n.res.food + n.res.water) * 0.2 },
    { label: "🎖️ Army", v: n.soldiers * 20 },
    { label: "📉 Loans owed", v: -n.bank.loan },
  ];
  return { items, total: Math.round(items.reduce((s, x) => s + x.v, 0)) };
}

/* ───────────── meteor ───────────── */
export function takeCover(n0: Nation, meteorId: string): Nation {
  if (n0.cover.includes(meteorId)) return n0;
  const n = clone(n0);
  n.cover.push(meteorId);
  return n;
}

/* ───────────── scoring & public view ───────────── */
export function netWorth(n: Nation) {
  return n.res.coins + n.bank.savings - n.bank.loan + n.res.materials * 0.5 + n.res.food * 0.2 + n.res.water * 0.2;
}
export function power(n: Nation, at = Date.now()) {
  const lv = n.tiles.filter((t) => active(t, at)).reduce((s, t) => s + t.lvl, 0);
  const techLv = Object.values(n.tech).reduce((s, v) => s + (v ?? 0), 0);
  return Math.round(n.pop * 2 + lv * 30 + n.soldiers * 4 + Math.max(0, netWorth(n)) / 20 + landSize(n, at) * 15 + levels(n, "monument", at) * 150 + techLv * 20 + n.stats.wins * 25 + n.stats.meteorsSurvived * 60);
}

export function toPublic(n: Nation, now = Date.now()): PublicNation {
  return {
    id: n.id,
    name: n.name,
    president: n.president,
    flag: n.flag,
    color: n.color,
    character: n.character,
    role: n.role,
    home: n.home,
    season: n.season,
    pop: Math.floor(n.pop),
    happiness: Math.round(n.happiness),
    soldiers: n.soldiers,
    defense: defensePower(n, now),
    power: power(n, now),
    coins: Math.floor(n.res.coins),
    materials: Math.floor(n.res.materials),
    food: Math.floor(n.res.food),
    land: landSize(n, now),
    cityLevel: cityLevel(n, now),
    tiles: n.tiles.map((t) => [t.x, t.y, t.t, t.lvl, t.dmg ? 1 : t.doneAt > now ? 2 : 0]),
    partners: n.partners.map((p) => p.id),
    shieldUntil: n.shieldUntil,
    airport: has(n, "airport", now),
    bank: has(n, "bank", now),
    warReady: warReady(n, now),
    stats: { wins: n.stats.wins, losses: n.stats.losses, aiWins: n.stats.aiWins, aiLosses: n.stats.aiLosses, tourists: n.stats.tourists, meteorsSurvived: n.stats.meteorsSurvived },
    status: n.status ?? null,
    lastSeen: now,
    fx: currencyRate(n),
    health: Math.round(healthIndex(n) * 100),
  };
}

/** Centerpoint School as it appears on the map today. */
export function aiPublic(season: Season, now: number): PublicNation {
  const a = aiStrength(season, now);
  const kinds: BType[] = ["hall", "house", "house", "factory", "school", "barracks", "wall", "farm", "water", "market", "wall", "barracks", "house", "factory", "park", "hospital"];
  const tiles: PublicNation["tiles"] = [];
  for (let i = 0; i < a.buildings; i++) {
    const side = 10;
    tiles.push([i % side, Math.floor(i / side), kinds[i % kinds.length], Math.min(5, 1 + Math.floor(a.day / 6)), 0]);
  }
  return {
    id: AI_ID,
    name: AI_NAME,
    president: "Centerpoint AI",
    flag: "🏫",
    color: "#5a5a66",
    character: "knight",
    role: "general",
    home: { cc: "356", country: "India", lat: 21.15, lon: 79.08 },
    season: season.id,
    pop: a.pop,
    happiness: 55,
    soldiers: a.soldiers,
    defense: a.defense,
    power: Math.round(a.pop * 2 + a.buildings * 40 + a.soldiers * 4 + a.coins / 20),
    coins: a.coins,
    materials: Math.round(a.coins * 0.6),
    food: 500,
    land: 10,
    cityLevel: Math.min(20, 2 + Math.floor(a.day / 2)),
    tiles,
    partners: [],
    shieldUntil: 0,
    airport: true,
    bank: true,
    warReady: true,
    stats: { wins: 0, losses: 0, aiWins: 0, aiLosses: 0, tourists: 0, meteorsSurvived: 0 },
    status: { kind: "plotting", since: now },
    lastSeen: now,
    ai: true,
  };
}

export type Ride = "cab" | "bus" | "metro" | "jetski" | "boat" | "cruise" | "ski";
export const RIDE_PER_KM: Record<Ride, number> = { cab: 3, bus: 1, metro: 1.5, jetski: 6, boat: 4, cruise: 0.4, ski: 2 };
export const RIDE_NAME: Record<Ride, string> = { cab: "Cab", bus: "Bus", metro: "Metro", jetski: "Jet ski", boat: "Boat", cruise: "Cruise", ski: "Ski lift" };
/** Supplies and outfits bought in Explore shops. Some activities need them. */
export const GEAR: Record<string, { icon: string; name: string; cost: number; desc: string }> = {
  trek: { icon: "🥾", name: "Trekking kit", cost: 60, desc: "Boots, backpack, water. Needed for mountain treks." },
  ski: { icon: "🎿", name: "Ski gear", cost: 140, desc: "Skis, poles, goggles and a warm jacket." },
  swim: { icon: "🩱", name: "Beachwear", cost: 30, desc: "For beaches, swimming and water sports." },
  jacket: { icon: "🧥", name: "Life jacket", cost: 25, desc: "Required for jet skis and boats." },
  camp: { icon: "⛺", name: "Camping supplies", cost: 80, desc: "Tent, stove and food for forest retreats." },
  suit: { icon: "🤵", name: "President's suit", cost: 200, desc: "Formal outfit for summits and state visits." },
};
export const RIDE_NEEDS: Partial<Record<Ride, string>> = { ski: "ski", jetski: "jacket", boat: "jacket" };
export function buyGear(n0: Nation, item: string, now: number): Result {
  const g = GEAR[item];
  if (!g) return { ok: false, err: "Not sold here." };
  if (n0.gear?.includes(item)) return { ok: false, err: "You already own it." };
  if (n0.res.coins < g.cost) return { ok: false, err: `${g.name} costs ${g.cost} coins.` };
  const n = clone(n0);
  n.res.coins -= g.cost;
  n.gear = [...(n.gear ?? []), item];
  pushLedger(n, { at: now, kind: "travel", text: `Bought ${g.name}`, coins: -g.cost });
  return { ok: true, n, msg: `${g.icon} ${g.name} bought` };
}
/** Pay a cab, bus or metro fare in Explore (server-checked, capped per ride). */
export function payFare(n0: Nation, mode: Ride, km: number, now: number): Result & { fare?: number } {
  const per = RIDE_PER_KM[mode];
  if (per === undefined) return { ok: false, err: "Unknown ride." };
  const need = RIDE_NEEDS[mode];
  if (need && !n0.gear?.includes(need)) return { ok: false, err: `You need ${GEAR[need].name} first (Shop).` };
  const d = Math.max(0, Math.min(mode === "cruise" ? 20000 : 80, Number(km) || 0));
  const fare = Math.max(2, Math.round(d * per));
  if (n0.res.coins < fare) return { ok: false, err: `The ${mode} fare is ${fare} coins.` };
  const n = clone(n0);
  n.res.coins -= fare;
  pushLedger(n, { at: now, kind: "travel", text: `${RIDE_NAME[mode]} ride, ${d.toFixed(1)} km`, coins: -fare });
  return { ok: true, n, fare };
}

/** Report an emergency you witnessed (accident, theft, medical). Up to 3 rewarded reports a day. */
export function reportIncident(n0: Nation, kind: string, now: number): Result {
  const key = dayKey(now);
  const used = n0.reports?.key === key ? n0.reports.n : 0;
  const n = clone(n0);
  n.reports = { key, n: used + 1 };
  if (used >= 3) return { ok: true, n, msg: "Thanks for reporting. (Daily civic reward already earned.)" };
  n.res.coins += 15;
  n.happiness = Math.min(100, n.happiness + 2);
  pushLedger(n, { at: now, kind: "civic", text: `Reported a ${kind} to emergency services`, coins: 15 });
  return { ok: true, n, msg: "+15 coins and +2% happiness: good citizen!" };
}
