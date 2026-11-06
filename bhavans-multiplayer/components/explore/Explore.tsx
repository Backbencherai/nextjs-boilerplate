"use client";
/**
 * Explore the REAL world: Google Photorealistic 3D Tiles (photogrammetry of real cities, monuments, trees and
 * streets) streamed around you. Walk, run, take a cab, a bus or the metro, in first or third person.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { TilesRenderer } from "3d-tiles-renderer";
import { GoogleCloudAuthPlugin, GLTFExtensionsPlugin, ReorientationPlugin, TilesFadePlugin } from "3d-tiles-renderer/plugins";
import Link from "next/link";
import { useGame } from "@/lib/store";
import { Hero, type Anim } from "../three/Hero";
import { LANDMARKS } from "@/lib/game/landmarks";
import { MODES, PLACES, searchPlaces, type Mode, type Place } from "@/lib/game/places";
import * as E from "@/lib/game/engine";
import { distanceKm } from "@/lib/game/world";
import type { CharId } from "@/lib/game/rules";

/* shared, mutable input (keyboard + touch) read every frame */
const input = { x: 0, y: 0, look: { dx: 0, dy: 0 }, keys: new Set<string>(), zoom: 1 };

/* Camera gestures: drag (mouse or finger) to orbit, pinch or wheel to zoom. Works on iPhone, where movementX is 0. */
const ptrs = new Map<number, { x: number; y: number }>();
let pinch = 0;
function gestureHandlers() {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const last = ptrs.get(e.pointerId);
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) input.zoom = Math.max(0.45, Math.min(3, input.zoom * (pinch / d)));
        pinch = d;
        return;
      }
      input.look.dx += dx;
      input.look.dy += dy;
    },
    onPointerUp: (e: React.PointerEvent) => {
      ptrs.delete(e.pointerId);
      pinch = 0;
    },
    onPointerCancel: (e: React.PointerEvent) => {
      ptrs.delete(e.pointerId);
      pinch = 0;
    },
    onWheel: (e: React.WheelEvent) => {
      input.zoom = Math.max(0.45, Math.min(3, input.zoom * (e.deltaY > 0 ? 1.1 : 0.9)));
    },
  };
}
type Telemetry = { lat: number; lon: number; speed: number; heading: number; ready: boolean; km: number };

const R2D = 180 / Math.PI;
const RIDES = ["cab", "bus", "ski", "jetski", "boat"] as const;
const isRide = (m: Mode): m is (typeof RIDES)[number] => (RIDES as readonly string[]).includes(m);
const MAIN: Mode[] = ["walk", "run", "cab", "bus", "metro"];
const FUN: Mode[] = ["ski", "jetski", "boat", "cruise"];

function localHour(lon: number) {
  const d = new Date();
  return (((d.getUTCHours() + d.getUTCMinutes() / 60 + lon / 15) % 24) + 24) % 24;
}

