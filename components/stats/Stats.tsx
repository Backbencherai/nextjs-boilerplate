"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PLAYERS, PLAYER_META, type PlayerId } from "@/lib/types";
import { DailyBars, Heatmap, KindBars, METRICS, type Metric } from "../charts/Charts";
import { fmtMinutes, lastNDays } from "@/lib/game/dates";
import { sumDays } from "@/lib/game/stats";

export function Stats() {
  const me = useStore((s) => s.me) as PlayerId;
  const u = useStore((s) => s.universe);
  const [metric, setMetric] = useState<Metric>("xp");
  const [days, setDays] = useState(14);
  const [heatWho, setHeatWho] = useState<PlayerId>(me);
  const keys = lastNDays(days);

  return (
    <main className="page">
      <header className="page-head">
        <p className="serif kicker">the</p>
        <h1 className="display">Observatory</h1>
      </header>

      {/* filters in one row above the charts */}
      <div className="filters">
        <div className="seg sm">
          {[7, 14, 30, 90].map((d) => (
            <button key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
        <div className="chips scroll">
          {METRICS.map((m) => (
            <button key={m.id} className={`chip ${metric === m.id ? "on" : ""}`} onClick={() => setMetric(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <section className="tiles">
        {PLAYERS.map((p) => {
          const d = sumDays(u.players[p], keys);
          const m = METRICS.find((x) => x.id === metric)!;
          const v = metric === "sleepH" ? (d.sleepH / Math.max(1, keys.filter((k) => (u.players[p].days.get(k)?.sleepH ?? 0) > 0).length)) : (d[metric] as number);
          return (
            <div key={p} className="tile" style={{ ["--c" as string]: PLAYER_META[p].chart }}>
              <small className="mono">
                {PLAYER_META[p].name} · {metric === "sleepH" ? "avg / night" : `last ${days}d`}
              </small>
              <b className="display">{metric === "sleepH" ? `${v.toFixed(1)}h` : m.fmt(v)}</b>
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>{METRICS.find((m) => m.id === metric)!.label} per day</h3>
        </div>
        <DailyBars u={u} metric={metric} days={days} />
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Consistency</h3>
          <div className="seg sm">
            {PLAYERS.map((p) => (
              <button key={p} className={heatWho === p ? "on" : ""} onClick={() => setHeatWho(p)}>
                {PLAYER_META[p].name}
              </button>
            ))}
          </div>
        </div>
        <Heatmap u={u} player={heatWho} />
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Where your XP comes from</h3>
          <span className="mono small muted">all time</span>
        </div>
        <KindBars u={u} />
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Lifetime</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                {PLAYERS.map((p) => (
                  <th key={p}>{PLAYER_META[p].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["XP", (p: PlayerId) => u.players[p].xp.toLocaleString()],
                  ["Active days", (p: PlayerId) => u.players[p].activeDays.size],
                  ["Study", (p: PlayerId) => fmtMinutes(u.players[p].studyMin)],
                  ["Workout", (p: PlayerId) => fmtMinutes(u.players[p].workoutMin)],
                  ["Meditation", (p: PlayerId) => fmtMinutes(u.players[p].meditationMin)],
                  ["Meals (healthy)", (p: PlayerId) => `${u.players[p].meals} (${u.players[p].healthyMeals})`],
                  ["Water", (p: PlayerId) => `${u.players[p].water} glasses`],
                  ["Steps", (p: PlayerId) => u.players[p].steps.toLocaleString()],
                  ["Quests", (p: PlayerId) => u.players[p].questsClaimed],
                ] as [string, (p: PlayerId) => string | number][]
              ).map(([l, f]) => (
                <tr key={l}>
                  <td>{l}</td>
                  {PLAYERS.map((p) => (
                    <td key={p}>{f(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
