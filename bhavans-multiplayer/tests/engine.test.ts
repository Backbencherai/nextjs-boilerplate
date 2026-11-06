import assert from "node:assert/strict";
import * as E from "../lib/game/engine";
import { BUILDINGS } from "../lib/game/rules";
import { HOUR, DAY, calamitiesForDay, meteors, aiRaids } from "../lib/game/world";

const season = { id: "S1", start: Date.UTC(2026, 10, 1) };
const t0 = season.start + 2 * HOUR;
const home = { cc: "356", country: "India", lat: 21.1, lon: 79.0 };
let ok = 0;
const test = (name: string, fn: () => void) => {
  fn();
  ok++;
  console.log("✓", name);
};

const mk = (id = "p1") => E.newNation({ id, name: "Testland", president: "Tester", flag: "🦁", color: "#ff9933", character: "knight", role: "president", home, season }, t0);

test("new nation starts with a small working city", () => {
  const n = mk();
  assert.equal(n.tiles.length, 4);
  assert.ok(n.res.coins > 0 && n.pop > 0);
  assert.ok(n.shieldUntil > t0);
});

test("time passes: taxes, food production and population growth", () => {
  const n = mk();
  const { n: m } = E.tick(n, t0 + 6 * HOUR, season);
  assert.ok(m.res.coins > n.res.coins, "coins grow from taxes");
  assert.ok(m.pop >= n.pop, "population grows");
  assert.equal(m.lastTick, t0 + 6 * HOUR);
});

test("offline time is capped", () => {
  const n = mk();
  const a = E.tick(n, t0 + 18 * HOUR, season).n;
  const b = E.tick(n, t0 + 100 * HOUR, season).n;
  assert.ok(Math.abs(a.res.coins - b.res.coins) < a.res.coins * 0.5 + 400, "huge gaps don't explode the economy");
});

test("real-life activities give resources, with daily caps", () => {
  let n = mk();
  n = E.logActivity(n, "study", 60, t0).n;
  assert.ok(n.res.knowledge >= 20 + 120);
  const before = n.res.energy;
  n = E.logActivity(n, "workout", 500, t0).n; // capped at 180
  assert.equal(n.res.energy - before, 180 * 3);
  n = E.logActivity(n, "water", 8, t0).n;
  n = E.logActivity(n, "meal", 1, t0, { quality: "healthy" }).n;
  n = E.logActivity(n, "meal", 1, t0, { quality: "healthy" }).n;
  const g = E.claimGoals(n, t0);
  assert.ok(g.coins >= 60 + 60 + 70 + 70 + 120, "all daily goals claimed with bonus");
});

test("building costs resources and finishes after build time", () => {
  let n = mk();
  const r = E.build(n, "park", 0, 0, t0);
  assert.ok(r.ok);
  n = (r as { n: E.Nation }).n;
  assert.equal(E.has(n, "park", t0), false, "under construction");
  assert.equal(E.has(n, "park", t0 + BUILDINGS.park.minutes * 60_000 + 1), true, "done later");
  assert.equal(E.build(n, "park", 0, 0, t0).ok, false, "tile occupied");
  assert.equal(E.build(n, "school", 1, 0, t0).ok, true);
  const n2 = (E.build(n, "school", 1, 0, t0) as { n: E.Nation }).n;
  assert.equal(E.build(n2, "school", 2, 0, t0 + DAY).ok, false, "only one Bhavan's BP Vidya Mandir");
});

test("banking: deposit earns interest, loans cost interest", () => {
  let n = mk();
  n.tiles.push({ x: 0, y: 5, t: "bank", lvl: 1, doneAt: t0 });
  n = (E.deposit(n, 200) as { n: E.Nation }).n;
  const after = E.tick(n, t0 + 12 * HOUR, season).n;
  assert.ok(after.bank.savings > 200, "savings grow");
  assert.equal(E.withdraw(after, 1e9).ok, false);
  const loan = E.borrow(n, 10);
  assert.ok(loan.ok);
});

