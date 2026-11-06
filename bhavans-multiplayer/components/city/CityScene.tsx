"use client";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, MapControls, Sparkles, Stars } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Ink } from "../three/Ink";
import { Crowd } from "../three/Crowd";
import { Hero, type Anim } from "../three/Hero";
import { BuildingModel, Scaffold } from "../three/Buildings";
import { Asset } from "../three/assets";
import type { BType, CharId } from "@/lib/game/rules";
import type { CalType } from "@/lib/game/world";

export type TileView = [number, number, BType, number, number]; // x, y, type, level, 0 ok | 1 damaged | 2 building
export interface CityProps {
  tiles: TileView[];
  land: number;
  accent: string;
  character: CharId;
  pop: number;
  selected?: { x: number; y: number } | null;
  onTile?: (x: number, y: number) => void;
  progress?: Record<string, number>; // "x,y" -> 0..1 construction progress
  weather?: CalType[];
  meteor?: "none" | "alert" | "strike";
  heroAnim?: Anim;
  compact?: boolean;
  hour?: number; // local time in the country, 0..24 (day, dusk, night)
  flag?: string; // ISO alpha-2 code: the real national flag on the pole
  title?: string;
}

/** 0 = deep night, 1 = full day, with dawn and dusk in between. */
export function daylight(h: number) {
  if (h >= 7 && h < 18) return 1;
  if (h >= 5 && h < 7) return (h - 5) / 2;
  if (h >= 18 && h < 20) return 1 - (h - 18) / 2;
  return 0;
}
const mix = (a: string, b: string, t: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

const T = 2; // world units per tile

export default function CityScene(props: CityProps) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 16, 16], fov: 38 }} gl={{ antialias: true }} style={{ touchAction: "none" }}>
      <Scene {...props} />
    </Canvas>
  );
}

