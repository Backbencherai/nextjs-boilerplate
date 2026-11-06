"use client";
/**
 * Roam: an endless, chunky cartoon open world. Huge streets and towers, traffic, people, parks and a
 * monument in every city centre. You are a tiny president: walk, run, take a cab, bus or metro, ski,
 * ride a jet ski or a boat, in first-person, third-person or drone view.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { useGame } from "@/lib/store";
import { Hero, type Anim } from "../three/Hero";
import { Monument, MONUMENT_RADIUS } from "./Monuments";
import { CELL, CHUNK, CHUNK_M, LOT, OCEAN_Z, ROAD, collide, genChunk, monumentFor, styleFor, type Box, type Chunk, type CityStyle } from "@/lib/roam/gen";
import { MODES, PLACES, searchPlaces, type Mode, type Place } from "@/lib/game/places";
import { LANDMARKS } from "@/lib/game/landmarks";
import * as E from "@/lib/game/engine";
import type { CharId } from "@/lib/game/rules";
import { rng } from "@/lib/game/world";

const input = { x: 0, y: 0, look: { dx: 0, dy: 0 }, keys: new Set<string>() };
type View = "third" | "first" | "drone";
const RIDES = ["cab", "bus", "ski", "jetski", "boat"] as const;
const isRide = (m: Mode): m is (typeof RIDES)[number] => (RIDES as readonly string[]).includes(m);
const MAIN: Mode[] = ["walk", "run", "cab", "bus", "metro"];
const FUN: Mode[] = ["ski", "jetski", "boat", "cruise"];
type Tel = { x: number; z: number; speed: number; heading: number; km: number };

const localHour = (lon: number) => {
  const d = new Date();
  return (((d.getUTCHours() + d.getUTCMinutes() / 60 + lon / 15) % 24) + 24) % 24;
};

export function Roam() {
  const nation = useGame((s) => s.nation);
  const cfg = useGame((s) => s.cfg);
  const payFare = useGame((s) => s.payFare);
  const buyGear = useGame((s) => s.buyGear);
  const visitLandmark = useGame((s) => s.visitLandmark);
  const toast = useGame((s) => s.toast);
  const start = useMemo<Place>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("lm");
      const p = q && PLACES.find((x) => x.id === "lm:" + q || x.id === q);
      if (p) return p;
    } catch {}
    return PLACES.find((p) => p.id === "lm:taj")!;
  }, []);
  const [place, setPlace] = useState<Place>(start);
  const [mode, setMode] = useState<Mode>("walk");
  const [view, setView] = useState<View>("third");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState<"" | "fun" | "metro" | "cruise">("");
  const [tunnel, setTunnel] = useState<{ p: Place; kind: "metro" | "cruise" } | null>(null);
  const tel = useRef<Tel>({ x: 0, z: 70, speed: 0, heading: 0, km: 0 });
  const [, bump] = useState(0);
  const style = useMemo(() => styleFor(place.name, place.tags), [place]);
  const monument = useMemo(() => monumentFor(place.id, place.name), [place]);
  const hour = localHour(place.lon);

  useEffect(() => {
    const t = setInterval(() => bump((x) => x + 1), 400);
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      input.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "v") setView((v) => (v === "third" ? "first" : v === "first" ? "drone" : "third"));
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const settle = () => {
    if (isRide(mode) && tel.current.km > 0.05) payFare(mode, tel.current.km);
    tel.current.km = 0;
  };
  const switchMode = (m: Mode) => {
    setSheet("");
    if (m === "metro") return setSheet("metro");
    if (m === "cruise") return setSheet("cruise");
    const need = E.RIDE_NEEDS[m as E.Ride];
    if (need && !nation?.gear?.includes(need)) return toast({ icon: E.GEAR[need].icon, title: `You need ${E.GEAR[need].name}. Buy it in Activities → Shop.`, kind: "info" });
    if ((m === "jetski" || m === "boat") && style.env !== "beach") return toast({ icon: "🌊", title: "Go to a beach or a port first (Activities → Go somewhere).", kind: "info" });
    settle();
    setMode(m);
  };
  const go = (p: Place) => {
    settle();
    tel.current = { x: 0, z: 70, speed: 0, heading: 0, km: 0 };
    setMode("walk");
    setPlace(p);
    setQ("");
    setSheet("");
  };
  const travel = (p: Place, kind: "metro" | "cruise") => {
    setSheet("");
    const km = kind === "metro" ? 2 + Math.round(Math.random() * 8) : 400;
    if (!payFare(kind, km)) return;
    setTunnel({ p, kind });
    setTimeout(() => {
      go(p);
      setTunnel(null);
    }, 3800);
  };

  const t = tel.current;
  const near = place.kind === "landmark" && Math.hypot(t.x, t.z) < (MONUMENT_RADIUS[monument ?? "generic"] ?? 20) + 60 ? LANDMARKS.find((l) => "lm:" + l.id === place.id) : undefined;
  const stamped = near && nation?.stamps.some((s) => s.id === "lm:" + near.id);
  const results = q ? searchPlaces(q, 10) : [];
  const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((((t.heading % 360) + 360) % 360) / 45) % 8];
  const sameCountry = PLACES.filter((p) => p.country === place.country && p.id !== place.id).slice(0, 10);
  const ports = PLACES.filter((p) => p.tags?.some((x) => x === "cruise" || x === "beach") && p.id !== place.id);

  return (
    <div className="xp roam">
      <Canvas
        className="xp-canvas"
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 60, near: 0.2, far: 2400, position: [0, 6, 80] }}
        onPointerDown={(e) => (e.target as Element).setPointerCapture?.(e.pointerId)}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === "touch") {
            input.look.dx += e.movementX;
            input.look.dy += e.movementY;
          }
        }}
      >
        <World key={place.id} style={style} monument={monument} label={place.name} hour={hour} mode={mode} view={view} character={(nation?.character ?? "scholar") as CharId} tel={tel} />
      </Canvas>

      <div className="xp-top">
        <Link href="/" className="hud-chip" aria-label="Back">
          ←
        </Link>
        <div className="xp-search">
          <input className="input" placeholder="Search a city, monument, beach or mountain…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && results[0] && go(results[0])} />
          {results.length > 0 && (
            <div className="xp-results">
              {results.map((p) => (
                <button key={p.id} onClick={() => go(p)}>
                  {p.icon} <b>{p.name}</b> <small>{p.country}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        {cfg?.mapsKey && (
          <a className="hud-chip" href={`/explore/?lm=${place.id.replace(/^lm:/, "")}`} title="Real 3D (Google)">
            🌐
          </a>
        )}
      </div>
      <div className="xp-info">
        <b>
          {place.icon} {place.name}
        </b>
        <small>
          {hour >= 6 && hour < 19 ? "☀️" : "🌙"} {String(Math.floor(hour)).padStart(2, "0")}:{String(Math.floor((hour % 1) * 60)).padStart(2, "0")} · {compass} · {Math.round(t.speed * 3.6)} km/h
          {isRide(mode) && ` · ${t.km.toFixed(2)} km · 🪙${Math.max(2, Math.round(t.km * MODES[mode].perKm))}`}
        </small>
      </div>
      <MiniMap tel={tel} style={style} />

      {near && (
        <div className="xp-near">
          <span>
            {near.icon} <b>{near.name}</b>
          </span>
          <small>{near.fact}</small>
          {nation && !stamped && (
            <button className="btn sm saffron" onClick={() => visitLandmark(near.id) && toast({ icon: "📸", title: `${near.name} stamp collected`, kind: "good" })}>
              📸 Collect stamp
            </button>
          )}
        </div>
      )}

      <div className="xp-modes">
        {MAIN.map((m) => (
          <button key={m} className={mode === m ? "on" : ""} onClick={() => switchMode(m)}>
            <span>{MODES[m].icon}</span>
            <small>{MODES[m].name}</small>
          </button>
        ))}
        <button className={FUN.includes(mode) ? "on" : ""} onClick={() => setSheet("fun")}>
          <span>🎒</span>
          <small>Activities</small>
        </button>
        <button onClick={() => setView((v) => (v === "third" ? "first" : v === "first" ? "drone" : "third"))}>
          <span>{view === "third" ? "🧍" : view === "first" ? "👁️" : "🚁"}</span>
          <small>{view === "third" ? "3rd person" : view === "first" ? "1st person" : "Drone"}</small>
        </button>
      </div>
      <Stick />
      <p className="xp-help">WASD / arrows · Shift run · drag to look · V changes camera</p>

      {sheet === "fun" && (
        <div className="back mid" onClick={() => setSheet("")}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h3 className="h3">🎒 Activities</h3>
            <div className="grid2">
              {FUN.map((m) => (
                <button key={m} className="btn" style={{ flexDirection: "column", minHeight: 70 }} onClick={() => switchMode(m)}>
                  <span style={{ fontSize: 24 }}>{MODES[m].icon}</span>
                  {MODES[m].name}
                </button>
              ))}
            </div>
            <h3 className="h3" style={{ marginTop: 14 }}>🛍️ Shop: supplies &amp; outfits</h3>
            {Object.entries(E.GEAR).map(([id, g]) => {
              const own = nation?.gear?.includes(id);
              return (
                <div key={id} className="ph-row">
                  <span style={{ fontSize: 22 }}>{g.icon}</span>
                  <div className="grow">
                    <b>{g.name}</b>
                    <small>{g.desc}</small>
                  </div>
                  <button className="btn sm" disabled={own || !nation} onClick={() => buyGear(id)}>
                    {own ? "✓ owned" : `🪙 ${g.cost}`}
                  </button>
                </div>
              );
            })}
            <h3 className="h3" style={{ marginTop: 14 }}>🏔️ Go somewhere</h3>
            <div className="row wrap" style={{ gap: 6 }}>
              {PLACES.filter((p) => p.kind === "adventure").map((p) => (
                <button key={p.id} className="chip" onClick={() => go(p)}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {(sheet === "metro" || sheet === "cruise") && (
        <div className="back mid" onClick={() => setSheet("")}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 className="h3">{sheet === "metro" ? "🚇 Metro / train: where to?" : "🚢 Cruise: choose a port"}</h3>
            {(sheet === "metro" ? sameCountry : ports).map((p) => (
              <button key={p.id} className="ph-row btn block" style={{ justifyContent: "space-between" }} onClick={() => travel(p, sheet)}>
                <span>
                  {p.icon} {p.name}
                </span>
                <small>{p.country}</small>
              </button>
            ))}
            {sheet === "metro" && !sameCountry.length && <p className="small muted">No other stations in {place.country}. Search a city instead.</p>}
          </div>
        </div>
      )}
      {tunnel && (
        <div className={`xp-tunnel ${tunnel.kind}`}>
          <div className="xp-tunnel-lights" />
          <b>{tunnel.kind === "metro" ? `🚇 Next station: ${tunnel.p.name}` : `🚢 Cruising to ${tunnel.p.name}`}</b>
          <small>{tunnel.kind === "metro" ? "Please mind the gap" : "Enjoy the ocean from the deck"}</small>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── the world ───────────────────────── */
