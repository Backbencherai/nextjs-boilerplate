"use client";
/* Seasons, weather and natural calamities you can see (and hear) in Roam. */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OCEAN_Z } from "@/lib/roam/gen";
import { PoolMat } from "./Festive";

let sprite: THREE.Texture | null = null;
function dotSprite() {
  if (sprite) return sprite;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  sprite = new THREE.CanvasTexture(c);
  return sprite;
}

export type Season = "spring" | "summer" | "monsoon" | "autumn" | "winter";
export type Sky = "clear" | "rain" | "storm" | "typhoon" | "tornado" | "tsunami" | "heat" | "snow";

export const SEASON_META: Record<Season, { icon: string; name: string }> = {
  spring: { icon: "🌸", name: "Spring" },
  summer: { icon: "☀️", name: "Summer" },
  monsoon: { icon: "🌧️", name: "Monsoon" },
  autumn: { icon: "🍂", name: "Autumn" },
  winter: { icon: "❄️", name: "Winter" },
};
export const SKY_META: Record<Sky, { icon: string; name: string }> = {
  clear: { icon: "🌤️", name: "Clear" },
  rain: { icon: "🌧️", name: "Rain" },
  storm: { icon: "⛈️", name: "Thunderstorm" },
  typhoon: { icon: "🌀", name: "Typhoon" },
  tornado: { icon: "🌪️", name: "Whirlwind" },
  tsunami: { icon: "🌊", name: "Tsunami" },
  heat: { icon: "🔥", name: "El Niño heatwave" },
  snow: { icon: "🌨️", name: "Snowfall" },
};

/** The real season at a place today (hemisphere- and tropics-aware). */
export function seasonAt(lat: number, date = new Date()): Season {
  let m = date.getUTCMonth();
  if (lat < 0) m = (m + 6) % 12;
  const tropical = Math.abs(lat) < 24;
  if (tropical) return m >= 5 && m <= 8 ? "monsoon" : m >= 2 && m <= 4 ? "summer" : m >= 9 && m <= 10 ? "autumn" : "winter";
  return m >= 2 && m <= 4 ? "spring" : m >= 5 && m <= 7 ? "summer" : m >= 8 && m <= 10 ? "autumn" : "winter";
}
export const snowy = (season: Season, lat: number, env: string) => env === "snow" || (season === "winter" && Math.abs(lat) > 34);

/** Shared shader uniforms: wind strength makes every tree sway. */
export const windU = { value: 0.15 };
export const timeU = { value: 0 };
export function addWind(m: THREE.Material, strength = 1) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = timeU;
    sh.uniforms.uWind = windU;
    sh.vertexShader =
      "uniform float uTime;\nuniform float uWind;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float hh = max(position.y + 1.2, 0.0) * ${strength.toFixed(2)};
  transformed.x += sin(uTime * 2.1 + wp.x * 0.31 + wp.z * 0.17) * uWind * hh * 0.16;
  transformed.z += cos(uTime * 1.7 + wp.z * 0.29) * uWind * hh * 0.1;
#endif`
      );
  };
  m.needsUpdate = true;
}