function Scene({ tiles, land, accent, character, pop, selected, onTile, progress = {}, weather = [], meteor = "none", heroAnim = "idle", compact, hour = 12, flag, title }: CityProps) {
  const day = daylight(hour);
  const dusk = day > 0 && day < 1;
  const night = day < 0.35;
  const half = (land * T) / 2;
  const centre = (x: number, y: number) => [x * T - half + T / 2, 0, y * T - half + T / 2] as [number, number, number];
  // the ruler stands at the front edge of the land, overlooking the city
  const heroPos: [number, number, number] = [T * 0.9, 0, T * 1.6]; // a small president standing in front of the town hall, among the citizens
  const stormy = weather.includes("thunderstorm") || weather.includes("typhoon");
  const red = meteor !== "none";
  const occupied = useMemo(() => new Set(tiles.map((t) => `${t[0]},${t[1]}`)), [tiles]);

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!onTile) return;
    e.stopPropagation();
    const x = Math.floor((e.point.x + half) / T);
    const y = Math.floor((e.point.z + half) / T);
    if (x >= 0 && y >= 0 && x < land && y < land) onTile(x, y);
  };

  return (
    <>
      <color attach="background" args={[mix(dusk ? "#f0a36b" : "#141c33", red ? "#f3d6cf" : stormy ? "#dfe3ea" : "#eef3ee", day)]} />
      <fog attach="fog" args={[mix(dusk ? "#f0a36b" : "#141c33", red ? "#f3d6cf" : stormy ? "#dfe3ea" : "#eef3ee", day), 40, 110]} />
      <Ink wash={0.35 * (0.4 + 0.6 * day)} />
      <hemisphereLight args={[mix("#7f8fc9", "#ffffff", day), mix("#1d2238", "#c9d6c0", day), (stormy ? 0.8 : 1.15) * (0.35 + 0.65 * day)]} />
      {night && <Stars radius={90} depth={30} count={1400} factor={3} fade speed={0.4} />}
      {night && <directionalLight position={[-14, 22, -8]} intensity={0.35} color="#a9b8ff" />}
      {night && <StreetLights half={half} />}
      <directionalLight
        position={[14, 26, 10]}
        color={dusk ? "#ffc58a" : "#ffffff"}
        intensity={(stormy ? 1.0 : 1.8) * day}
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <CameraRig land={land} compact={compact} />

      {/* sea + island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <circleGeometry args={[120, 48]} />
        <meshStandardMaterial color="#9fd3ea" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <boxGeometry args={[land * T + 5.4, 0.6, land * T + 5.4]} />
        <meshStandardMaterial color="#e8dcc0" flatShading />
      </mesh>
      <mesh position={[0, -0.02, 0]} receiveShadow onClick={click}>
        <boxGeometry args={[land * T, 0.08, land * T]} />
        <meshStandardMaterial color="#a9d58a" flatShading />
      </mesh>
      {/* plots */}
      {Array.from({ length: land * land }).map((_, i) => {
        const x = i % land;
        const y = Math.floor(i / land);
        if (occupied.has(`${x},${y}`)) return null;
        const c = centre(x, y);
        return (
          <mesh key={i} position={[c[0], 0.03, c[2]]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noLine: true }}>
            <planeGeometry args={[T * 0.86, T * 0.86]} />
            <meshBasicMaterial color="#bfe2a3" transparent opacity={0.55} depthWrite={false} />
          </mesh>
        );
      })}
      {/* trees around the coast */}
      {Array.from({ length: Math.min(22, land * 2) }).map((_, i) => {
        const a = (i / Math.min(22, land * 2)) * Math.PI * 2;
        const r = half + 1.55;
        return <Asset key={i} name={i % 3 ? "Tree_Round" : "Tree_Pine"} position={[Math.cos(a) * r, -0.05, Math.sin(a) * r]} scale={0.55 + (i % 3) * 0.12} />;
      })}

      {tiles.map(([x, y, t, lvl, st]) => {
        const c = centre(x, y);
        const k = `${x},${y}`;
        return (
          <group key={k} position={c}>
            {st === 2 ? (
              <>
                <Scaffold pct={progress[k] ?? 0.3} />
                <Html position={[0, 2.1, 0]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
                  <div className="build-chip">🔨 {Math.round((progress[k] ?? 0) * 100)}%</div>
                </Html>
              </>
            ) : (
              <group>
                <BuildingModel t={t} lvl={lvl} accent={accent} />
                {st === 1 && (
                  <Html position={[0, 1.8, 0]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
                    <div className="build-chip bad">🔧 damaged</div>
                  </Html>
                )}
                {lvl > 1 && (
                  <Html position={[0.85, 0.15, 0.85]} center distanceFactor={20} style={{ pointerEvents: "none" }}>
                    <div className="lvl-chip">{lvl}</div>
                  </Html>
                )}
              </group>
            )}
          </group>
        );
      })}

      {selected && (
        <mesh position={[centre(selected.x, selected.y)[0], 0.07, centre(selected.x, selected.y)[2]]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noLine: true }}>
          <ringGeometry args={[T * 0.46, T * 0.5, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#14140f" />
        </mesh>
      )}

      {/* you: a giant Head of State among your citizens */}
      <group position={heroPos} rotation={[0, -0.15, 0]}>
        <Hero character={character} anim={heroAnim} height={0.8} />
        <group scale={0.28}>
          <Crown y={3.0} color={accent} />
        </group>
        {title && (
          <Html position={[0, 1.35, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
            <div className="lvl-chip" style={{ whiteSpace: "nowrap", width: "auto", padding: "0 8px" }}>{title}</div>
          </Html>
        )}
      </group>
      {flag && (
        <Suspense fallback={null}>
          <group position={[heroPos[0] - 0.7, 0, heroPos[2] - 0.1]} scale={0.42}>
            <FlagPole code={flag} at={[0, 0, 0]} />
          </group>
        </Suspense>
      )}
      {night && <Sleepers tiles={tiles} centre={centre} />}
      {!night && <Workers tiles={tiles} centre={centre} />}
      <Crowd count={night ? Math.min(4, Math.round(pop / 25)) : Math.max(3, Math.min(26, Math.round(pop / 5)))} radius={half * 0.95} seed={"city" + land} accents={[accent, "#f2c31a", "#2b5a9b", "#c0342a"]} />
      <Traffic half={half} cars={Math.min(6, 1 + Math.floor(tiles.length / 4))} />
      <RivalCampus at={[half + 9, 0, -half + 2]} />
      {tiles.some((t) => t[2] === "station" && t[4] === 0) && <Railway half={half} />}

      {weather.includes("rain") || stormy ? <Rain heavy={stormy} /> : null}
      {stormy && <Lightning />}
      {weather.includes("whirlwind") && <Whirl />}
      {weather.includes("elnino") && <Sparkles count={40} scale={[30, 4, 30]} position={[0, 2, 0]} color="#ffb347" size={4} speed={0.2} />}
      {red && <MeteorSky strike={meteor === "strike"} />}
    </>
  );
}

function CameraRig({ land, compact }: { land: number; compact?: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const portrait = size.width < size.height;
    const d = land * T * (portrait ? 1.35 : 0.95) * (compact ? 1.1 : 1);
    camera.position.set(d * 0.55, d * 0.95, d * 0.85);
    camera.lookAt(0, 0, 0);
  }, [camera, land, size.width, size.height, compact]);
  return <MapControls enableDamping dampingFactor={0.12} minDistance={8} maxDistance={land * T * 3} maxPolarAngle={Math.PI * 0.42} screenSpacePanning={false} target={[0, 0, 0]} />;
}

function Rain({ heavy }: { heavy: boolean }) {
  const N = heavy ? 900 : 500;
  const ref = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo(() => Array.from({ length: N }, () => new THREE.Vector3((Math.random() - 0.5) * 40, Math.random() * 18, (Math.random() - 0.5) * 40)), [N]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    drops.forEach((d, i) => {
      d.y -= dt * (heavy ? 22 : 15);
      d.x += dt * (heavy ? 4 : 1);
      if (d.y < 0) {
        d.y = 18;
        d.x = (Math.random() - 0.5) * 40;
      }
      m.makeTranslation(d.x, d.y, d.z);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} userData={{ noLine: true }}>
      <boxGeometry args={[0.03, 0.5, 0.03]} />
      <meshBasicMaterial color="#5b8fc9" transparent opacity={0.6} />
    </instancedMesh>
  );
}
function Lightning() {
  const l = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!l.current) return;
    const t = clock.elapsedTime % 5;
    l.current.intensity = t < 0.08 || (t > 0.16 && t < 0.22) ? 900 : 0;
  });
  return <pointLight ref={l} position={[6, 20, -4]} color="#dfe8ff" distance={80} />;
}
function Whirl() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * 4;
    g.current.position.x = Math.sin(clock.elapsedTime * 0.3) * 8;
    g.current.position.z = Math.cos(clock.elapsedTime * 0.2) * 6;
  });
  return (
    <group ref={g}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.8 + i * 1.1, 0]} userData={{ noLine: true }}>
          <torusGeometry args={[0.5 + i * 0.45, 0.08, 6, 24]} />
          <meshBasicMaterial color="#9a9a9a" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}