export function Explore() {
  const cfg = useGame((s) => s.cfg);
  const nation = useGame((s) => s.nation);
  const payFare = useGame((s) => s.payFare);
  const buyGear = useGame((s) => s.buyGear);
  const [fun, setFun] = useState(false);
  const [cruise, setCruise] = useState(false);
  const visitLandmark = useGame((s) => s.visitLandmark);
  const toast = useGame((s) => s.toast);
  const start = useMemo<Place>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("lm");
      const lm = q && PLACES.find((p) => p.id === "lm:" + q);
      if (lm) return lm;
    } catch {}
    return PLACES.find((p) => p.id === "lm:taj")!;
  }, []);
  const [place, setPlace] = useState<Place>(start);
  const [mode, setMode] = useState<Mode>("walk");
  const [view, setView] = useState<"third" | "first">("third");
  const [q, setQ] = useState("");
  const [geo, setGeo] = useState<Place[]>([]);
  const [metro, setMetro] = useState(false);
  const [tunnel, setTunnel] = useState<Place | null>(null);
  const [tunnelKind, setTunnelKind] = useState<"metro" | "cruise">("metro");
  const [attr, setAttr] = useState<{ text: string; logo?: string }>({ text: "" });
  const tel = useRef<Telemetry>({ lat: start.lat, lon: start.lon, speed: 0, heading: 0, ready: false, km: 0 });
  const [, bump] = useState(0);
  const testSet = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("tileset") ?? "";
    } catch {
      return "";
    }
  }, []);
  const key = cfg?.mapsKey ?? "";

  useEffect(() => {
    const t = setInterval(() => bump((x) => x + 1), 400);
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      input.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "v") setView((v) => (v === "third" ? "first" : "third"));
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

  /* change transport: pay the fare for the ride you are leaving */
  const switchMode = (m: Mode) => {
    setFun(false);
    if (m === "metro") return setMetro(true);
    if (m === "cruise") return setCruise(true);
    const need = E.RIDE_NEEDS[m as E.Ride];
    if (need && !nation?.gear?.includes(need)) return toast({ icon: E.GEAR[need].icon, title: `You need ${E.GEAR[need].name}. Buy it in the Shop.`, kind: "info" });
    if (isRide(mode) && tel.current.km > 0.05) payFare(mode, tel.current.km);
    tel.current.km = 0;
    setMode(m);
  };
  const go = (p: Place) => {
    if (isRide(mode) && tel.current.km > 0.05) payFare(mode, tel.current.km);
    tel.current = { lat: p.lat, lon: p.lon, speed: 0, heading: 0, ready: false, km: 0 };
    setMode("walk");
    setPlace(p);
    setQ("");
    setGeo([]);
  };
  const rideMetro = (p: Place, how: "metro" | "cruise" = "metro") => {
    setMetro(false);
    setCruise(false);
    const km = distanceKm(tel.current, p);
    if (!payFare(how, km)) return;
    setTunnelKind(how);
    setTunnel(p);
    setTimeout(() => {
      go(p);
      setTunnel(null);
    }, 4200);
  };
  const googleSearch = async () => {
    if (!q.trim()) return;
    try {
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`);
      const j = (await r.json()) as { status: string; results: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[] };
      if (j.status !== "OK") return toast({ icon: "🔎", title: j.status === "REQUEST_DENIED" ? "Turn on the Geocoding API for your Google key to search any address." : "No place found.", kind: "info" });
      setGeo(j.results.slice(0, 5).map((x, i) => ({ id: "g" + i, name: x.formatted_address, country: "", lat: x.geometry.location.lat, lon: x.geometry.location.lng, kind: "search", icon: "📍" })));
    } catch {
      toast({ icon: "🔎", title: "Search is offline.", kind: "bad" });
    }
  };

  if (!cfg) return <div className="blank">Loading…</div>;
  if (!key && !testSet) return <NoKey />;

  const t = tel.current;
  const hour = localHour(t.lon);
  const near = LANDMARKS.map((l) => ({ l, d: distanceKm(t, l) })).filter((x) => x.d < 0.45).sort((a, b) => a.d - b.d)[0];
  const stamped = near && nation?.stamps.some((s) => s.id === "lm:" + near.l.id);
  const results = q ? searchPlaces(q) : [];
  const nearby = PLACES.filter((p) => p.id !== place.id && distanceKm(t, p) < 60).slice(0, 8);
  const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((t.heading % 360) + 360) % 360 / 45) % 8];

  return (
    <div className="xp">
      <Canvas
        className="xp-canvas"
        dpr={[1, 1.5]}
        gl={{ antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" }}
        camera={{ fov: 62, near: 0.3, far: 160000, position: [0, 300, 300] }}
        {...gestureHandlers()}
      >
        <World key={place.id + key} place={place} mapsKey={key} testSet={testSet} mode={mode} view={view} character={(nation?.character ?? "scholar") as CharId} tel={tel} onAttr={setAttr} hour={hour} />
      </Canvas>

      {/* HUD */}
      <div className="xp-top">
        <Link href="/" className="hud-chip" aria-label="Back">
          ←
        </Link>
        <div className="xp-search">
          <input
            className="input"
            placeholder="Search any city or monument…"
            value={q}
            onChange={(e) => (setQ(e.target.value), setGeo([]))}
            onKeyDown={(e) => e.key === "Enter" && (results[0] && !geo.length ? go(results[0]) : googleSearch())}
          />
          {(results.length > 0 || geo.length > 0 || q) && (
            <div className="xp-results">
              {[...results, ...geo].map((p) => (
                <button key={p.id} onClick={() => go(p)}>
                  {p.icon} <b>{p.name}</b> <small>{p.country}</small>
                </button>
              ))}
              {q && (
                <button onClick={googleSearch}>
                  🔎 <b>Search the whole world for “{q}”</b>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="xp-info">
        <b>
          {place.icon} {place.name}
        </b>
        <small>
          {hour >= 6 && hour < 19 ? "☀️" : "🌙"} {String(Math.floor(hour)).padStart(2, "0")}:{String(Math.floor((hour % 1) * 60)).padStart(2, "0")} local · {compass} · {Math.round(t.speed * 3.6)} km/h
          {isRide(mode) && ` · ${t.km.toFixed(2)} km · fare ${Math.max(2, Math.round(t.km * MODES[mode].perKm))}`}
        </small>
      </div>
      {!t.ready && <div className="xp-loading">Streaming the real {place.name}…</div>}

      {near && (
        <div className="xp-near">
          <span>
            {near.l.icon} You are at <b>{near.l.name}</b>
          </span>
          <small>{near.l.fact}</small>
          {nation && !stamped && (
            <button className="btn sm saffron" onClick={() => visitLandmark(near.l.id) && toast({ icon: "📸", title: `${near.l.name} stamp collected`, kind: "good" })}>
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
        <button className={FUN.includes(mode) ? "on" : ""} onClick={() => setFun(true)}>
          <span>🎒</span>
          <small>Activities</small>
        </button>
        <button onClick={() => setView((v) => (v === "third" ? "first" : "third"))}>
          <span>{view === "third" ? "👁️" : "🎥"}</span>
          <small>{view === "third" ? "1st person" : "3rd person"}</small>
        </button>
      </div>
      <Joystick />
      <p className="xp-help">WASD / arrows to move · Shift to run · drag to look · V switches view</p>

      {metro && (
        <div className="back mid" onClick={() => setMetro(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 className="h3">🚇 Metro: where to?</h3>
            {nearby.length ? (
              nearby.map((p) => {
                const km = distanceKm(t, p);
                return (
                  <button key={p.id} className="ph-row btn block" style={{ justifyContent: "space-between" }} onClick={() => rideMetro(p)}>
                    <span>
                      {p.icon} {p.name}
                    </span>
                    <small>
                      {km.toFixed(1)} km · {Math.max(2, Math.round(km * 1.5))} coins
                    </small>
                  </button>
                );
              })
            ) : (
              <p className="small muted">No metro stations near here. Search another city to travel there.</p>
            )}
          </div>
        </div>
      )}
      {tunnel && (
        <div className={`xp-tunnel ${tunnelKind}`}>
          <div className="xp-tunnel-lights" />
          {tunnelKind === "metro" ? (
            <>
              <b>🚇 Next station: {tunnel.name}</b>
              <small>Please mind the gap</small>
            </>
          ) : (
            <>
              <b>🚢 Cruising to {tunnel.name}</b>
              <small>Enjoy the ocean view from the deck</small>
            </>
          )}
        </div>
      )}
      {fun && (
        <div className="back mid" onClick={() => setFun(false)}>
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
              {PLACES.filter((p) => p.kind === "adventure")
                .slice(0, 29)
                .map((p) => (
                  <button key={p.id} className="chip" onClick={() => (setFun(false), go(p))}>
                    {p.icon} {p.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      {cruise && (
        <div className="back mid" onClick={() => setCruise(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 className="h3">🚢 Cruise: choose a port</h3>
            {PLACES.filter((p) => p.tags?.some((x) => x === "cruise" || x === "beach") && p.id !== place.id).map((p) => {
              const km = distanceKm(t, p);
              return (
                <button key={p.id} className="ph-row btn block" style={{ justifyContent: "space-between" }} onClick={() => rideMetro(p, "cruise")}>
                  <span>
                    {p.icon} {p.name}
                  </span>
                  <small>
                    {Math.round(km).toLocaleString()} km · {Math.max(2, Math.round(km * 0.4))} coins
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="xp-attr">
        {attr.logo && <img src={attr.logo} alt="Google" height={14} />}
        <span>{attr.text}{mode === "cab" ? " · Car: Ferrari 458 by vicent091036 (CC BY)" : ""}</span>
      </div>
    </div>
  );
}

/* ───────── the real world ───────── */
function World({ place, mapsKey, testSet, mode, view, character, tel, onAttr, hour }: { place: Place; mapsKey: string; testSet?: string; mode: Mode; view: "third" | "first"; character: CharId; tel: React.RefObject<Telemetry>; onAttr: (a: { text: string; logo?: string }) => void; hour: number }) {
  const { camera, gl, scene } = useThree();
  const tiles = useMemo(() => {
    const t = new TilesRenderer(testSet || undefined);
    if (!testSet) t.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: mapsKey, autoRefreshToken: true }));
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    t.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: draco }));
    // (TileCompressionPlugin is skipped: quantised positions break ground raycasts)
    t.registerPlugin(new TilesFadePlugin());
    t.registerPlugin(testSet ? new ReorientationPlugin({ up: "+z", recenter: true }) : new ReorientationPlugin({ lat: place.lat / R2D, lon: place.lon / R2D, height: 0, up: "+y", recenter: true }));
    t.errorTarget = /Mobi|Android/i.test(navigator.userAgent) ? 20 : 12;
    t.lruCache.minSize = 900;
    t.lruCache.maxSize = 1600;
    // scanned meshes can face either way: make them solid from both sides so you can stand and collide on them
    t.addEventListener("load-model", (e: { scene?: THREE.Object3D }) => {
      e.scene?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) m.side = THREE.DoubleSide;
      });
    });
    return t;
  }, [place, mapsKey, testSet]);

  useEffect(() => {
    scene.add(tiles.group);
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, gl);
    const iv = setInterval(() => {
      const a = tiles.getAttributions();
      onAttr({ text: a.filter((x) => x.type === "string").map((x) => x.value as string).join(" · "), logo: (a.find((x) => x.type === "image")?.value as HTMLImageElement | undefined)?.src });
    }, 2000);
    return () => {
      clearInterval(iv);
      scene.remove(tiles.group);
      tiles.dispose();
    };
  }, [tiles, camera, gl, scene, onAttr]);

  useFrame(() => {
    camera.updateMatrixWorld();
    tiles.setResolutionFromRenderer(camera, gl);
    tiles.update();
  });

  const night = hour < 6 || hour >= 19;
  const elev = Math.sin(((hour - 6) / 12) * Math.PI);
  const sun: [number, number, number] = [Math.cos(((hour - 6) / 12) * Math.PI) * 100, elev * 100, -40];
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = night ? 0.55 : hour < 7.5 || hour > 17.5 ? 0.8 : 1.05;
  }, [gl, night, hour]);

  return (
    <>
      <Sky sunPosition={sun} turbidity={6} rayleigh={night ? 0.2 : 1.6} mieCoefficient={0.004} mieDirectionalG={0.85} distance={150000} />
      {night && <Stars radius={20000} depth={100} count={3000} factor={60} fade />}
      <fog attach="fog" args={[night ? "#0b1020" : "#c9d8e6", 2500, 30000]} />
      <ambientLight intensity={night ? 0.9 : 1.2} />
      <hemisphereLight args={[night ? "#8aa0ff" : "#ffffff", "#5a4a3a", night ? 0.8 : 0.6]} />
      <directionalLight position={sun} intensity={night ? 0.2 : 2} />
      <Player tiles={tiles} mode={mode} view={view} character={character} tel={tel} place={place} spawn={testSet ? 0 : place.kind === "landmark" ? 170 : 0} />
    </>
  );
}

/* ───────── you: walk, run or drive across the photogrammetry ───────── */
function Player({ tiles, mode, view, character, tel, place, spawn }: { spawn: number; tiles: TilesRenderer; mode: Mode; view: "third" | "first"; character: CharId; tel: React.RefObject<Telemetry>; place: Place }) {
  const body = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const st = useRef({
    pos: new THREE.Vector3(0, 0, spawn),
    yaw: 0, // 0 = facing south (-z); landmarks spawn 170 m north of the monument, looking at it
    pitch: -0.12,
    speed: 0,
    grounded: false,
    frame: 0,
    probe: 0,
    slope: 0,
  });
  const [anim, setAnim] = useState<Anim>("idle");
  const ray = useMemo(() => {
    const r = new THREE.Raycaster();
    (r as THREE.Raycaster & { firstHitOnly: boolean }).firstHitOnly = true;
    return r;
  }, []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const groundAt = (x: number, z: number, from: number) => {
    ray.set(tmp.set(x, from, z), down);
    ray.far = from + 4000;
    const hit = ray.intersectObject(tiles.group, true)[0];
    return hit ? hit.point.y : null;
  };

  useFrame((_, dtRaw) => {
    const s = st.current;
    const dt = Math.min(0.05, dtRaw);
    s.frame++;
    const k = input.keys;
    // look
    if (k.has("q")) s.yaw += dt * 1.8;
    if (k.has("e")) s.yaw -= dt * 1.8;
    s.yaw -= input.look.dx * 0.0042;
    s.pitch = Math.max(-1.2, Math.min(0.9, s.pitch - input.look.dy * 0.0032));
    input.look.dx = input.look.dy = 0;

    // first contact with the ground (tiles stream in for a few seconds)
    if (!s.grounded) {
      if (s.frame % 10 === 0) {
        const g = groundAt(s.pos.x, s.pos.z, 3000);
        if (g !== null) {
          s.pos.y = g;
          s.grounded = true;
          tel.current!.ready = true;
        }
      }
      camera.position.set(s.pos.x, 420, s.pos.z + 420);
      camera.lookAt(s.pos.x, 0, s.pos.z);
      return;
    }

    const vehicle = isRide(mode);
    const fwdIn = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0) + -input.y;
    const sideIn = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0) + input.x;
    const running = mode === "run" || k.has("shift");
    const top = vehicle ? MODES[mode].speed : running ? MODES.run.speed : MODES.walk.speed;

    let mx = 0;
    let mz = 0;
    if (vehicle) {
      // drive: throttle and steering, with momentum
      s.speed += (Math.max(-0.4, Math.min(1, fwdIn)) * top - s.speed) * Math.min(1, dt * (fwdIn ? 0.9 : mode === "ski" ? 0.15 : 1.6));
      if (mode === "ski") s.speed = Math.max(-2, Math.min(26, s.speed + s.slope * 9.8 * dt)); // gravity pulls you downhill
      s.yaw -= sideIn * dt * 1.6 * Math.min(1, Math.abs(s.speed) / 6) * Math.sign(s.speed || 1);
      mx = -Math.sin(s.yaw) * s.speed * dt;
      mz = -Math.cos(s.yaw) * s.speed * dt;
    } else {
      const len = Math.hypot(fwdIn, sideIn);
      const target = len > 0.05 ? top * Math.min(1, len) : 0;
      s.speed += (target - s.speed) * Math.min(1, dt * 8);
      if (len > 0.05) {
        const a = s.yaw + Math.atan2(-sideIn, fwdIn);
        mx = -Math.sin(a) * s.speed * dt;
        mz = -Math.cos(a) * s.speed * dt;
        if (body.current) {
          const want = a + Math.PI; // the character model looks down +z
          const cur = body.current.rotation.y;
          const d = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
          body.current.rotation.y = cur + d * Math.min(1, dt * 10);
        }
      }
    }

    // collisions: walls block you, gentle slopes and steps are climbed
    if (mx || mz) {
      const len = Math.hypot(mx, mz);
      ray.set(tmp.set(s.pos.x, s.pos.y + (vehicle ? 1.0 : 0.9), s.pos.z), new THREE.Vector3(mx / len, 0, mz / len));
      ray.far = len + (vehicle ? 2.2 : 0.5);
      const wall = ray.intersectObject(tiles.group, true)[0];
      if (!wall) {
        const g = groundAt(s.pos.x + mx, s.pos.z + mz, s.pos.y + 2.5);
        if (g !== null && g - s.pos.y < (vehicle ? 1.2 : 0.9)) {
          s.pos.x += mx;
          s.pos.z += mz;
          s.slope = (s.pos.y - g) / Math.max(len, 0.01);
          s.pos.y += (g - s.pos.y) * Math.min(1, dt * 12);
          if (vehicle) tel.current!.km += len / 1000;
        } else s.speed *= 0.3;
      } else s.speed *= vehicle ? -0.2 : 0;
    } else if (s.frame % 6 === 0) {
      const g = groundAt(s.pos.x, s.pos.z, s.pos.y + 2.5);
      if (g !== null && Math.abs(g - s.pos.y) < 3) s.pos.y = g;
    }

    if (body.current) {
      body.current.position.copy(s.pos);
      if (vehicle) body.current.rotation.y = s.yaw;
      body.current.visible = view === "third";
    }
    const a2: Anim = mode === "ski" ? "idle" : vehicle || s.speed < 0.3 ? "idle" : s.speed > 5 ? "run" : "walk";
    if (a2 !== anim) setAnim(a2);

    // camera
    const eye = mode === "bus" ? 2.6 : mode === "ski" ? 1.62 : vehicle ? 1.3 : 1.62;
    if (view === "first") {
      camera.position.set(s.pos.x, s.pos.y + eye, s.pos.z);
      camera.rotation.set(s.pitch, s.yaw, 0, "YXZ");
    } else {
      const dist = (vehicle ? (mode === "bus" ? 16 : 10) : 7.5) * input.zoom; // far enough that the world towers over you
      const h = vehicle ? 3.6 : 2.6;
      const cx = s.pos.x + Math.sin(s.yaw) * Math.cos(s.pitch) * dist;
      const cz = s.pos.z + Math.cos(s.yaw) * Math.cos(s.pitch) * dist;
      const cy = s.pos.y + h - Math.sin(s.pitch) * dist;
      camera.position.lerp(tmp.set(cx, Math.max(cy, s.pos.y + 0.6), cz), Math.min(1, dt * 10));
      camera.lookAt(s.pos.x, s.pos.y + (vehicle ? 1.5 : 1.45), s.pos.z);
    }

    // telemetry for the HUD
    const t = tel.current!;
    const lat0 = place.lat;
    // Google frame after reorientation: +y up, +z north, +x west
    t.lat = lat0 + s.pos.z / 111_320;
    t.lon = place.lon - s.pos.x / (111_320 * Math.cos(lat0 / R2D));
    t.speed = Math.abs(s.speed);
    t.heading = ((Math.atan2(Math.sin(s.yaw), -Math.cos(s.yaw)) * R2D) % 360 + 360) % 360;
  });

  return (
    <group ref={body}>
      <Suspense fallback={null}>
        {mode === "cab" ? (
          <RealCar />
        ) : mode === "bus" ? (
          <Bus />
        ) : mode === "jetski" ? (
          <JetSki character={character} />
        ) : mode === "boat" ? (
          <Boat character={character} />
        ) : mode === "ski" ? (
          <group>
            <Hero character={character} anim="idle" height={1.75} />
            {[-0.14, 0.14].map((x) => (
              <mesh key={x} position={[x, 0.03, 0]}>
                <boxGeometry args={[0.1, 0.03, 1.7]} />
                <meshStandardMaterial color="#d23a3a" roughness={0.3} />
              </mesh>
            ))}
          </group>
        ) : (
          <Hero character={character} anim={anim} height={1.75} />
        )}
      </Suspense>
    </group>
  );
}

/** A real, PBR car model (Ferrari 458 by vicent091036, CC BY) painted as a yellow cab. */
function RealCar() {
  const { scene } = useGLTF("/models/car.glb", "/draco/");
  const car = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
      if (m && /body/i.test(o.name + m.name)) {
        const nm = m.clone();
        nm.color = new THREE.Color("#f2b705");
        (o as THREE.Mesh).material = nm;
      }
    });
    return c;
  }, [scene]);
  return <primitive object={car} rotation={[0, Math.PI, 0]} />;
}

function JetSki({ character }: { character: CharId }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} scale={[0.6, 0.35, 1.5]}>
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial color="#f2c31a" roughness={0.25} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.85, 0.2]}>
        <boxGeometry args={[0.4, 0.2, 0.9]} />
        <meshStandardMaterial color="#16161d" />
      </mesh>
      <group position={[0, 0.55, 0.3]} scale={0.85}>
        <Hero character={character} anim="sit" height={1.75} />
      </group>
    </group>
  );
}
function Boat({ character }: { character: CharId }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} scale={[1.3, 0.55, 3.6]}>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 3.5, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshStandardMaterial color="#b98a5a" />
      </mesh>
      <mesh position={[0, 1.2, -0.6]}>
        <boxGeometry args={[1.4, 0.9, 1.2]} />
        <meshStandardMaterial color="#1f3a93" roughness={0.2} metalness={0.4} />
      </mesh>
      <group position={[0, 0.55, 1.1]}>
        <Hero character={character} anim="idle" height={1.75} />
      </group>
    </group>
  );
}

function Bus() {
  return (
    <group>
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[2.5, 2.7, 11]} />
        <meshStandardMaterial color="#c8102e" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[2.54, 0.9, 10.4]} />
        <meshStandardMaterial color="#1d2a38" roughness={0.1} metalness={0.6} />
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

function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
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
    setKnob({ x, y });
  };
  const end = () => {
    input.x = input.y = 0;
    setKnob({ x: 0, y: 0 });
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
      <i style={{ transform: `translate(${knob.x * 34}px, ${knob.y * 34}px)` }} />
    </div>
  );
}

function NoKey() {
  return (
    <main className="page">
      <h1 className="page-title">🌍 Explore the real world</h1>
      <div className="card stack">
        <p>
          Explore streams Google&apos;s <b>Photorealistic 3D Tiles</b>: real 3D scans of whole cities, monuments, trees and streets. Walk, take a cab, a bus or the metro around the real Taj Mahal, Qutub Minar, Paris or Tokyo.
        </p>
        <p className="small">To switch it on, the game owner adds a free Google key once:</p>
        <ol className="small">
          <li>console.cloud.google.com → create a project → enable <b>Map Tiles API</b> (and <b>Geocoding API</b> for searching any address).</li>
          <li>Credentials → Create API key. Restrict it to your website domain.</li>
          <li>
            Vercel → your project → Settings → Environment Variables → <code>GOOGLE_MAPS_KEY</code> = your key → Redeploy.
          </li>
        </ol>
        <p className="tiny muted">Google gives a monthly free allowance; a billing account is required by Google to create the key.</p>
        <Link className="btn" href="/">
          ← Back
        </Link>
      </div>
    </main>
  );
}
