"use client";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { questBoard } from "@/lib/game/quests";
import { QuestRow } from "./QuestList";
import { BuildCard } from "./BuildCard";
import type { PlayerId } from "@/lib/types";

function untilMidnight() {
  const n = new Date();
  const m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const h = Math.floor((m.getTime() - n.getTime()) / 3600000);
  return `${h}h ${Math.floor(((m.getTime() - n.getTime()) % 3600000) / 60000)}m`;
}
function untilMonday() {
  const n = new Date();
  const d = (8 - n.getDay()) % 7 || 7;
  return `${d} day${d > 1 ? "s" : ""}`;
}

export function Quests() {
  const me = useStore((s) => s.me) as PlayerId;
  const u = useStore((s) => s.universe);
  const b = useMemo(() => questBoard(u, me), [u, me]);
  return (
    <main className="page">
      <header className="page-head">
        <p className="serif kicker">the</p>
        <h1 className="display">Quest Board</h1>
        <p className="muted">Quests are the same for both of you and refresh automatically. Complete one, then claim it for bonus XP.</p>
      </header>
      <section className="card corkboard">
        <div className="card-head">
          <h3>Daily</h3>
          <span className="mono small">resets in {untilMidnight()}</span>
        </div>
        <div className="quests">
          {b.daily.map((q, i) => (
            <QuestRow key={q.def.id} q={q} i={i} />
          ))}
        </div>
      </section>
      <section className="card corkboard">
        <div className="card-head">
          <h3>Weekly</h3>
          <span className="mono small">resets in {untilMonday()}</span>
        </div>
        <div className="quests">
          {b.weekly.map((q, i) => (
            <QuestRow key={q.def.id} q={q} i={i} />
          ))}
        </div>
      </section>
      <BuildCard limit={20} />
      <section className="card corkboard together">
        <div className="card-head">
          <h3>Together this week</h3>
          <span className="mono small">progress is shared · each of you claims</span>
        </div>
        <div className="quests">
          {b.together.map((q, i) => (
            <QuestRow key={q.def.id} q={q} i={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
