"use client";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { AI_NAME, SEASON_DAYS } from "@/lib/game/rules";
import { fmt, left, useNow, Flag } from "../ui";

type Cat = "power" | "pop" | "coins" | "wins" | "aiWins" | "tourists";
const CATS: { id: Cat; label: string; get: (p: E.PublicNation) => number }[] = [
  { id: "power", label: "⚡ Power", get: (p) => p.power },
  { id: "pop", label: "👥 Population", get: (p) => p.pop },
  { id: "coins", label: "🪙 Wealth", get: (p) => p.coins },
  { id: "wins", label: "⚔️ Victories", get: (p) => p.stats.wins },
  { id: "aiWins", label: "🏫 Beat Centerpoint", get: (p) => p.stats.aiWins },
  { id: "tourists", label: "🧳 Tourism", get: (p) => p.stats.tourists },
];

export function Ranks() {
  const n = useGame((s) => s.nation)!;
  const season = useGame((s) => s.season)!;
  const world = useGame((s) => s.world);
  const now = useNow(10_000);
  const [cat, setCat] = useState<Cat>("power");
  const c = CATS.find((x) => x.id === cat)!;
  const rows = useMemo(() => [E.toPublic(n, now), ...Object.values(world).filter((p) => p.id !== n.id)].sort((a, b) => c.get(b) - c.get(a)), [world, n, now, c]);
  const ai = E.aiPublic(season, now);
  return (
    <main className="page">
      <header>
        <p className="kicker">
          season {season.n} · day {season.day}/{SEASON_DAYS} · ends in {left(season.endsAt - now)}
        </p>
        <h1 className="page-title">Rankings</h1>
      </header>
      <div className="seg">
        {CATS.map((x) => (
          <button key={x.id} className={cat === x.id ? "on" : ""} onClick={() => setCat(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <section className="card">
        <div className="list">
          {rows.slice(0, 200).map((p, i) => (
            <div key={p.id} className="nation-row" style={p.id === n.id ? { background: "#fff1bd", borderRadius: 12, padding: "10px 8px" } : undefined}>
              <b className="display" style={{ width: 36, fontSize: 22 }}>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
              </b>
              <span className="flag" style={{ background: p.color }}>
                <Flag code={p.flag} />
              </span>
              <div className="grow">
                <b>{p.name}</b>
                <div className="tiny muted">
                  {p.president} · {p.home.country}
                </div>
              </div>
              <b>{fmt(c.get(p))}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="card dark">
        <div className="row">
          <span className="flag" style={{ background: "#5a5a66" }}>
            🏫
          </span>
          <div className="grow">
            <b>{AI_NAME} (AI)</b>
            <div className="tiny">
              ⚡ {fmt(ai.power)} power · 🎖️ {fmt(ai.soldiers)} soldiers · grows every day of the season
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
