"use client";
import { useState } from "react";
import { useGame } from "@/lib/store";
import { ACT_META, type ActKind } from "@/lib/game/rules";
import { Sheet, useNow } from "./ui";
import { useUI } from "./Shell";

const TABS: ActKind[] = ["study", "workout", "meditation", "meal", "water", "sleep", "steps"];

/** Log real life. Every action powers your country. */
export function LogSheet() {
  const open = useUI((s) => s.log);
  const setOpen = useUI((s) => s.setLog);
  const [tab, setTab] = useState<ActKind>("study");
  const log = useGame((s) => s.log);
  const timer = useGame((s) => s.timer);
  const startTimer = useGame((s) => s.startTimer);
  const stopTimer = useGame((s) => s.stopTimer);
  const day = useGame((s) => s.nation?.day);
  const [mins, setMins] = useState("30");
  const [hours, setHours] = useState(7.5);
  const [steps, setSteps] = useState("");
  const now = useNow(1000);
  const done = () => setOpen(false);
  const timed = tab === "study" || tab === "workout" || tab === "meditation";
  const used = day ? (day as unknown as Record<string, number>)[tab === "meal" ? "meals" : tab] ?? 0 : 0;

  return (
    <Sheet open={open} onClose={done}>
      <div className="card-h">
        <h3>Log real life</h3>
        <button className="x" onClick={done} aria-label="Close">
          ✕
        </button>
      </div>
      <p className="small muted" style={{ margin: "4px 0 10px" }}>
        Everything you do in real life powers your country.
      </p>
      <div className="seg" style={{ marginBottom: 14 }}>
        {TABS.map((k) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {ACT_META[k].icon} {ACT_META[k].label}
          </button>
        ))}
      </div>
      <div className="card flat navy" style={{ marginBottom: 12 }}>
        <div className="row between">
          <b>
            {ACT_META[tab].icon} {ACT_META[tab].gives}
          </b>
          <span className="tiny muted">
            today {used}/{ACT_META[tab].cap}
          </span>
        </div>
      </div>
      {timed && (
        <div className="stack">
          {timer && timer.kind === tab ? (
            <div className="card flat center" style={{ alignItems: "center" }}>
              <span className="big mono">
                {String(Math.floor((now - timer.startedAt) / 60000)).padStart(2, "0")}:{String(Math.floor(((now - timer.startedAt) / 1000) % 60)).padStart(2, "0")}
              </span>
              <span className="small muted">Everyone on the world map can see you&apos;re {tab === "study" ? "studying" : tab === "workout" ? "working out" : "meditating"}.</span>
              <div className="row center">
                <button className="btn" onClick={() => stopTimer(false)}>
                  Discard
                </button>
                <button
                  className="btn primary"
                  onClick={() => {
                    stopTimer(true);
                    done();
                  }}
                >
                  ■ Finish & log
                </button>
              </div>
            </div>
          ) : (
            <button className="btn primary lg block" disabled={!!timer} onClick={() => startTimer(tab as "study")}>
              ▶ Start {ACT_META[tab].label.toLowerCase()} timer
            </button>
          )}
          {timer && timer.kind !== tab && <p className="small muted center">A {timer.kind} timer is running.</p>}
          <div className="row">
            <input className="input" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value.replace(/\D/g, "").slice(0, 3))} aria-label="Minutes" />
            <button
              className="btn"
              onClick={() => {
                if (+mins > 0) {
                  log(tab, +mins);
                  done();
                }
              }}
            >
              Log {mins || 0} min
            </button>
          </div>
        </div>
      )}
      {tab === "meal" && (
        <div className="grid3">
          {(
            [
              ["healthy", "🥦", "Healthy"],
              ["balanced", "🍛", "Balanced"],
              ["treat", "🍰", "Treat"],
            ] as const
          ).map(([q, e, l]) => (
            <button
              key={q}
              className="btn lg"
              style={{ flexDirection: "column", height: 92 }}
              onClick={() => {
                log("meal", 1, { quality: q });
                done();
              }}
            >
              <span style={{ fontSize: 28 }}>{e}</span>
              {l}
            </button>
          ))}
        </div>
      )}
      {tab === "water" && (
        <div className="grid2">
          {[1, 2].map((g) => (
            <button key={g} className="btn lg" onClick={() => log("water", g)}>
              💧 +{g} glass{g > 1 ? "es" : ""}
            </button>
          ))}
        </div>
      )}
      {tab === "sleep" && (
        <div className="stack">
          <p className="big center">{hours} h</p>
          <input className="range" type="range" min={3} max={12} step={0.5} value={hours} onChange={(e) => setHours(+e.target.value)} />
          <button
            className="btn primary lg block"
            onClick={() => {
              log("sleep", hours);
              done();
            }}
          >
            🌙 Log last night
          </button>
        </div>
      )}
      {tab === "steps" && (
        <div className="row">
          <input className="input" inputMode="numeric" placeholder="e.g. 8400" value={steps} onChange={(e) => setSteps(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          <button
            className="btn primary"
            disabled={!steps}
            onClick={() => {
              log("steps", +steps);
              setSteps("");
              done();
            }}
          >
            Log steps
          </button>
        </div>
      )}
    </Sheet>
  );
}