function World({ style, monument, label, hour, mode, view, character, tel }: { style: CityStyle; monument: string | null; label: string; hour: number; mode: Mode; view: View; character: CharId; tel: React.RefObject<Tel> }) {
  const night = hour < 6 || hour >= 19;
  const dusk = !night && (hour < 7.5 || hour > 17.5);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const chunks = useMemo(() => {
    const out: Chunk[] = [];
    const R = 2;
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) out.push(cached(style, center[0] + i, center[1] + j));
    return out;
  }, [style, center]);
  const boxes = useMemo(() => chunks.flatMap((c) => c.boxes), [chunks]);
  const sun = useMemo<[number, number, number]>(() => {
    const a = ((hour - 6) / 12) * Math.PI;
    return [Math.cos(a) * 120, Math.max(12, Math.sin(a) * 160), 70];
  }, [hour]);
  const skyCol = night ? "#0c1430" : dusk ? "#f4b98a" : "#bfe3ff";

  return (
    <>
      <color attach="background" args={[skyCol]} />
      <fog attach="fog" args={[skyCol, 260, 900]} />
      {!night && <Sky sunPosition={sun} turbidity={4} rayleigh={dusk ? 2.5 : 0.9} mieCoefficient={0.004} distance={4000} />}
      {night && <Stars radius={900} depth={60} count={2500} factor={8} fade />}
      <hemisphereLight args={[night ? "#7f8fd0" : "#ffffff", night ? "#202436" : "#b9c2a6", night ? 0.55 : 1.05]} />
      <SunLight pos={sun} tel={tel} intensity={night ? 0.25 : dusk ? 1.6 : 2.6} color={dusk ? "#ffc28a" : night ? "#9fb0ff" : "#fff4e0"} />
      <Ground style={style} tel={tel} />
      {chunks.map((c) => (
        <ChunkMesh key={c.key} c={c} style={style} night={night} />
      ))}
      <Trees chunks={chunks} />
      <Lamps chunks={chunks} night={night} />
      {monument && <Monument id={monument} label={label} />}
      <Plaza style={style} monument={monument} night={night} />
      <Traffic style={style} tel={tel} night={night} />
      <People tel={tel} style={style} />
      <Clouds />
      <Player mode={mode} view={view} character={character} tel={tel} boxes={boxes} monumentR={monument ? MONUMENT_RADIUS[monument] ?? 12 : 0} style={style} onChunk={(c) => (c[0] !== center[0] || c[1] !== center[1]) && setCenter(c)} />
    </>
  );
}

