"use client";
import { useMemo, useState } from "react";
import { PLAYERS, PLAYER_META, KIND_META, type ActivityKind, type PlayerId } from "@/lib/types";
import { fmtDay, lastNDays, fmtMinutes, dayKey, addDays, weekKey } from "@/lib/game/dates";
import type { DayStats, Universe } from "@/lib/game/stats";

export type Metric = "xp" | "study" | "workout" | "water" | "sleepH" | "steps" | "healthy";
export const METRICS: { id: Metric; label: string; fmt: (v: number) => string }[] = [
  { id: "xp", label: "XP", fmt: (v) => `${Math.round(v)} XP` },
  { id: "study", label: "Study", fmt: (v) => fmtMinutes(v) },
  { id: "workout", label: "Workout", fmt: (v) => fmtMinutes(v) },
  { id: "water", label: "Water", fmt: (v) => `${v} glasses` },
  { id: "sleepH", label: "Sleep", fmt: (v) => `${v}h` },
  { id: "steps", label: "Steps", fmt: (v) => Math.round(v).toLocaleString() },
  { id: "healthy", label: "Healthy meals", fmt: (v) => `${v}` },
];

const val = (d: DayStats | undefined, m: Metric) => (d ? (d[m] as number) : 0);

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= v) return k * p;
  return 10 * p;
}

export function Legend() {
  return (
    <div className="legend">
      {PLAYERS.map((p) => (
        <span key={p}>
          <i style={{ background: PLAYER_META[p].chart }} />
          {PLAYER_META[p].name}
        </span>
      ))}
    </div>
  );
}

