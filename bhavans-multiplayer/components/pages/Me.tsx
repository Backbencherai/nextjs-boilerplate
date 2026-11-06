"use client";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { useGame } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { ACT_META, CHARACTERS, ROLES, ROLE_SWITCH_HOURS, type RoleId } from "@/lib/game/rules";
import { askNotifications, notifyGranted, notifySupported } from "@/lib/device";
import { Hero } from "../three/Hero";
import { Ink } from "../three/Ink";
import { Stat, ago, fmt, left, useNow } from "../ui";

export function Me() {
  const n = useGame((s) => s.nation)!;
  const account = useGame((s) => s.account)!;
  const setRole = useGame((s) => s.setRole);
  const logout = useGame((s) => s.logout);
  const now = useNow(30_000);
  const [notif, setNotif] = useState(notifyGranted());
  const switchIn = n.roleSince + ROLE_SWITCH_HOURS * 3600_000 - now;
  return (
    <main className="page">
      <header>
        <p className="kicker">head of state</p>
        <h1 className="page-title">{n.president}</h1>
      </header>
      <div className="cols">
        <div className="stack">
          <section className="card saffron">
            <div className="char-stage" style={{ height: 260 }}>
              <Canvas shadows camera={{ position: [0, 1.4, 4.3], fov: 38 }} dpr={[1, 2]}>
                <Ink wash={0.2} />
                <hemisphereLight args={["#ffffff", "#e8d9c0", 1.2]} />
                <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
                <group position={[0, -0.9, 0]}>
                  <Hero character={n.character} anim="cheer" height={2.1} />
                </group>
              </Canvas>
            </div>
            <div className="row between">
              <b className="display" style={{ fontSize: 20 }}>
                {CHARACTERS[n.character].name}
              </b>
              <span className="chip">
                {n.flag} {n.name}
              </span>
            </div>
            <span className="tiny">
              Signed in {account.via === "email" ? `as ${account.email}` : account.via === "google" ? `with Google (${account.email})` : "on this device only (guest)"}
            </span>
          </section>

          <section className="card">
            <div className="card-h">
              <h3>Your role</h3>
              {switchIn > 0 && <span className="tiny muted">switch again in {left(switchIn)}</span>}
            </div>
            <div className="roles">
              {(Object.keys(ROLES) as RoleId[]).map((r) => (
                <button key={r} className={`role ${n.role === r ? "on" : ""}`} disabled={switchIn > 0 && n.role !== r} onClick={() => setRole(r)}>
                  <span style={{ fontSize: 20 }}>{ROLES[r].icon}</span>
                  <b>{ROLES[r].name}</b>
                  <small>{ROLES[r].perk}</small>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h3 className="h3">Real-life records</h3>
            <div className="grid3">
              <Stat icon="📚" v={`${Math.round(n.stats.studyMin / 60)}h`} l="studied" />
              <Stat icon="🏋️" v={`${Math.round(n.stats.workoutMin / 60)}h`} l="trained" />
              <Stat icon="💧" v={n.stats.water} l="glasses" />
              <Stat icon="🥗" v={n.stats.meals} l="meals" />
              <Stat icon="👟" v={fmt(n.stats.steps)} l="steps" />
              <Stat icon="☄️" v={n.stats.meteorsSurvived} l="meteors survived" />
            </div>
            <div className="list">
              {n.log.slice(0, 12).map((l, i) => (
                <div key={i} className="row small">
                  <span>{ACT_META[l.kind].icon}</span>
                  <span className="grow">
                    {ACT_META[l.kind].label} · {l.amount} {ACT_META[l.kind].unit}
                    {l.note ? ` · ${l.note}` : ""}
                  </span>
                  <span className="tiny muted">{ago(l.at)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3 className="h3">🛂 Passport</h3>
            <div className="row wrap">
              {n.stamps.map((s) => (
                <span key={s.id} className="chip">
                  🛬 {s.name}
                </span>
              ))}
              {!n.stamps.length && <span className="small muted">No stamps yet. Build an airport and fly somewhere!</span>}
            </div>
          </section>

          <section className="card">
            <h3 className="h3">Settings</h3>
            <div className="row">
              <span className="grow">🔔 Notifications (attacks, meteors, tourists, money)</span>
              {notif ? (
                <span className="chip on">On</span>
              ) : (
                <button className="btn sm" disabled={!notifySupported()} onClick={async () => setNotif(await askNotifications())}>
                  Turn on
                </button>
              )}
            </div>
            <Link href="/install/" className="btn">
              📲 Install the app on any device
            </Link>
            <Link href="/ranks" className="btn">
              🏆 Rankings
            </Link>
            <Link href="/bank" className="btn">
              🏦 Bank
            </Link>
            <button className="btn red" onClick={() => confirm("Sign out? Email accounts can sign back in anywhere.") && logout()}>
              Sign out
            </button>
            <p className="tiny muted" style={{ margin: 0 }}>
              Power {fmt(E.power(n))} · founded {ago(n.createdAt)} · {n.done.length} world events survived
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