const chunkCache = new Map<string, Chunk>();
function cached(style: CityStyle, cx: number, cz: number) {
  const k = `${style.key}|${style.env}|${cx},${cz}`;
  let c = chunkCache.get(k);
  if (!c) {
    c = genChunk(style, cx, cz);
    chunkCache.set(k, c);
    if (chunkCache.size > 200) chunkCache.delete(chunkCache.keys().next().value!);
  }
  return c;
}

function SunLight({ pos, tel, intensity, color }: { pos: [number, number, number]; tel: React.RefObject<Tel>; intensity: number; color: string }) {
  const l = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const t = tel.current!;
    if (!l.current) return;
    l.current.position.set(t.x + pos[0] * 0.5, pos[1] * 0.5, t.z + pos[2] * 0.5);
    l.current.target.position.set(t.x, 0, t.z);
    l.current.target.updateMatrixWorld();
  });
  return <directionalLight ref={l} intensity={intensity} color={color} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={400} shadow-bias={-0.0005} shadow-normalBias={0.05} />;
}

/* ───── textures: facade windows (day) + lit windows (night) ───── */
let facade: { map: THREE.Texture; glow: THREE.Texture } | null = null;
function facadeTex() {
  if (facade) return facade;
  const N = 8;
  const S = 64;
  const mk = (night: boolean) => {
    const c = document.createElement("canvas");
    c.width = c.height = N * S;
    const g = c.getContext("2d")!;
    g.fillStyle = night ? "#000" : "#ffffff";
    g.fillRect(0, 0, c.width, c.height);
    const r = rng("windows");
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const x = i * S + 12;
        const y = j * S + 14;
        if (night) {
          g.fillStyle = r() < 0.45 ? (r() < 0.5 ? "#ffd27a" : "#ffe9b0") : "#000";
          g.fillRect(x, y, S - 24, S - 26);
        } else {
          g.fillStyle = "#6d86a8";
          g.fillRect(x, y, S - 24, S - 26);
          g.fillStyle = "#a9c3e0";
          g.fillRect(x + 3, y + 3, (S - 24) * 0.35, S - 32);
          g.fillStyle = "#e9e4da";
          g.fillRect(x - 3, y + S - 26, S - 18, 4);
        }
      }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  facade = { map: mk(false), glow: mk(true) };
  return facade;
}

/* ───── one chunk = a handful of merged meshes ───── */
function buildChunk(c: Chunk, style: CityStyle) {
  const P: number[] = [];
  const Nn: number[] = [];
  const U: number[] = [];
  const C: number[] = [];
  const col = new THREE.Color();
  const quad = (a: number[], b: number[], cc: number[], d: number[], n: number[], uv: number[], color: THREE.Color) => {
    for (const [v, t] of [
      [a, [uv[0], uv[1]]],
      [b, [uv[2], uv[1]]],
      [cc, [uv[2], uv[3]]],
      [a, [uv[0], uv[1]]],
      [cc, [uv[2], uv[3]]],
      [d, [uv[0], uv[3]]],
    ] as [number[], number[]][]) {
      P.push(v[0], v[1], v[2]);
      Nn.push(n[0], n[1], n[2]);
      U.push(t[0], t[1]);
      C.push(color.r, color.g, color.b);
    }
  };
  const solid = [0.003, 0.003, 0.004, 0.004];
  const box = (x: number, y0: number, z: number, w: number, h: number, d: number, color: THREE.Color, windows: boolean) => {
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const z0 = z - d / 2;
    const z1 = z + d / 2;
    const y1 = y0 + h;
    const uv = (len: number) => (windows ? [0, y0 / 25.6, len / 32, y1 / 25.6] : solid);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], uv(w), color);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], uv(w), color);
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], uv(d), color);
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], uv(d), color);
    const roof = col.clone().multiplyScalar(0.82);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], solid, roof);
  };
  const pitched = (x: number, y: number, z: number, w: number, d: number, color: THREE.Color) => {
    const h = Math.min(w, d) * 0.35;
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const z0 = z - d / 2;
    const z1 = z + d / 2;
    quad([x0, y, z1], [x1, y, z1], [x1, y + h, z], [x0, y + h, z], [0, 0.7, 0.7], solid, color);
    quad([x1, y, z0], [x0, y, z0], [x0, y + h, z], [x1, y + h, z], [0, 0.7, -0.7], solid, color);
    for (const [xx, n] of [
      [x0, -1],
      [x1, 1],
    ] as [number, number][]) {
      P.push(xx, y, z0, xx, y, z1, xx, y + h, z);
      for (let k = 0; k < 3; k++) {
        Nn.push(n, 0, 0);
        U.push(0.003, 0.003);
        C.push(color.r, color.g, color.b);
      }
    }
  };
  const r = rng("roof:" + c.key);
  for (const b of c.boxes) {
    col.set(b.color);
    box(b.x, 0, b.z, b.w, b.h, b.d, col, true);
    // ground-floor shop band
    col.set(b.color).multiplyScalar(0.78);
    box(b.x, 0, b.z, b.w + 0.3, 3.4, b.d + 0.3, col, false);
    if (b.roof === 2) pitched(b.x, b.h, b.z, b.w + 0.6, b.d + 0.6, new THREE.Color(style.env === "snow" ? "#f4f6fa" : "#b5523b"));
    if (b.roof === 1) {
      const n = 1 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) box(b.x + (r() - 0.5) * b.w * 0.6, b.h, b.z + (r() - 0.5) * b.d * 0.6, 2 + r() * 3, 1.4 + r() * 2.5, 2 + r() * 3, new THREE.Color(r() < 0.5 ? "#9aa3ad" : "#c7ccd3"), false);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  g.computeBoundingSphere();

  // sidewalks / parks / lane markings
  const S: number[] = [];
  const SC: number[] = [];
  const slab = (x: number, z: number, w: number, d: number, h: number, color: string) => {
    const t = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    t.translate(x, h / 2, z);
    const p = t.getAttribute("position").array;
    const k = new THREE.Color(color);
    for (let i = 0; i < p.length; i++) S.push(p[i]);
    for (let i = 0; i < p.length / 3; i++) SC.push(k.r, k.g, k.b);
  };
  const walk = style.env === "snow" ? "#f2f5fa" : style.env === "forest" ? "#7a9a5a" : "#d9d4c9";
  for (const l of c.lots) {
    slab(l.x, l.z, LOT, LOT, 0.22, walk);
    if (l.park) slab(l.x, l.z, LOT - 4, LOT - 4, 0.3, style.env === "snow" ? "#ffffff" : "#86c46a");
  }
  const x0 = c.cx * CHUNK_M;
  const z0 = c.cz * CHUNK_M;
  if (style.env !== "forest")
    for (let i = 0; i < CHUNK; i++)
      for (let s = 0; s < CHUNK_M; s += 9) {
        const rx = x0 + i * CELL;
        const rz = z0 + i * CELL;
        const inPlazaX = Math.abs(rx) < 100;
        const inPlazaZ = Math.abs(rz) < 100;
        const zz = z0 + s;
        const xx = x0 + s;
        if (!(inPlazaX && Math.abs(zz) < 100) && !(style.env === "beach" && zz > OCEAN_Z - 40)) slab(rx, zz + 2, 0.25, 4, 0.03, "#f6f1e3");
        if (!(inPlazaZ && Math.abs(xx) < 100) && !(style.env === "beach" && rz > OCEAN_Z - 40)) slab(xx + 2, rz, 4, 0.25, 0.03, "#f6f1e3");
      }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(S, 3));
  sg.setAttribute("color", new THREE.Float32BufferAttribute(SC, 3));
  sg.computeVertexNormals();
  return { g, sg };
}

