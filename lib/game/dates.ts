/** Local-time date helpers. Day keys are YYYY-MM-DD in the device's timezone. */

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date | string | number = new Date()): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function parseDayKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k: string, n: number): string {
  const d = parseDayKey(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Monday-based week key: the day key of that week's Monday. */
export function weekKey(d: Date | string | number = new Date()): string {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return dayKey(x);
}

export function monthKey(d: Date | string | number = new Date()): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86400000);
}

export function lastNDays(n: number, end = dayKey()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

export function fmtDay(k: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return parseDayKey(k).toLocaleDateString(undefined, opts);
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Small deterministic PRNG so daily quests and coin spawns match on both devices. */
export function seeded(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