/** Grouped daily columns: one bar per person per day, crosshair-style hover per day. */
export function DailyBars({ u, metric, days }: { u: Universe; metric: Metric; days: number }) {
  const keys = useMemo(() => lastNDays(days), [days]);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const m = METRICS.find((x) => x.id === metric)!;
  const series = PLAYERS.map((p) => keys.map((k) => val(u.players[p].days.get(k), metric)));
  const max = niceMax(Math.max(...series.flat(), 0));
  const W = 640,
    H = 220,
    padL = 40,
    padB = 24,
    padT = 10;
  const iw = W - padL - 8;
  const ih = H - padB - padT;
  const slot = iw / keys.length;
  const bw = Math.max(1.5, Math.min(14, (slot - 4) / 2 - 1));
  const y = (v: number) => padT + ih - (v / max) * ih;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(keys.length / 7);

  return (
    <div className="chart">
      <div className="row between">
        <Legend />
        <button className="link-btn small" onClick={() => setTable(!table)}>
          {table ? "chart view" : "table view"}
        </button>
      </div>
      {table ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                {PLAYERS.map((p) => (
                  <th key={p}>{PLAYER_META[p].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys
                .map((k, i) => (
                  <tr key={k}>
                    <td>{fmtDay(k)}</td>
                    {PLAYERS.map((_, pi) => (
                      <td key={pi}>{m.fmt(series[pi][i])}</td>
                    ))}
                  </tr>
                ))
                .reverse()}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-svg-wrap" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label={`${m.label} per day for the last ${days} days`}>
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} className="grid" />
                <text x={padL - 6} y={y(t) + 4} className="axis" textAnchor="end">
                  {metric === "study" || metric === "workout" ? fmtMinutes(t) : Math.round(t).toLocaleString()}
                </text>
              </g>
            ))}
            {keys.map((k, i) => {
              const x0 = padL + i * slot + slot / 2;
              return (
                <g key={k}>
                  {hover === i && <rect x={padL + i * slot} y={padT} width={slot} height={ih} className="hover-band" />}
                  {PLAYERS.map((p, pi) => {
                    const v = series[pi][i];
                    if (!v) return null;
                    const h = Math.max(2, (v / max) * ih);
                    const x = pi === 0 ? x0 - bw - 1 : x0 + 1;
                    const r = Math.min(4, bw / 2);
                    const top = padT + ih - h;
                    // rounded data-end, square at baseline
                    return (
                      <path
                        key={p}
                        d={`M${x},${padT + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${padT + ih} Z`}
                        fill={PLAYER_META[p].chart}
                        opacity={hover === null || hover === i ? 1 : 0.45}
                      />
                    );
                  })}
                  {i % labelEvery === 0 && (
                    <text x={x0} y={H - 6} className="axis" textAnchor="middle">
                      {fmtDay(k, { day: "numeric", month: keys.length > 14 ? "short" : undefined })}
                    </text>
                  )}
                  <rect
                    x={padL + i * slot}
                    y={0}
                    width={slot}
                    height={H}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onTouchStart={() => setHover(i)}
                    onClick={() => setHover(i)}
                  />
                </g>
              );
            })}
            <line x1={padL} x2={W - 8} y1={padT + ih} y2={padT + ih} className="baseline" />
          </svg>
          {hover !== null && (
            <div className="tooltip" style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%` }}>
              <b>{fmtDay(keys[hover], { weekday: "short", day: "numeric", month: "short" })}</b>
              {PLAYERS.map((p, pi) => (
                <span key={p}>
                  <i style={{ background: PLAYER_META[p].chart }} />
                  {PLAYER_META[p].name} <b>{m.fmt(series[pi][hover])}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Calendar heatmap — sequential, one hue (the person's own) light→dark. */
export function Heatmap({ u, player, weeks = 16 }: { u: Universe; player: PlayerId; weeks?: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const start = addDays(weekKey(), -7 * (weeks - 1));
  const cells: { k: string; w: number; d: number; v: number }[] = [];
  for (let w = 0; w < weeks; w++)
    for (let d = 0; d < 7; d++) {
      const k = addDays(start, w * 7 + d);
      cells.push({ k, w, d, v: u.players[player].days.get(k)?.xp ?? 0 });
    }
  const max = Math.max(1, ...cells.map((c) => c.v));
  const today = dayKey();
  const S = 15,
    G = 3;
  const W = weeks * (S + G) + 22;
  const H = 7 * (S + G) + 4;
  const hc = hover ? cells.find((c) => c.k === hover) : null;
  const color = PLAYER_META[player].chart;
  return (
    <div className="chart">
      <div className="chart-svg-wrap" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg heat" role="img" aria-label={`${PLAYER_META[player].name}'s daily XP, last ${weeks} weeks`}>
          {["M", "", "W", "", "F", "", "S"].map((l, i) => (
            <text key={i} x={8} y={i * (S + G) + S - 3} className="axis" textAnchor="middle">
              {l}
            </text>
          ))}
          {cells.map((c) =>
            c.k > today ? null : (
              <rect
                key={c.k}
                x={22 + c.w * (S + G)}
                y={c.d * (S + G)}
                width={S}
                height={S}
                rx={3}
                fill={c.v ? color : "var(--chart-empty)"}
                fillOpacity={c.v ? 0.2 + 0.8 * Math.sqrt(c.v / max) : 1}
                stroke={hover === c.k ? "var(--ink)" : "none"}
                strokeWidth={1.5}
                onMouseEnter={() => setHover(c.k)}
                onClick={() => setHover(c.k)}
              />
            )
          )}
        </svg>
      </div>
      <p className="mono small muted heat-read">
        {hc ? `${fmtDay(hc.k, { weekday: "short", day: "numeric", month: "short" })} · ${hc.v} XP` : `Darker = more XP that day · best day ${max > 1 ? max + " XP" : "—"}`}
      </p>
    </div>
  );
}

/** XP by source — horizontal grouped bars, both people on one axis. */
export function KindBars({ u }: { u: Universe }) {
  const kinds = (Object.keys(KIND_META) as ActivityKind[]).filter((k) => PLAYERS.some((p) => (u.players[p].xpByKind[k] ?? 0) > 0));
  const max = niceMax(Math.max(1, ...kinds.flatMap((k) => PLAYERS.map((p) => u.players[p].xpByKind[k] ?? 0))));
  const [hover, setHover] = useState<string | null>(null);
  if (!kinds.length) return <p className="muted">No XP yet — log something and it shows up here.</p>;
  return (
    <div className="chart">
      <Legend />
      <div className="kindbars">
        {kinds
          .sort((a, b) => PLAYERS.reduce((s, p) => s + (u.players[p].xpByKind[b] ?? 0), 0) - PLAYERS.reduce((s, p) => s + (u.players[p].xpByKind[a] ?? 0), 0))
          .map((k) => (
            <div key={k} className={`kindrow ${hover && hover !== k ? "dim" : ""}`} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)}>
              <span className="kindlabel">
                {KIND_META[k].icon} {KIND_META[k].label}
              </span>
              <div className="kindtracks">
                {PLAYERS.map((p) => {
                  const v = u.players[p].xpByKind[k] ?? 0;
                  return (
                    <div key={p} className="kindtrack">
                      <i style={{ width: `${(v / max) * 100}%`, background: PLAYER_META[p].chart }} />
                      <small className="mono">{v}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
