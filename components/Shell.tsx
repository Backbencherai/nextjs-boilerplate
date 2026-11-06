"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useStore, timerElapsed } from "@/lib/store";
import { ActionSheet, fmtClock, useTick } from "./ActionSheet";
import { KIND_META, PLAYER_META } from "@/lib/types";
import { ACH_BY_ID, TIER_COLORS } from "@/lib/game/achievements";

const CelebrationCanvas = dynamic(() => import("./CelebrationCanvas"), { ssr: false });
import { fmtDate } from "@/lib/game/dates";

const NAV = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/world", label: "World", icon: "◎" },
  { href: "/quests", label: "Quests", icon: "✦" },
  { href: "+", label: "Log", icon: "＋" },
  { href: "/fame", label: "Fame", icon: "♛" },
  { href: "/stats", label: "Stats", icon: "▥" },
];

export function Shell({ children }: { children: ReactNode }) {
  const hydrate = useStore((s) => s.hydrate);
  const me = useStore((s) => s.me);
  const space = useStore((s) => s.space);
  const introSeen = useStore((s) => s.introSeen);
  const pathname = usePathname();
  const router = useRouter();
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    hydrate();
  }, [hydrate]);

  // Konami code → developer console
  useEffect(() => {
    const seq = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    let i = 0;
    const on = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0;
      if (i === seq.length) {
        i = 0;
        useStore.getState().setDevConsole(true);
        useStore.getState().findSecret("konami");
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const onboarded = !!me && !!space && introSeen;
  useEffect(() => {
    if (pathname !== "/" && useStore.getState().me === null && booted.current) {
      const t = setTimeout(() => {
        const s = useStore.getState();
        if (!s.me || !s.space) router.replace("/");
      }, 50);
      return () => clearTimeout(t);
    }
  }, [pathname, router, me]);

  const inWorld = pathname.startsWith("/world") || pathname.startsWith("/museum");
  const showChrome = onboarded;

  return (
    <>
      {children}
      {showChrome && !inWorld && <BottomNav pathname={pathname} />}
      {showChrome && <TimerPill inWorld={inWorld} />}
      {showChrome && <ActionSheet />}
      <Toasts />
      <CelebrationLayer />
      <DevConsole />
    </>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const openSheet = useStore((s) => s.openSheet);
  return (
    <nav className="bottom-nav" aria-label="Main">
      {NAV.map((n) =>
        n.href === "+" ? (
          <button key="plus" className="nav-plus" onClick={() => openSheet("timer")} aria-label="Log activity">
            ＋
          </button>
        ) : (
          <Link key={n.href} href={n.href} className={`nav-item ${pathname === n.href ? "on" : ""}`}>
            <span>{n.icon}</span>
            <small>{n.label}</small>
          </Link>
        )
      )}
    </nav>
  );
}

function TimerPill({ inWorld }: { inWorld: boolean }) {
  const timer = useStore((s) => s.timer);
  const open = useStore((s) => s.openSheet);
  useTick(1000);
  if (!timer) return null;
  const m = KIND_META[timer.kind];
  return (
    <button className={`timer-pill ${inWorld ? "in-world" : ""}`} onClick={() => open("timer")} style={{ borderColor: m.color }}>
      <span className={timer.pausedAt ? "" : "pulse"} style={{ background: m.color }} />
      {m.icon} {fmtClock(timerElapsed(timer))}
      {timer.pausedAt ? " · paused" : ""}
    </button>
  );
}

function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            className="toast"
            style={{ borderColor: t.color ?? "var(--line)" }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            onClick={() => dismiss(t.id)}
          >
            <span>{t.icon}</span>
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

function CelebrationLayer() {
  const c = useStore((s) => s.celebrations[0]);
  const shift = useStore((s) => s.shiftCelebration);
  const ach = c?.achId ? ACH_BY_ID.get(c.achId) : undefined;
  const color = c?.who && c.who !== "together" ? PLAYER_META[c.who].color : "#c98f06";
  return (
    <AnimatePresence>
      {c && (
        <motion.div key={c.id} className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={shift}>
          <div className="celebrate-rays" style={{ ["--c" as string]: color }} />
          <Confetti />
          <motion.div className="celebrate-card" initial={{ scale: 0.6, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
            <div className="celebrate-3d">
              <CelebrationCanvas ach={ach} />
            </div>
            <p className="mono small" style={{ color }}>
              {c.kind === "achievement"
                ? `${ach ? TIER_COLORS[ach.tier].label : ""} medal unlocked${c.who === "together" ? " · together" : ""}`
                : c.kind === "level"
                  ? "level up"
                  : c.kind === "secret"
                    ? "secret discovered"
                    : "quest complete"}
            </p>
            <h2 className="display celebrate-title">{c.title}</h2>
            <p className="muted">{c.subtitle}</p>
            <p className="mono small muted">{fmtDate(new Date().toISOString())} · tap to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 });
  const colors = ["#f2c31a", "#2b5a9b", "#c0342a", "#ffffff", "#9abeef", "#eda6a0"];
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 10) * 0.08}s`,
            animationDuration: `${2.2 + (i % 7) * 0.3}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function DevConsole() {
  const open = useStore((s) => s.devConsole);
  const setOpen = useStore((s) => s.setDevConsole);
  const acts = useStore((s) => s.activities);
  const mode = useStore((s) => s.mode);
  const online = useStore((s) => s.online);
  const u = useStore((s) => s.universe);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="devconsole mono" initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}>
          <div className="row between">
            <b>~/adxd-universe $ tail -f events</b>
            <button className="link-btn" onClick={() => setOpen(false)}>
              [esc]
            </button>
          </div>
          <p>
            sync={mode} online=[{online.join(",")}] events={acts.length} xp.A={u.players.adarsh.xp} xp.D={u.players.devanshi.xp} medals.shared={u.unlocks.together.size}
          </p>
          <div className="devlog">
            {acts
              .slice(-40)
              .reverse()
              .map((a) => (
                <div key={a.id}>
                  <span className="muted">{a.at.slice(5, 16).replace("T", " ")}</span> <span style={{ color: PLAYER_META[a.player].color }}>{a.player}</span> {a.kind}
                  {a.minutes ? ` ${a.minutes}m` : ""} <span style={{ color: "#ffd166" }}>+{a.xp}</span>
                </div>
              ))}
            {!acts.length && <div className="muted">// no events yet. go live a little.</div>}
          </div>
          <p className="muted">// you found the developer console. pip says hi.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
