/* The authoritative game server. Clients send intents; only the server changes game state. */
import * as E from "../game/engine";
import * as M from "../game/market";
import { AI_ID, CHARACTERS, MAX_PARTNERS, ROLES, SEASON_DAYS, type ActKind, type BType, type CharId, type ResKey, type RoleId, type TechId } from "../game/rules";
import { DAY, distanceKm, nextMeteor, COVER_OPEN_MIN, METEOR_WINDOW_MIN } from "../game/world";
import { LM_BY_ID } from "../game/landmarks";
import codes from "../countryCodes.json";
import { getDB, withLock } from "./db";

const WORLD = (process.env.WORLD || "global").toLowerCase().replace(/[^a-z0-9-]/g, "") || "global";
const K = {
  nation: (id: string) => `w:${WORLD}:n:${id}`,
  pub: `w:${WORLD}:pub`,
  pubv: `w:${WORLD}:pubv`,
  seen: `w:${WORLD}:seen`,
  cc: `w:${WORLD}:cc`,
  notes: (id: string) => `w:${WORLD}:notes:${id}`,
  dms: (id: string) => `w:${WORLD}:dm:${id}`,
  sig: (id: string) => `w:${WORLD}:sig:${id}`,
  news: `w:${WORLD}:news`,
  chat: `w:${WORLD}:chat`,
};
const COUNTRIES = codes as Record<string, { a2: string; name: string }>;