function ChunkMesh({ c, style, night }: { c: Chunk; style: CityStyle; night: boolean }) {
  const { g, sg } = useMemo(() => buildChunk(c, style), [c, style]);
  const tex = facadeTex();
  useEffect(
    () => () => {
      g.dispose();
      sg.dispose();
    },
    [g, sg]
  );
  return (
    <group>
      <mesh geometry={g} castShadow receiveShadow>
        <meshStandardMaterial vertexColors map={tex.map} emissiveMap={tex.glow} emissive="#ffcf7a" emissiveIntensity={night ? 1.1 : 0} roughness={0.85} />
      </mesh>
      <mesh geometry={sg} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
    </group>
  );
}

function Ground({ style, tel }: { style: CityStyle; tel: React.RefObject<Tel> }) {
  const g = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = tel.current!;
    if (g.current) g.current.position.set(Math.round(t.x / 50) * 50, 0, Math.round(t.z / 50) * 50);
    if (water.current) (water.current.material as THREE.MeshStandardMaterial).color.setHSL(0.55, 0.65, 0.52 + Math.sin(clock.elapsedTime * 0.8) * 0.02);
  });
  return (
    <>
      <group ref={g}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[2600, 2600]} />
          <meshStandardMaterial color={style.ground} roughness={0.95} />
        </mesh>
      </group>
      {/* the plaza around the monument */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[186, 186]} />
        <meshStandardMaterial color={style.env === "snow" ? "#eef2f7" : "#e8e0d0"} roughness={0.9} />
      </mesh>
      {style.env === "beach" && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, OCEAN_Z - 20]} receiveShadow>
            <planeGeometry args={[2600, 40]} />
            <meshStandardMaterial color="#f3dfae" roughness={1} />
          </mesh>
          <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, OCEAN_Z + 1300]} receiveShadow>
            <planeGeometry args={[2600, 2600, 1, 1]} />
            <meshStandardMaterial color="#38a8d8" roughness={0.12} metalness={0.2} />
          </mesh>
          <Waves />
        </>
      )}
    </>
  );
}

function Waves() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 80;
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => [((i * 97) % 600) - 300, OCEAN_Z + 4 + ((i * 53) % 260), (i * 0.37) % 6]), []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    seeds.forEach(([x, z, p], i) => {
      const s = 0.6 + 0.4 * Math.sin(clock.elapsedTime * 1.2 + p);
      m.makeScale(6 * s, 1, 0.5).setPosition(x + Math.sin(clock.elapsedTime * 0.3 + p) * 4, 0.12, z);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <boxGeometry args={[1, 0.05, 1]} />
      <meshBasicMaterial color="#e9f8ff" transparent opacity={0.85} />
    </instancedMesh>
  );
}

