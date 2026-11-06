"use client";
import { create } from "zustand";
import { PLAYER_META, partnerOf, type Activity, type ActivityKind, type PlayerId } from "./types";
import { xpFor } from "./game/xp";
import { computeUniverse, type Universe } from "./game/stats";
import { ACH_BY_ID } from "./game/achievements";
import { makeBackend, readCache, writeCache, type Backend, type WorldPos } from "./sync/backend";
import { loadSyncConfig } from "./sync/config";
import { buildStates } from "./game/builds";
import { SECRETS } from "./game/secrets";

export type TimerKind = "study" | "workout" | "meditation";
export interface Timer {
  kind: TimerKind;
  startedAt: number;
  pausedTotal: number;
  pausedAt: number | null;
  label: string;
}

export interface Celebration {
  id: string;
  kind: "achievement" | "level" | "quest" | "secret" | "build";
  title: string;
  subtitle: string;
  who: PlayerId | "together";
  achId?: string;
  level?: number;
}

export interface Toast {
  id: string;
  icon: string;
  text: string;
  color?: string;
}

export type SheetTab = "timer" | "meal" | "water" | "sleep" | "mood" | "steps" | "manual";

interface State {
  hydrated: boolean;
  ready: boolean;
  me: PlayerId | null;
  space: string | null;
  introSeen: boolean;
  mode: "cloud" | "local";
  activities: Activity[];
  universe: Universe;
  online: PlayerId[];
  partnerPos: WorldPos | null;
  timer: Timer | null;
  sheet: { open: boolean; tab: SheetTab; timerKind?: TimerKind };
  celebrations: Celebration[];
  toasts: Toast[];
  night: boolean;
  devConsole: boolean;