/* ───────── rain & snow (particles around the camera) ───────── */
function Precip({ kind, heavy, wind }: { kind: "rain" | "snow"; heavy: number; wind: number }) {
  const { camera } = useThree();
  const N = kind === "rain" ? Math.round(2600 * heavy) : 2200;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(N * (kind === "rain" ? 6 : 3));
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 120;
      const y = Math.random() * 60;
      const z = (Math.random() - 0.5) * 120;
      if (kind === "rain") p.set([x, y, z, x, y - 1.1, z], i * 6);
      else p.set([x, y, z], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [N, kind]);
  const obj = useRef<THREE.Object3D>(null);
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const a = geo.getAttribute("position") as THREE.BufferAttribute;
    const p = a.array as Float32Array;
    const fall = kind === "rain" ? 34 : 2.2;
    const t = performance.now() / 1000;
    if (kind === "rain")
      for (let i = 0; i < N; i++) {
        const o = i * 6;
        p[o + 1] -= fall * dt;
        p[o] += wind * dt;
        if (p[o + 1] < 0) {
          const x = (Math.random() - 0.5) * 120;
          const y = 50 + Math.random() * 10;
          const z = (Math.random() - 0.5) * 120;
          p[o] = x;
          p[o + 1] = y;
          p[o + 2] = z;
        }
        p[o + 3] = p[o] - wind * 0.035;
        p[o + 4] = p[o + 1] - 1.1;
        p[o + 5] = p[o + 2];
      }
    else
      for (let i = 0; i < N; i++) {
        const o = i * 3;
        p[o + 1] -= fall * dt;
        p[o] += Math.sin(t + i) * 0.4 * dt + wind * 0.2 * dt;
        if (p[o + 1] < 0) p[o + 1] = 55 + Math.random() * 5;
      }
    a.needsUpdate = true;
    obj.current?.position.set(camera.position.x, 0, camera.position.z);
  });
  return kind === "rain" ? (
    <lineSegments ref={obj as React.RefObject<THREE.LineSegments>} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#cfe3f5" transparent opacity={0.55} />
    </lineSegments>
  ) : (
    <points ref={obj as React.RefObject<THREE.Points>} geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#ffffff" size={0.35} map={dotSprite()} transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}

/* ───────── lightning: flash, bolt and thunder ───────── */
function Lightning({ tel }: { tel: React.RefObject<{ x: number; z: number }> }) {
  const flash = useRef<THREE.AmbientLight>(null);
  const bolt = useRef<THREE.Line>(null);
  const next = useRef(performance.now() + 2500);
  const life = useRef(0);
  const geo = useMemo(() => new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(14 * 3), 3)), []);
  useFrame((_, dt) => {
    const now = performance.now();
    if (now > next.current) {
      next.current = now + 3500 + Math.random() * 7000;
      life.current = 0.35;
      const t = tel.current!;
      const bx = t.x + (Math.random() - 0.5) * 300;
      const bz = t.z - 80 - Math.random() * 200;
      const p = geo.getAttribute("position") as THREE.BufferAttribute;
      let x = bx;
      let z = bz;
      for (let i = 0; i < 14; i++) {
        p.setXYZ(i, x, 160 - i * 12.3, z);
        x += (Math.random() - 0.5) * 14;
        z += (Math.random() - 0.5) * 8;
      }
      p.needsUpdate = true;
      thunder(Math.hypot(bx - t.x, bz - t.z));
    }
    life.current = Math.max(0, life.current - dt);
    const on = life.current > 0 && Math.sin(life.current * 60) > -0.3;
    if (flash.current) flash.current.intensity = on ? 5 : 0;
    if (bolt.current) bolt.current.visible = on;
  });
  return (
    <>
      <ambientLight ref={flash} intensity={0} color="#dfe8ff" />
      <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#f4f7ff" }))} ref={bolt} />
    </>
  );
}