/* ───── the plaza: lawns, flowers, benches and a ring of trees ───── */
function Plaza({ style, monument, night }: { style: CityStyle; monument: string | null; night: boolean }) {
  const lawn = style.env === "snow" ? "#f7f9fc" : "#7cc35e";
  const beds = ["#ff6b8b", "#ffd166", "#f78c3b", "#c77dff"];
  const ring = useMemo(() => {
    const out: [number, number][] = [];
    for (let k = -84; k <= 84; k += 14) out.push([k, -86], [k, 86], [-86, k], [86, k]);
    return out;
  }, []);
  const quads: [number, number][] = [
    [-52, -52],
    [52, -52],
    [-52, 52],
    [52, 52],
  ];
  return (
    <group>
      {quads.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <mesh position={[x, 0.12, z]} receiveShadow>
            <boxGeometry args={[52, 0.24, 52]} />
            <meshStandardMaterial color={lawn} roughness={1} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[x + (i % 2 ? 14 : -14), 0.35, z + (i < 2 ? 14 : -14)]} castShadow>
              <cylinderGeometry args={[3.2, 3.4, 0.5, 18]} />
              <meshStandardMaterial color={beds[(i + (x > 0 ? 1 : 0)) % 4]} roughness={0.9} />
            </mesh>
          ))}
          {/* benches facing the monument */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[x + sd * 8, 0, z - Math.sign(z) * 27.5]}>
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[3, 0.12, 0.7]} />
                <meshStandardMaterial color="#a0673f" />
              </mesh>
              <mesh position={[0, 0.85, Math.sign(z) * 0.3]} castShadow>
                <boxGeometry args={[3, 0.6, 0.1]} />
                <meshStandardMaterial color="#a0673f" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {ring.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 2.6, 6]} />
            <meshStandardMaterial color="#8a5a3b" />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            {style.env === "snow" ? <coneGeometry args={[2, 6, 7]} /> : <icosahedronGeometry args={[2.3, 1]} />}
            <meshStandardMaterial color={style.env === "snow" ? "#2f6b45" : i % 5 === 0 ? "#f6a6c1" : "#4f9d4a"} flatShading />
          </mesh>
        </group>
      ))}
      {/* floodlights so the monument glows at night */}
      {night && monument && (
        <>
          {quads.map(([x, z]) => (
            <pointLight key={`l${x}${z}`} position={[x * 0.6, 8, z * 0.6]} intensity={2600} distance={220} decay={1.6} color="#ffe2b0" />
          ))}
          <pointLight position={[0, 90, 60]} intensity={5000} distance={300} decay={1.4} color="#cfd8ff" />
        </>
      )}
    </group>
  );
}

/* ───── trees & lamps (instanced) ───── */
function Trees({ chunks }: { chunks: Chunk[] }) {
  const trees = useMemo(() => chunks.flatMap((c) => c.trees), [chunks]);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const round = useRef<THREE.InstancedMesh>(null);
  const pine = useRef<THREE.InstancedMesh>(null);
  const palm = useRef<THREE.InstancedMesh>(null);
  const MAX = 4000;
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;
    for (const t of trees.slice(0, MAX)) {
      const r = rng(`${t.x},${t.z}`);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
      const tall = t.kind === 3 ? 7 : t.kind === 1 ? 2 : 2.6;
      m.compose(new THREE.Vector3(t.x, (tall * t.s) / 2, t.z), q, new THREE.Vector3(t.s, t.s * tall, t.s));
      trunk.current!.setMatrixAt(a++, m);
      if (t.kind === 1) {
        m.compose(new THREE.Vector3(t.x, 2 * t.s + 3.4 * t.s, t.z), q, new THREE.Vector3(t.s, t.s, t.s));
        pine.current!.setMatrixAt(b, m);
        pine.current!.setColorAt(b++, col.setHSL(0.36 + r() * 0.04, 0.45, 0.28 + r() * 0.08));
      } else if (t.kind === 3) {
        m.compose(new THREE.Vector3(t.x, 7 * t.s, t.z), q, new THREE.Vector3(t.s * 1.3, t.s * 0.45, t.s * 1.3));
        palm.current!.setMatrixAt(c, m);
        palm.current!.setColorAt(c++, col.setHSL(0.3, 0.55, 0.4 + r() * 0.08));
      } else {
        m.compose(new THREE.Vector3(t.x, 2.6 * t.s + 2.2 * t.s, t.z), q, new THREE.Vector3(t.s, t.s * (0.9 + r() * 0.3), t.s));
        round.current!.setMatrixAt(d, m);
        round.current!.setColorAt(d++, t.kind === 2 ? col.setHSL(0.94, 0.6, 0.78) : col.setHSL(0.27 + r() * 0.08, 0.5, 0.38 + r() * 0.1));
      }
    }
    for (const [ref, n] of [
      [trunk, a],
      [pine, b],
      [palm, c],
      [round, d],
    ] as [React.RefObject<THREE.InstancedMesh>, number][]) {
      ref.current!.count = n;
      ref.current!.instanceMatrix.needsUpdate = true;
      if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
      ref.current!.computeBoundingSphere();
    }
  }, [trees]);
  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, MAX]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 1, 6]} />
        <meshStandardMaterial color="#8a5a3b" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={round} args={[undefined, undefined, MAX]} castShadow receiveShadow>
        <icosahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={pine} args={[undefined, undefined, MAX]} castShadow>
        <coneGeometry args={[2.1, 6.5, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={palm} args={[undefined, undefined, MAX]} castShadow>
        <coneGeometry args={[3, 1.6, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  );
}

function Lamps({ chunks, night }: { chunks: Chunk[]; night: boolean }) {
  const lamps = useMemo(() => chunks.flatMap((c) => c.lamps), [chunks]);
  const pole = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const MAX = 1200;
  useEffect(() => {
    const m = new THREE.Matrix4();
    lamps.slice(0, MAX).forEach((l, i) => {
      pole.current!.setMatrixAt(i, m.makeTranslation(l.x, 2.6, l.z));
      head.current!.setMatrixAt(i, m.makeTranslation(l.x, 5.3, l.z));
    });
    for (const r of [pole, head]) {
      r.current!.count = Math.min(MAX, lamps.length);
      r.current!.instanceMatrix.needsUpdate = true;
      r.current!.computeBoundingSphere();
    }
  }, [lamps]);
  return (
    <>
      <instancedMesh ref={pole} args={[undefined, undefined, MAX]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 5.2, 6]} />
        <meshStandardMaterial color="#3b4150" />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, MAX]}>
        <sphereGeometry args={[0.38, 10, 8]} />
        <meshStandardMaterial color="#fff3c9" emissive="#ffcf6a" emissiveIntensity={night ? 2.2 : 0.1} />
      </instancedMesh>
    </>
  );
}