export function season(now = Date.now()) {
  const s0 = Date.parse(process.env.SEASON_START || "2026-11-06T00:00:00Z");
  const len = SEASON_DAYS * DAY;
  const n = Math.max(1, Math.floor((now - s0) / len) + 1);
  const start = s0 + (n - 1) * len;
  return { id: `S${n}`, n, start, day: Math.min(SEASON_DAYS, Math.floor((now - start) / DAY) + 1), endsAt: start + len };
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
type Note = E.Note & { at?: number };

async function load(id: string) {
  return getDB().get<E.Nation>(K.nation(id));
}
async function save(n: E.Nation) {
  const d = getDB();
  await d.set(K.nation(n.id), n);
  const p = E.toPublic(n);
  const prev = await d.hget<E.PublicNation>(K.pub, n.id);
  const strip = (x: E.PublicNation | null) => (x ? JSON.stringify({ ...x, lastSeen: 0 }) : "");
  if (strip(prev) !== strip(p)) {
    await d.hset(K.pub, n.id, p);
    await d.hset(K.pubv, n.id, Date.now());
  }
}
async function pub(id: string, now = Date.now()) {
  if (id === AI_ID) return E.aiPublic(season(now), now);
  return getDB().hget<E.PublicNation>(K.pub, id);
}
async function pushNotes(id: string, notes: Note[]) {
  const d = getDB();
  for (const n of notes) await d.lpush(K.notes(id), { ...n, at: Date.now() }, 40);
}
async function news(icon: string, text: string, nation?: string) {
  await getDB().lpush(K.news, { id: uid(), at: Date.now(), icon, text, nation }, 150);
}

/** Tick a nation forward on the server, resolve its marches, and deliver the results. */
async function advance(id: string): Promise<{ n: E.Nation | null; notes: Note[] }> {
  const s = season();
  const outgoing: { to: string; ev: E.InEvent }[] = [];
  const res = await withLock(id, async () => {
    const n0 = await load(id);
    if (!n0) return { n: null, notes: [] };
    if (n0.season !== s.id) return { n: n0, notes: [] };
    const now = Date.now();
    const t = E.tick(n0, now, s);
    const lookups = new Map<string, E.PublicNation | null>();
    for (const m of t.n.marches) if (m.arriveAt <= now && !m.ai) lookups.set(m.target, await pub(m.target, now));
    const r = E.resolveMarches(t.n, now, s, (tid) => lookups.get(tid) ?? null);
    for (const o of r.outgoing) outgoing.push(o);
    await save(r.n);
    await getDB().hset(K.seen, id, now);
    const notes = [...t.notes, ...r.notes];
    for (const no of notes) if (no.news) await news(no.icon, no.title.includes(r.n.name) ? no.title : `${r.n.name}: ${no.title}`, id);
    return { n: r.n, notes };
  });
  for (const o of outgoing) await deliver(o.to, o.ev);
  return res;
}

/** Apply an event to another player's nation, server-side and atomically. */
async function deliver(to: string, ev: E.InEvent) {
  if (to === AI_ID) return;
  await withLock(to, async () => {
    const n0 = await load(to);
    if (!n0) return;
    const now = Date.now();
    const t = E.tick(n0, now, season());
    const r = E.applyEvent(t.n, ev, now);
    await save(r.n);
    await pushNotes(to, [...t.notes, ...(r.note ? [r.note] : [])]);
    if (r.note?.news) await news(r.note.icon, `${r.n.name}: ${r.note.title}`, to);
  });
}

/* ───────────── sync (polled by clients every few seconds) ───────────── */
export async function sync(id: string, since: number) {
  const d = getDB();
  const { n, notes: tickNotes } = await advance(id);
  const queued = await d.drain<Note>(K.notes(id));
  const [pubv, seen, newsL, chatL] = await Promise.all([d.hgetall<number>(K.pubv), d.hgetall<number>(K.seen), d.lrange(K.news, 60), d.lrange(K.chat, 80)]);
  const changed = Object.entries(pubv)
    .filter(([, v]) => Number(v) > since)
    .map(([k]) => k);
  const world: E.PublicNation[] = [];
  for (const k of changed) {
    const p = await d.hget<E.PublicNation>(K.pub, k);
    if (p) world.push(p);
  }
  const s = season();
  return {
    now: Date.now(),
    season: s,
    db: d.kind,
    me: n,
    notes: [...tickNotes, ...queued.reverse()],
    world,
    ai: E.aiPublic(s, Date.now()),
    seen,
    news: newsL,
    chat: chatL,
    dms: await d.lrange(K.dms(id), 120),
    sig: await d.drain(K.sig(id)),
    claims: await d.hgetall<string>(K.cc),
  };
}

/* ───────────── actions ───────────── */
type Body = Record<string, unknown> & { a: string };
const S = (v: unknown) => String(v ?? "");
const N = (v: unknown) => Number(v) || 0;

export async function act(id: string, b: Body): Promise<{ ok: boolean; err?: string; msg?: string; me?: E.Nation | null }> {
  const d = getDB();
  const now = Date.now();
  const s = season(now);

  if (b.a === "found") {
    const cc = S(b.cc);
    const country = COUNTRIES[cc];
    if (!country) return { ok: false, err: "Pick a real country on the map." };
    if (await load(id)) {
      const ex = await load(id);
      if (ex && ex.season === s.id) return { ok: false, err: "You already lead a country." };
    }
    const owner = await d.hget<string>(K.cc, cc);
    if (owner && owner !== id) {
      const other = await d.hget<E.PublicNation>(K.pub, owner);
      if (other) return { ok: false, err: `${country.name} already has a president: ${other.president}. Choose another country.` };
    }
    if (!(await d.hsetnx(K.cc, cc, id)) && (await d.hget<string>(K.cc, cc)) !== id) return { ok: false, err: `${country.name} was just claimed by someone else.` };
    const character = (S(b.character) in CHARACTERS ? S(b.character) : "scholar") as CharId;
    const role = (S(b.role) in ROLES ? S(b.role) : "president") as RoleId;
    const president = ((await d.get<string>(`uname:${id}`)) || S(b.president)).slice(0, 24) || "President";
    const lat = Math.max(-80, Math.min(80, N(b.lat)));
    const lon = Math.max(-180, Math.min(180, N(b.lon)));
    const n = E.newNation({ id, name: country.name, president, flag: country.a2, color: /^#[0-9a-f]{6}$/i.test(S(b.color)) ? S(b.color) : "#ff9933", character, role, home: { cc, country: country.name, lat, lon }, season: s }, now);
    await save(n);
    await news("🏛️", `${president} became President of ${country.name}`, id);
    return { ok: true, me: n };
  }
  if (b.a === "chat") {
    const n = await load(id);
    const text = S(b.text).trim().slice(0, 240);
    if (!n || !text) return { ok: false, err: "Empty message." };
    await d.lpush(K.chat, { id: uid(), at: now, from: id, name: `President ${n.president} (${n.name})`, flag: n.flag, text }, 150);
    return { ok: true };
  }
  if (b.a === "signal") {
    const to = S(b.to);
    if (!to || to === id) return { ok: false };
    await d.rpush(K.sig(to), b.s, 90);
    return { ok: true };
  }
  if (b.a === "dm") {
    const n = await load(id);
    const to = S(b.to);
    const text = S(b.text).trim().slice(0, 400);
    const tp = await pub(to);
    if (!n || !tp || !text) return { ok: false, err: "Can't send." };
    const msg = { id: uid(), at: now, from: id, fromName: `President ${n.president} (${n.name})`, to, toName: `President ${tp.president} (${tp.name})`, text };
    await d.lpush(K.dms(to), msg, 300);
    await d.lpush(K.dms(id), msg, 300);
    await pushNotes(to, [{ icon: "💬", title: msg.fromName, body: text, kind: "info" }]);
    return { ok: true };
  }

  // everything else edits your own nation
  const outgoing: { to: string; ev: E.InEvent }[] = [];
  const extraNews: [string, string][] = [];
  const result = await withLock(id, async () => {
    const n0 = await load(id);
    if (!n0) return { ok: false as const, err: "Found your country first." };
    const n = E.tick(n0, now, s).n;
    const me = `${n.name}`;
    let r: E.Result & { march?: E.March; ticket?: number; paid?: number; got?: number };
    switch (b.a) {
      case "timer-start":
        r = E.startTimer(n, S(b.kind) as "study", now);
        break;
      case "timer-stop":
        r = E.stopTimer(n, !!b.save, now);
        break;
      case "log": {
        const kind = S(b.kind) as ActKind;
        if (kind === "study" || kind === "workout" || kind === "meditation") r = E.logManual(n, kind, N(b.amount), now);
        else r = { ok: true, n: E.logActivity(n, kind, N(b.amount), now, { quality: S(b.quality) as "healthy" }).n };
        break;
      }
      case "goals":
        r = { ok: true, n: E.claimGoals(n, now).n };
        break;
      case "build":
        r = E.build(n, S(b.t) as BType, N(b.x), N(b.y), now);
        break;
      case "upgrade":
        r = E.upgrade(n, N(b.x), N(b.y), now);
        break;
      case "repair":
        r = E.repair(n, N(b.x), N(b.y));
        break;
      case "demolish":
        r = E.demolish(n, N(b.x), N(b.y));
        break;
      case "move":
        r = E.move(n, { x: N(b.fx), y: N(b.fy) }, { x: N(b.tx), y: N(b.ty) }, now);
        break;
      case "train":
        r = E.train(n, N(b.count), now);
        break;
      case "research":
        r = E.research(n, S(b.t) as TechId);
        break;
      case "role":
        r = E.setRole(n, S(b.role) as RoleId, now);
        break;
      case "bank": {
        const op = S(b.op);
        r = op === "deposit" ? E.deposit(n, N(b.amt)) : op === "withdraw" ? E.withdraw(n, N(b.amt)) : op === "borrow" ? E.borrow(n, N(b.amt)) : E.repay(n, N(b.amt));
        break;
      }
      case "cover": {
        const m = nextMeteor(s, now);
        const mins = m ? (m.at - now) / 60_000 : Infinity;
        r = m && mins <= COVER_OPEN_MIN && mins > -METEOR_WINDOW_MIN ? { ok: true, n: E.takeCover(n, m.id) } : { ok: false, err: "Shelters open 30 minutes before impact." };
        break;
      }
      case "prep":
        r = E.prepare(n, S(b.cal), S(b.kind) as E.PrepKind);
        break;
      case "send": {
        const tp = await pub(S(b.to));
        if (!tp || tp.ai) return { ok: false as const, err: "Pick a real country." };
        r = E.sendMoney(n, N(b.amt), tp.name);
        if (r.ok) outgoing.push({ to: tp.id, ev: { type: "transfer", id: "tx-" + uid(), from: id, fromName: me, amount: Math.floor(N(b.amt)), note: S(b.note).slice(0, 80), at: now } });
        break;
      }
      case "attack": {
        const tp = await pub(S(b.to));
        if (!tp) return { ok: false as const, err: "Unknown target." };
        r = E.launchAttack(n, tp, N(b.soldiers), now);
        if (r.ok && r.march && !tp.ai) outgoing.push({ to: tp.id, ev: { type: "march", id: "w-" + r.march.id, from: id, fromName: me, arriveAt: r.march.arriveAt, sent: r.march.sent, at: now } });
        if (r.ok) extraNews.push(["⚔️", `${me} marches ${N(b.soldiers)} soldiers on ${tp.name}`]);
        break;
      }
      case "fly": {
        const tp = await pub(S(b.to));
        if (!tp) return { ok: false as const, err: "Unknown country." };
        r = E.fly(n, tp, now);
        if (r.ok && !tp.ai) outgoing.push({ to: tp.id, ev: { type: "tourist", id: "t-" + uid(), from: id, fromName: me, coins: Math.round((r.ticket ?? 30) * 0.6), at: now } });
        break;
      }
      case "landmark": {
        const lm = LM_BY_ID.get(S(b.id));
        if (!lm) return { ok: false as const, err: "Unknown place." };
        r = E.visitLandmark(n, lm, now);
        if (r.ok) extraNews.push([lm.icon, `President ${n.president} of ${me} visited ${lm.name}`]);
        break;
      }
      case "ally": {
        const op = S(b.op);
        const to = S(b.to);
        const tp = await pub(to);
        if (op === "request") {
          if (!tp || tp.ai) return { ok: false as const, err: "Centerpoint School doesn't do partnerships." };
          if (n.partners.length >= MAX_PARTNERS) return { ok: false as const, err: "Max 3 partners." };
          outgoing.push({ to, ev: { type: "ally-req", id: "ar-" + uid(), from: id, fromName: me, at: now } });
          r = { ok: true, n, msg: `Partnership proposed to ${tp.name}` };
        } else if (op === "accept") {
          const req = n.allyReqs.find((x) => x.id === to);
          if (!req || n.partners.length >= MAX_PARTNERS) return { ok: false as const, err: "No such request." };
          n.allyReqs = n.allyReqs.filter((x) => x.id !== to);
          n.partners.push({ id: to, name: req.name, since: now });
          outgoing.push({ to, ev: { type: "ally-ok", id: "ao-" + uid(), from: id, fromName: me, at: now } });
          extraNews.push(["🤝", `${me} and ${req.name} formed a partnership`]);
          r = { ok: true, n };
        } else if (op === "decline") {
          n.allyReqs = n.allyReqs.filter((x) => x.id !== to);
          r = { ok: true, n };
        } else {
          n.partners = n.partners.filter((x) => x.id !== to);
          outgoing.push({ to, ev: { type: "ally-end", id: "ae-" + uid(), from: id, fromName: me, at: now } });
          r = { ok: true, n };
        }
        break;
      }
      case "aid": {
        const to = S(b.to);
        if (!n.partners.some((p) => p.id === to)) return { ok: false as const, err: "Aid is for partners." };
        const res: Partial<Record<ResKey, number>> = { food: 50, water: 50 };
        if (n.res.food < 50 || n.res.water < 50) return { ok: false as const, err: "Not enough food and water." };
        n.res.food -= 50;
        n.res.water -= 50;
        outgoing.push({ to, ev: { type: "aid", id: "aid-" + uid(), from: id, fromName: me, res, at: now } });
        r = { ok: true, n, msg: "Aid sent" };
        break;
      }
      case "buy": {
        const tp = await pub(S(b.to));
        if (!tp) return { ok: false as const, err: "Unknown stock." };
        r = M.buyShares(n, tp, N(b.qty));
        if (r.ok && !tp.ai && r.paid) outgoing.push({ to: tp.id, ev: { type: "invest", id: "iv-" + uid(), from: id, fromName: me, coins: Math.round(r.paid * 0.1), qty: Math.floor(N(b.qty)), at: now } });
        break;
      }
      case "sell":
        r = M.sellShares(n, await pub(S(b.to)), S(b.to), N(b.qty));
        break;
      case "export":
        r = M.exportGoods(n, S(b.k) as ResKey, N(b.qty));
        break;
      case "import":
        r = M.importGoods(n, S(b.k) as ResKey, N(b.qty));
        break;
      case "offer": {
        const tp = await pub(S(b.to));
        if (!tp || tp.ai) return { ok: false as const, err: "Pick a real country." };
        r = M.offerTrade(n, S(b.k) as ResKey, N(b.qty), N(b.price));
        if (r.ok) outgoing.push({ to: tp.id, ev: { type: "trade-offer", id: "to-" + uid(), from: id, fromName: me, res: S(b.k) as ResKey, qty: Math.floor(N(b.qty)), price: Math.floor(N(b.price)), at: now } });
        break;
      }
      case "answer": {
        const o = n.offers?.find((x) => x.id === S(b.offer));
        if (!o) return { ok: false as const, err: "Offer expired." };
        n.offers = (n.offers ?? []).filter((x) => x.id !== o.id);
        if (b.accept) {
          if (n.res.coins < o.price) return { ok: false as const, err: "Not enough coins." };
          n.res.coins -= o.price;
          n.res[o.res] += o.qty;
          n.ledger.unshift({ at: now, kind: "trade", text: `Imported ${o.qty} ${o.res} from ${o.fromName}`, coins: -o.price });
          outgoing.push({ to: o.from, ev: { type: "trade-ok", id: "tk-" + uid(), offer: o.id, from: id, fromName: me, coins: o.price, at: now } });
        } else outgoing.push({ to: o.from, ev: { type: "trade-no", id: "tn-" + uid(), offer: o.id, from: id, fromName: me, res: o.res, qty: o.qty, at: now } });
        r = { ok: true, n };
        break;
      }
      case "fare": {
        const mode = S(b.mode);
        if (!(mode in E.RIDE_PER_KM)) return { ok: false as const, err: "Unknown ride." };
        r = E.payFare(n, mode as E.Ride, N(b.km), now);
        break;
      }
      case "report":
        r = E.reportIncident(n, S(b.kind).slice(0, 20), now);
        break;
      case "gear": {
        r = E.buyGear(n, S(b.item), now);
        break;
      }
      case "profile": {
        if (S(b.character) in CHARACTERS) n.character = S(b.character) as CharId;
        if (/^#[0-9a-f]{6}$/i.test(S(b.color))) n.color = S(b.color);
        r = { ok: true, n };
        break;
      }
      default:
        return { ok: false as const, err: "Unknown action." };
    }
    if (!r.ok) return r;
    await save(r.n);
    return { ok: true as const, n: r.n, msg: r.msg };
  });
  if (!result.ok) return { ok: false, err: result.err };
  for (const o of outgoing) await deliver(o.to, o.ev);
  for (const [i, t] of extraNews) await news(i, t, id);
  return { ok: true, me: result.n, msg: result.msg };
}

export async function myNation(id: string) {
  const n = await load(id);
  const s = season();
  return n && n.season === s.id ? n : null;
}

export { distanceKm };
