"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PLAYERS, PLAYER_META, type PlayerId } from "@/lib/types";
import { ACHIEVEMENTS, TIER_COLORS, progressOf, type AchievementDef } from "@/lib/game/achievements";
import { addDays, dayKey, fmtDate, fmtDay, fmtMinutes, lastNDays, monthKey, weekKey } from "@/lib/game/dates";
import { sumDays, type PlayerStats, type Universe } from "@/lib/game/stats";
import { titleForLevel } from "@/lib/game/xp";
import { downloadCertificate } from "@/lib/certificate";

type Who = PlayerId | "together";

export function Fame() {
  const me = useStore((s) => s.me) as PlayerId;
  const u = useStore((s) => s.universe);
  const [who, setWho] = useState<Who>(me);
  return (
    <main className="page">
      <header className="page-head">
        <p className="serif kicker">the</p>
        <h1 className="display">Hall of Fame</h1>
      </header>
      <div className="seg big">
        {([...PLAYERS, "together"] as Who[]).map((w) => (
          <button key={w} className={who === w ? "on" : ""} onClick={() => setWho(w)}>
            {w === "together" ? "Together" : PLAYER_META[w].name}
          </button>
        ))}
      </div>
      <motion.div key={who} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Records u={u} who={who} />
        <Link href={`/museum/${who}`} className="museum-link">
          <span className="display">Walk the museum</span>
          <span className="serif">every medal on its own pedestal, in 3D →</span>
        </Link>
        <Cabinet u={u} who={who} />
      </motion.div>
      <Leaderboard u={u} />
    </main>
  );
}

function Records({ u, who }: { u: Universe; who: Who }) {
  if (who === "together") {
    const s = u.shared;
    const a = u.players.adarsh,
      d = u.players.devanshi;
    const rows = [
      ["🔗", "Best in-sync streak", s.bestSyncStreak ? `${s.bestSyncStreak} days` : "—"],
      ["☀️", "Days you were both active", `${s.syncDays.length}`],
      ["📚", "Hours studied together", fmtMinutes(s.studyMin)],
      ["🏋️", "Hours trained together", fmtMinutes(s.workoutMin)],
      ["🥗", "Healthy meals, combined", `${s.healthyMeals}`],
      ["💞", "Cheers exchanged", `${s.cheers}`],
      ["⚡", "Combined XP", s.xp.toLocaleString()],
      ["🏆", "Shared medals", `${u.unlocks.together.size}`],
      ["🗓️", "Universe began", a.firstAt || d.firstAt ? fmtDate([a.firstAt, d.firstAt].filter(Boolean).sort()[0]!) : "—"],
    ];
    return <RecordGrid rows={rows} />;
  }
  const p = u.players[who];
  const rows = [
    ["⭐", "Level", `${p.level} · ${titleForLevel(p.level)}`],
    ["🎯", "Longest study session", p.maxStudy ? `${fmtMinutes(p.maxStudy.value)} · ${fmtDate(p.maxStudy.at)}` : "—"],
    ["💪", "Longest workout", p.maxWorkout ? `${fmtMinutes(p.maxWorkout.value)} · ${fmtDate(p.maxWorkout.at)}` : "—"],
    ["⚡", "Best day", p.bestDay ? `${p.bestDay.xp} XP · ${fmtDay(p.bestDay.key, { day: "numeric", month: "long" })}` : "—"],
    ["🔥", "Best streak", p.bestStreak ? `${p.bestStreak} days` : "—"],
    ["📚", "Total study", fmtMinutes(p.studyMin)],
    ["🏋️", "Total training", fmtMinutes(p.workoutMin)],
    ["💧", "Most water in a day", p.maxWaterDay ? `${p.maxWaterDay} glasses` : "—"],
    ["👟", "Most steps in a day", p.maxStepsDay ? p.maxStepsDay.toLocaleString() : "—"],
  ];
  return (
    <>
      <RecordGrid rows={rows} />
      {p.level > 1 && (
        <button
          className="btn btn-ghost wide"
          onClick={() =>
            downloadCertificate({
              recipient: PLAYER_META[who].name,
              title: `Level ${p.level}`,
              description: `Reached level ${p.level} — ${titleForLevel(p.level)} — with ${p.xp.toLocaleString()} XP earned in real life.`,
              date: fmtDate(p.levelUps[p.levelUps.length - 1]?.at ?? new Date().toISOString()),
              tier: p.level >= 20 ? "platinum" : p.level >= 10 ? "gold" : p.level >= 5 ? "silver" : "bronze",
              icon: "⭐",
              serial: `${who[0].toUpperCase()}-LV${p.level}`,
              accent: PLAYER_META[who].accent,
            })
          }
        >
          ⬇ Download level {p.level} certificate
        </button>
      )}
    </>
  );
}

function RecordGrid({ rows }: { rows: string[][] }) {
  return (
    <div className="records">
      {rows.map(([i, l, v], idx) => (
        <motion.div key={l} className="record" initial={{ opacity: 0, rotate: idx % 2 ? 1 : -1 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: idx * 0.03 }}>
          <span className="record-icon">{i}</span>
          <small className="mono">{l}</small>
          <b>{v}</b>
        </motion.div>
      ))}
    </div>
  );
}