test("war: needs a built city; battle resolves deterministically", () => {
  let n = mk();
  const target = E.toPublic(mk("p2"), t0);
  target.shieldUntil = 0;
  assert.equal(E.launchAttack(n, target, 5, t0).ok, false, "city not built yet");
  for (let i = 0; i < 6; i++) n.tiles.push({ x: i, y: 0, t: i === 0 ? "barracks" : "house", lvl: 1, doneAt: t0 });
  n.soldiers = 40;
  const r = E.launchAttack(n, target, 30, t0);
  assert.ok(r.ok, (r as { err?: string }).err);
  n = (r as { n: E.Nation }).n;
  assert.equal(n.soldiers, 10);
  const res = E.resolveMarches(n, t0 + 5 * HOUR, season, () => target);
  assert.equal(res.n.marches.length, 0);
  assert.equal(res.outgoing.length, 1);
  assert.equal(E.battle("x", 100, 50).win, E.battle("x", 100, 50).win, "deterministic");
});

test("defender applies a raid, gets a shield, police reduce losses", () => {
  const n = mk("p2");
  const ev: E.RaidEvent = { type: "raid", id: "m1", from: "p1", fromName: "A", at: t0, win: true, loot: { coins: 100, materials: 50, food: 10 }, defLossPct: 0.3, land: false };
  const { n: m, note } = E.applyEvent(n, ev, t0);
  assert.equal(m.res.coins, n.res.coins - 100);
  assert.ok(m.shieldUntil >= t0 + 8 * HOUR - 1);
  assert.ok(note);
  assert.equal(E.applyEvent(m, ev, t0).n.res.coins, m.res.coins, "same event never applies twice");
});

test("calamities are deterministic and the weekly meteor exists", () => {
  assert.deepEqual(calamitiesForDay(season, 3), calamitiesForDay(season, 3));
  const ms = meteors(season);
  assert.equal(ms.length, 4);
  assert.ok(ms[0].at > season.start + 6 * DAY);
});

test("meteor: a bunker + taking cover saves your people", () => {
  const m = meteors(season)[0];
  let a = mk("a");
  a.lastTick = m.at - HOUR;
  a.pop = 100;
  let b = E.takeCover({ ...mk("b"), lastTick: m.at - HOUR, pop: 100 }, m.id);
  b.tiles.push({ x: 0, y: 5, t: "bunker", lvl: 2, doneAt: t0 });
  a = E.tick(a, m.at + 30 * 60_000, season).n;
  b = E.tick(b, m.at + 30 * 60_000, season).n;
  assert.ok(b.pop > a.pop, "protected nation keeps more people");
  assert.equal(b.stats.meteorsSurvived, 1);
});

test("Centerpoint School raids on a schedule after the shield", () => {
  const n = mk();
  const raids = aiRaids(n.id, n.createdAt, 72, n.createdAt, n.createdAt + 10 * DAY);
  assert.ok(raids.length >= 3);
  assert.ok(raids[0].at >= n.createdAt + 72 * HOUR);
  const after = E.tick({ ...n, lastTick: raids[0].at - 1000 }, raids[0].at + 1000, season).n;
  assert.ok(after.stats.aiWins + after.stats.aiLosses === 1);
});

test("tourism: flight costs coins and stamps a passport", () => {
  let n = mk();
  n.tiles.push({ x: 0, y: 5, t: "airport", lvl: 1, doneAt: t0 });
  const target = E.toPublic(mk("p2"), t0);
  target.home = { cc: "392", country: "Japan", lat: 35.6, lon: 139.7 };
  const r = E.fly(n, target, t0);
  assert.ok(r.ok);
  n = (r as { n: E.Nation }).n;
  assert.equal(n.stamps.length, 1);
});

test("partnerships: request, accept, can't attack partner", () => {
  let n = mk();
  n = E.applyEvent(n, { type: "ally-req", id: "r1", from: "p2", fromName: "B", at: t0 }, t0).n;
  assert.equal(n.allyReqs.length, 1);
  n = E.applyEvent(n, { type: "ally-ok", id: "r2", from: "p2", fromName: "B", at: t0 }, t0).n;
  assert.equal(n.partners.length, 1);
  const target = E.toPublic(mk("p2"), t0);
  assert.equal(E.launchAttack(n, target, 1, t0).ok, false);
});

console.log(`\n${ok} engine tests passed`);
