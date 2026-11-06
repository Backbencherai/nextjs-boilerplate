"use client";
import { create } from "zustand";
import * as E from "./game/engine";
import { AI_ID, type ActKind, type BType, type CharId, type Res, type RoleId, type TechId } from "./game/rules";
import { distanceKm, HOUR, nextMeteor, COVER_OPEN_MIN, METEOR_WINDOW_MIN } from "./game/world";
import { Net, sha, seal, unseal, type ChatMsg, type NewsItem } from "./net/relay";
import { currentSeason, loadConfig, type GameConfig } from "./config";
import { notify, persistStorage } from "./device";
import { LM_BY_ID } from "./game/landmarks";
import * as M from "./game/market";
import { Caller, type CallState, type Signal } from "./net/call";
import type { ResKey } from "./game/rules";

export interface Account {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  via: "email" | "google" | "guest";
  secret?: string; // encrypts the cloud save; never leaves this device
  saveKey?: string;
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
type Season = ReturnType<typeof currentSeason>;

interface State {
  booted: boolean;
  cfg: GameConfig | null;
  season: Season | null;
  account: Account | null;
  nation: E.Nation | null;
  world: Record<string, E.PublicNation>;
  news: NewsItem[];
  chat: ChatMsg[];
  relays: number;
  toasts: Toast[];
  timer: Timer | null;
  visit: string | null;
  now: number;

