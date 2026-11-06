/* Currency, stock market and trade. Healthy living literally makes your money stronger. */
import type { Nation, PublicNation, Result } from "./engine";
import type { ResKey } from "./rules";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** 0..1 health score for one day: healthy meals, water, movement, sleep. */
export function dayHealth(d: { healthy: number; water: number; workout: number; steps: number; sleep: number }) {
  return Math.min(1, Math.min(1, d.healthy / 2) * 0.3 + Math.min(1, d.water / 8) * 0.25 + Math.min(1, Math.max(d.workout / 30, d.steps / 8000)) * 0.3 + (d.sleep ? 0.15 : 0));
}
export function healthIndex(n: Nation) {
  const hist = (n.hist ?? []).slice(-6).map((h) => h.score);
  const today = dayHealth(n.day);
  const all = [...hist, today];
  return all.reduce((s, x) => s + x, 0) / all.length;
}
/** Exchange rate of your national currency vs. the world coin. Healthier nations = stronger currency. */
export function currencyRate(n: Nation) {
  return Math.round((0.75 + healthIndex(n) * 0.6 + n.happiness / 400) * 100) / 100;
}
export const currencyName = (name: string) => `${name.split(" ")[0]} Rupee`;

/** Share price of a country (public data only, so every device agrees). */
export function sharePrice(p: Pick<PublicNation, "power" | "happiness"> & { fx?: number }) {
  return Math.max(5, Math.round((10 + p.power / 40) * (p.fx ?? 1) * (0.8 + p.happiness / 250)));
}

export function buyShares(n0: Nation, target: PublicNation, qty: number): Result & { paid?: number } {
  qty = Math.floor(qty);
  if (qty < 1) return { ok: false, err: "Buy at least 1 share." };
  if (target.id === n0.id) return { ok: false, err: "You can't buy your own country's shares." };
  const price = sharePrice(target);
  const paid = price * qty;
  if (paid > n0.res.coins) return { ok: false, err: `That costs ${paid} coins.` };
  const n = clone(n0);
  n.res.coins -= paid;
  const pf = (n.portfolio ??= {});
  const h = pf[target.id] ?? { qty: 0, avg: 0, name: target.name, flag: target.flag };
  h.avg = Math.round(((h.avg * h.qty + paid) / (h.qty + qty)) * 100) / 100;
  h.qty += qty;
  h.name = target.name;
  h.flag = target.flag;
  pf[target.id] = h;
  n.ledger.unshift({ at: Date.now(), kind: "stocks", text: `Bought ${qty} ${target.name} @ ${price}`, coins: -paid });
  return { ok: true, n, paid };
}
export function sellShares(n0: Nation, target: PublicNation | null, id: string, qty: number): Result & { got?: number } {
  const h = n0.portfolio?.[id];
  qty = Math.floor(qty);
  if (!h || qty < 1 || qty > h.qty) return { ok: false, err: "You don't have those shares." };
  const price = target ? sharePrice(target) : Math.round(h.avg * 0.5);
  const got = price * qty;
  const n = clone(n0);
  n.res.coins += got;
  const nh = n.portfolio![id];
  nh.qty -= qty;
  if (nh.qty <= 0) delete n.portfolio![id];
  n.ledger.unshift({ at: Date.now(), kind: "stocks", text: `Sold ${qty} ${h.name} @ ${price}`, coins: got });
  return { ok: true, n, got };
}
export function portfolioValue(n: Nation, lookup: (id: string) => PublicNation | null) {
  let v = 0;
  for (const [id, h] of Object.entries(n.portfolio ?? {})) {
    const p = lookup(id);
    v += (p ? sharePrice(p) : h.avg) * h.qty;
  }
  return v;
}

/* ───────── world market: always-open exports & imports ───────── */
export const BASE_PRICE: Partial<Record<ResKey, number>> = { food: 0.6, water: 0.5, materials: 1.1, knowledge: 1.8 };
export const TRADABLE: ResKey[] = ["food", "water", "materials", "knowledge"];

export function exportGoods(n0: Nation, k: ResKey, qty: number): Result & { got?: number } {
  qty = Math.floor(qty);
  if (!BASE_PRICE[k] || qty < 1 || qty > n0.res[k]) return { ok: false, err: "Not enough to export." };
  const got = Math.round(qty * BASE_PRICE[k]! * currencyRate(n0));
  const n = clone(n0);
  n.res[k] -= qty;
  n.res.coins += got;
  n.ledger.unshift({ at: Date.now(), kind: "trade", text: `Exported ${qty} ${k}`, coins: got });
  return { ok: true, n, got };
}
export function importGoods(n0: Nation, k: ResKey, qty: number): Result & { paid?: number } {
  qty = Math.floor(qty);
  if (!BASE_PRICE[k] || qty < 1) return { ok: false, err: "Choose an amount." };
  const paid = Math.round((qty * BASE_PRICE[k]! * 1.6) / currencyRate(n0));
  if (paid > n0.res.coins) return { ok: false, err: `That costs ${paid} coins.` };
  const n = clone(n0);
  n.res.coins -= paid;
  n.res[k] += qty;
  n.ledger.unshift({ at: Date.now(), kind: "trade", text: `Imported ${qty} ${k}`, coins: -paid });
  return { ok: true, n, paid };
}

/** Player-to-player trade offer: goods are held in escrow until the buyer answers. */
export function offerTrade(n0: Nation, k: ResKey, qty: number, price: number): Result {
  qty = Math.floor(qty);
  price = Math.floor(price);
  if (qty < 1 || qty > n0.res[k] || price < 0) return { ok: false, err: "Not enough goods for that offer." };
  const n = clone(n0);
  n.res[k] -= qty;
  return { ok: true, n };
}