function MeteorSky({ strike }: { strike: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = (clock.elapsedTime * (strike ? 0.6 : 0.08)) % 1;
    g.current.position.set(30 - t * 30, 40 - t * 40, -30 + t * 30);
  });
  return (
    <group ref={g}>
      <mesh userData={{ noLine: true }}>
        <sphereGeometry args={[strike ? 2.4 : 1.6, 16, 12]} />
        <meshBasicMaterial color="#ff4a1c" />
      </mesh>
      <pointLight color="#ff6a2c" intensity={strike ? 400 : 120} distance={60} />
    </group>
  );
}

/* ───────── workers: tiny citizens with job colours, busy at their buildings ───────── */
const JOBS: Partial<Record<BType, { hat: string; body: string; label: string }>> = {
  hospital: { hat: "#ffffff", body: "#e8f4ff", label: "doctor" },
  factory: { hat: "#ff9933", body: "#3b5ba5", label: "engineer" },
  school: { hat: "#7a4fd8", body: "#f0e6ff", label: "teacher" },
  barracks: { hat: "#4f6b3a", body: "#6b7f4a", label: "soldier" },
  farm: { hat: "#e9c83d", body: "#7fbf5a", label: "farmer" },
  bank: { hat: "#16161d", body: "#f2c31a", label: "banker" },
  market: { hat: "#c0342a", body: "#ffe2c2", label: "trader" },
  police: { hat: "#1f3a93", body: "#2b3f78", label: "police" },
  airport: { hat: "#1f3a93", body: "#ffffff", label: "pilot" },
  hall: { hat: "#f2c31a", body: "#16161d", label: "minister" },
};
function Workers({ tiles, centre }: { tiles: TileView[]; centre: (x: number, y: number) => [number, number, number] }) {
  const list = tiles.filter((t) => JOBS[t[2]] && t[4] !== 2).slice(0, 18);
  return (
    <group>
      {list.map(([x, y, t, lvl], i) => {
        const c = centre(x, y);
        const j = JOBS[t]!;
        return Array.from({ length: Math.min(3, lvl) }).map((_, k) => <Worker key={`${i}-${k}`} base={[c[0], 0, c[2]]} seed={i * 7 + k} hat={j.hat} body={j.body} />);
      })}
    </group>
  );
}
function Worker({ base, seed, hat, body }: { base: [number, number, number]; seed: number; hat: string; body: string }) {
  const g = useRef<THREE.Group>(null);
  const ph = seed * 1.7;
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * 0.6 + ph;
    const a = t % (Math.PI * 2);
    g.current.position.set(base[0] + Math.cos(a) * 1.05, Math.abs(Math.sin(t * 9)) * 0.04, base[2] + Math.sin(a) * 1.05);
    g.current.rotation.y = -a;
  });
  return (
    <group ref={g} scale={0.55} userData={{ keep: true }}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.24, 4, 8]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial color="#f3d5bd" />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.08, 10]} />
        <meshStandardMaterial color={hat} />
      </mesh>
    </group>
  );
}

