"use client";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { QuestState } from "@/lib/game/quests";

const fmtVal = (v: number, unit: string) => (unit === "steps" ? Math.floor(v).toLocaleString() : Math.floor(v));

export function QuestRow({ q, i = 0 }: { q: QuestState; i?: number }) {
  const log = useStore((s) => s.log);
  const celebrate = useStore((s) => s.celebrate);
  const me = useStore((s) => s.me)!;
  const pct = Math.min(1, q.value / q.def.target);
  const claim = () => {
    if (!q.done || q.claimed) return;
    log("quest", { data: { questId: q.def.id, period: q.period, reward: q.def.reward } });
    celebrate({ kind: "quest", title: q.def.title, subtitle: `Quest complete · +${q.def.reward} XP`, who: q.def.scope === "shared" ? "together" : me });
  };
  return (
    <motion.div
      className={`quest ${q.done ? "done" : ""} ${q.claimed ? "claimed" : ""}`}
      initial={{ opacity: 0, y: 12, rotate: i % 2 ? 0.6 : -0.6 }}
      animate={{ opacity: 1, y: 0, rotate: i % 2 ? 0.4 : -0.4 }}
      transition={{ delay: i * 0.05 }}
    >
      <div className="quest-icon">{q.def.icon}</div>
      <div className="quest-main">
        <b>{q.def.title}</b>
        <div className="quest-bar">
          <i style={{ width: `${pct * 100}%` }} />
        </div>
        <small className="mono">
          {fmtVal(q.value, q.def.unit)} / {fmtVal(q.def.target, q.def.unit)} {q.def.unit}
        </small>
      </div>
      {q.claimed ? (
        <span className="quest-stamp">DONE</span>
      ) : q.done ? (
        <button className="btn btn-primary sm" onClick={claim}>
          Claim +{q.def.reward}
        </button>
      ) : (
        <span className="quest-reward mono">+{q.def.reward}</span>
      )}
    </motion.div>
  );
}
