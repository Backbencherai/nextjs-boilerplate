/* Deterministic world events: every device computes the same storms, meteors and AI moves. */
import { AI_RAID_EVERY_HOURS, SEASON_DAYS } from "./rules";

export function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
export const hash01 = (s: string) => rng(s)();

export const HOUR = 3600_000;
export const DAY = 24 * HOUR;

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const t = (d: number) => (d * Math.PI) / 180;
  const dLat = t(b.lat - a.lat);
  const dLon = t(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ───────────── Natural calamities ───────────── */
export type CalType = "thunderstorm" | "rain" | "typhoon" | "whirlwind" | "elnino" | "tsunami";
export const CAL_META: Record<CalType, { icon: string; name: string; hours: number; effect: string }> = {
  rain: { icon: "🌧️", name: "Heavy rain", hours: 6, effect: "+50% water, +20% food production" },
  thunderstorm: { icon: "⛈️", name: "Thunderstorm", hours: 3, effect: "Power cut: factories at half output" },
  typhoon: { icon: "🌀", name: "Typhoon", hours: 8, effect: "Damages buildings. Walls and a bunker reduce it" },
  whirlwind: { icon: "🌪️", name: "Whirlwind", hours: 2, effect: "Blows away food and materials, can damage a building" },
  elnino: { icon: "🌡️", name: "El Niño", hours: 48, effect: "Drought in the tropics: -30% food and water" },
  tsunami: { icon: "🌊", name: "Tsunami", hours: 1, effect: "Coastal flooding: people and materials lost unless walled" },
};

const HOTSPOTS: { name: string; lat: number; lon: number }[] = [
  { name: "Bay of Bengal", lat: 15, lon: 88 },
  { name: "Arabian Sea", lat: 15, lon: 65 },
  { name: "South China Sea", lat: 15, lon: 115 },
  { name: "Philippine Sea", lat: 18, lon: 130 },
  { name: "Sea of Japan", lat: 38, lon: 135 },
  { name: "Gulf of Mexico", lat: 25, lon: -90 },
  { name: "Caribbean", lat: 17, lon: -72 },
  { name: "North Atlantic", lat: 45, lon: -30 },
  { name: "Mediterranean", lat: 37, lon: 18 },
  { name: "West Africa coast", lat: 6, lon: -2 },
  { name: "East Africa coast", lat: -5, lon: 42 },
  { name: "Coral Sea", lat: -18, lon: 152 },
  { name: "Andes", lat: -15, lon: -72 },
  { name: "Great Plains", lat: 38, lon: -98 },
  { name: "North Sea", lat: 56, lon: 3 },
  { name: "Indian Ocean", lat: -10, lon: 80 },
  { name: "Gangetic Plain", lat: 26, lon: 80 },
  { name: "Siberia", lat: 60, lon: 100 },
];

export interface Calamity {
  id: string;
  type: CalType;
  start: number;
  end: number;
  region: { name: string; lat: number; lon: number; km: number } | null; // null = tropics-wide (El Niño)
}

export function calamitiesForDay(season: { id: string; start: number }, day: number): Calamity[] {
  const r = rng(`cal:${season.id}:${day}`);
  const n = 1 + (r() < 0.55 ? 1 : 0) + (r() < 0.2 ? 1 : 0);
  const out: Calamity[] = [];
  const types: CalType[] = ["rain", "rain", "thunderstorm", "thunderstorm", "typhoon", "whirlwind", "whirlwind", "tsunami", "elnino"];
  for (let i = 0; i < n; i++) {
    let type = types[Math.floor(r() * types.length)];
    if (type === "elnino" && day % 9 !== 4) type = "rain"; // El Niño is rare
    const start = season.start + day * DAY + Math.floor(r() * 20) * HOUR;
    const spot = HOTSPOTS[Math.floor(r() * HOTSPOTS.length)];
    const km = type === "tsunami" ? 1400 + r() * 900 : type === "whirlwind" ? 900 + r() * 700 : 1800 + r() * 2200;
    out.push({ id: `cal-${season.id}-${day}-${i}`, type, start, end: start + CAL_META[type].hours * HOUR, region: type === "elnino" ? null : { ...spot, km } });
  }
  return out;
}

export function calamitiesBetween(season: { id: string; start: number }, from: number, to: number) {
  const d0 = Math.max(0, Math.floor((from - season.start) / DAY) - 3);
  const d1 = Math.min(SEASON_DAYS + 1, Math.floor((to - season.start) / DAY) + 1);
  const out: Calamity[] = [];
  for (let d = d0; d <= d1; d++) for (const c of calamitiesForDay(season, d)) if (c.end > from && c.start < to) out.push(c);
  return out;
}

export function hits(c: Calamity, home: { lat: number; lon: number }) {
  if (!c.region) return Math.abs(home.lat) < 30; // El Niño: tropics
  return distanceKm(home, c.region) < c.region.km;
}

/* ───────────── The weekly Red Meteor ───────────── */
export const METEOR_WINDOW_MIN = 10;
export const COVER_OPEN_MIN = 30;
export interface Meteor {
  id: string;
  n: number;
  at: number;
}
export function meteors(season: { id: string; start: number }): Meteor[] {
  const out: Meteor[] = [];
  const first = Math.floor(season.start / DAY) * DAY; // UTC midnight of season start
  for (let k = 1; k * 7 <= SEASON_DAYS; k++) out.push({ id: `meteor-${season.id}-${k}`, n: k, at: first + k * 7 * DAY + 14 * HOUR }); // 14:00 UTC
  return out;
}
export function nextMeteor(season: { id: string; start: number }, now: number) {
  return meteors(season).find((m) => m.at + METEOR_WINDOW_MIN * 60_000 > now) ?? null;
}

/* ───────────── Centerpoint School (AI) ───────────── */
export function aiStrength(season: { start: number }, now: number) {
  const day = Math.max(0, (now - season.start) / DAY);
  return {
    day,
    soldiers: Math.round(25 + day * 11 + day ** 1.5 * 2),
    walls: Math.min(20, 1 + Math.floor(day / 2)),
    coins: Math.round(600 + day * 260),
    pop: Math.round(40 + day * 22),
    buildings: Math.min(60, 7 + Math.floor(day * 1.6)),
    defense: Math.round(320 + day * 170),
  };
}

/** Centerpoint raids each nation on its own schedule (no two players get hit at the same time). */
export function aiRaids(nationId: string, createdAt: number, shieldHours: number, from: number, to: number) {
  const offset = Math.floor(hash01("ai-offset:" + nationId) * AI_RAID_EVERY_HOURS) * HOUR;
  const first = createdAt + shieldHours * HOUR + offset;
  const out: { id: string; at: number }[] = [];
  const period = AI_RAID_EVERY_HOURS * HOUR;
  const k0 = Math.max(0, Math.floor((from - first) / period));
  for (let k = k0; ; k++) {
    const at = first + k * period;
    if (at > to) break;
    if (at > from) out.push({ id: `ai-raid-${nationId}-${k}`, at });
  }
  return out;
}
export function nextAiRaid(nationId: string, createdAt: number, shieldHours: number, now: number) {
  return aiRaids(nationId, createdAt, shieldHours, now, now + AI_RAID_EVERY_HOURS * HOUR * 2)[0] ?? null;
}