  hydrate(): void;
  setIdentity(me: PlayerId, space: string): void;
  switchPlayer(): void;
  markIntroSeen(): void;
  log(kind: ActivityKind, opts?: { minutes?: number; data?: Record<string, unknown>; at?: string }): Activity | null;
  remove(id: string): void;
  findSecret(id: string): void;
  openSheet(tab?: SheetTab, timerKind?: TimerKind): void;
  closeSheet(): void;
  startTimer(kind: TimerKind, label?: string): void;
  pauseTimer(): void;
  resumeTimer(): void;
  stopTimer(save: boolean): Activity | null;
  toast(t: Omit<Toast, "id">): void;
  dismissToast(id: string): void;
  celebrate(c: Omit<Celebration, "id">): void;
  shiftCelebration(): void;
  setNight(v: boolean): void;
  setDevConsole(v: boolean): void;
  sendPos(p: Omit<WorldPos, "player" | "t">): void;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

let backend: Backend | null = null;
let disconnect: (() => void) | null = null;

const PREF = "adxd:prefs";
type Prefs = { me?: PlayerId; space?: string; introSeen?: boolean; timer?: Timer | null; night?: boolean };
const readPrefs = (): Prefs => {
  try {
    return JSON.parse(localStorage.getItem(PREF) || "{}");
  } catch {
    return {};
  }
};
const writePrefs = (p: Partial<Prefs>) => {
  try {
    localStorage.setItem(PREF, JSON.stringify({ ...readPrefs(), ...p }));
  } catch {}
};

export const timerElapsed = (t: Timer, now = Date.now()) =>
  Math.max(0, (t.pausedAt ?? now) - t.startedAt - t.pausedTotal) / 1000;

export const useStore = create<State>((set, get) => {
  /** Replace activities, recompute the universe and celebrate anything new. */
  const apply = (next: Activity[], celebrateNew: boolean) => {
    const dedup = new Map<string, Activity>();
    for (const a of next) dedup.set(a.id, a);
    const list = [...dedup.values()].sort((a, b) => a.at.localeCompare(b.at));
    const prev = get().universe;
    const u = computeUniverse(list);
    set({ activities: list, universe: u });
    const { space, me } = get();
    if (space) writeCache(space, list);
    if (!celebrateNew || !me) return;

    // Only celebrate things that just happened — not history arriving on a new device.
    const RECENT = 10 * 60_000;
    const recent = (iso?: string) => !!iso && Date.now() - new Date(iso).getTime() < RECENT;
    const prevIds = new Set(prev.activities.map((a) => a.id));
    const freshChange = list.some((a) => !prevIds.has(a.id) && recent(a.at));
    if (!freshChange) return;
    for (const who of ["adarsh", "devanshi", "together"] as const) {
      u.unlocks[who].forEach((at, id) => {
        if (prev.unlocks[who].has(id) || !recent(at)) return;
        const def = ACH_BY_ID.get(id);
        if (!def) return;
        if (who === me || who === "together") {
          get().celebrate({ kind: "achievement", title: def.name, subtitle: def.desc, who, achId: id });
        } else {
          get().toast({ icon: def.icon, text: `${PLAYER_META[who].name} unlocked ${def.name}`, color: PLAYER_META[who].color });
        }
      });
    }
    const before = new Set(buildStates(prev).filter((b) => b.done).map((b) => b.def.id));
    for (const b of buildStates(u)) {
      if (!b.done || before.has(b.def.id)) continue;
      get().celebrate({
        kind: "build",
        title: b.def.name,
        subtitle: b.def.kind === "bridge" ? "Bridge complete! A new island is open — go explore." : b.def.kind === "vehicle" ? "Your car is parked on Together Isle. Hop in!" : "Built on your islands. Go and see it in the world.",
        who: b.def.owner ?? "together",
      });
    }
    const pm = prev.players[me].level;
    const nm = u.players[me].level;
    if (nm > pm) get().celebrate({ kind: "level", title: `Level ${nm}`, subtitle: "You levelled up in real life.", who: me, level: nm });
    const partner = partnerOf(me);
    if (u.players[partner].level > prev.players[partner].level)
      get().toast({ icon: "⬆️", text: `${PLAYER_META[partner].name} reached level ${u.players[partner].level}`, color: PLAYER_META[partner].color });
  };

  const connect = () => {
    const { me, space } = get();
    if (!me || !space) return;
    disconnect?.();
    backend = makeBackend(space);
    set({ mode: backend.mode });
    const cached = readCache(space);
    apply(cached, false);
    backend
      .load()
      .then((all) => apply(all, false))
      .catch(() => get().toast({ icon: "⚠️", text: "Offline — showing saved data. Changes will sync later." }))
      .finally(() => set({ ready: true }));
    disconnect = backend.connect(me, {
      onInsert: (a) => {
        if (get().activities.some((x) => x.id === a.id)) return;
        apply([...get().activities, a], true);
        const myself = get().me;
        if (a.player !== myself) {
          if (a.kind === "cheer") get().toast({ icon: "💛", text: `${PLAYER_META[a.player].name} cheered you on!`, color: PLAYER_META[a.player].color });
          else if (a.kind === "note") get().toast({ icon: "🍾", text: `${PLAYER_META[a.player].name} sent a bottle to your shore`, color: PLAYER_META[a.player].color });
        }
      },
      onDelete: (id) => apply(
        get().activities.filter((a) => a.id !== id),
        false
      ),
      onPresence: (online) => set({ online }),
      onPos: (p) => p.player !== get().me && set({ partnerPos: p }),
      onResync: (all) => {
        // server is the source of truth; keep only very fresh local rows still in flight
        const ids = new Set(all.map((a) => a.id));
        const fresh = get().activities.filter((a) => !ids.has(a.id) && Date.now() - new Date(a.at).getTime() < 15_000);
        apply([...all, ...fresh], true);
      },
    });
  };

  return {
    hydrated: false,
    ready: false,
    me: null,
    space: null,
    introSeen: false,
    mode: "local",
    activities: [],
    universe: computeUniverse([]),
    online: [],
    partnerPos: null,
    timer: null,
    sheet: { open: false, tab: "timer" },
    celebrations: [],
    toasts: [],
    night: false,
    devConsole: false,

    hydrate() {
      const p = readPrefs();
      set({ me: p.me ?? null, space: p.space ?? null, introSeen: !!p.introSeen, timer: p.timer ?? null, night: !!p.night });
      // read sync settings first so the right backend (cloud or local) is chosen
      loadSyncConfig().finally(() => {
        set({ hydrated: true });
        if (p.me && p.space) connect();
        else set({ ready: true });
      });
    },
    setIdentity(me, space) {
      writePrefs({ me, space });
      set({ me, space, ready: false });
      connect();
    },
    switchPlayer() {
      const me = get().me;
      if (!me) return;
      const next = partnerOf(me);
      writePrefs({ me: next });
      set({ me: next });
      connect();
    },
    markIntroSeen() {
      writePrefs({ introSeen: true });
      set({ introSeen: true });
    },

    log(kind, opts = {}) {
      const { me } = get();
      if (!me || !backend) return null;
      const data = opts.data ?? {};
      const a: Activity = {
        id: uid(),
        player: me,
        kind,
        at: opts.at ?? new Date().toISOString(),
        minutes: opts.minutes,
        data,
        xp: xpFor(kind, opts.minutes, data),
      };
      apply([...get().activities, a], true);
      backend.insert(a);
      return a;
    },
    remove(id) {
      const a = get().activities.find((x) => x.id === id);
      if (!a || a.player !== get().me) return;
      apply(
        get().activities.filter((x) => x.id !== id),
        false
      );
      backend?.remove(id);
    },
    findSecret(id) {
      const { me, universe } = get();
      if (!me) return;
      if (universe.players[me].secrets.has(id)) return;
      const s = SECRETS.find((x) => x.id === id);
      get().log("secret", { data: { secret: id } });
      get().celebrate({ kind: "secret", title: s?.name ?? "Secret found", subtitle: "Hidden secret discovered · +25 XP", who: me });
    },

    openSheet(tab = "timer", timerKind) {
      set({ sheet: { open: true, tab, timerKind } });
    },
    closeSheet() {
      set((s) => ({ sheet: { ...s.sheet, open: false } }));
    },

    startTimer(kind, label) {
      const t: Timer = { kind, startedAt: Date.now(), pausedTotal: 0, pausedAt: null, label: label ?? "" };
      writePrefs({ timer: t });
      set({ timer: t });
    },
    pauseTimer() {
      const t = get().timer;
      if (!t || t.pausedAt) return;
      const n = { ...t, pausedAt: Date.now() };
      writePrefs({ timer: n });
      set({ timer: n });
    },
    resumeTimer() {
      const t = get().timer;
      if (!t || !t.pausedAt) return;
      const n = { ...t, pausedTotal: t.pausedTotal + (Date.now() - t.pausedAt), pausedAt: null };
      writePrefs({ timer: n });
      set({ timer: n });
    },
    stopTimer(save) {
      const t = get().timer;
      writePrefs({ timer: null });
      set({ timer: null });
      if (!t || !save) return null;
      const minutes = Math.round((timerElapsed(t) / 60) * 10) / 10;
      if (minutes < 1) {
        get().toast({ icon: "⏱️", text: "Sessions under a minute aren't logged." });
        return null;
      }
      return get().log(t.kind, { minutes, data: t.label ? { label: t.label } : {} });
    },

    toast(t) {
      const id = uid();
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
      setTimeout(() => get().dismissToast(id), 4200);
    },
    dismissToast(id) {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },
    celebrate(c) {
      set((s) => ({ celebrations: [...s.celebrations, { ...c, id: uid() }] }));
    },
    shiftCelebration() {
      set((s) => ({ celebrations: s.celebrations.slice(1) }));
    },
    setNight(v) {
      writePrefs({ night: v });
      set({ night: v });
    },
    setDevConsole(v) {
      set({ devConsole: v });
    },
    sendPos(p) {
      const me = get().me;
      if (!me) return;
      backend?.sendPos({ ...p, player: me, t: Date.now() });
    },
  };
});