function Clouds() {
  const items = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: ((i * 173) % 1400) - 700, z: ((i * 311) % 1400) - 700, y: 140 + (i % 4) * 25, s: 10 + (i % 5) * 4 })), []);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.position.x = (g.current.position.x + dt * 3) % 400;
  });
  return (
    <group ref={g}>
      {items.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[
            [0, 0, 0, 1.2],
            [1.2, -0.2, 0.2, 0.9],
            [-1.1, -0.25, -0.1, 0.85],
            [0.4, 0.5, -0.3, 0.8],
          ].map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]}>
              <sphereGeometry args={[r, 12, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ───── traffic: cartoon cars on every street around you ───── */
const CAR_COLS = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#ffffff", "#9b59b6", "#e67e22", "#34495e", "#1abc9c", "#f78fb3"];
function Traffic({ style, tel, night }: { style: CityStyle; tel: React.RefObject<Tel>; night: boolean }) {
  const N = style.env === "forest" ? 6 : 38;
  const body = useRef<THREE.InstancedMesh>(null);
  const cabin = useRef<THREE.InstancedMesh>(null);
  const wheel = useRef<THREE.InstancedMesh>(null);
  const lights = useRef<THREE.InstancedMesh>(null);
  const cars = useMemo(() => Array.from({ length: N }, (_, i) => ({ axis: i % 2, line: 0, dir: 1, t: 0, speed: 9 + (i % 5) * 2.5, init: false, color: CAR_COLS[i % CAR_COLS.length] })), [N]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useEffect(() => {
    const c = new THREE.Color();
    cars.forEach((car, i) => body.current!.setColorAt(i, c.set(car.color)));
    body.current!.instanceColor!.needsUpdate = true;
  }, [cars]);
  const respawn = (car: (typeof cars)[number], px: number, pz: number, r: () => number) => {
    const base = car.axis ? pz : px;
    let k = Math.round(base / CELL) + Math.floor(r() * 9) - 4;
    if (Math.abs(k * CELL) <= 100) k = k >= 0 ? 3 : -3;
    car.line = k * CELL;
    car.dir = r() < 0.5 ? 1 : -1;
    const along = car.axis ? px : pz;
    car.t = along + (r() - 0.5) * 500;
    car.init = true;
  };
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const t = tel.current!;
    const r = Math.random;
    cars.forEach((car, i) => {
      if (!car.init) respawn(car, t.x, t.z, r);
      const along = car.axis ? t.x : t.z;
      if (Math.abs(car.t - along) > 330) respawn(car, t.x, t.z, r);
      const lane = car.dir * 3.4;
      let x = car.axis ? car.t : car.line + lane;
      let z = car.axis ? car.line - lane : car.t;
      // stop for the player standing in front
      const ahead = car.axis ? (t.x - x) * car.dir : (t.z - z) * car.dir;
      const side = car.axis ? Math.abs(t.z - z) : Math.abs(t.x - x);
      const blocked = ahead > 0 && ahead < 9 && side < 2.2;
      if (!blocked) car.t += car.dir * car.speed * dt;
      // keep out of the monument plaza and the sea
      if (Math.abs(car.axis ? car.line : car.line) < 100 && Math.abs(car.t) < 100) car.t += car.dir * 200;
      if (style.env === "beach" && (car.axis ? car.line : car.t) > OCEAN_Z - 40) respawn(car, t.x, Math.min(t.z, OCEAN_Z - 200), r);
      x = car.axis ? car.t : car.line + lane;
      z = car.axis ? car.line - lane : car.t;
      q.setFromAxisAngle(up, car.axis ? (car.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : car.dir > 0 ? Math.PI : 0);
      m.compose(v.set(x, 0.75, z), q, one);
      body.current!.setMatrixAt(i, m);
      m.compose(v.set(x, 1.55, z), q, one);
      cabin.current!.setMatrixAt(i, m);
      lights.current!.setMatrixAt(i, m.compose(v.set(x, 0.85, z), q, one));
      const fx = car.axis ? 0 : 1;
      for (let w = 0; w < 4; w++) {
        const ox = (w % 2 ? 0.9 : -0.9) * (car.axis ? 0 : 1) + (w < 2 ? 1.35 : -1.35) * (car.axis ? 1 : 0);
        const oz = (w % 2 ? 0.9 : -0.9) * (car.axis ? 1 : 0) + (w < 2 ? 1.35 : -1.35) * fx;
        m.compose(v.set(x + ox, 0.38, z + oz), q, one);
        wheel.current!.setMatrixAt(i * 4 + w, m);
      }
    });
    for (const rf of [body, cabin, wheel, lights]) {
      rf.current!.instanceMatrix.needsUpdate = true;
      rf.current!.computeBoundingSphere();
    }
  });
  return (
    <>
      <instancedMesh ref={body} args={[undefined, undefined, N]} castShadow>
        <boxGeometry args={[1.85, 0.8, 4.3]} />
        <meshStandardMaterial roughness={0.35} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={cabin} args={[undefined, undefined, N]} castShadow>
        <boxGeometry args={[1.6, 0.75, 2.2]} />
        <meshStandardMaterial color="#2b3a4f" roughness={0.1} metalness={0.5} />
      </instancedMesh>
      <instancedMesh ref={lights} args={[undefined, undefined, N]}>
        <boxGeometry args={[1.5, 0.18, 4.36]} />
        <meshStandardMaterial color="#fff6d0" emissive="#fff0b0" emissiveIntensity={night ? 1.6 : 0.2} />
      </instancedMesh>
      <instancedMesh ref={wheel} args={[undefined, undefined, N * 4]}>
        <boxGeometry args={[0.32, 0.76, 0.76]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.9} />
      </instancedMesh>
    </>
  );
}

/* ───── citizens: the same characters as you, walking the sidewalks ───── */
const CAST: CharId[] = ["knight", "barbarian", "mage", "rogue", "hooded", "scholar", "explorer"];
function People({ tel, style }: { tel: React.RefObject<Tel>; style: CityStyle }) {
  const N = 22;
  const refs = useRef<(THREE.Group | null)[]>([]);
  const ps = useMemo(() => Array.from({ length: N }, (_, i) => ({ axis: i % 2, line: 0, side: 1, dir: 1, t: 0, init: false, sp: 1.2 + (i % 4) * 0.2, who: CAST[i % CAST.length], h: 1.6 + (i % 5) * 0.06 })), []);
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const t = tel.current!;
    ps.forEach((p, i) => {
      const g = refs.current[i];
      if (!g) return;
      const along = p.axis ? t.x : t.z;
      if (!p.init || Math.abs(p.t - along) > 140) {
        const base = p.axis ? t.z : t.x;
        p.line = (Math.round(base / CELL) + Math.floor(Math.random() * 5) - 2) * CELL;
        p.side = Math.random() < 0.5 ? 1 : -1;
        p.dir = Math.random() < 0.5 ? 1 : -1;
        p.t = along + (Math.random() - 0.5) * 220;
        p.init = true;
      }
      p.t += p.dir * p.sp * dt;
      const off = p.side * (ROAD / 2 + 1.4);
      const x = p.axis ? p.t : p.line + off;
      const z = p.axis ? p.line + off : p.t;
      const hidden = (style.env === "beach" && z > OCEAN_Z - 10) || (Math.abs(x) < 93 && Math.abs(z) < 93 && Math.hypot(x, z) < 40);
      g.visible = !hidden;
      g.position.set(x, 0.22, z);
      g.rotation.y = p.axis ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : p.dir > 0 ? 0 : Math.PI;
    });
  });
  return (
    <>
      {ps.map((p, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <Hero character={p.who} anim="walk" height={p.h} />
        </group>
      ))}
    </>
  );
}

