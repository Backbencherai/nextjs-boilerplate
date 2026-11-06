"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useGame } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { ACT_META, AI_NAME, DAILY_GOALS, ROLES, SEASON_DAYS, type ActKind } from "@/lib/game/rules";
import { CAL_META, COVER_OPEN_MIN, METEOR_WINDOW_MIN, calamitiesBetween, hits, nextAiRaid, nextMeteor } from "@/lib/game/world";
import { Bar, ResBar, Stat, ago, fmt, left, useNow, Flag } from "../ui";
import { useUI } from "../Shell";
import { Logo } from "../Logo";
import { upcomingFestivals } from "@/lib/game/festivals";

export function Home() {
  const n = useGame((s) => s.nation)!;
  const season = useGame((s) => s.season)!;
  const world = useGame((s) => s.world);
  const news = useGame((s) => s.news);
  const relays = useGame((s) => s.relays);
  const log = useGame((s) => s.log);
  const claim = useGame((s) => s.claimGoals);
  const takeCover = useGame((s) => s.takeCover);
  const setLog = useUI((s) => s.setLog);
  const now = useNow(1000);
  const me = E.toPublic(n, now);
  const all = useMemo(() => [...Object.values(world).filter((p) => p.id !== n.id), me].sort((a, b) => b.power - a.power), [world, me.power]); // eslint-disable-line react-hooks/exhaustive-deps
  const rank = all.findIndex((p) => p.id === n.id) + 1;
  const meteor = nextMeteor(season, now);
  const mMins = meteor ? (meteor.at - now) / 60_000 : Infinity;
  const coverOpen = meteor && mMins <= COVER_OPEN_MIN && mMins > -METEOR_WINDOW_MIN;
  const covered = meteor && n.cover.includes(meteor.id);
  const raid = nextAiRaid(n.id, n.createdAt, 72, now);
  const cals = calamitiesBetween(season, now, now + 1).filter((c) => hits(c, n.home));
  const soon = calamitiesBetween(season, now, now + 12 * 3600_000).filter((c) => c.start > now && hits(c, n.home)).slice(0, 2);
  const goalsReady = DAILY_GOALS.some((g) => g.test(n.day) && !n.day.claimed.includes(g.id));
  const everyone = [...Object.values(world).filter((p) => p.id !== n.id), me];
  const bhavansWins = everyone.reduce((s, p) => s + (p.stats?.aiWins ?? 0), 0);
  const cpWins = everyone.reduce((s, p) => s + (p.stats?.aiLosses ?? 0), 0);
  const quick: [ActKind, number, string][] = [
    ["study", 0, "Study"],
    ["workout", 0, "Workout"],
    ["water", 1, "+1 Water"],
    ["meal", 1, "Meal"],
    ["steps", 0, "Steps"],
    ["sleep", 0, "Sleep"],
  ];

  return (
    <main className="page">
      <header className="row between">
        <div className="row">
          <span className="flag" style={{ background: n.color }}>
            <Flag code={n.flag} />
          </span>
          <div>
            <p className="kicker">
              {ROLES[n.role].icon} {ROLES[n.role].name} {n.president} · {n.home.country}
            </p>
            <h1 className="display" style={{ margin: 0, fontSize: "clamp(26px, 7vw, 40px)" }}>
              {n.name}
            </h1>
          </div>
        </div>
        <div className="stack" style={{ alignItems: "flex-end", gap: 4 }}>
          <Logo size={38} />
          <span className="tiny muted">
            <span className={relays ? "dot on" : "dot"} /> {relays ? "online" : "offline"}
          </span>
        </div>
      </header>

      <ResBar res={n.res} />

      {/* alerts */}
      {meteor && mMins < 24 * 60 && (
        <div className={`banner ${coverOpen ? "red pulse" : "gold"}`}>
          <span className="e">☄️</span>
          <div className="grow">
            <b>{coverOpen ? (covered ? "You're in the shelters. Stay safe!" : "METEOR INCOMING: take cover!") : `The Red Meteor hits in ${left(meteor.at - now)}`}</b>
            <div className="small">{E.levels(n, "bunker") ? `Bunker level ${E.levels(n, "bunker")} protects your people.` : "Build a Bunker in your city to protect your people."}</div>
          </div>
          {coverOpen && !covered && (
            <button className="btn" onClick={takeCover}>
              🛡️ Take cover
            </button>
          )}
        </div>
      )}
      {n.marches.length > 0 && (
        <div className="banner navy">
          <span className="e">⚔️</span>
          <div className="grow">
            {n.marches.map((m) => (
              <div key={m.id} className="small">
                <b>{m.sent} soldiers</b> → {m.targetName} · arrives in {left(m.arriveAt - now)}
              </div>
            ))}
          </div>
        </div>
      )}
      <Forecast />
      <Festivals />
      {cals.map((c) => (
        <div key={c.id} className="banner gold">
          <span className="e">{CAL_META[c.type].icon}</span>
          <div className="grow">
            <b>
              {CAL_META[c.type].name} over {n.name} now
            </b>
            <div className="small">{CAL_META[c.type].effect}</div>
          </div>
        </div>
      ))}

      <div className="cols">
        <div className="stack">
          <section className="card saffron">
            <div className="card-h">
              <h3>Season {season.n} · Day {season.day}/{SEASON_DAYS}</h3>
              <span className="chip">🏆 #{rank || "–"} of {all.length}</span>
            </div>
            <div className="grid3">
              <Stat icon="👥" v={fmt(n.pop)} l={`/ ${E.popCap(n)} people`} />
              <Stat icon="😊" v={`${Math.round(n.happiness)}%`} l="happiness" />
              <Stat icon="⚡" v={fmt(me.power)} l="power" />
              <Stat icon="🎖️" v={n.soldiers} l={`/ ${E.soldierCap(n)} soldiers`} />
              <Stat icon="🏙️" v={me.cityLevel} l="city level" />
              <Stat icon="🗺️" v={`${me.land}×${me.land}`} l="land" />
            </div>
            <Bar pct={season.day / SEASON_DAYS} color="#1f3a93" />
          </section>

          <section className="card">
            <div className="card-h">
              <h3>Real life → your country</h3>
              <button className="btn sm primary" onClick={() => setLog(true)}>
                ＋ Log
              </button>
            </div>
            <div className="grid3">
              {quick.map(([k, amt, label]) => (
                <button key={k} className="btn" style={{ flexDirection: "column", minHeight: 74, gap: 2 }} onClick={() => (amt ? log(k, amt) : setLog(true))}>
                  <span style={{ fontSize: 24 }}>{ACT_META[k].icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h3>Daily goals</h3>
              <button className="btn sm saffron" disabled={!goalsReady} onClick={claim}>
                Claim rewards
              </button>
            </div>
            {DAILY_GOALS.map((g) => {
              const cur = { water8: n.day.water / 8, work30: n.day.workout / 30, study60: n.day.study / 60, healthy2: n.day.healthy / 2 }[g.id] ?? 0;
              return (
                <div key={g.id} className="goal">
                  <span>{g.icon}</span>
                  <span className="small" style={{ width: 120 }}>
                    {g.label}
                  </span>
                  <Bar pct={cur} color={n.day.claimed.includes(g.id) ? "#138808" : undefined} />
                  <span className="tiny">{n.day.claimed.includes(g.id) ? "✓" : `+${g.reward}`}</span>
                </div>
              );
            })}
          </section>
        </div>

        <div className="stack">
          <section className="card dark">
            <div className="card-h">
              <h3 style={{ color: "#fff" }}>The rivalry</h3>
              <span className="tiny">every country · every city</span>
            </div>
            <div className="vs">
              <div>
                <b style={{ color: "#ff9933" }}>{bhavansWins}</b>
                <div className="tiny">Bhavan&apos;s BP Vidya Mandir</div>
              </div>
              <span className="display" style={{ fontSize: 22 }}>
                VS
              </span>
              <div>
                <b style={{ color: "#b8b8c4" }}>{cpWins}</b>
                <div className="tiny">{AI_NAME}</div>
              </div>
            </div>
            <p className="small" style={{ margin: 0, opacity: 0.85 }}>
              {raid ? `Centerpoint's next raid on ${n.name}: in ${left(raid.at - now)}.` : ""} Beat them back with soldiers, walls and peace, or raid their campus from the War room.
            </p>
            <Link href="/war" className="btn saffron">
              ⚔️ War room
            </Link>
          </section>

          {soon.length > 0 && (
            <section className="card navy">
              <h3 className="h3">🌦️ Forecast for {n.name}</h3>
              {soon.map((c) => (
                <div key={c.id} className="small">
                  {CAL_META[c.type].icon} <b>{CAL_META[c.type].name}</b> in {left(c.start - now)}: {CAL_META[c.type].effect}
                </div>
              ))}
            </section>
          )}

          <section className="card">
            <div className="card-h">
              <h3>World news</h3>
              <Link href="/world" className="link small">
                world map →
              </Link>
            </div>
            <div className="list">
              {news.slice(0, 7).map((x) => (
                <div key={x.id} className="row small">
                  <span>{x.icon}</span>
                  <span className="grow">{x.text}</span>
                  <span className="tiny muted">{ago(x.at)}</span>
                </div>
              ))}
              {!news.length && <p className="small muted">Quiet so far. Make some news!</p>}
            </div>
          </section>

          <div className="grid2">
            <Link href="/bank" className="btn block">
              🏦 Bank
            </Link>
            <Link href="/ranks" className="btn block">
              🏆 Rankings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/** 7-day disaster forecast for your country, with preparations you can make in advance. */
function Forecast() {
  const n = useGame((s) => s.nation)!;
  const forecast = useGame((s) => s.forecast);
  const prepare = useGame((s) => s.prepare);
  const now = useNow(30_000);
  const list = useMemo(() => forecast(), [forecast, Math.floor(now / 60_000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const night = E.isNight(n.home, now);
  const hour = E.localHour(n.home, now);
  return (
    <section className="card">
      <div className="card-h">
        <h3>🌦️ Disaster forecast · next 7 days</h3>
        <span className="chip">
          {night ? "🌙" : "☀️"} {String(Math.floor(hour)).padStart(2, "0")}:{String(Math.floor((hour % 1) * 60)).padStart(2, "0")} in {n.home.country}
        </span>
      </div>
      {!list.length && <p className="small muted" style={{ margin: 0 }}>Clear skies over {n.name} for the next week.</p>}
      {list.map((c) => {
        const meta = CAL_META[c.type];
        const prepped = n.prep?.[c.id];
        const active = c.start <= now;
        const urgency = active ? "red" : c.start - now < 24 * 3600_000 ? "gold" : "";
        return (
          <div key={c.id} className={`fc-row ${urgency}`}>
            <span className="e">{meta.icon}</span>
            <div className="grow">
              <b>
                {meta.name} {active ? "· happening now" : `· in ${left(c.start - now)}`}
              </b>
              <div className="small muted">
                {c.region?.name ?? "Tropics-wide"} · {new Date(c.start).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {meta.effect}
              </div>
              {prepped ? (
                <div className="small" style={{ color: "var(--green)" }}>
                  ✅ Prepared: {E.PREP[prepped].name} ({E.PREP[prepped].desc})
                </div>
              ) : active ? null : (
                <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                  {(Object.keys(E.PREP) as E.PrepKind[]).map((k) => (
                    <button key={k} className="btn sm" onClick={() => prepare(c.id, k)} title={E.PREP[k].desc}>
                      {E.PREP[k].icon} {E.PREP[k].name} · {Object.entries(E.PREP[k].cost).map(([r, v]) => `${v} ${r}`).join(" + ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Festivals and holidays around the world: notifications and vacation ideas. */
function Festivals() {
  const list = useMemo(() => upcomingFestivals(Date.now(), 75).slice(0, 6), []);
  if (!list.length) return null;
  return (
    <section className="card">
      <div className="card-h">
        <h3>🎉 Festivals & holidays</h3>
        <span className="chip">vacation ideas</span>
      </div>
      {list.map((f) => (
        <div key={f.id} className="fc-row">
          <span className="e">{f.icon}</span>
          <div className="grow">
            <b>
              {f.name} {f.inDays <= 0 ? "· on now!" : `· in ${f.inDays} day${f.inDays > 1 ? "s" : ""}`}
            </b>
            <div className="small muted">
              {f.countries === "all" ? "Everywhere" : f.countries.slice(0, 4).join(", ")} · {f.blurb}
            </div>
          </div>
          {f.city && (
            <Link className="btn sm" href={`/roam/?lm=${f.city}`}>
              🧭 Go
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}
