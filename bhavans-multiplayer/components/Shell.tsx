"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { create } from "zustand";
import { useGame } from "@/lib/store";
import { Logo } from "./Logo";
import { LogSheet } from "./LogSheet";
import { Phone, PhoneButton } from "./Phone";
import dynamic from "next/dynamic";

const Entry = dynamic(() => import("./Entry").then((m) => m.Entry), { ssr: false, loading: () => <div className="blank" /> });
import { ACT_META } from "@/lib/game/rules";
import { useNow } from "./ui";

export const useUI = create<{ log: boolean; setLog: (v: boolean) => void }>((set) => ({ log: false, setLog: (log) => set({ log }) }));

const NAV = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/city", icon: "🏙️", label: "City" },
  { href: "/world", icon: "🌍", label: "World" },
  { href: "+", icon: "＋", label: "Log" },
  { href: "/war", icon: "⚔️", label: "War" },
  { href: "/me", icon: "👑", label: "Me" },
];

export function Shell({ children }: { children: ReactNode }) {
  const boot = useGame((s) => s.boot);
  const booted = useGame((s) => s.booted);
  const nation = useGame((s) => s.nation);
  const path = usePathname();
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    boot();
    const t = setTimeout(() => setIntro(false), 1700);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __bhvInstall?: Event }).__bhvInstall = e;
      window.dispatchEvent(new Event("bhv-installable"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, [boot]);

  const free = path.startsWith("/install");
  return (
    <div className="app">
      <AnimatePresence>
        {(intro || !booted) && (
          <motion.div className="loader" key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <Logo size={132} animated />
            <p>
              BHAVAN&apos;S <span style={{ color: "#1f3a93" }}>MULTIPLAYER</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {booted && (free ? children : nation ? children : <Entry />)}
      {booted && nation && !free && <Nav path={path} />}
      {booted && nation && <TimerPill />}
      {booted && nation && <LogSheet />}
      {booted && nation && !free && <PhoneButton />}
      {booted && nation && <Phone />}
      <Toasts />
    </div>
  );
}

function Nav({ path }: { path: string }) {
  const setLog = useUI((s) => s.setLog);
  return (
    <nav className="nav" aria-label="Main">
      {NAV.map((n) =>
        n.href === "+" ? (
          <button key="plus" className="plus" onClick={() => setLog(true)} aria-label="Log real-life activity">
            ＋
          </button>
        ) : (
          <Link key={n.href} href={n.href} className={(n.href === "/" ? path === "/" : path.startsWith(n.href)) ? "on" : ""}>
            <span>{n.icon}</span>
            <small>{n.label}</small>
          </Link>
        )
      )}
    </nav>
  );
}

function TimerPill() {
  const timer = useGame((s) => s.timer);
  const setLog = useUI((s) => s.setLog);
  const now = useNow(1000);
  if (!timer) return null;
  const sec = Math.floor((now - timer.startedAt) / 1000);
  return (
    <button className="timer-pill" onClick={() => setLog(true)}>
      <span className="dot on" /> {ACT_META[timer.kind].icon} {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}
    </button>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismiss);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button key={t.id} layout className={`toast ${t.kind}`} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 50 }} onClick={() => dismiss(t.id)}>
            <span>{t.icon}</span>
            <div>
              <b>{t.title}</b>
              {t.body && <small>{t.body}</small>}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