/* ───── you ───── */
function Player({ mode, view, character, tel, boxes, monumentR, style, onChunk }: { mode: Mode; view: View; character: CharId; tel: React.RefObject<Tel>; boxes: Box[]; monumentR: number; style: CityStyle; onChunk: (c: [number, number]) => void }) {
  const { camera } = useThree();
  const body = useRef<THREE.Group>(null);
  const spawnZ = monumentR >= 36 ? monumentR + 110 : monumentR + 48;
  const s = useRef({ x: 0, z: spawnZ, y: 0, yaw: 0, pitch: -0.04, speed: 0, face: 0 });
  const [anim, setAnim] = useState<Anim>("idle");
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const lastChunk = useRef("0,0");

  useFrame((_, dtRaw) => {
    const st = s.current;
    const dt = Math.min(0.05, dtRaw);
    const k = input.keys;
    st.yaw -= input.look.dx * 0.0045;
    st.pitch = Math.max(-1.25, Math.min(0.75, st.pitch - input.look.dy * 0.0035));
    input.look.dx = input.look.dy = 0;
    const ride = isRide(mode);
    const fwd = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0) - input.y;
    const side = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0) + input.x;
    const running = mode === "run" || k.has("shift");
    const top = ride ? MODES[mode].speed : running ? MODES.run.speed : MODES.walk.speed;
    let mx = 0;
    let mz = 0;
    if (ride) {
      st.speed += (Math.max(-0.35, Math.min(1, fwd)) * top - st.speed) * Math.min(1, dt * (fwd ? 0.9 : 1.4));
      st.yaw -= side * dt * 1.7 * Math.min(1, Math.abs(st.speed) / 5) * Math.sign(st.speed || 1);
      st.face = st.yaw;
      mx = -Math.sin(st.yaw) * st.speed * dt;
      mz = -Math.cos(st.yaw) * st.speed * dt;
    } else {
      const len = Math.hypot(fwd, side);
      st.speed += ((len > 0.05 ? top * Math.min(1, len) : 0) - st.speed) * Math.min(1, dt * 8);
      if (len > 0.05) {
        const a = st.yaw + Math.atan2(-side, fwd);
        mx = -Math.sin(a) * st.speed * dt;
        mz = -Math.cos(a) * st.speed * dt;
        const d = Math.atan2(Math.sin(a - st.face), Math.cos(a - st.face));
        st.face += d * Math.min(1, dt * 10);
      }
    }
    let nx = st.x + mx;
    let nz = st.z + mz;
    const rad = ride ? (mode === "bus" ? 2 : 1.3) : 0.4;
    // buildings
    const near = boxes.filter((b) => Math.abs(b.x - nx) < 60 && Math.abs(b.z - nz) < 60);
    const [cx, cz, hit] = collide(near, nx, nz, rad);
    nx = cx;
    nz = cz;
    // monument footprint
    const dm = Math.hypot(nx, nz);
    if (monumentR && dm < monumentR + rad) {
      nx = (nx / (dm || 1)) * (monumentR + rad);
      nz = (nz / (dm || 1)) * (monumentR + rad);
    }
    // water rules
    if (style.env === "beach") {
      const boat = mode === "jetski" || mode === "boat";
      if (boat && nz < OCEAN_Z + 3) nz = OCEAN_Z + 3;
      if (!boat && nz > OCEAN_Z + 4) nz = OCEAN_Z + 4;
    }
    if (hit && ride) st.speed *= 0.5;
    const moved = Math.hypot(nx - st.x, nz - st.z);
    if (ride) tel.current!.km += moved / 1000;
    st.x = nx;
    st.z = nz;
    const water = style.env === "beach" && st.z > OCEAN_Z;
    st.y = water ? 0.2 + Math.sin(performance.now() / 400) * 0.08 : 0;

    if (body.current) {
      body.current.position.set(st.x, st.y, st.z);
      body.current.rotation.y = st.face;
      body.current.visible = view !== "first";
    }
    const a2: Anim = ride ? (mode === "jetski" ? "sit" : "idle") : st.speed < 0.3 ? "idle" : st.speed > 5 ? "run" : "walk";
    if (a2 !== anim) setAnim(a2);

    // cameras
    if (view === "first") {
      const eye = mode === "bus" ? 2.6 : ride ? 1.3 : 1.6;
      camera.position.set(st.x, st.y + eye, st.z);
      camera.rotation.set(st.pitch, st.yaw, 0, "YXZ");
    } else {
      const dist = view === "drone" ? 34 : ride ? (mode === "bus" ? 15 : 10) : 6.5;
      const pitch = view === "drone" ? Math.min(-0.45, st.pitch - 0.4) : st.pitch;
      const cx2 = st.x + Math.sin(st.yaw) * Math.cos(pitch) * dist;
      const cz2 = st.z + Math.cos(st.yaw) * Math.cos(pitch) * dist;
      const cy2 = st.y + (view === "drone" ? 4 : ride ? 3.2 : 2.2) - Math.sin(pitch) * dist;
      camera.position.lerp(tmp.set(cx2, Math.max(cy2, 0.8), cz2), Math.min(1, dt * 9));
      // aim a little above your head so towers and monuments fill the screen
      camera.lookAt(st.x - Math.sin(st.yaw) * 4, st.y + (view === "drone" ? 1 : ride ? 2.4 : 2.1), st.z - Math.cos(st.yaw) * 4);
    }
    const t = tel.current!;
    t.x = st.x;
    t.z = st.z;
    t.speed = Math.abs(st.speed);
    t.heading = ((Math.atan2(-Math.sin(st.yaw), -Math.cos(st.yaw)) * 180) / Math.PI + 360) % 360;
    const ck = `${Math.floor(st.x / CHUNK_M)},${Math.floor(st.z / CHUNK_M)}`;
    if (ck !== lastChunk.current) {
      lastChunk.current = ck;
      onChunk([Math.floor(st.x / CHUNK_M), Math.floor(st.z / CHUNK_M)]);
    }
  });

  return (
    <group ref={body}>
      <Suspense fallback={null}>
        {mode === "cab" ? (
          <Car color="#f6c21c" taxi />
        ) : mode === "bus" ? (
          <BusModel />
        ) : mode === "jetski" ? (
          <JetSki character={character} />
        ) : mode === "boat" ? (
          <BoatModel character={character} />
        ) : (
          <group>
            <Hero character={character} anim={anim} height={1.7} />
            {mode === "ski" &&
              [-0.13, 0.13].map((x) => (
                <mesh key={x} position={[x, 0.03, 0]}>
                  <boxGeometry args={[0.09, 0.03, 1.7]} />
                  <meshStandardMaterial color="#d23a3a" />
                </mesh>
              ))}
          </group>
        )}
      </Suspense>
    </group>
  );
}

