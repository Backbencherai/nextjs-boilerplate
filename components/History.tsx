"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { KIND_META, PLAYERS, PLAYER_META, type PlayerId } from "@/lib/types";
import { dayKey, fmtDay, fmtMinutes } from "@/lib/game/dates";

/** Every record you've both ever logged, newest first, grouped by day. */
export function History() {
  const acts = useStore((s) => s.activities);
  const [who, setWho] = useState<PlayerId | "both">("both");
  const [limit, setLimit] = useState(120);
  const list = useMemo(() => acts.filter((a) => (who === "both" || a.player === who) && a.kind !== "coin").slice().reverse(), [acts, who]);
  const groups = useMemo(() => {
    const g: { day: string; items: typeof list }[] = [];
    for (const a of list.slice(0, limit)) {
      const d = dayKey(a.at);
      if (!g.length || g[g.length - 1].day !== d) g.push({ day: d, items: [] });
      g[g.length - 1].items.push(a);
    }
    return g;
  }, [list, limit]);
  const totalXp = list.reduce((s, a) => s + a.xp, 0);

  return (
    <main className="page">
      <header className="page-head">
        <p className="serif kicker">every single</p>
        <h1 className="display">Record</h1>
        <p className="muted">
          {list.length.toLocaleString()} records · {totalXp.toLocaleString()} XP. Saved on this phone and in your shared universe.
        </p>
      </header>
      <div className="seg big">
        {(["both", ...PLAYERS] as const).map((w) => (
          <button key={w} className={who === w ? "on" : ""} onClick={() => setWho(w)}>
            {w === "both" ? "Both" : PLAYER_META[w].name}
          </button>
        ))}
      </div>
      <section className="card">
        {groups.length === 0 && <p className="muted">Nothing here yet. Your first log starts the story.</p>}
        {groups.map((g) => (
          <div key={g.day}>
            <p className="history-day">{fmtDay(g.day, { weekday: "long", day: "numeric", month: "long" })}</p>
            <ul className="feed">
              {g.items.map((a) => (
                <li key={a.id}>
                  <span className="feed-dot" style={{ background: PLAYER_META[a.player].color }} />
                  <span className="feed-icon">{KIND_META[a.kind].icon}</span>
                  <span className="grow">
                    <b>{PLAYER_META[a.player].name}</b> {KIND_META[a.kind].label}
                    {a.minutes ? ` · ${fmtMinutes(a.minutes)}` : ""}
                    {a.data.label ? ` · ${a.data.label}` : ""}
                    {a.data.what ? ` · ${a.data.what}` : ""}
                    {a.data.hours ? ` · ${a.data.hours}h` : ""}
                    {a.data.steps ? ` · ${Number(a.data.steps).toLocaleString()} steps` : ""}
                    <small className="muted"> · {new Date(a.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</small>
                  </span>
                  <span className="mono small">+{a.xp}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {list.length > limit && (
          <button className="btn btn-ghost" onClick={() => setLimit(limit + 200)}>
            Show older
          </button>
        )}
      </section>
      <Link href="/" className="link-btn">
        ← home
      </Link>
    </main>
  );
}
