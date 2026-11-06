"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ISLANDS, ZONES, SPAWN, BRIDGES, CAR_SPOT, islandAt, reachableIslands } from "./layout";
import { buildStates, bridgeProgress } from "@/lib/game/builds";
import type { Ctl } from "./World";
import { useStore } from "@/lib/store";
import { PLAYER_META, partnerOf, type PlayerId } from "@/lib/types";
import { levelFromXp } from "@/lib/game/xp";
import { dayKey, timeAgo } from "@/lib/game/dates";
import { WorldLoader } from "../intro/WorldLoader";

const World = dynamic(() => import("./World"), { ssr: false, loading: () => <WorldLoader /> });

const NOTES_READ = "adxd:notesRead";

export function WorldPage() {
  const me = useStore((s) => s.me) as PlayerId;
  const u = useStore((s) => s.universe);
  const acts = useStore((s) => s.activities);
  const online = useStore((s) => s.online);
  const openSheet = useStore((s) => s.openSheet);
  const log = useStore((s) => s.log);
  const toast = useStore((s) => s.toast);
  const router = useRouter();
  const ctl = useRef<Ctl>({ joy: { x: 0, y: 0, active: false }, target: null, teleport: null, zoom: 1, driving: false });
  const [driving, setDriving] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [hint, setHint] = useState(true);
  const [readAt, setReadAt] = useState<string>("");

  useEffect(() => {
    try {
      setReadAt(localStorage.getItem(NOTES_READ) || "");
    } catch {}
    const t = setTimeout(() => setHint(false), 7000);
    return () => clearTimeout(t);
  }, []);

  const partner = partnerOf(me);
  const notes = useMemo(() => acts.filter((a) => a.kind === "note"), [acts]);
  const unread = notes.some((n) => n.player === partner && n.at > readAt);
  const zone = ZONES.find((z) => z.id === zoneId) ?? null;
  const p = u.players[me];
  const lv = levelFromXp(p.xp);
  const today = dayKey();
  const coinsToday = p.days.get(today)?.coins ?? 0;

  const act = () => {
    if (!zone) return;
    const a = zone.action;
    if (a.type === "timer") openSheet("timer", a.kind);
    else if (a.type === "sheet") openSheet(a.tab);
    else if (a.type === "route") router.push(a.href);
    else if (a.type === "notes") openNotes();
    else if (a.type === "drive") {
      ctl.current.driving = true;
      setDriving(true);
      toast({ icon: "🚗", text: "Vroom! You're driving — twice as fast." });
    }
    else if (a.type === "water") {
      log("water", { data: { glasses: 1 } });
      toast({ icon: "💧", text: `Glass logged · ${(p.days.get(today)?.water ?? 0) + 1} today` });
    }
  };
  const openNotes = () => {
    setNotesOpen(true);
    const now = new Date().toISOString();
    try {
      localStorage.setItem(NOTES_READ, now);
    } catch {}
    setTimeout(() => setReadAt(now), 1500);
  };

  return (
    <div className="world-root">
      <World ctl={ctl} onZone={setZoneId} onNotes={openNotes} unreadNotes={unread} driving={driving} />

      {/* top HUD */}
      <div className="hud-top">
        <Link href="/" className="hud-chip" aria-label="Back to home">
          ←
        </Link>
        <div className="hud-chip hud-me" style={{ borderColor: PLAYER_META[me].color }}>
          <b>{PLAYER_META[me].name}</b>
          <span>Lv {lv.level}</span>
          <i className="hud-xp">
            <i style={{ width: `${lv.pct * 100}%`, background: PLAYER_META[me].color }} />
          </i>
        </div>
        <div className="grow" />
        <div className="hud-chip" title="Coins collected today">
          🪙 {coinsToday}/6
        </div>
        <div className="hud-chip" title={online.includes(partner) ? "Online now" : "Offline"}>
          <span className={online.includes(partner) ? "dot on" : "dot"} />
          {PLAYER_META[partner].short}
        </div>
        <button className="hud-chip" onClick={() => setBuildOpen(true)} aria-label="Island projects">
          🔨
        </button>
        <button className="hud-chip" onClick={() => setMapOpen(true)} aria-label="Open map">
          🗺️
        </button>
      </div>

      <div className="hud-zoom">
        <button onClick={() => (ctl.current.zoom = Math.max(0.55, ctl.current.zoom - 0.2))} aria-label="Zoom in">
          +
        </button>
        <button onClick={() => (ctl.current.zoom = Math.min(1.8, ctl.current.zoom + 0.2))} aria-label="Zoom out">
          −
        </button>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.div className="hud-hint" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onClick={() => setHint(false)}>
            Tap the ground to walk · drag the stick · WASD on desktop. Walk up to a place to use it. Some things here are hiding secrets…
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zone && (
          <motion.div
            key={zone.id}
            className="zone-card"
            initial={{ y: 40, opacity: 0, rotate: -1 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="zone-icon">{zone.icon}</div>
            <div className="zone-text">
              <b>{zone.name}</b>
              <span>{zone.blurb}</span>
            </div>
            <button className="btn btn-primary" onClick={act}>
              {zone.cta}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {driving && (
        <button
          className="btn btn-primary hop-out"
          onClick={() => {
            ctl.current.driving = false;
            setDriving(false);
          }}
        >
          🚗 Hop out
        </button>
      )}
      <Joystick ctl={ctl} />
      <AnimatePresence>{buildOpen && <BuildPanel onClose={() => setBuildOpen(false)} />}</AnimatePresence>

      <AnimatePresence>
        {mapOpen && (
          <MiniMap
            me={me}
            onClose={() => setMapOpen(false)}
            onTravel={(x, z) => {
              ctl.current.teleport = [x, z];
              setMapOpen(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{notesOpen && <NotesPanel me={me} onClose={() => setNotesOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function Joystick({ ctl }: { ctl: React.MutableRefObject<Ctl> }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const id = useRef<number | null>(null);
  const R = 46;
  const move = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2);
    let dy = cy - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    ctl.current.joy = { x: dx / R, y: dy / R, active: true };
  };
  const end = () => {
    id.current = null;
    setKnob({ x: 0, y: 0 });
    ctl.current.joy = { x: 0, y: 0, active: false };
  };
  return (
    <div
      ref={base}
      className="joystick"
      onPointerDown={(e) => {
        id.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => id.current === e.pointerId && move(e.clientX, e.clientY)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function MiniMap({ me, onClose, onTravel }: { me: PlayerId; onClose: () => void; onTravel: (x: number, z: number) => void }) {
  const u = useStore((s) => s.universe);
  const bp = bridgeProgress(u);
  const reach = reachableIslands(me, bp.map((x) => x >= 1));
  const S = 6; // px per unit
  const W = 52 * S;
  const tx = (x: number) => W / 2 + x * S;
  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="paper-card map-card" initial={{ scale: 0.9, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h3>Fast travel</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <svg viewBox={`0 0 ${W} ${W}`} className="map-svg">
          {BRIDGES.map((b, i) => (
            <line key={i} x1={tx(b.from[0])} y1={tx(b.from[1])} x2={tx(b.to[0])} y2={tx(b.to[1])} stroke={bp[i] >= 1 ? "#a06d43" : "#14140f"} strokeWidth={bp[i] >= 1 ? 8 : 2.5} strokeDasharray={bp[i] >= 1 ? undefined : "6 6"} />
          ))}
          {ISLANDS.map((i) => (
            <g key={i.id}>
              <circle cx={tx(i.x)} cy={tx(i.z)} r={i.r * S} fill={!reach.has(i.id) ? "#e6e3da" : i.id === me ? PLAYER_META[me].soft : "#d6e8b4"} stroke="#14140f" strokeWidth={2.5} strokeDasharray={reach.has(i.id) ? undefined : "5 5"} />
              {!reach.has(i.id) && (
                <text x={tx(i.x)} y={tx(i.z) + 7} textAnchor="middle" fontSize={20}>
                  🔒
                </text>
              )}
              <text x={tx(i.x)} y={tx(i.z) + i.r * S + 14} textAnchor="middle" className="map-label">
                {i.name}
              </text>
            </g>
          ))}
          {ZONES.filter((z) => reach.has(islandAt(z.door[0], z.door[1]) ?? "") && (z.id !== "garage" || buildStates(u).find((b) => b.def.id === "car")?.done)).map((z) => (
            <g key={z.id} onClick={() => onTravel(z.door[0], z.door[1])} style={{ cursor: "pointer" }}>
              <circle cx={tx(z.door[0])} cy={tx(z.door[1])} r={11} fill="#fffaf0" stroke="#3a2a1f" strokeWidth={1.5} />
              <text x={tx(z.door[0])} y={tx(z.door[1]) + 5} textAnchor="middle" fontSize={12}>
                {z.icon}
              </text>
            </g>
          ))}
          <g onClick={() => onTravel(SPAWN[me][0], SPAWN[me][1])} style={{ cursor: "pointer" }}>
            <circle cx={tx(SPAWN[me][0])} cy={tx(SPAWN[me][1])} r={9} fill={PLAYER_META[me].color} />
          </g>
        </svg>
        <p className="muted small">Tap a place to travel there instantly. Dashed islands unlock when their bridge is built — open 🔨 to see how.</p>
      </motion.div>
    </motion.div>
  );
}

function NotesPanel({ me, onClose }: { me: PlayerId; onClose: () => void }) {
  const acts = useStore((s) => s.activities);
  const log = useStore((s) => s.log);
  const [text, setText] = useState("");
  const notes = useMemo(() => acts.filter((a) => a.kind === "note").slice(-30).reverse(), [acts]);
  const partner = partnerOf(me);
  const send = () => {
    const t = text.trim().slice(0, 280);
    if (!t) return;
    log("note", { data: { text: t, to: partner } });
    setText("");
  };
  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="paper-card notes-card" initial={{ y: 30 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h3>🍾 Bottle Dock</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="note-compose">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={280} placeholder={`Write something for ${PLAYER_META[partner].name}…`} rows={3} />
          <button className="btn btn-primary" onClick={send} disabled={!text.trim()}>
            Cast the bottle
          </button>
        </div>
        <div className="note-list">
          {notes.length === 0 && <p className="muted">No bottles yet. Be the first to send one.</p>}
          {notes.map((n) => (
            <div key={n.id} className={`note ${n.player === me ? "mine" : ""}`} style={{ borderColor: PLAYER_META[n.player].color }}>
              <p>{String(n.data.text ?? "")}</p>
              <small>
                {PLAYER_META[n.player].name} · {timeAgo(n.at)}
              </small>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BuildPanel({ onClose }: { onClose: () => void }) {
  const u = useStore((s) => s.universe);
  const list = buildStates(u);
  const done = list.filter((b) => b.done).length;
  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="paper-card" initial={{ y: 30 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h3>🔨 Island projects</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="muted small">
          Your world is built by real life. {done} of {list.length} built. Bridges appear plank by plank as you make progress.
        </p>
        <div className="builds">
          {list.map((b) => (
            <div key={b.def.id} className={`build ${b.done ? "done" : ""}`}>
              <span className="build-icon">{b.def.icon}</span>
              <div className="grow">
                <b>{b.def.name}</b>
                <small>{b.done ? "Built ✓" : b.def.how}</small>
                {!b.done && (
                  <div className="quest-bar">
                    <i style={{ width: `${b.pct * 100}%` }} />
                  </div>
                )}
              </div>
              {!b.done && <span className="mono small">{Math.round(b.pct * 100)}%</span>}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
