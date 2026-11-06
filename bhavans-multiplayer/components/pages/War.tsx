"use client";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useGame, kmTo } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { AI_ID, AI_NAME } from "@/lib/game/rules";
import { nextAiRaid } from "@/lib/game/world";
import { Bar, Stat, fmt, left, useNow } from "../ui";

export function War() {
  const n = useGame((s) => s.nation)!;
  const season = useGame((s) => s.season)!;
  const world = useGame((s) => s.world);
  const train = useGame((s) => s.train);
  const attack = useGame((s) => s.attack);
  const params = useSearchParams();
  const now = useNow(1000);
  const [count, setCount] = useState(5);
  const [target, setTarget] = useState<string | null>(params.get("target"));
  const [send, setSend] = useState(10);
  const maxT = E.maxTrainable(n, now);
  const cost = E.soldierCost(n);
  const ready = E.warReady(n, now);
  const raid = nextAiRaid(n.id, n.createdAt, 72, now);
  const targets = useMemo(() => {
    const list = [E.aiPublic(season, now), ...Object.values(world).filter((p) => p.id !== n.id && p.season === season.id)];
    return list.sort((a, b) => Math.abs(a.power - E.power(n)) - Math.abs(b.power - E.power(n)));
  }, [world, season, n, now]);
  const tp = target ? targets.find((t) => t.id === target) ?? null : null;
  const myAtt = E.attackPower(n, Math.min(send, n.soldiers));
  const odds = tp ? myAtt / Math.max(1, tp.defense) : 0;
  const warLog = n.ledger.filter((l) => l.kind === "war" || l.kind === "raid").slice(0, 10);

  return (
    <main className="page">
      <header>
        <p className="kicker">ministry of defence</p>
        <h1 className="page-title">War room</h1>
      </header>
      {!ready && (
        <div className="banner gold">
          <span className="e">🏗️</span>
          <div className="grow">
            <b>Finish building your city to go to war</b>
            <div className="small">
              You need 8 buildings ({E.completedCount(n, now)}/8) including Barracks ({E.has(n, "barracks", now) ? "✓" : "✗"}). You can still defend yourself.
            </div>
          </div>
        </div>
      )}
      <div className="cols">
        <div className="stack">
          <section className="card">
            <div className="card-h">
              <h3>🎖️ Army</h3>
              {n.shieldUntil > now && <span className="chip">🕊️ peace shield {left(n.shieldUntil - now)}</span>}
            </div>
            <div className="grid3">
              <Stat icon="🎖️" v={`${n.soldiers}/${E.soldierCap(n, now)}`} l="soldiers" />
              <Stat icon="🛡️" v={fmt(E.defensePower(n, now))} l="defence" />
              <Stat icon="⚔️" v={fmt(E.attackPower(n, n.soldiers))} l="attack (all)" />
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              One soldier costs ⚡{cost.energy} 🌾{cost.food} 🪙{cost.coins}. Real workouts give energy.
            </p>
            <div className="row">
              <input className="range" type="range" min={1} max={Math.max(1, maxT)} value={Math.min(count, Math.max(1, maxT))} onChange={(e) => setCount(+e.target.value)} disabled={!maxT} />
              <button className="btn primary" disabled={!maxT} onClick={() => train(Math.min(count, maxT))}>
                Train {Math.min(count, maxT) || 0}
              </button>
            </div>
            {!E.has(n, "barracks", now) && <p className="tiny muted">Build Barracks in your city to train soldiers.</p>}
          </section>

          <section className="card dark">
            <div className="card-h">
              <h3 style={{ color: "#fff" }}>🏫 vs {AI_NAME}</h3>
            </div>
            <p className="small" style={{ margin: 0 }}>
              Centerpoint&apos;s campus in {n.home.country} raids you every ~2 days. Their next attack: <b>{raid ? left(raid.at - now) : "soon"}</b>. Record: <b>{n.stats.aiWins}</b> wins, <b>{n.stats.aiLosses}</b> losses.
            </p>
            <button className="btn saffron" onClick={() => setTarget(AI_ID)}>
              🎯 Target Centerpoint
            </button>
          </section>

          {n.marches.length > 0 && (
            <section className="card navy">
              <h3 className="h3">Armies on the march</h3>
              {n.marches.map((m) => {
                const pct = (now - m.launchAt) / (m.arriveAt - m.launchAt);
                return (
                  <div key={m.id} className="stack" style={{ gap: 4 }}>
                    <div className="row between small">
                      <b>
                        {m.sent} soldiers → {m.targetName}
                      </b>
                      <span>{left(m.arriveAt - now)}</span>
                    </div>
                    <Bar pct={pct} color="#d23a3a" />
                  </div>
                );
              })}
            </section>
          )}
        </div>

        <div className="stack">
          <section className="card">
            <h3 className="h3">🎯 Plan an attack</h3>
            <select className="input" value={target ?? ""} onChange={(e) => setTarget(e.target.value || null)}>
              <option value="">Choose a target…</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id} disabled={!t.ai && t.shieldUntil > now}>
                  {t.flag} {t.name} · 🛡️{fmt(t.defense)} {!t.ai && t.shieldUntil > now ? "(shielded)" : ""}
                </option>
              ))}
            </select>
            {tp && (
              <>
                <div className="grid3">
                  <Stat icon="🛡️" v={fmt(tp.defense)} l="their defence" />
                  <Stat icon="🪙" v={fmt(tp.coins)} l="their coins" />
                  <Stat icon="🗺️" v={`${Math.round(kmTo(n, tp))}`} l="km away" />
                </div>
                <label className="f">
                  Soldiers to send: {Math.min(send, n.soldiers)}
                  <input className="range" type="range" min={1} max={Math.max(1, n.soldiers)} value={Math.min(send, Math.max(1, n.soldiers))} onChange={(e) => setSend(+e.target.value)} />
                </label>
                <div className="row between small">
                  <span>Your attack ⚔️ {fmt(myAtt)}</span>
                  <b style={{ color: odds > 1.15 ? "#138808" : odds > 0.9 ? "#c98f06" : "#d23a3a" }}>{odds > 1.15 ? "Good odds" : odds > 0.9 ? "Risky" : "Likely defeat"}</b>
                </div>
                <p className="tiny muted" style={{ margin: 0 }}>
                  March time ≈ {E.marchMinutes(kmTo(n, tp))} min. They&apos;ll get a warning. Win: loot 25% of their coins and 20% of materials, and maybe land.
                </p>
                <button className="btn red lg block" disabled={!ready || n.soldiers < 1} onClick={() => attack(tp.id, Math.min(send, n.soldiers))}>
                  ⚔️ Launch attack
                </button>
              </>
            )}
          </section>

          <section className="card">
            <h3 className="h3">📜 War log</h3>
            <div className="list">
              {warLog.map((l, i) => (
                <div key={i} className="row small">
                  <span className="grow">{l.text}</span>
                  <b style={{ color: (l.coins ?? 0) >= 0 ? "#138808" : "#d23a3a" }}>
                    {(l.coins ?? 0) >= 0 ? "+" : ""}
                    {fmt(l.coins ?? 0)}
                  </b>
                </div>
              ))}
              {!warLog.length && <p className="small muted">No battles yet.</p>}
            </div>
            <p className="tiny muted" style={{ margin: 0 }}>
              Wins {n.stats.wins} · losses {n.stats.losses} · defended {n.stats.defended} · raided {n.stats.raided}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