let ac: AudioContext | null = null;
function audio() {
  try {
    ac = ac ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ac;
  } catch {
    return null;
  }
}
function noise(a: AudioContext, sec: number) {
  const b = a.createBuffer(1, a.sampleRate * sec, a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function thunder(dist: number) {
  const a = audio();
  if (!a || a.state !== "running") return;
  const s = a.createBufferSource();
  s.buffer = noise(a, 3);
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 180;
  const g = a.createGain();
  const t0 = a.currentTime + Math.min(2.5, dist / 340);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.8, t0 + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 2.6);
  s.connect(f).connect(g).connect(a.destination);
  s.start();
}
/** Looping rain / wind ambience. */
function Ambience({ level, tone }: { level: number; tone: number }) {
  useEffect(() => {
    const a = audio();
    if (!a || level <= 0) return;
    const resume = () => a.state === "suspended" && a.resume();
    window.addEventListener("pointerdown", resume);
    const s = a.createBufferSource();
    s.buffer = noise(a, 2);
    s.loop = true;
    const f = a.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = tone;
    f.Q.value = 0.6;
    const g = a.createGain();
    g.gain.value = level;
    s.connect(f).connect(g).connect(a.destination);
    s.start();
    return () => {
      window.removeEventListener("pointerdown", resume);
      s.stop();
    };
  }, [level, tone]);
  return null;
}

/* ───────── whirlwind / tornado ───────── */
function Tornado({ tel }: { tel: React.RefObject<{ x: number; z: number }> }) {
  const g = useRef<THREE.Group>(null);
  const N = 900;
  const pts = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) seed[i] = Math.random();
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return { geo, seed };
  }, []);
  const debris = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const me = tel.current!;
    if (g.current) {
      // it wanders across the street ahead of you
      g.current.position.set(me.x + Math.sin(t * 0.12) * 90, 0, me.z - 120 + Math.cos(t * 0.09) * 30);
    }
    const p = pts.geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const s = pts.seed[i];
      const y = ((s * 97 + t * 6) % 90) + 0.5;
      const r = 2 + y * 0.32 + Math.sin(t * 3 + s * 20) * 1.2;
      const ang = s * 60 + t * (5 - y * 0.03);
      p.setXYZ(i, Math.cos(ang) * r, y, Math.sin(ang) * r);
    }
    p.needsUpdate = true;
    if (debris.current) {
      for (let i = 0; i < 40; i++) {
        const y = ((i * 7.3 + t * 9) % 60) + 1;
        const r = 5 + y * 0.35;
        const a = i * 1.7 + t * 3.5;
        m.makeRotationFromEuler(new THREE.Euler(t * 3 + i, t * 2, i)).setPosition(Math.cos(a) * r, y, Math.sin(a) * r);
        debris.current.setMatrixAt(i, m);
      }
      debris.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group ref={g}>
      <points geometry={pts.geo} frustumCulled={false}>
        <pointsMaterial color="#9a8f84" size={2.6} map={dotSprite()} transparent opacity={0.55} depthWrite={false} />
      </points>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 45, 0]} rotation={[Math.PI, i, 0]}>
          <coneGeometry args={[30 + i * 4, 92, 24, 1, true]} />
          <meshStandardMaterial color="#8d8379" transparent opacity={0.16 - i * 0.03} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <instancedMesh ref={debris} args={[undefined, undefined, 40]} frustumCulled={false}>
        <boxGeometry args={[0.8, 0.3, 1.2]} />
        <meshStandardMaterial color="#6b5a4a" />
      </instancedMesh>
    </group>
  );
}

/* ───────── tsunami: a wall of water rolls in from the sea ───────── */
function Tsunami({ tel, beach }: { tel: React.RefObject<{ x: number; z: number }>; beach: boolean }) {
  const wave = useRef<THREE.Group>(null);
  const flood = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const curl = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-30, 0);
    s.quadraticCurveTo(-8, 4, 0, 24);
    s.quadraticCurveTo(6, 32, 16, 26);
    s.quadraticCurveTo(8, 24, 10, 14);
    s.quadraticCurveTo(14, 4, 30, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 1600, bevelEnabled: false, steps: 1 });
  }, []);
  useFrame(({ clock }) => {
    const me = tel.current!;
    const cyc = clock.elapsedTime % 45; // a wave every 45 s
    const startZ = beach ? OCEAN_Z + 450 : me.z + 500;
    const z = startZ - cyc * 32;
    if (wave.current) {
      wave.current.position.set(me.x - 800, 0, z);
      wave.current.visible = cyc < 30;
      const near = Math.abs(z - me.z);
      if (near < 60 && cyc < 30) camera.position.y += Math.sin(clock.elapsedTime * 40) * 0.12 * (1 - near / 60);
    }
    if (flood.current) {
      const passed = z < me.z ? Math.min(1, (me.z - z) / 120) : 0;
      const recede = cyc > 30 ? 1 - (cyc - 30) / 15 : 1;
      flood.current.position.set(me.x, 0.05 + passed * 1.4 * recede, me.z);
      flood.current.visible = passed * recede > 0.01;
    }
  });
  return (
    <>
      <group ref={wave}>
        <mesh geometry={curl} rotation={[0, Math.PI / 2, 0]} castShadow>
          <PoolMat color="#1d6e9c" scale={0.08} speed={4} />
        </mesh>
        <mesh position={[800, 26, 14]}>
          <boxGeometry args={[1600, 3, 6]} />
          <meshStandardMaterial color="#f4fbff" roughness={0.6} />
        </mesh>
      </group>
      <mesh ref={flood} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[700, 700]} />
        <meshPhysicalMaterial color="#4a7f95" transparent opacity={0.85} roughness={0.08} clearcoat={1} />
      </mesh>
    </>
  );
}