  boot(): Promise<void>;
  loginEmail(name: string, email: string, pin: string): Promise<"restored" | "new">;
  loginGoogle(cred: { sub: string; name: string; email: string; picture?: string }): Promise<"restored" | "new">;
  loginGuest(name: string): void;
  logout(): void;
  found(p: { name: string; flag: string; color: string; character: CharId; role: RoleId; home: E.Home }): void;

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
  call: CallState;
  dms: { id: string; with: string; withName: string; mine: boolean; text: string; at: number }[];
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
  dial(to: string): void;
  acceptCall(): void;
  declineCall(): void;
  hangup(): void;
  mute(on: boolean): void;
  lastLandmark: string | null;
  ally(target: string, op: "request" | "accept" | "decline" | "end"): void;
  sendAid(target: string, res: Partial<Res>): boolean;
  takeCover(): void;
  say(text: string): void;
  toast(t: Omit<Toast, "id">): void;
  dismiss(id: string): void;
  pub(id: string): E.PublicNation | null;
}

const LS = { account: "bhv:account", nation: (id: string) => `bhv:nation:${id}`, world: "bhv:world", timer: "bhv:timer" };
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
const LS_DMS = "bhv:dms";
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

let net: Net | null = null;
let loop: ReturnType<typeof setInterval> | null = null;
let lastPub = 0;
let lastPubHash = "";
let lastCloud = 0;
let pendingInbox: E.InEvent[] = [];
let caller: Caller | null = null;

export const useGame = create<State>((set, get) => {
  /* ── helpers ── */
  const commit = (n: E.Nation, publish = true) => {
    set({ nation: n });
    write(LS.nation(n.id), n);
    if (publish) publishSoon(true);
  };
  const fail = (err: string) => {
    get().toast({ icon: "⚠️", title: err, kind: "bad" });
    return false;
  };
  const onNotes = (notes: E.Note[]) => {
    const n = get().nation;
    for (const note of notes) {
      get().toast({ icon: note.icon, title: note.title, body: note.body, kind: note.kind });
      notify(`${note.icon} ${note.title}`, note.body, note.title);
      if (note.news && n) net?.news({ id: uid(), at: Date.now(), icon: note.icon, text: note.title.includes(n.name) ? note.title : `${n.flag} ${n.name}: ${note.title}`, nation: n.id });
    }
  };
  const publishSoon = (force = false) => {
    const n = get().nation;
    if (!n || !net) return;
    const now = Date.now();
    const p = E.toPublic(n, now);
    const h = JSON.stringify({ ...p, lastSeen: 0 });
    if (!force && h === lastPubHash && now - lastPub < 60_000) return;
    if (now - lastPub < 3000 && !force) return;
    lastPub = now;
    lastPubHash = h;
    net.publishNation(p);
    set((s) => ({ world: { ...s.world, [p.id]: p } }));
  };
  const cloudSave = async (force = false) => {
    const { nation, account } = get();
    if (!nation || !account?.saveKey || !account.secret || !net) return;
    if (!force && Date.now() - lastCloud < 30_000) return;
    lastCloud = Date.now();
    net.saveCloud(account.saveKey, await seal(account.secret, nation));
  };
  const processInbox = () => {
    let n = get().nation;
    if (!n || !pendingInbox.length) return;
    const now = Date.now();
    const batch = pendingInbox;
    pendingInbox = [];
    const notes: E.Note[] = [];
    for (const ev of batch) {
      const r = E.applyEvent(n, ev, now);
      n = r.n;
      if (r.note) notes.push(r.note);
      net?.clearInbox(ev.id);
    }
    commit(n);
    onNotes(notes);
  };
  const step = () => {
    const { nation, season } = get();
    const now = Date.now();
    set({ now });
    if (!nation || !season) return;
    const t = E.tick(nation, now, season);
    const r = E.resolveMarches(t.n, now, season, (id) => get().pub(id));
    for (const o of r.outgoing) net?.send(o.to, o.ev);
    const changed = t.notes.length || r.notes.length || r.outgoing.length;
    commit(r.n, false);
    onNotes([...t.notes, ...r.notes]);
    processInbox();
    publishSoon(!!changed);
    cloudSave();
    // meteor alerts
    const m = nextMeteor(season, now);
    if (m) {
      const key = `bhv:meteor-alert:${m.id}`;
      const mins = (m.at - now) / 60_000;
      if (mins < 24 * 60 && mins > COVER_OPEN_MIN && !read(key + ":24")) {
        write(key + ":24", 1);
        onNotes([{ icon: "☄️", title: "The Red Meteor arrives in under 24 hours", body: "Build or upgrade a Bunker. When the alert opens, tap Take cover.", kind: "bad" }]);
      }
      if (mins <= COVER_OPEN_MIN && mins > -METEOR_WINDOW_MIN && !read(key + ":now")) {
        write(key + ":now", 1);
        onNotes([{ icon: "🚨", title: "METEOR ALERT: take cover now!", body: "Open the app and tap Take cover to protect your people.", kind: "bad" }]);
      }
    }
  };
  const startNet = async () => {
    const { cfg } = get();
    if (!cfg || net) return;
    net = new Net(cfg.relays, cfg.world);
    await net.connect({
      onNation: (p) => {
        const s = get().season;
        if (s && p.season !== s.id) return;
        if (Date.now() - p.lastSeen > 40 * 24 * HOUR) return;
        set((st) => ({ world: { ...st.world, [p.id]: p } }));
      },
      onGone: (id) =>
        set((st) => {
          const w = { ...st.world };
          delete w[id];
          return { world: w };
        }),
      onInbox: (ev) => {
        if (ev.type === "dm") {
          const me = get().nation?.id;
          if (!get().dms.some((d) => d.id === ev.id)) {
            const dms = [...get().dms, { id: ev.id, with: ev.from, withName: ev.fromName, mine: false, text: ev.text, at: ev.at }].slice(-300);
            set({ dms });
            write("bhv:dms", dms);
            if (Date.now() - ev.at < 120_000 && ev.from !== me) {
              get().toast({ icon: "💬", title: ev.fromName, body: ev.text, kind: "info" });
              notify(`💬 ${ev.fromName}`, ev.text, "dm-" + ev.from);
            }
          }
          net?.clearInbox(ev.id);
          return;
        }
        pendingInbox.push(ev);
        if (get().nation) processInbox();
      },
      onNews: (item) => set((st) => ({ news: [item, ...st.news.filter((x) => x.id !== item.id)].sort((a, b) => b.at - a.at).slice(0, 120) })),
      onChat: (m) => set((st) => ({ chat: [...st.chat.filter((x) => x.id !== m.id), m].sort((a, b) => a.at - b.at).slice(-150) })),
      onStatus: (relays) => set({ relays }),
      onSignal: (s) => caller?.onSignal(s as Signal),
    });
    caller = new Caller(
      () => {
        const n = get().nation;
        return { id: n?.id ?? get().account?.id ?? "", name: n ? `${n.flag} President ${n.president} of ${n.name}` : "A president" };
      },
      (to, s) => net?.signal(to, s),
      (call) => set({ call })
    );
    // stock price history (sampled from public data, so everyone sees the same chart)
    setInterval(() => {
      const w = get().world;
      const ps = { ...get().prices };
      for (const p of Object.values(w)) ps[p.id] = [...(ps[p.id] ?? []), M.sharePrice(p)].slice(-60);
      set({ prices: ps });
      write("bhv:prices", ps);
    }, 60_000);
    const acc = get().account;
    if (acc) net.setMe(acc.id);
  };
  const startLoop = () => {
    if (loop) return;
    loop = setInterval(step, 4000);
    step();
    publishSoon(true);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        const n = get().nation;
        if (n) write(LS.nation(n.id), n);
        cloudSave(true);
      } else step();
    });
    setInterval(() => {
      const w = get().world;
      write(LS.world, Object.values(w).slice(0, 400));
    }, 30_000);
  };
  const afterLogin = async (acc: Account): Promise<"restored" | "new"> => {
    write(LS.account, acc);
    set({ account: acc });
    await startNet();
    net!.setMe(acc.id);
    const season = get().season!;
    let n = read<E.Nation>(LS.nation(acc.id));
    if (!n && acc.saveKey && acc.secret) {
      const blob = await net!.loadCloud(acc.saveKey);
      if (blob) n = await unseal<E.Nation>(acc.secret, blob);
    }
    if (n && n.season === season.id) {
      set({ nation: n });
      startLoop();
      return "restored";
    }
    return "new";
  };

  return {
    booted: false,
    cfg: null,
    season: null,
    account: null,
    nation: null,
    world: {},
    news: [],
    chat: [],
    relays: 0,
    toasts: [],
    timer: null,
    visit: null,
    lastLandmark: null,
    call: { state: "idle" },
    dms: [],
    prices: {},
    phone: false,
    now: Date.now(),

    async boot() {
      if (get().booted) return;
      const cfg = await loadConfig();
      const season = currentSeason(cfg);
      const cachedWorld = read<E.PublicNation[]>(LS.world) ?? [];
      const world: Record<string, E.PublicNation> = {};
      for (const p of cachedWorld) if (p.season === season.id) world[p.id] = p;
      set({ cfg, season, world, timer: read<Timer>(LS.timer), dms: read(LS_DMS) ?? [], prices: read("bhv:prices") ?? {} });
      persistStorage();
      const acc = read<Account>(LS.account);
      if (acc) {
        set({ account: acc });
        await afterLogin(acc);
      } else startNet();
      set({ booted: true });
    },

    async loginEmail(name, email, pin) {
      const e = email.trim().toLowerCase();
      const id = (await sha(`id:${e}:${pin}`)).slice(0, 24);
      const saveKey = (await sha(`save:${e}:${pin}`)).slice(0, 40);
      return afterLogin({ id, name: name.trim() || e.split("@")[0], email: e, via: "email", secret: `${e}:${pin}`, saveKey });
    },
    async loginGoogle(c) {
      const id = (await sha(`g:${c.sub}`)).slice(0, 24);
      const saveKey = (await sha(`gsave:${c.sub}`)).slice(0, 40);
      return afterLogin({ id, name: c.name, email: c.email, picture: c.picture, via: "google", secret: `g:${c.sub}:${c.email}`, saveKey });
    },
    loginGuest(name) {
      const acc: Account = { id: "g" + uid(), name: name.trim() || "Guest", via: "guest" };
      afterLogin(acc);
    },
    logout() {
      const n = get().nation;
      if (n) write(LS.nation(n.id), n);
      cloudSave(true);
      write(LS.account, null);
      if (loop) clearInterval(loop);
      loop = null;
      set({ account: null, nation: null, visit: null });
    },

    found(p) {
      const { account, season } = get();
      if (!account || !season) return;
      const n = E.newNation({ ...p, id: account.id, president: account.name, season }, Date.now());
      commit(n);
      startLoop();
      net?.news({ id: uid(), at: Date.now(), icon: p.flag, text: `${p.flag} ${p.name} was founded in ${p.home.country} by President ${account.name}`, nation: n.id });
      cloudSave(true);
    },

    log(kind, amount, meta) {
      const n = get().nation;
      if (!n) return;
      const r = E.logActivity(n, kind, amount, Date.now(), meta);
      commit(r.n);
      const parts = Object.entries(r.gained).map(([k, v]) => `+${v} ${k}`);
      if (r.morale) parts.push(`+${r.morale} happiness today`);
      get().toast({ icon: "✅", title: r.capped ? "Daily limit reached for that one" : `Logged: ${parts.join(" · ")}`, kind: r.capped ? "info" : "good" });
    },
    startTimer(kind) {
      const t = { kind, startedAt: Date.now() };
      write(LS.timer, t);
      set({ timer: t });
      const n = get().nation;
      if (n) commit({ ...n, status: { kind, since: t.startedAt } });
    },
    stopTimer(save) {
      const t = get().timer;
      write(LS.timer, null);
      set({ timer: null });
      const n = get().nation;
      if (n) commit({ ...n, status: null });
      if (t && save) {
        const min = Math.floor((Date.now() - t.startedAt) / 60_000);
        if (min >= 1) get().log(t.kind, min);
        else get().toast({ icon: "⏱️", title: "Sessions under a minute aren't counted", kind: "info" });
      }
    },
    claimGoals() {
      const n = get().nation;
      if (!n) return;
      const r = E.claimGoals(n, Date.now());
      commit(r.n);
      if (r.coins) get().toast({ icon: "🎯", title: `Daily goals: +${r.coins} coins`, kind: "good" });
    },
    build(t, x, y) {
      const n = get().nation;
      if (!n) return false;
      const r = E.build(n, t, x, y, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    upgrade(x, y) {
      const n = get().nation;
      if (!n) return false;
      const r = E.upgrade(n, x, y, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    repair(x, y) {
      const n = get().nation;
      if (!n) return false;
      const r = E.repair(n, x, y);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    demolish(x, y) {
      const n = get().nation;
      if (!n) return false;
      const r = E.demolish(n, x, y);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    move(from, to) {
      const n = get().nation;
      if (!n) return false;
      const r = E.move(n, from, to, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    train(count) {
      const n = get().nation;
      if (!n) return false;
      const r = E.train(n, count, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      get().toast({ icon: "🎖️", title: r.msg ?? "Trained", kind: "good" });
      return true;
    },
    research(t) {
      const n = get().nation;
      if (!n) return false;
      const r = E.research(n, t);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    setRole(role) {
      const n = get().nation;
      if (!n) return false;
      const r = E.setRole(n, role, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    bank(op, amt) {
      const n = get().nation;
      if (!n) return false;
      const r = op === "deposit" ? E.deposit(n, amt) : op === "withdraw" ? E.withdraw(n, amt) : op === "borrow" ? E.borrow(n, amt) : E.repay(n, amt);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      return true;
    },
    sendMoney(to, amt, note) {
      const n = get().nation;
      const target = get().pub(to);
      if (!n || !target || target.ai) return fail("Pick a real country.");
      const r = E.sendMoney(n, amt, target.name);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      net?.send(to, { type: "transfer", id: "tx-" + uid(), from: n.id, fromName: `${n.flag} ${n.name}`, amount: Math.floor(amt), note: note?.slice(0, 80), at: Date.now() });
      get().toast({ icon: "💸", title: `Sent ${Math.floor(amt)} coins to ${target.name}`, kind: "good" });
      return true;
    },
    attack(target, soldiers) {
      const n = get().nation;
      const tp = get().pub(target);
      if (!n || !tp) return false;
      const r = E.launchAttack(n, tp, soldiers, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      if (!tp.ai && r.march) net?.send(target, { type: "march", id: "w-" + r.march.id, from: n.id, fromName: `${n.flag} ${n.name}`, arriveAt: r.march.arriveAt, sent: r.march.sent, at: Date.now() });
      net?.news({ id: uid(), at: Date.now(), icon: "⚔️", text: `${n.flag} ${n.name} marches ${soldiers} soldiers on ${tp.flag} ${tp.name}`, nation: n.id });
      get().toast({ icon: "⚔️", title: `Army marching to ${tp.name}`, body: `Arrives ${new Date(r.march!.arriveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, kind: "info" });
      return true;
    },
    fly(target) {
      const n = get().nation;
      const tp = get().pub(target);
      if (!n || !tp) return false;
      const r = E.fly(n, tp, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      if (!tp.ai) net?.send(target, { type: "tourist", id: "t-" + uid(), from: n.id, fromName: `${n.flag} ${n.name}`, coins: Math.round((r.ticket ?? 30) * 0.6), at: Date.now() });
      set({ visit: target });
      return true;
    },
    visitLandmark(id) {
      const n = get().nation;
      const lm = LM_BY_ID.get(id);
      if (!n || !lm) return false;
      const r = E.visitLandmark(n, lm, Date.now());
      if (!r.ok) return fail(r.err);
      commit(r.n);
      set({ lastLandmark: id });
      net?.news({ id: uid(), at: Date.now(), icon: lm.icon, text: `${n.flag} President ${n.president} of ${n.name} visited ${lm.name}`, nation: n.id });
      return true;
    },
    setPhone(v) {
      set({ phone: v });
    },
    buyShares(id, qty) {
      const n = get().nation;
      const t = get().pub(id);
      if (!n || !t) return false;
      const r = M.buyShares(n, t, qty);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      if (!t.ai && r.paid) net?.send(id, { type: "invest", id: "iv-" + uid(), from: n.id, fromName: `${n.flag} ${n.name}`, coins: Math.round(r.paid * 0.1), qty: Math.floor(qty), at: Date.now() });
      get().toast({ icon: "📈", title: `Bought ${Math.floor(qty)} shares of ${t.name}`, kind: "good" });
      return true;
    },
    sellShares(id, qty) {
      const n = get().nation;
      if (!n) return false;
      const r = M.sellShares(n, get().pub(id), id, qty);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      get().toast({ icon: "📉", title: `Sold for ${r.got} coins`, kind: "good" });
      return true;
    },
    exportGoods(k, qty) {
      const n = get().nation;
      if (!n) return false;
      const r = M.exportGoods(n, k, qty);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      get().toast({ icon: "🚢", title: `Exported ${Math.floor(qty)} ${k} for ${r.got} coins`, kind: "good" });
      return true;
    },
    importGoods(k, qty) {
      const n = get().nation;
      if (!n) return false;
      const r = M.importGoods(n, k, qty);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      get().toast({ icon: "🛳️", title: `Imported ${Math.floor(qty)} ${k} for ${r.paid} coins`, kind: "good" });
      return true;
    },
    offerTrade(to, k, qty, price) {
      const n = get().nation;
      const t = get().pub(to);
      if (!n || !t || t.ai) return fail("Choose a real country.");
      const r = M.offerTrade(n, k, qty, price);
      if (!r.ok) return fail(r.err);
      commit(r.n);
      net?.send(to, { type: "trade-offer", id: "to-" + uid(), from: n.id, fromName: `${n.flag} ${n.name}`, res: k, qty: Math.floor(qty), price: Math.floor(price), at: Date.now() });
      get().toast({ icon: "🚢", title: `Offer sent to ${t.name}`, body: "Goods are held until they answer.", kind: "info" });
      return true;
    },
    answerTrade(offerId, accept) {
      const n = get().nation;
      const o = n?.offers?.find((x) => x.id === offerId);
      if (!n || !o) return;
      const m = JSON.parse(JSON.stringify(n)) as E.Nation;
      m.offers = (m.offers ?? []).filter((x) => x.id !== offerId);
      if (accept) {
        if (m.res.coins < o.price) return void fail("Not enough coins.");
        m.res.coins -= o.price;
        m.res[o.res] += o.qty;
        m.ledger.unshift({ at: Date.now(), kind: "trade", text: `Imported ${o.qty} ${o.res} from ${o.fromName}`, coins: -o.price });
        net?.send(o.from, { type: "trade-ok", id: "tk-" + uid(), offer: o.id, from: n.id, fromName: `${n.flag} ${n.name}`, coins: o.price, at: Date.now() });
      } else net?.send(o.from, { type: "trade-no", id: "tn-" + uid(), offer: o.id, from: n.id, fromName: `${n.flag} ${n.name}`, res: o.res, qty: o.qty, at: Date.now() });
      commit(m);
    },
    dm(to, text) {
      const n = get().nation;
      const t = get().pub(to);
      const msg = text.trim().slice(0, 400);
      if (!n || !t || !msg) return;
      const id = "dm-" + uid();
      net?.send(to, { type: "dm", id, from: n.id, fromName: `${n.flag} ${n.president} (${n.name})`, text: msg, at: Date.now() });
      const dms = [...get().dms, { id, with: to, withName: `${t.flag} ${t.president} (${t.name})`, mine: true, text: msg, at: Date.now() }].slice(-300);
      set({ dms });
      write(LS_DMS, dms);
    },
    dial(to) {
      const t = get().pub(to);
      if (!t || t.ai) return void fail("Centerpoint School never picks up.");
      caller?.dial(to, `${t.flag} President ${t.president} of ${t.name}`);
    },
    acceptCall() {
      caller?.accept();
    },
    declineCall() {
      caller?.decline();
    },
    hangup() {
      caller?.end();
    },
    mute(on) {
      caller?.mute(on);
    },
    endVisit() {
      set({ visit: null });
    },
    ally(target, op) {
      const n = get().nation;
      const tp = get().pub(target);
      if (!n) return;
      const from = n.id;
      const fromName = `${n.flag} ${n.name}`;
      if (op === "request") {
        if (!tp || tp.ai) return void fail("Centerpoint School doesn't do partnerships!");
        if (n.partners.length >= 3) return void fail("Max 3 partners.");
        net?.send(target, { type: "ally-req", id: "ar-" + uid(), from, fromName, at: Date.now() });
        get().toast({ icon: "🤝", title: `Partnership request sent to ${tp.name}`, kind: "info" });
      } else if (op === "accept") {
        const req = n.allyReqs.find((r) => r.id === target);
        if (!req || n.partners.length >= 3) return;
        commit({ ...n, allyReqs: n.allyReqs.filter((r) => r.id !== target), partners: [...n.partners, { id: target, name: req.name, since: Date.now() }] });
        net?.send(target, { type: "ally-ok", id: "ao-" + uid(), from, fromName, at: Date.now() });
        net?.news({ id: uid(), at: Date.now(), icon: "🤝", text: `${fromName} and ${req.name} formed a partnership`, nation: n.id });
      } else if (op === "decline") {
        commit({ ...n, allyReqs: n.allyReqs.filter((r) => r.id !== target) });
      } else if (op === "end") {
        commit({ ...n, partners: n.partners.filter((p) => p.id !== target) });
        net?.send(target, { type: "ally-end", id: "ae-" + uid(), from, fromName, at: Date.now() });
      }
    },
    sendAid(target, res) {
      const n = get().nation;
      if (!n || !n.partners.some((p) => p.id === target)) return fail("You can only send aid to partners.");
      const m = JSON.parse(JSON.stringify(n)) as E.Nation;
      for (const [k, v] of Object.entries(res)) {
        const key = k as keyof Res;
        if ((v ?? 0) > m.res[key]) return fail(`Not enough ${k}.`);
        m.res[key] -= v ?? 0;
      }
      commit(m);
      net?.send(target, { type: "aid", id: "aid-" + uid(), from: n.id, fromName: `${n.flag} ${n.name}`, res, at: Date.now() });
      get().toast({ icon: "🎁", title: "Aid sent", kind: "good" });
      return true;
    },
    takeCover() {
      const { nation, season } = get();
      if (!nation || !season) return;
      const m = nextMeteor(season, Date.now());
      if (!m) return;
      const mins = (m.at - Date.now()) / 60_000;
      if (mins > COVER_OPEN_MIN) return void fail(`Shelters open ${COVER_OPEN_MIN} minutes before impact.`);
      commit(E.takeCover(nation, m.id));
      get().toast({ icon: "🛡️", title: "Your people are in the shelters", body: "Stay safe until the all-clear.", kind: "good" });
    },
    say(text) {
      const n = get().nation;
      const t = text.trim().slice(0, 240);
      if (!n || !t) return;
      const m: ChatMsg = { id: "c-" + uid(), at: Date.now(), from: n.id, name: `${n.president} (${n.name})`, flag: n.flag, text: t };
      set((s) => ({ chat: [...s.chat, m].slice(-150) }));
      net?.chat(m);
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
