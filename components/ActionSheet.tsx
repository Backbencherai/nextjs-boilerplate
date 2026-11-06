"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore, timerElapsed, type SheetTab, type TimerKind } from "@/lib/store";
import { KIND_META, type MealQuality } from "@/lib/types";
import { xpFor } from "@/lib/game/xp";
import { dayKey } from "@/lib/game/dates";

const TABS: { id: SheetTab; label: string; icon: string }[] = [
  { id: "timer", label: "Timer", icon: "⏱️" },
  { id: "meal", label: "Meal", icon: "🥗" },
  { id: "water", label: "Water", icon: "💧" },
  { id: "sleep", label: "Sleep", icon: "🌙" },
  { id: "mood", label: "Mood", icon: "✨" },
  { id: "steps", label: "Steps", icon: "👟" },
  { id: "manual", label: "Past session", icon: "🕰️" },
];

export function ActionSheet() {
  const sheet = useStore((s) => s.sheet);
  const close = useStore((s) => s.closeSheet);
  const open = useStore((s) => s.openSheet);
  return (
    <AnimatePresence>
      {sheet.open && (
        <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => i.offset.y > 120 && close()}
          >
            <div className="sheet-grab" />
            <div className="sheet-tabs">
              {TABS.map((t) => (
                <button key={t.id} className={`sheet-tab ${sheet.tab === t.id ? "on" : ""}`} onClick={() => open(t.id, sheet.timerKind)}>
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="sheet-body">
              {sheet.tab === "timer" && <TimerTab initial={sheet.timerKind} />}
              {sheet.tab === "meal" && <MealTab />}
              {sheet.tab === "water" && <WaterTab />}
              {sheet.tab === "sleep" && <SleepTab />}
              {sheet.tab === "mood" && <MoodTab />}
              {sheet.tab === "steps" && <StepsTab />}
              {sheet.tab === "manual" && <ManualTab />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useDone() {
  const close = useStore((s) => s.closeSheet);
  const toast = useStore((s) => s.toast);
  return (icon: string, text: string, xp: number) => {
    toast({ icon, text: `${text} · +${xp} XP` });
    close();
  };
}

export function useTick(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    const i = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}

export const fmtClock = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return (h ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function TimerTab({ initial }: { initial?: TimerKind }) {
  const timer = useStore((s) => s.timer);
  const start = useStore((s) => s.startTimer);
  const pause = useStore((s) => s.pauseTimer);
  const resume = useStore((s) => s.resumeTimer);
  const stop = useStore((s) => s.stopTimer);
  const done = useDone();
  const [kind, setKind] = useState<TimerKind>(initial ?? "study");
  const [label, setLabel] = useState("");
  const [goal, setGoal] = useState(25);
  useTick(500);

  if (timer) {
    const sec = timerElapsed(timer);
    const meta = KIND_META[timer.kind];
    const pct = Math.min(1, sec / (goal * 60));
    return (
      <div className="timer-live">
        <div className="timer-ring" style={{ ["--p" as string]: pct, ["--c" as string]: meta.color }}>
          <div>
            <span className="timer-kind">
              {meta.icon} {meta.label}
              {timer.label ? ` · ${timer.label}` : ""}
            </span>
            <b className="display timer-clock">{fmtClock(sec)}</b>
            <span className="muted small">≈ {xpFor(timer.kind, sec / 60, {})} XP so far</span>
          </div>
        </div>
        <div className="row gap center">
          {timer.pausedAt ? (
            <button className="btn btn-ghost" onClick={resume}>
              ▶ Resume
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={pause}>
              ❚❚ Pause
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              const a = stop(true);
              if (a) done(meta.icon, `${meta.label} logged: ${Math.round(a.minutes ?? 0)} min`, a.xp);
            }}
          >
            ■ Finish & log
          </button>
        </div>
        <button className="link-btn danger" onClick={() => confirm("Discard this session without logging?") && stop(false)}>
          discard session
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="seg">
        {(["study", "workout", "meditation"] as TimerKind[]).map((k) => (
          <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {KIND_META[k].icon} {KIND_META[k].label}
          </button>
        ))}
      </div>
      <input className="input" placeholder={kind === "study" ? "What are you studying? (optional)" : kind === "workout" ? "Run, gym, yoga… (optional)" : "Breathing, body scan… (optional)"} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
      <div className="field">
        <label>Focus goal (ring fills up)</label>
        <div className="chips">
          {[15, 25, 45, 60, 90].map((g) => (
            <button key={g} className={`chip ${goal === g ? "on" : ""}`} onClick={() => setGoal(g)}>
              {g}m
            </button>
          ))}
        </div>
      </div>
      <p className="muted small">
        {kind === "study" ? "2" : "3"} XP per minute. The timer keeps running if you close the app.
      </p>
      <button className="btn btn-primary wide" onClick={() => start(kind, label.trim())}>
        ▶ Start {KIND_META[kind].label.toLowerCase()} timer
      </button>
    </div>
  );
}

function MealTab() {
  const log = useStore((s) => s.log);
  const done = useDone();
  const [what, setWhat] = useState("");
  const [q, setQ] = useState<MealQuality>("healthy");
  const [slot, setSlot] = useState(() => {
    const h = new Date().getHours();
    return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 21 ? "dinner" : "snack";
  });
  const [kcal, setKcal] = useState("");
  return (
    <div className="stack">
      <div className="chips">
        {["breakfast", "lunch", "dinner", "snack"].map((s) => (
          <button key={s} className={`chip ${slot === s ? "on" : ""}`} onClick={() => setSlot(s)}>
            {s}
          </button>
        ))}
      </div>
      <input className="input" placeholder="What did you eat?" value={what} onChange={(e) => setWhat(e.target.value)} maxLength={80} />
      <div className="seg">
        {(
          [
            ["healthy", "🥦 Healthy"],
            ["balanced", "🍛 Balanced"],
            ["treat", "🍰 Treat"],
          ] as [MealQuality, string][]
        ).map(([k, l]) => (
          <button key={k} className={q === k ? "on" : ""} onClick={() => setQ(k)}>
            {l}
          </button>
        ))}
      </div>
      <input className="input" inputMode="numeric" placeholder="Calories (optional)" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))} />
      <button
        className="btn btn-primary wide"
        onClick={() => {
          const a = log("meal", { data: { what: what.trim(), quality: q, slot, kcal: kcal ? Number(kcal) : undefined } });
          if (a) done("🥗", `${slot[0].toUpperCase() + slot.slice(1)} logged`, a.xp);
        }}
      >
        Log {slot}
      </button>
    </div>
  );
}

function WaterTab() {
  const log = useStore((s) => s.log);
  const me = useStore((s) => s.me)!;
  const u = useStore((s) => s.universe);
  const toast = useStore((s) => s.toast);
  const today = u.players[me].days.get(dayKey())?.water ?? 0;
  return (
    <div className="stack center">
      <div className="glasses">
        {Array.from({ length: Math.max(8, today) }).map((_, i) => (
          <span key={i} className={i < today ? "full" : ""}>
            💧
          </span>
        ))}
      </div>
      <p className="display big-num">
        {today}
        <small>/8 glasses today</small>
      </p>
      <div className="row gap">
        {[1, 2].map((n) => (
          <button
            key={n}
            className="btn btn-primary"
            onClick={() => {
              const a = log("water", { data: { glasses: n } });
              if (a) toast({ icon: "💧", text: `+${n} glass${n > 1 ? "es" : ""} · +${a.xp} XP` });
            }}
          >
            + {n} glass{n > 1 ? "es" : ""}
          </button>
        ))}
      </div>
      <p className="muted small">One glass ≈ 250 ml.</p>
    </div>
  );
}

function SleepTab() {
  const log = useStore((s) => s.log);
  const done = useDone();
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(3);
  return (
    <div className="stack">
      <p className="display big-num center">
        {hours}
        <small>hours last night</small>
      </p>
      <input type="range" min={3} max={12} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="range" />
      <div className="field">
        <label>How rested do you feel?</label>
        <div className="chips">
          {["😵", "🥱", "🙂", "😌", "🤩"].map((e, i) => (
            <button key={i} className={`chip emoji ${quality === i + 1 ? "on" : ""}`} onClick={() => setQuality(i + 1)}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary wide"
        onClick={() => {
          const a = log("sleep", { data: { hours, quality } });
          if (a) done("🌙", `${hours}h sleep logged`, a.xp);
        }}
      >
        Log sleep
      </button>
    </div>
  );
}

function MoodTab() {
  const log = useStore((s) => s.log);
  const done = useDone();
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const faces = ["😞", "😕", "😐", "🙂", "😄"];
  return (
    <div className="stack">
      <div className="mood-row">
        {faces.map((f, i) => (
          <button key={i} className={`mood ${mood === i + 1 ? "on" : ""}`} onClick={() => setMood(i + 1)}>
            {f}
          </button>
        ))}
      </div>
      <div className="field">
        <label>Energy</label>
        <input type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="range" />
      </div>
      <input className="input" placeholder="One line about today (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
      <div className="row gap">
        <button className="btn btn-ghost" onClick={() => useStore.getState().openSheet("sleep")}>
          🌙 Log sleep too
        </button>
        <button
          className="btn btn-primary grow"
          onClick={() => {
            const a = log("mood", { data: { mood, energy, note: note.trim() } });
            if (a) done(faces[mood - 1], "Mood checked in", a.xp);
          }}
        >
          Check in
        </button>
      </div>
    </div>
  );
}

function StepsTab() {
  const log = useStore((s) => s.log);
  const done = useDone();
  const [steps, setSteps] = useState("");
  return (
    <div className="stack">
      <input className="input big" inputMode="numeric" placeholder="Steps walked (e.g. 8400)" value={steps} onChange={(e) => setSteps(e.target.value.replace(/\D/g, ""))} />
      <p className="muted small">Copy the number from your phone&apos;s health app. 1 XP per 500 steps (max 60).</p>
      <button
        className="btn btn-primary wide"
        disabled={!steps}
        onClick={() => {
          const a = log("steps", { data: { steps: Number(steps) } });
          if (a) done("👟", `${Number(steps).toLocaleString()} steps logged`, a.xp);
        }}
      >
        Log steps
      </button>
    </div>
  );
}

function ManualTab() {
  const log = useStore((s) => s.log);
  const done = useDone();
  const [kind, setKind] = useState<TimerKind>("study");
  const [min, setMin] = useState("30");
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() - 3600_000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [label, setLabel] = useState("");
  return (
    <div className="stack">
      <p className="muted small">Forgot to start the timer? Log a session you already did.</p>
      <div className="seg">
        {(["study", "workout", "meditation"] as TimerKind[]).map((k) => (
          <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {KIND_META[k].icon} {KIND_META[k].label}
          </button>
        ))}
      </div>
      <div className="row gap">
        <div className="field grow">
          <label>Minutes</label>
          <input className="input" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </div>
        <div className="field grow">
          <label>Finished at</label>
          <input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
      </div>
      <input className="input" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
      <button
        className="btn btn-primary wide"
        disabled={!Number(min)}
        onClick={() => {
          const at = new Date(when);
          const iso = isNaN(at.getTime()) || at.getTime() > Date.now() ? new Date().toISOString() : at.toISOString();
          const a = log(kind, { minutes: Math.min(300, Number(min)), at: iso, data: { label: label.trim(), manual: true } });
          if (a) done(KIND_META[kind].icon, `${min} min ${KIND_META[kind].label.toLowerCase()} logged`, a.xp);
        }}
      >
        Log session
      </button>
    </div>
  );
}