/* ───────── heat haze shimmer for heatwaves ───────── */
function Heat() {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.translateZ(-1);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(clock.elapsedTime * 2) * 0.03;
  });
  return (
    <mesh ref={ref} renderOrder={999}>
      <planeGeometry args={[4, 3]} />
      <meshBasicMaterial color="#ff8a3d" transparent opacity={0.1} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

/** All weather layers for the chosen sky. */
export function Weather({ sky, tel, beach }: { sky: Sky; tel: React.RefObject<{ x: number; z: number }>; beach: boolean }) {
  const wind = sky === "typhoon" ? 1.8 : sky === "tornado" ? 1.1 : sky === "storm" ? 0.7 : sky === "rain" ? 0.3 : sky === "snow" ? 0.25 : 0.12;
  useFrame((_, dt) => {
    timeU.value += dt;
    windU.value += (wind - windU.value) * Math.min(1, dt);
  });
  return (
    <>
      {(sky === "rain" || sky === "storm" || sky === "typhoon") && <Precip kind="rain" heavy={sky === "rain" ? 0.6 : 1} wind={sky === "typhoon" ? 22 : sky === "storm" ? 6 : 2} />}
      {sky === "snow" && <Precip kind="snow" heavy={1} wind={2} />}
      {(sky === "storm" || sky === "typhoon") && <Lightning tel={tel} />}
      {sky === "tornado" && <Tornado tel={tel} />}
      {sky === "tsunami" && <Tsunami tel={tel} beach={beach} />}
      {sky === "heat" && <Heat />}
      <Ambience level={sky === "rain" ? 0.05 : sky === "storm" ? 0.09 : sky === "typhoon" ? 0.16 : sky === "tornado" ? 0.12 : sky === "tsunami" ? 0.1 : 0} tone={sky === "typhoon" || sky === "tornado" ? 500 : 1400} />
    </>
  );
}

/** How the sky and light change with the weather. */
export function skyLook(sky: Sky, base: string) {
  switch (sky) {
    case "rain":
      return { col: "#9aa7b4", light: 0.55, fog: [120, 600] as [number, number] };
    case "storm":
      return { col: "#5d6673", light: 0.35, fog: [90, 480] as [number, number] };
    case "typhoon":
      return { col: "#4e5964", light: 0.3, fog: [60, 360] as [number, number] };
    case "tornado":
      return { col: "#8a8478", light: 0.5, fog: [120, 600] as [number, number] };
    case "tsunami":
      return { col: "#8fa7b8", light: 0.7, fog: [200, 800] as [number, number] };
    case "heat":
      return { col: "#f4c08a", light: 1.25, fog: [160, 700] as [number, number] };
    case "snow":
      return { col: "#cfd8e3", light: 0.7, fog: [100, 500] as [number, number] };
    default:
      return { col: base, light: 1, fog: [260, 900] as [number, number] };
  }
}