/* ───────── traffic on the ring road ───────── */
function Traffic({ half, cars }: { half: number; cars: number }) {
  const r = half + 0.75;
  return (
    <group>
      {/* the road: a square loop around the land */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i % 2 === 0 ? 0 : (i === 1 ? 1 : -1) * r, -0.005, i % 2 === 0 ? (i === 0 ? 1 : -1) * r : 0]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]} receiveShadow userData={{ noLine: true }}>
          <boxGeometry args={[r * 2 + 1.1, 0.04, 1.0]} />
          <meshStandardMaterial color="#5d5f68" />
        </mesh>
      ))}
      {Array.from({ length: cars }).map((_, i) => (
        <Car key={i} r={r} offset={i / cars} />
      ))}
    </group>
  );
}
function Car({ r, offset }: { r: number; offset: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const p = (clock.elapsedTime * 0.035 + offset) % 1; // around the square
    const side = Math.floor(p * 4);
    const f = (p * 4) % 1;
    const L = r * 2;
    const pts = [
      [-r + f * L, r, 0],
      [r, r - f * L, -Math.PI / 2],
      [r - f * L, -r, Math.PI],
      [-r, -r + f * L, Math.PI / 2],
    ][side];
    g.current.position.set(pts[0], 0.02, pts[1]);
    g.current.rotation.y = pts[2] + Math.PI / 2;
  });
  return (
    <group ref={g} scale={0.6}>
      <Asset name="Car" />
    </group>
  );
}

function Crown({ y, color }: { y: number; color: string }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = y + Math.sin(clock.elapsedTime * 2) * 0.05;
  });
  return (
    <group ref={g} position={[0, y, 0]} userData={{ keep: true }}>
      <mesh>
        <cylinderGeometry args={[0.26, 0.3, 0.16, 8, 1, true]} />
        <meshStandardMaterial color="#f2c31a" emissive="#c98f06" emissiveIntensity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.27, 0.14, Math.sin(a) * 0.27]}>
            <coneGeometry args={[0.06, 0.16, 4]} />
            <meshStandardMaterial color="#f2c31a" emissive="#c98f06" emissiveIntensity={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.04, 0.29]}>
        <octahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/** Every country has a Bhavan's — and a Centerpoint campus glaring at it from across the water. */
function RivalCampus({ at }: { at: [number, number, number] }) {
  return (
    <group position={at}>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4.4, 0.6, 24]} />
        <meshStandardMaterial color="#d8d2c4" flatShading />
      </mesh>
      <group scale={1.3}>
        <BuildingModel t="school" lvl={3} accent="#5a5a66" />
      </group>
      <mesh position={[0, 0.6, 2.3]} castShadow>
        <boxGeometry args={[2.6, 1.2, 0.2]} />
        <meshStandardMaterial color="#5a5a66" />
      </mesh>
      <Html position={[0, 3.6, 0]} center distanceFactor={22} style={{ pointerEvents: "none" }}>
        <div className="build-chip" style={{ background: "#5a5a66", color: "#fff" }}>
          🏫 Centerpoint School
        </div>
      </Html>
    </group>
  );
}

