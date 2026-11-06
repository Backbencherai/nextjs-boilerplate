"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { buildStates } from "@/lib/game/builds";

/** The next couple of island projects, with exactly what to do to finish them. */
export function BuildCard({ limit = 3 }: { limit?: number }) {
  const u = useStore((s) => s.universe);
  const all = buildStates(u);
  const next = all.filter((b) => !b.done).sort((a, b) => b.pct - a.pct).slice(0, limit);
  const done = all.length - all.filter((b) => !b.done).length;
  return (
    <section className="card">
      <div className="card-head">
        <h3>🔨 Island projects</h3>
        <span className="mono small">
          {done}/{all.length} built
        </span>
      </div>
      {next.length === 0 && <p className="muted">Everything is built. You legends.</p>}
      <div className="builds">
        {next.map((b) => (
          <div key={b.def.id} className="build">
            <span className="build-icon">{b.def.icon}</span>
            <div className="grow">
              <b>{b.def.name}</b>
              <small>{b.def.how}</small>
              <div className="quest-bar">
                <i style={{ width: `${b.pct * 100}%` }} />
              </div>
            </div>
            <span className="mono small">{Math.round(b.pct * 100)}%</span>
          </div>
        ))}
      </div>
      <Link href="/world" className="link-btn">
        see it in the world →
      </Link>
    </section>
  );
}
