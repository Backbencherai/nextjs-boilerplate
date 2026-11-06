"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { KIND_META, PLAYER_META, partnerOf, type PlayerId } from "@/lib/types";
import { levelFromXp, titleForLevel } from "@/lib/game/xp";
import { dayKey, fmtMinutes, timeAgo } from "@/lib/game/dates";
import { dayOf } from "@/lib/game/stats";
import { questBoard } from "@/lib/game/quests";
import { SECRETS } from "@/lib/game/secrets";
import { QuestRow } from "../QuestList";
import { Logo } from "../Logo";
import { BuildCard } from "../BuildCard";
import { InstallCard } from "../InstallCard";

export function Home() {
  const me = useStore((s) => s.me) as PlayerId;
  const u = useStore((s) => s.universe);
  const mode = useStore((s) => s.mode);
  const online = useStore((s) => s.online);
  const openSheet = useStore((s) => s.openSheet);
  const log = useStore((s) => s.log);
  const toast = useStore((s) => s.toast);
  const acts = useStore((s) => s.activities);
  const remove = useStore((s) => s.remove);
  const partner = partnerOf(me);
  const p = u.players[me];
  const q = u.players[partner];
  const lv = levelFromXp(p.xp);
  const today = dayOf(p);
  const ptoday = dayOf(q);
  const board = useMemo(() => questBoard(u, me), [u, me]);
  const meta = PLAYER_META[me];
  const hour = new Date().getHours();
  const greet = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const recent = useMemo(() => acts.filter((a) => a.kind !== "coin").slice(-14).reverse(), [acts]);
  const [showAll, setShowAll] = useState(false);

  const quick = [
    { icon: "📚", label: "Study", on: () => openSheet("timer", "study") },
    { icon: "🏋️", label: "Workout", on: () => openSheet("timer", "workout") },
    { icon: "🥗", label: "Meal", on: () => openSheet("meal") },
    {
      icon: "💧",
      label: "+1 Water",
      on: () => {
        log("water", { data: { glasses: 1 } });
        toast({ icon: "💧", text: `Glass logged · ${today.water + 1} today · +3 XP` });
      },
    },
    { icon: "🌙", label: "Sleep", on: () => openSheet("sleep") },
    { icon: "✨", label: "Mood", on: () => openSheet("mood") },
  ];

  return (
    <main className="page home">
      <header className="home-head">
        <Logo />
        <div className="grow">
          <p className="serif kicker">{greet},</p>
          <h1 className="display home-name">{meta.name}.</h1>
        </div>
        <div className={`sync-badge ${mode}`} title={mode === "cloud" ? "Live sync on" : "This device only"}>
          {mode === "cloud" ? (online.includes(partner) ? "● both online" : "● live") : "◌ local"}
        </div>
      </header>

      {/* poster hero */}
      <motion.section className="poster" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ["--c" as string]: meta.color }}>
        <div className="poster-level">
          <span className="mono">LEVEL</span>
          <b className="display">{lv.level}</b>
        </div>
        <div className="poster-info">
          <p className="serif">{titleForLevel(lv.level)}</p>
          <div className="xpbar">
            <i style={{ width: `${lv.pct * 100}%` }} />
          </div>
          <p className="mono small">
            {lv.into} / {lv.span} XP · {p.xp.toLocaleString()} total
          </p>
          <div className="poster-chips">
            <span>🔥 {p.streak} day streak</span>
            <span>🏅 {u.unlocks[me].size} medals</span>
            <span>⚡ {today.xp} XP today</span>
          </div>
        </div>
        <Link href="/world" className="btn btn-cream poster-cta">
          Enter the world »
        </Link>
      </motion.section>

      <section className="quick">
        {quick.map((x, i) => (
          <motion.button key={x.label} className="quick-btn" onClick={x.on} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} whileTap={{ scale: 0.94 }}>
            <span>{x.icon}</span>
            {x.label}
          </motion.button>
        ))}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Today</h3>
          <span className="mono small muted">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</span>
        </div>
        <div className="today-grid">
          <Stat icon="📚" v={fmtMinutes(today.study)} l="studied" />
          <Stat icon="🏋️" v={fmtMinutes(today.workout)} l="trained" />
          <Stat icon="💧" v={`${today.water}/8`} l="glasses" />
          <Stat icon="🍽️" v={`${today.meals}`} l={`meals · ${today.healthy} healthy`} />
          <Stat icon="🌙" v={today.sleepH ? `${today.sleepH}h` : "—"} l="slept" />
          <Stat icon="👟" v={today.steps ? today.steps.toLocaleString() : "—"} l="steps" />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Daily quests</h3>
          <Link href="/quests" className="link-btn">
            all quests →
          </Link>
        </div>
        <div className="quests">
          {board.daily.map((qq, i) => (
            <QuestRow key={qq.def.id} q={qq} i={i} />
          ))}
        </div>
      </section>

      <InstallCard />
      <BuildCard limit={2} />

      <section className="card partner" style={{ ["--c" as string]: PLAYER_META[partner].color }}>
        <div className="card-head">
          <h3>
            <span className={online.includes(partner) ? "dot on" : "dot"} /> {PLAYER_META[partner].name}
          </h3>
          <span className="mono small">
            Lv {q.level} · 🔥 {q.streak}
          </span>
        </div>
        <p className="muted small">
          Today: {fmtMinutes(ptoday.study)} study · {fmtMinutes(ptoday.workout)} workout · {ptoday.water} water · {ptoday.xp} XP
        </p>
        <div className="vs">
          <VsBar label="This week XP" a={weekXp(u.players[me])} b={weekXp(q)} ca={meta.color} cb={PLAYER_META[partner].color} />
        </div>
        <button
          className="btn btn-ghost wide"
          onClick={() => {
            log("cheer", { data: { to: partner } });
            toast({ icon: "📣", text: `You cheered ${PLAYER_META[partner].name} on! +2 XP` });
          }}
        >
          📣 Send a cheer
        </button>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Recent</h3>
          <span className="mono small muted">both of you</span>
        </div>
        {recent.length === 0 && <p className="muted">Nothing logged yet. Your first activity plants your first tree.</p>}
        <ul className="feed">
          {(showAll ? recent : recent.slice(0, 6)).map((a) => (
            <li key={a.id}>
              <span className="feed-dot" style={{ background: PLAYER_META[a.player].color }} />
              <span className="feed-icon">{KIND_META[a.kind].icon}</span>
              <span className="grow">
                <b>{PLAYER_META[a.player].name}</b> {describe(a)}
                <small className="muted"> · {timeAgo(a.at)}</small>
              </span>
              <span className="mono small">+{a.xp}</span>
              {a.player === me && (
                <button className="icon-btn sm" aria-label="Delete entry" onClick={() => confirm("Delete this entry? Its XP will be removed.") && remove(a.id)}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        {recent.length > 6 && (
          <button className="link-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? "show less" : "show more"}
          </button>
        )}
      </section>

      <Settings />
    </main>
  );
}

function weekXp(p: { days: Map<string, { xp: number }> }) {
  let s = 0;
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    s += p.days.get(dayKey(d))?.xp ?? 0;
  }
  return s;
}

function describe(a: { kind: string; minutes?: number; data: Record<string, unknown> }) {
  switch (a.kind) {
    case "study":
    case "workout":
    case "meditation":
      return `${a.kind === "study" ? "studied" : a.kind === "workout" ? "worked out" : "meditated"} ${fmtMinutes(a.minutes ?? 0)}${a.data.label ? ` — ${a.data.label}` : ""}`;
    case "meal":
      return `ate ${a.data.what ? `${a.data.what}` : `a ${a.data.quality} ${a.data.slot ?? "meal"}`}`;
    case "water":
      return `drank ${a.data.glasses ?? 1} glass${Number(a.data.glasses) > 1 ? "es" : ""} of water`;
    case "sleep":
      return `slept ${a.data.hours}h`;
    case "mood":
      return `checked in ${["😞", "😕", "😐", "🙂", "😄"][Number(a.data.mood ?? 3) - 1]}${a.data.note ? ` — “${a.data.note}”` : ""}`;
    case "steps":
      return `walked ${Number(a.data.steps).toLocaleString()} steps`;
    case "cheer":
      return `sent a cheer 📣`;
    case "note":
      return `cast a bottle 🍾`;
    case "secret":
      return `discovered a secret 🗝️`;
    case "quest":
      return `completed a quest`;
    default:
      return a.kind;
  }
}

function Stat({ icon, v, l }: { icon: string; v: string; l: string }) {
  return (
    <div className="stat">
      <span>{icon}</span>
      <b>{v}</b>
      <small>{l}</small>
    </div>
  );
}

export function VsBar({ label, a, b, ca, cb }: { label: string; a: number; b: number; ca: string; cb: string }) {
  const t = a + b || 1;
  return (
    <div className="vsbar">
      <div className="row between mono small">
        <span>{Math.round(a).toLocaleString()}</span>
        <span className="muted">{label}</span>
        <span>{Math.round(b).toLocaleString()}</span>
      </div>
      <div className="vsbar-track">
        <i style={{ width: `${(a / t) * 100}%`, background: ca }} />
        <i style={{ width: `${(b / t) * 100}%`, background: cb }} />
      </div>
    </div>
  );
}

function Settings() {
  const me = useStore((s) => s.me)!;
  const u = useStore((s) => s.universe);
  const switchPlayer = useStore((s) => s.switchPlayer);
  const [open, setOpen] = useState(false);
  const found = u.players[me].secrets;
  return (
    <section className="card subtle">
      <button className="row between wide link-plain" onClick={() => setOpen(!open)}>
        <h3>Settings & secrets</h3>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="stack">
          <div>
            <p className="mono small muted">SECRETS FOUND · {found.size}/{SECRETS.length}</p>
            <ul className="secret-list">
              {SECRETS.map((s) => (
                <li key={s.id} className={found.has(s.id) ? "found" : ""}>
                  {found.has(s.id) ? `🗝️ ${s.name}` : `🔒 ${s.hint}`}
                </li>
              ))}
            </ul>
          </div>
          <button className="btn btn-ghost" onClick={() => confirm(`Switch this device to ${PLAYER_META[partnerOf(me)].name}?`) && switchPlayer()}>
            Switch to {PLAYER_META[partnerOf(me)].name}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              try {
                sessionStorage.removeItem("adxd:loaded");
                localStorage.setItem("adxd:prefs", JSON.stringify({ ...JSON.parse(localStorage.getItem("adxd:prefs") || "{}"), introSeen: false }));
              } catch {}
              location.href = "/";
            }}
          >
            Replay the opening story
          </button>
          <button
            className="btn btn-ghost danger"
            onClick={() => {
              if (!confirm("Leave this universe on this device? Your shared progress stays with your partner and comes back when you join with the same code again.")) return;
              try {
                localStorage.removeItem("adxd:prefs");
              } catch {}
              location.href = "/";
            }}
          >
            Change join code / sign out
          </button>
        </div>
      )}
    </section>
  );
}