/* ───────── railway: a loop outside the ring road with a little train ───────── */
function Railway({ half }: { half: number }) {
  const r = half + 2.05;
  const train = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!train.current) return;
    const p = (clock.elapsedTime * 0.05) % 1;
    train.current.children.forEach((car, i) => {
      const q = (p - i * 0.012 + 1) % 1;
      const side = Math.floor(q * 4);
      const f = (q * 4) % 1;
      const L = r * 2;
      const pts = [
        [-r + f * L, -r, 0],
        [r, -r + f * L, Math.PI / 2],
        [r - f * L, r, Math.PI],
        [-r, r - f * L, -Math.PI / 2],
      ][side];
      car.position.set(pts[0], 0.12, pts[1]);
      car.rotation.y = -pts[2];
    });
  });
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i % 2 === 0 ? 0 : (i === 1 ? 1 : -1) * r, -0.01, i % 2 === 0 ? (i === 0 ? 1 : -1) * r : 0]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]} userData={{ noLine: true }}>
          <boxGeometry args={[r * 2 + 0.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#8b6a4e" />
        </mesh>
      ))}
      <group ref={train}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} castShadow userData={{ keep: true }}>
            <boxGeometry args={[0.9, 0.45, 0.42]} />
            <meshStandardMaterial color={i === 0 ? "#c0342a" : "#2b5a9b"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** The country's real flag flying beside the president. */
function FlagPole({ code, at }: { code: string; at: [number, number, number] }) {
  // flag SVGs have no pixel size, so draw them onto a canvas first (works on every browser/GPU)
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 240;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.onload = () => {
      c.getContext("2d")!.drawImage(img, 0, 0, 320, 240);
      t.needsUpdate = true;
    };
    img.src = `/flags/${code}.svg`;
    return t;
  }, [code]);
  const cloth = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(1.5, 1.1, 12, 1), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(({ clock }) => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3] + 0.75;
      p.setZ(i, Math.sin(x * 3.2 - clock.elapsedTime * 4) * 0.09 * x);
    }
    p.needsUpdate = true;
  });
  return (
    <group position={at}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 4, 8]} />
        <meshStandardMaterial color="#d8d8de" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.05, 0]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#f2c31a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={cloth} geometry={geo} position={[0.78, 3.4, 0]} userData={{ keep: true, noLine: true }}>
        <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Warm street lamps around the city at night. */
function StreetLights({ half }: { half: number }) {
  const spots: [number, number][] = [
    [-half - 0.6, -half - 0.6],
    [half + 0.6, -half - 0.6],
    [-half - 0.6, half + 0.6],
    [half + 0.6, half + 0.6],
  ];
  return (
    <>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.8, 6]} />
            <meshStandardMaterial color="#2b2b33" />
          </mesh>
          <mesh position={[0, 1.85, 0]} userData={{ noLine: true }}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshBasicMaterial color="#ffd68a" />
          </mesh>
          <pointLight position={[0, 1.8, 0]} color="#ffbf66" intensity={14} distance={half * 1.6} decay={1.6} />
        </group>
      ))}
    </>
  );
}

/** Citizens asleep: lit windows and a sleepy "Zzz" over homes. */
function Sleepers({ tiles, centre }: { tiles: TileView[]; centre: (x: number, y: number) => [number, number, number] }) {
  return (
    <>
      {tiles
        .filter((t) => (t[2] === "house" || t[2] === "hall") && t[4] === 0)
        .slice(0, 10)
        .map(([x, y, t], i) => {
          const c = centre(x, y);
          return (
            <group key={`${x},${y}`} position={c}>
              <mesh position={[0, 0.7, 0]} userData={{ noLine: true }}>
                <boxGeometry args={[0.5, 0.18, 0.02]} />
                <meshBasicMaterial color={i % 3 === 0 ? "#3a3a48" : "#ffd27a"} />
              </mesh>
              {t === "house" && (
                <Html position={[0.3, 1.9, 0]} center distanceFactor={20} style={{ pointerEvents: "none" }}>
                  <div className="zzz">💤</div>
                </Html>
              )}
            </group>
          );
        })}
    </>
  );
}
