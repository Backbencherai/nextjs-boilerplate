"use client";
/**
 * Client game store. The SERVER owns the game: every action is sent to /api/act and the server's copy
 * of your country replaces the local one. The local engine only predicts results so taps feel instant.
 */
import { create } from "zustand";
import * as E from "./game/engine";
import { AI_ID, type ActKind, type BType, type CharId, type Res, type RoleId, type TechId, type ResKey } from "./game/rules";
import { distanceKm, nextMeteor, COVER_OPEN_MIN, METEOR_WINDOW_MIN, calamitiesBetween, hits, CAL_META, DAY, HOUR, type Calamity } from "./game/world";
import { notify, persistStorage } from "./device";
import { LM_BY_ID } from "./game/landmarks";
import * as M from "./game/market";
import { Caller, type CallState, type Signal } from "./net/call";
import { festivalsNow, upcomingFestivals } from "./game/festivals";

export interface NewsItem {
  id: string;
  at: number;
  icon: string;
  text: string;
  nation?: string;
}
export interface ChatMsg {
  id: string;
  at: number;
  from: string;
  name: string;
  flag: string;
  text: string;
}
export interface Account {
  id: string;
  name: string;
  email?: string;
  via: "email" | "google" | "guest";
}
export interface Toast {
  id: string;
  icon: string;
  title: string;
  body?: string;
  kind: E.Note["kind"];
}
export interface Timer {
  kind: "study" | "workout" | "meditation";
  startedAt: number;
}
export interface GameConfig {
  googleClientId?: string;
  mapsKey?: string;
}
export type Season = E.Season & { n: number; day: number; endsAt: number };
type DM = { id: string; with: string; withName: string; mine: boolean; text: string; at: number };

interface State {
  booted: boolean;
  cfg: GameConfig | null;
  season: Season | null;
  account: Account | null;
  nation: E.Nation | null;
  world: Record<string, E.PublicNation>;
  claims: Record<string, string>;
  news: NewsItem[];
  chat: ChatMsg[];
  relays: number;
  toasts: Toast[];
  timer: Timer | null;
  visit: string | null;
  now: number;
  skew: number;

  boot(): Promise<void>;
  loginEmail(name: string, email: string, pin: string): Promise<"restored" | "new" | string>;
  loginGoogle(credential: string): Promise<"restored" | "new" | string>;
  loginGuest(name: string): Promise<"restored" | "new" | string>;
  logout(): void;
  found(p: { cc: string; color: string; character: CharId; role: RoleId; lat: number; lon: number }): Promise<string | null>;

  log(kind: ActKind, amount: number, meta?: { quality?: "healthy" | "balanced" | "treat"; note?: string }): void;
  startTimer(kind: Timer["kind"]): void;
  stopTimer(save: boolean): void;
  claimGoals(): void;
  build(t: BType, x: number, y: number): boolean;
  upgrade(x: number, y: number): boolean;
  repair(x: number, y: number): boolean;
  demolish(x: number, y: number): boolean;
  move(from: { x: number; y: number }, to: { x: number; y: number }): boolean;
  train(count: number): boolean;
  research(t: TechId): boolean;
  setRole(r: RoleId): boolean;
  bank(op: "deposit" | "withdraw" | "borrow" | "repay", amt: number): boolean;
  sendMoney(to: string, amt: number, note?: string): boolean;
  attack(target: string, soldiers: number): boolean;
  fly(target: string): boolean;
  endVisit(): void;
  visitLandmark(id: string): boolean;
  prepare(calId: string, kind: E.PrepKind): boolean;
  forecast(): Calamity[];
  payFare(mode: E.Ride, km: number): boolean;
  buyGear(item: string): boolean;
  call: CallState;
  caller: Caller | null;
  dms: DM[];
  prices: Record<string, number[]>;
  phone: boolean;
  setPhone(v: boolean): void;
  buyShares(id: string, qty: number): boolean;
  sellShares(id: string, qty: number): boolean;
  exportGoods(k: ResKey, qty: number): boolean;
  importGoods(k: ResKey, qty: number): boolean;
  offerTrade(to: string, k: ResKey, qty: number, price: number): boolean;
  answerTrade(offerId: string, accept: boolean): void;
  dm(to: string, text: string): void;
  dial(to: string, video?: boolean): void;
  acceptCall(video?: boolean): void;
  declineCall(): void;
  hangup(): void;
  mute(on: boolean): void;
  camera(off: boolean): void;
  flipCamera(): void;
  lastLandmark: string | null;
  ally(target: string, op: "request" | "accept" | "decline" | "end"): void;
  sendAid(target: string, res?: Partial<Res>): boolean;
  takeCover(): void;
  say(text: string): void;
  toast(t: Omit<Toast, "id">): void;
  dismiss(id: string): void;
  pub(id: string): E.PublicNation | null;
}