export function certFor(a: AchievementDef, who: Who, at: string) {
  return downloadCertificate({
    recipient: who === "together" ? "Adarsh & Dewanshi" : PLAYER_META[who].name,
    title: a.name,
    description: a.desc,
    date: fmtDate(at),
    tier: a.tier,
    icon: a.icon,
    serial: `${who === "together" ? "T" : who[0].toUpperCase()}-${a.id.toUpperCase()}`,
    accent: who === "together" ? "#c2410c" : PLAYER_META[who].accent,
  });
}

function Cabinet({ u, who }: { u: Universe; who: Who }) {
  const list = ACHIEVEMENTS.filter((a) => (who === "together" ? a.scope === "shared" : a.scope === "solo"));
  const unlocked = u.unlocks[who];
  const sorted = [...list].sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)));
  return (
    <section className="card">
      <div className="card-head">
        <h3>Medals & trophies</h3>
        <span className="mono small">
          {[...unlocked.keys()].filter((k) => list.some((a) => a.id === k)).length} / {list.length}
        </span>
      </div>
      <div className="medals">
        {sorted.map((a) => {
          const at = unlocked.get(a.id);
          const [c, t] = progressOf(a, u, who);
          return (
            <div key={a.id} className={`medal ${at ? "on" : ""}`} style={{ ["--t" as string]: TIER_COLORS[a.tier].base }}>
              <div className="medal-disc">{at ? a.icon : "?"}</div>
              <b>{a.name}</b>
              <small>{a.desc}</small>
              {at ? (
                <>
                  <small className="mono">
                    {TIER_COLORS[a.tier].label} · {fmtDate(at)}
                  </small>
                  <button className="link-btn small" onClick={() => certFor(a, who, at)}>
                    ⬇ certificate
                  </button>
                </>
              ) : (
                <div className="quest-bar small">
                  <i style={{ width: `${Math.min(100, (c / t) * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type Cat = "xp" | "study" | "workout" | "healthy" | "water" | "steps" | "streak";
const CATS: { id: Cat; label: string; fmt: (v: number) => string }[] = [
  { id: "xp", label: "XP", fmt: (v) => `${v.toLocaleString()} XP` },
  { id: "study", label: "Study", fmt: fmtMinutes },
  { id: "workout", label: "Workout", fmt: fmtMinutes },
  { id: "healthy", label: "Healthy meals", fmt: (v) => `${v}` },
  { id: "water", label: "Water", fmt: (v) => `${v} glasses` },
  { id: "steps", label: "Steps", fmt: (v) => v.toLocaleString() },
  { id: "streak", label: "Best streak", fmt: (v) => `${v} days` },
];

function rangeKeys(period: "week" | "month" | "all", p: PlayerStats) {
  if (period === "week") return Array.from({ length: 7 }, (_, i) => addDays(weekKey(), i));
  if (period === "month") {
    const mk = monthKey();
    return lastNDays(31).filter((k) => k.startsWith(mk));
  }
  return [...p.days.keys()];
}

function Leaderboard({ u }: { u: Universe }) {
  const [cat, setCat] = useState<Cat>("xp");
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const rows = useMemo(
    () =>
      PLAYERS.map((p) => {
        const ps = u.players[p];
        let v = 0;
        if (cat === "streak") {
          // best run of consecutive active days inside the period
          const keys = rangeKeys(period, ps).sort();
          let run = 0,
            best = 0,
            prev = "";
          for (const k of keys) {
            if (!ps.activeDays.has(k)) {
              run = 0;
              continue;
            }
            run = prev && addDays(prev, 1) === k ? run + 1 : 1;
            prev = k;
            best = Math.max(best, run);
          }
          v = period === "all" ? ps.bestStreak : best;
        } else {
          const d = sumDays(ps, rangeKeys(period, ps).filter((k) => k <= dayKey()));
          v = cat === "xp" ? d.xp : (d[cat] as number);
        }
        return { p, v };
      }).sort((a, b) => b.v - a.v),
    [u, cat, period]
  );
  const c = CATS.find((x) => x.id === cat)!;
  const max = Math.max(1, ...rows.map((r) => r.v));
  const tie = rows[0].v === rows[1].v;
  return (
    <section className="card">
      <div className="card-head">
        <h3>Leaderboard</h3>
        <div className="seg sm">
          {(["week", "month", "all"] as const).map((x) => (
            <button key={x} className={period === x ? "on" : ""} onClick={() => setPeriod(x)}>
              {x === "all" ? "all time" : `this ${x}`}
            </button>
          ))}
        </div>
      </div>
      <div className="chips scroll">
        {CATS.map((x) => (
          <button key={x.id} className={`chip ${cat === x.id ? "on" : ""}`} onClick={() => setCat(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="podium">
        {rows.map((r, i) => (
          <motion.div key={r.p} layout className="podium-row" style={{ ["--c" as string]: PLAYER_META[r.p].chart }}>
            <span className="display podium-rank">{tie ? "=" : i + 1}</span>
            <div className="grow">
              <div className="row between">
                <b>{PLAYER_META[r.p].name}</b>
                <span className="mono">{c.fmt(r.v)}</span>
              </div>
              <div className="podium-bar">
                <motion.i initial={{ width: 0 }} animate={{ width: `${(r.v / max) * 100}%` }} />
              </div>
            </div>
            {!tie && i === 0 && r.v > 0 && <span className="crown">👑</span>}
          </motion.div>
        ))}
      </div>
      <p className="muted small">Friendly rivalry only — the together quests are where you both win.</p>
    </section>
  );
}
