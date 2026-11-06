"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { RES_META, type Res, type ResKey } from "@/lib/game/rules";

export const fmt = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (a >= 1e4) return (n / 1e3).toFixed(1) + "k";
  return Math.floor(n).toLocaleString();
};
export const ago = (t: number) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
export const left = (ms: number) => {
  if (ms <= 0) return "now";
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

export function useNow(ms = 1000) {
  const [now, set] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => set(Date.now()), ms);
    return () => clearInterval(i);
  }, [ms]);
  return now;
}

export function ResBar({ res, keys = ["coins", "food", "water", "materials", "knowledge", "energy", "peace"] }: { res: Res; keys?: ResKey[] }) {
  return (
    <div className="resbar">
      {keys.map((k) => (
        <span key={k} className="res" title={RES_META[k].label}>
          {RES_META[k].icon} {fmt(res[k])}
        </span>
      ))}
    </div>
  );
}

export function Cost({ cost, have }: { cost: Partial<Res>; have?: Res }) {
  return (
    <span className="cost">
      {(Object.keys(cost) as ResKey[]).map((k) => (
        <span key={k} className={have && have[k] < (cost[k] ?? 0) ? "lack" : ""}>
          {RES_META[k].icon}
          {fmt(cost[k] ?? 0)}
        </span>
      ))}
    </span>
  );
}

export function Sheet({ open, onClose, children, mid }: { open: boolean; onClose: () => void; children: ReactNode; mid?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={`back ${mid ? "mid" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="sheet" initial={mid ? { scale: 0.94, opacity: 0 } : { y: "100%" }} animate={mid ? { scale: 1, opacity: 1 } : { y: 0 }} exit={mid ? { scale: 0.94, opacity: 0 } : { y: "100%" }} transition={{ type: "spring", stiffness: 360, damping: 34 }} onClick={(e) => e.stopPropagation()}>
            {!mid && <div className="grab" />}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="bar">
      <i style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
    </div>
  );
}

export function Stat({ icon, v, l }: { icon: string; v: ReactNode; l: string }) {
  return (
    <div className="stat">
      <small>
        {icon} {l}
      </small>
      <b>{v}</b>
    </div>
  );
}

/** A real country flag (ISO alpha-2 code), or an emoji for the AI rival. */
export function Flag({ code, size }: { code: string; size?: number }) {
  if (/^[a-z]{2}(-[a-z]+)?$/.test(code)) return <img className="flag-img" src={`/flags/${code}.svg`} alt="" style={size ? { width: size, height: size * 0.75 } : undefined} />;
  return <span>{code}</span>;
}