const LS = { account: "bhv:account", token: "bhv:token", world: "bhv:world" };
const read = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const write = (k: string, v: unknown) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

let token: string | null = null;
let since = 0;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let inflight = 0;
let caller: Caller | null = null;

type Res2<T> = T & { ok: boolean; err?: string };
async function api<T = Record<string, unknown>>(path: string, body?: unknown): Promise<Res2<T>> {
  try {
    const r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({ ok: false, err: "Server error." }))) as Res2<T>;
    if (r.status === 401) j.err = "auth";
    return j;
  } catch {
    return { ok: false, err: "You're offline. Check your internet." } as Res2<T>;
  }
}

export const useGame = create<State>((set, get) => {
  const setNation = (n: E.Nation | null) => set({ nation: n, timer: (n?.timer as Timer | null | undefined) ?? null });
  const fail = (err: string) => {
    get().toast({ icon: "⚠️", title: err, kind: "bad" });
    return false;
  };
  const showNotes = (notes: E.Note[]) => {
    for (const note of notes) {
      get().toast({ icon: note.icon, title: note.title, body: note.body, kind: note.kind });
      notify(`${note.icon} ${note.title}`, note.body, note.title);
    }
  };
  const srvNow = () => Date.now() + get().skew;

  /** Predict locally (instant UI), then let the server decide. */
  const run = <R extends E.Result>(body: Record<string, unknown>, predict?: (n: E.Nation) => R, ok?: (r: Extract<R, { ok: true }>) => void): boolean => {
    const n = get().nation;
    if (!n) return false;
    if (predict) {
      const r = predict(n);
      if (!r.ok) return fail(r.err);
      setNation(r.n);
      ok?.(r as Extract<R, { ok: true }>);
    }
    inflight++;
    api<{ me?: E.Nation; msg?: string }>("/api/act/", body).then((res) => {
      inflight--;
      if (res.me) setNation(res.me);
      if (!res.ok) {
        fail(res.err === "auth" ? "Please sign in again." : res.err ?? "Not allowed.");
        doSync();
      } else if (res.msg && !predict) get().toast({ icon: "✅", title: res.msg, kind: "good" });
    });
    return true;
  };

  const alerts = () => {
    const { nation, season } = get();
    if (!nation || !season) return;
    const now = srvNow();
    const m = nextMeteor(season, now);
    if (m) {
      const key = `bhv:meteor-alert:${m.id}`;
      const mins = (m.at - now) / 60_000;
      if (mins < 24 * 60 && mins > COVER_OPEN_MIN && !read(key + ":24")) {
        write(key + ":24", 1);
        showNotes([{ icon: "☄️", title: "The Red Meteor arrives in under 24 hours", body: "Build or upgrade a Bunker. When the alert opens, tap Take cover.", kind: "bad" }]);
      }
      if (mins <= COVER_OPEN_MIN && mins > -METEOR_WINDOW_MIN && !read(key + ":now")) {
        write(key + ":now", 1);
        showNotes([{ icon: "🚨", title: "METEOR ALERT: take cover now!", body: "Open the app and tap Take cover to protect your people.", kind: "bad" }]);
      }
    }
    // festivals: today in your country, and holiday ideas a few days ahead
    for (const f of festivalsNow(nation.home.country, now))
      if (!read(`bhv:fest:${f.id}:on`)) {
        write(`bhv:fest:${f.id}:on`, 1);
        showNotes([{ icon: f.icon, title: `Happy ${f.name}!`, body: `${f.blurb} Celebrate in Roam.`, kind: "good" }]);
      }
    for (const f of upcomingFestivals(now, 3))
      if (f.inDays > 0 && !read(`bhv:fest:${f.id}:soon`)) {
        write(`bhv:fest:${f.id}:soon`, 1);
        showNotes([{ icon: f.icon, title: `${f.name} in ${f.inDays} day${f.inDays > 1 ? "s" : ""}`, body: `Plan a trip! ${f.blurb}`, kind: "info" }]);
      }
    // disaster early warnings: a week, a day and an hour before it reaches your country
    for (const c of get().forecast()) {
      const left = c.start - now;
      if (left <= 0) continue;
      const meta = CAL_META[c.type];
      const where = c.region?.name ?? "the tropics";
      const tag = left <= HOUR ? "1h" : left <= DAY ? "1d" : "7d";
      const label = tag === "1h" ? "within the hour" : tag === "1d" ? "within a day" : "this week";
      if (read(`bhv:cal:${c.id}:${tag}`)) continue;
      write(`bhv:cal:${c.id}:${tag}`, 1);
      const ready = nation.prep?.[c.id] ? " You are prepared." : " Prepare now: Home → Disaster forecast.";
      showNotes([{ icon: meta.icon, title: `${meta.name} warning for ${nation.name}: ${label}`, body: `${meta.effect} (${where}).${ready}`, kind: "bad" }]);
    }
  };

  const doSync = async () => {
    if (!token) return;
    const r = await api<{
      now: number;
      season: Season;
      me: E.Nation | null;
      notes: E.Note[];
      world: E.PublicNation[];
      seen: Record<string, number>;
      news: NewsItem[];
      chat: ChatMsg[];
      dms: { id: string; at: number; from: string; fromName: string; to: string; toName: string; text: string }[];
      sig: Signal[];
      claims: Record<string, string>;
    }>(`/api/sync/?since=${since}`);
    if (!r.ok) {
      set({ relays: 0 });
      if (r.err === "auth") get().logout();
      return;
    }
    since = r.now - 1500;
    const me = get().account?.id;
    const world = { ...get().world };
    for (const p of r.world) world[p.id] = p;
    for (const [id, t] of Object.entries(r.seen)) if (world[id]) world[id] = { ...world[id], lastSeen: Number(t) };
    for (const id of Object.keys(world)) if (world[id].season !== r.season.id) delete world[id];
    if (me) delete world[me];
    set({
      relays: 1,
      skew: r.now - Date.now(),
      season: r.season,
      world,
      claims: r.claims,
      news: r.news,
      chat: [...r.chat].reverse(),
      dms: [...r.dms].reverse().map((d) => ({ id: d.id, at: d.at, mine: d.from === me, with: d.from === me ? d.to : d.from, withName: d.from === me ? d.toName : d.fromName, text: d.text })),
    });
    if (!inflight) setNation(r.me);
    showNotes(r.notes);
    for (const s of r.sig) caller?.onSignal(s);
    alerts();
  };
  const loop = () => {
    if (syncTimer) clearTimeout(syncTimer);
    if (!token) return;
    const busy = get().call.state !== "idle";
    syncTimer = setTimeout(
      async () => {
        await doSync();
        loop();
      },
      busy ? 900 : document.visibilityState === "hidden" ? 15_000 : 3000
    );
  };
  const start = () => {
    if (tickTimer) return;
    tickTimer = setInterval(() => {
      set({ now: Date.now() });
      // smooth local preview of production between server syncs (the server's numbers always win)
      const { nation, season } = get();
      if (nation && season && !inflight) set({ nation: E.tick(nation, srvNow(), season).n });
    }, 4000);
    setInterval(() => {
      const ps = { ...get().prices };
      const n = get().nation;
      const all = [...Object.values(get().world), ...(n ? [E.toPublic(n)] : [])];
      for (const p of all) ps[p.id] = [...(ps[p.id] ?? []), M.sharePrice(p)].slice(-60);
      set({ prices: ps });
      write("bhv:prices", ps);
      write(LS.world, Object.values(get().world).slice(0, 300));
    }, 60_000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") doSync().then(loop);
    });
    caller = new Caller(
      () => {
        const n = get().nation;
        return { id: n?.id ?? get().account?.id ?? "", name: n ? `President ${n.president} of ${n.name}` : "A president" };
      },
      (to, s) => void api("/api/act/", { a: "signal", to, s }),
      (call) => {
        const was = get().call.state;
        set({ call });
        if (call.state === "ringing" && was !== "ringing") notify(`📞 ${call.peerName}`, call.video ? "Incoming video call" : "Incoming call", "call");
        if (call.state === "idle" && was !== "idle" && call.reason && call.reason !== "ended") get().toast({ icon: "📞", title: `Call ended: ${call.reason}`, kind: "info" });
        loop();
      }
    );
    set({ caller });
  };
  const signedIn = async (r: Res2<{ token?: string; id?: string; name?: string }>, via: Account["via"], email?: string) => {
    if (!r.ok || !r.token || !r.id) return r.err ?? "Couldn't sign in.";
    token = r.token;
    write(LS.token, token);
    const acc: Account = { id: r.id, name: r.name ?? "President", via, email };
    write(LS.account, acc);
    set({ account: acc });
    since = 0;
    await doSync();
    start();
    loop();
    return get().nation ? "restored" : "new";
  };

  return {
    booted: false,
    cfg: null,
    season: null,
    account: null,
    nation: null,
    world: {},
    claims: {},
    news: [],
    chat: [],
    relays: 0,
    toasts: [],
    timer: null,
    visit: null,
    lastLandmark: null,
    call: { state: "idle" },
    caller: null,
    dms: [],
    prices: {},
    phone: false,
    now: Date.now(),
    skew: 0,

    async boot() {
      if (get().booted) return;
      const cached = read<E.PublicNation[]>(LS.world) ?? [];
      const world: Record<string, E.PublicNation> = {};
      for (const p of cached) world[p.id] = p;
      set({ world, prices: read("bhv:prices") ?? {} });
      persistStorage();
      const info = await api<{ googleClientId: string; mapsKey: string }>("/api/auth/");
      set({ cfg: { googleClientId: info.googleClientId || "", mapsKey: info.mapsKey || "" }, relays: info.ok ? 1 : 0 });
      token = read<string>(LS.token);
      const acc = read<Account>(LS.account);
      if (token && acc) {
        set({ account: acc });
        await doSync();
        start();
        loop();
      }
      set({ booted: true });
    },

    async loginEmail(name, email, pin) {
      return signedIn(await api("/api/auth/", { mode: "email", name, email, pin }), "email", email.trim().toLowerCase());
    },
    async loginGoogle(credential) {
      return signedIn(await api("/api/auth/", { mode: "google", credential }), "google");
    },
    async loginGuest(name) {
      return signedIn(await api("/api/auth/", { mode: "guest", name }), "guest");
    },
    logout() {
      token = null;
      write(LS.token, null);
      write(LS.account, null);
      if (syncTimer) clearTimeout(syncTimer);
      if (get().call.state !== "idle") caller?.end();
      set({ account: null, nation: null, visit: null, timer: null });
    },

    async found(p) {
      const r = await api<{ me?: E.Nation }>("/api/act/", { a: "found", ...p, president: get().account?.name });
      if (!r.ok || !r.me) {
        await doSync();
        return r.err ?? "Couldn't found your country.";
      }
      setNation(r.me);
      doSync();
      return null;
    },

    log(kind, amount, meta) {
      const timed = kind === "study" || kind === "workout" || kind === "meditation";
      run(
        { a: "log", kind, amount, quality: meta?.quality },
        (n): E.Result => {
          if (timed) return E.logManual(n, kind, amount, srvNow());
          const r = E.logActivity(n, kind, amount, srvNow(), meta);
          const parts = Object.entries(r.gained).map(([k, v]) => `+${v} ${k}`);
          if (r.morale) parts.push(`+${r.morale} happiness today`);
          get().toast({ icon: "✅", title: r.capped ? "Daily limit reached for that one" : `Logged: ${parts.join(" · ")}`, kind: r.capped ? "info" : "good" });
          return { ok: true, n: r.n };
        },
        () => {
          if (timed) get().toast({ icon: "✅", title: "Logged. Self-reported minutes count up to 60 a day; use the timer for more.", kind: "good" });
        }
      );
    },
    startTimer(kind) {
      run({ a: "timer-start", kind }, (n) => E.startTimer(n, kind, srvNow()));
    },
    stopTimer(save) {
      run({ a: "timer-stop", save }, (n) => E.stopTimer(n, save, srvNow()), (r) => {
        const m = r.minutes ?? 0;
        if (save) get().toast(m >= 1 ? { icon: "⏱️", title: `${m} minutes saved, timed by the server`, kind: "good" } : { icon: "⏱️", title: "Sessions under a minute aren't counted", kind: "info" });
      });
    },
    claimGoals() {
      run({ a: "goals" }, (n): E.Result => {
        const r = E.claimGoals(n, srvNow());
        if (r.coins) get().toast({ icon: "🎯", title: `Daily goals: +${r.coins} coins`, kind: "good" });
        return { ok: true, n: r.n };
      });
    },
    build: (t, x, y) => run({ a: "build", t, x, y }, (n) => E.build(n, t, x, y, srvNow())),
    upgrade: (x, y) => run({ a: "upgrade", x, y }, (n) => E.upgrade(n, x, y, srvNow())),
    repair: (x, y) => run({ a: "repair", x, y }, (n) => E.repair(n, x, y)),
    demolish: (x, y) => run({ a: "demolish", x, y }, (n) => E.demolish(n, x, y)),
    move: (f, t) => run({ a: "move", fx: f.x, fy: f.y, tx: t.x, ty: t.y }, (n) => E.move(n, f, t, srvNow())),
    train: (count) => run({ a: "train", count }, (n) => E.train(n, count, srvNow()), (r) => get().toast({ icon: "🎖️", title: r.msg ?? "Trained", kind: "good" })),
    research: (t) => run({ a: "research", t }, (n) => E.research(n, t)),
    setRole: (role) => run({ a: "role", role }, (n) => E.setRole(n, role, srvNow())),
    bank: (op, amt) => run({ a: "bank", op, amt }, (n) => (op === "deposit" ? E.deposit(n, amt) : op === "withdraw" ? E.withdraw(n, amt) : op === "borrow" ? E.borrow(n, amt) : E.repay(n, amt))),
    sendMoney(to, amt, note) {
      const t = get().pub(to);
      if (!t || t.ai) return fail("Pick a real country.");
      return run({ a: "send", to, amt, note }, (n) => E.sendMoney(n, amt, t.name), () => get().toast({ icon: "💸", title: `Sent ${Math.floor(amt)} coins to ${t.name}`, kind: "good" }));
    },
    attack(target, soldiers) {
      const tp = get().pub(target);
      if (!tp) return false;
      return run({ a: "attack", to: target, soldiers }, (n) => E.launchAttack(n, tp, soldiers, srvNow()), (r) =>
        get().toast({ icon: "⚔️", title: `Army marching to ${tp.name}`, body: r.march ? `Arrives ${new Date(r.march.arriveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : undefined, kind: "info" })
      );
    },
    fly(target) {
      const tp = get().pub(target);
      if (!tp) return false;
      return run({ a: "fly", to: target }, (n) => E.fly(n, tp, srvNow()), () => set({ visit: target }));
    },
    visitLandmark(id) {
      const lm = LM_BY_ID.get(id);
      if (!lm) return false;
      return run({ a: "landmark", id }, (n) => E.visitLandmark(n, lm, srvNow()), () => set({ lastLandmark: id }));
    },
    prepare(calId, kind) {
      return run({ a: "prep", cal: calId, kind }, (n) => E.prepare(n, calId, kind), () => get().toast({ icon: E.PREP[kind].icon, title: `${E.PREP[kind].name}: ready`, body: E.PREP[kind].desc, kind: "good" }));
    },
    payFare(mode, km) {
      return run({ a: "fare", mode, km }, (n) => E.payFare(n, mode, km, srvNow()), (r) => get().toast({ icon: "🎟️", title: `${E.RIDE_NAME[mode]}: paid ${r.fare} coins`, kind: "info" }));
    },
    buyGear(item) {
      return run({ a: "gear", item }, (n) => E.buyGear(n, item, srvNow()), (r) => get().toast({ icon: "🛍️", title: r.msg ?? "Bought", kind: "good" }));
    },
    forecast() {
      const { nation, season } = get();
      if (!nation || !season) return [];
      const now = srvNow();
      return calamitiesBetween(season, now - DAY, now + 7 * DAY + HOUR)
        .filter((c) => c.end > now && c.start < now + 7 * DAY + HOUR && hits(c, nation.home))
        .sort((a, b) => a.start - b.start);
    },
    setPhone(v) {
      set({ phone: v });
    },
    buyShares(id, qty) {
      const t = get().pub(id);
      if (!t) return false;
      return run({ a: "buy", to: id, qty }, (n) => M.buyShares(n, t, qty), () => get().toast({ icon: "📈", title: `Bought ${Math.floor(qty)} shares of ${t.name}`, kind: "good" }));
    },
    sellShares(id, qty) {
      return run({ a: "sell", to: id, qty }, (n) => M.sellShares(n, get().pub(id), id, qty), (r) => get().toast({ icon: "📉", title: `Sold for ${r.got} coins`, kind: "good" }));
    },
    exportGoods(k, qty) {
      return run({ a: "export", k, qty }, (n) => M.exportGoods(n, k, qty), (r) => get().toast({ icon: "🚢", title: `Exported ${Math.floor(qty)} ${k} for ${r.got} coins`, kind: "good" }));
    },
    importGoods(k, qty) {
      return run({ a: "import", k, qty }, (n) => M.importGoods(n, k, qty), (r) => get().toast({ icon: "🛳️", title: `Imported ${Math.floor(qty)} ${k} for ${r.paid} coins`, kind: "good" }));
    },
    offerTrade(to, k, qty, price) {
      const t = get().pub(to);
      if (!t || t.ai) return fail("Choose a real country.");
      return run({ a: "offer", to, k, qty, price }, (n) => M.offerTrade(n, k, qty, price), () => get().toast({ icon: "🚢", title: `Offer sent to ${t.name}`, body: "Goods are held until they answer.", kind: "info" }));
    },
    answerTrade(offer, accept) {
      run({ a: "answer", offer, accept });
    },
    dm(to, text) {
      const t = get().pub(to);
      const msg = text.trim().slice(0, 400);
      if (!t || !msg) return;
      set({ dms: [...get().dms, { id: "tmp-" + uid(), with: to, withName: `President ${t.president} (${t.name})`, mine: true, text: msg, at: Date.now() }] });
      api("/api/act/", { a: "dm", to, text: msg }).then((r) => void (r.ok ? doSync() : fail(r.err ?? "Not sent.")));
    },
    dial(to, video = false) {
      const t = get().pub(to);
      if (!t || t.ai) return void fail("Centerpoint School never picks up.");
      caller?.dial(to, `President ${t.president} of ${t.name}`, video);
    },
    acceptCall: (video) => void caller?.accept(video),
    declineCall: () => caller?.decline(),
    hangup: () => caller?.end(),
    mute: (on) => caller?.mute(on),
    camera: (off) => caller?.camera(off),
    flipCamera: () => void caller?.flip(),
    endVisit() {
      set({ visit: null });
    },
    ally(target, op) {
      run({ a: "ally", op, to: target });
      if (op === "request") get().toast({ icon: "🤝", title: "Partnership request sent", kind: "info" });
    },
    sendAid(target) {
      const n = get().nation;
      if (!n || !n.partners.some((p) => p.id === target)) return fail("You can only send aid to partners.");
      return run({ a: "aid", to: target });
    },
    takeCover() {
      run({ a: "cover" });
    },
    say(text) {
      const t = text.trim().slice(0, 240);
      const n = get().nation;
      if (!t || !n) return;
      set((s) => ({ chat: [...s.chat, { id: "tmp-" + uid(), at: Date.now(), from: n.id, name: `President ${n.president} (${n.name})`, flag: n.flag, text: t }] }));
      api("/api/act/", { a: "chat", text: t }).then((r) => void (r.ok ? doSync() : fail(r.err ?? "Not sent.")));
    },
    toast(t) {
      const id = uid();
      set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
      setTimeout(() => get().dismiss(id), 5000);
    },
    dismiss(id) {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },
    pub(id) {
      const { season, world, nation } = get();
      if (id === AI_ID && season) return E.aiPublic(season, Date.now());
      if (nation && id === nation.id) return E.toPublic(nation);
      return world[id] ?? null;
    },
  };
});

export function useMyPublic() {
  const n = useGame((s) => s.nation);
  return n ? E.toPublic(n) : null;
}

export function kmTo(a: E.PublicNation | E.Nation | null, b: E.PublicNation | null) {
  if (!a || !b) return 0;
  return distanceKm(a.home, b.home);
}