function Car({ color, taxi }: { color: string; taxi?: boolean }) {
  return (
    <group rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.85, 0.8, 4.3]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.55, -0.1]} castShadow>
        <boxGeometry args={[1.6, 0.75, 2.2]} />
        <meshStandardMaterial color="#2b3a4f" roughness={0.1} metalness={0.5} />
      </mesh>
      {taxi && (
        <mesh position={[0, 2.05, -0.1]}>
          <boxGeometry args={[0.8, 0.25, 0.4]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff3b0" emissiveIntensity={0.6} />
        </mesh>
      )}
      {[-1.35, 1.35].map((z) =>
        [-0.9, 0.9].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 14]} />
            <meshStandardMaterial color="#1c1c22" />
          </mesh>
        ))
      )}
    </group>
  );
}
function BusModel() {
  return (
    <group>
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[2.5, 2.8, 11]} />
        <meshStandardMaterial color="#d6352b" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[2.54, 0.9, 10.2]} />
        <meshStandardMaterial color="#26384d" roughness={0.1} metalness={0.5} />
      </mesh>
      {[-3.8, 3.6].map((z) =>
        [-1.2, 1.2].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.5, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.35, 16]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))
      )}
    </group>
  );
}
function JetSki({ character }: { character: CharId }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} scale={[0.62, 0.3, 1.5]} castShadow>
        <sphereGeometry args={[1, 32, 16]} />
        <meshPhysicalMaterial color="#f2c31a" roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0.2, 0]} scale={[0.64, 0.12, 1.52]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="#1b1f2a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, -0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* life jacket */}
      <mesh position={[0, 1.05, 0.3]}>
        <boxGeometry args={[0.55, 0.5, 0.36]} />
        <meshStandardMaterial color="#ff6a00" roughness={0.6} />
      </mesh>
      <group position={[0, 0.45, 0.3]} scale={0.85}>
        <Hero character={character} anim="sit" height={1.7} />
      </group>
    </group>
  );
}
function BoatModel({ character }: { character: CharId }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} scale={[1.4, 0.6, 3.8]} castShadow>
        <sphereGeometry args={[1, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.2} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.35, 3.7, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshStandardMaterial color="#c8935e" />
      </mesh>
      <mesh position={[0, 1.25, -0.8]} castShadow>
        <boxGeometry args={[1.5, 1, 1.3]} />
        <meshStandardMaterial color="#1f3a93" roughness={0.2} metalness={0.4} />
      </mesh>
      <group position={[0, 0.55, 1.1]}>
        <Hero character={character} anim="idle" height={1.7} />
      </group>
    </group>
  );
}

/* ───── HUD helpers ───── */
function MiniMap({ tel, style }: { tel: React.RefObject<Tel>; style: CityStyle }) {
  const t = tel.current!;
  const S = 110;
  const scale = S / 400; // 400 m across
  const lines: number[] = [];
  for (let k = -5; k <= 5; k++) lines.push(Math.round(t.x / CELL + k) * CELL);
  const lz: number[] = [];
  for (let k = -5; k <= 5; k++) lz.push(Math.round(t.z / CELL + k) * CELL);
  const toX = (x: number) => S / 2 + (x - t.x) * scale;
  const toY = (z: number) => S / 2 + (z - t.z) * scale;
  return (
    <svg className="mini" width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <rect width={S} height={S} fill={style.env === "snow" ? "#eef2f7" : "#e8e2d4"} />
      {style.env === "beach" && <rect x={0} y={toY(OCEAN_Z)} width={S} height={S} fill="#7cc8ea" />}
      {lines.map((x) => (
        <rect key={"x" + x} x={toX(x) - 2} y={0} width={4} height={S} fill="#5b6170" />
      ))}
      {lz.map((z) => (
        <rect key={"z" + z} x={0} y={toY(z) - 2} width={S} height={4} fill="#5b6170" />
      ))}
      <circle cx={toX(0)} cy={toY(0)} r={6} fill="#ff9933" stroke="#16161d" strokeWidth={1.5} />
      <g transform={`translate(${S / 2},${S / 2}) rotate(${t.heading})`}>
        <path d="M0,-7 L5,6 L0,3 L-5,6 Z" fill="#1f3a93" stroke="#fff" strokeWidth={1} />
      </g>
    </svg>
  );
}

function Stick() {
  const [k, setK] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    input.x = x;
    input.y = y;
    setK({ x, y });
  };
  const end = () => {
    input.x = input.y = 0;
    setK({ x: 0, y: 0 });
  };
  return (
    <div
      ref={base}
      className="xp-stick"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <i style={{ transform: `translate(${k.x * 34}px, ${k.y * 34}px)` }} />
    </div>
  );
}
