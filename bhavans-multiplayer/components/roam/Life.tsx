"use client";
/* Everyday life: a live soundscape (waves, traffic, birds, footsteps, engines, horns, sirens) and incidents
   (accidents, thieves, medical emergencies) that you can report to the local emergency number. */
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL, OCEAN_Z, ROAD } from "@/lib/roam/gen";
import { Prop } from "./props";
import { Hero } from "../three/Hero";
import { npcPos } from "./Festive";

/* ───────────────────────── sound ───────────────────────── */
let ac: AudioContext | null = null;
let master: GainNode | null = null;
export const sound = { on: true };
export function audio() {
  try {
    if (!ac) {
      ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);
    }
    return ac;
  } catch {
    return null;
  }
}
export function setMuted(m: boolean) {
  sound.on = !m;
  if (master) master.gain.value = m ? 0 : 0.9;
}
function noiseBuf(a: AudioContext, sec: number, brown = false) {
  const b = a.createBuffer(1, a.sampleRate * sec, a.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return b;
}
function loop(a: AudioContext, buf: AudioBuffer, filter: BiquadFilterType, freq: number) {
  const s = a.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  const f = a.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = 0;
  s.connect(f).connect(g).connect(master!);
  s.start();
  return { g, f };
}
export function beep(freq: number, dur: number, type: OscillatorType = "square", vol = 0.08, when = 0) {
  const a = audio();
  if (!a || !master || a.state !== "running") return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = a.currentTime + when;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
const horn = () => {
  beep(392, 0.35, "sawtooth", 0.05);
  beep(494, 0.35, "sawtooth", 0.04);
};
function chirp() {
  const a = audio();
  if (!a || !master || a.state !== "running") return;
  const n = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const o = a.createOscillator();
    const g = a.createGain();
    const t0 = a.currentTime + i * 0.12;
    const f = 2600 + Math.random() * 1800;
    o.frequency.setValueAtTime(f, t0);
    o.frequency.exponentialRampToValueAtTime(f * 1.5, t0 + 0.06);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + 0.1);
  }
}
function step(vol: number) {
  const a = audio();
  if (!a || !master || a.state !== "running") return;
  const s = a.createBufferSource();
  s.buffer = noiseBuf(a, 0.08);
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.07);
  s.connect(f).connect(g).connect(master);
  s.start();
}

type Mix = { x: number; z: number; speed: number; ride: string | null };
/** The always-on soundscape, mixed by where you are and what you're doing. */
export function Soundscape({ tel, env, night, ride, indoors }: { tel: React.RefObject<Mix>; env: string; night: boolean; ride: string | null; indoors: boolean }) {
  const nodes = useRef<{ city: ReturnType<typeof loop>; sea: ReturnType<typeof loop>; wind: ReturnType<typeof loop>; engine: { o: OscillatorNode; g: GainNode; f: BiquadFilterNode } } | null>(null);
  const tNext = useRef({ bird: 0, horn: 0, step: 0 });
  useEffect(() => {
    const a = audio();
    if (!a) return;
    const resume = () => a.state === "suspended" && a.resume();
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    const city = loop(a, noiseBuf(a, 4, true), "lowpass", 420);
    const sea = loop(a, noiseBuf(a, 4), "lowpass", 700);
    const wind = loop(a, noiseBuf(a, 4), "bandpass", 500);
    const o = a.createOscillator();
    o.type = "sawtooth";
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 300;
    const g = a.createGain();
    g.gain.value = 0;
    o.connect(f).connect(g).connect(master!);
    o.start();
    nodes.current = { city, sea, wind, engine: { o, g, f } };
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      for (const n of [city, sea, wind]) n.g.disconnect();
      o.stop();
      g.disconnect();
    };
  }, []);
  useFrame(({ clock }) => {
    const n = nodes.current;
    const a = ac;
    if (!n || !a) return;
    const t = tel.current!;
    const now = clock.elapsedTime;
    const k = 0.05;
    const set = (g: GainNode, v: number) => (g.gain.value += (v - g.gain.value) * k);
    // waves: a slow swell that breaks every ~7 s, louder the closer you are to the shore
    const nearSea = env === "beach" ? Math.max(0, 1 - Math.abs(t.z - OCEAN_Z) / 160) : 0;
    const surge = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(now * 0.9)), 3);
    set(n.sea.g, indoors ? 0 : nearSea * 0.5 * surge);
    n.sea.f.frequency.value = 300 + surge * 900;
    set(n.city.g, indoors ? 0.05 : env === "city" || env === "beach" ? (night ? 0.18 : 0.32) : 0.05);
    set(n.wind.g, indoors ? 0 : env === "snow" || env === "forest" ? 0.12 : 0.03);
    // your engine
    const driving = ride === "cab" || ride === "bus" || ride === "jetski" || ride === "boat";
    set(n.engine.g, driving ? 0.05 : 0);
    n.engine.o.frequency.value = (ride === "bus" ? 38 : ride === "cab" ? 55 : 70) + t.speed * (ride === "bus" ? 2 : 4);
    n.engine.f.frequency.value = 200 + t.speed * 40;
    // birds, horns and footsteps
    if (!indoors && !night && env !== "snow" && now > tNext.current.bird) {
      tNext.current.bird = now + 2 + Math.random() * 6;
      chirp();
    }
    if (!indoors && (env === "city" || env === "beach") && now > tNext.current.horn) {
      tNext.current.horn = now + 7 + Math.random() * 16;
      horn();
    }
    if (!driving && t.speed > 0.4 && now > tNext.current.step) {
      tNext.current.step = now + Math.max(0.24, 0.9 / t.speed);
      step(env === "snow" ? 0.06 : 0.04);
    }
  });
  return null;
}

/* ───────────────────────── emergency numbers ───────────────────────── */
export function emergencyNumber(country: string) {
  if (["United States", "Canada", "Mexico", "Philippines", "Argentina"].includes(country)) return "911";
  if (["United Kingdom", "Ireland", "Hong Kong", "Malaysia", "Singapore", "Bangladesh"].includes(country)) return country === "Singapore" ? "995" : "999";
  if (country === "Australia") return "000";
  if (country === "New Zealand") return "111";
  if (country === "Japan") return "119";
  if (country === "China") return "110";
  return "112"; // India, the EU and most of the world
}
export function speak(text: string, voice: "operator" | "officer" = "operator") {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = voice === "operator" ? 1.1 : 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

/* ───────────────────────── incidents ───────────────────────── */
export type Incident = {
  id: number;
  kind: "accident" | "theft" | "medical";
  x: number;
  z: number;
  started: number;
  reported: boolean;
  responders: number; // seconds since help was called
  caught?: boolean;
  thief?: { x: number; z: number; dir: number };
  done?: string;
};
export const life: { incident: Incident | null; calls: number } = { incident: null, calls: 0 };

function siren(time: number) {
  const a = ac;
  if (!a || !master || a.state !== "running") return;
  const f = 700 + Math.sin(time * 6) * 250;
  beep(f, 0.12, "triangle", 0.035);
}

function LightBar({ t0 }: { t0: number }) {
  const l = useRef<THREE.Mesh>(null);
  const r = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const on = Math.floor((clock.elapsedTime - t0) * 6) % 2 === 0;
    if (l.current) (l.current.material as THREE.MeshBasicMaterial).color.set(on ? "#ff2020" : "#300");
    if (r.current) (r.current.material as THREE.MeshBasicMaterial).color.set(on ? "#002" : "#2060ff");
  });
  return (
    <group position={[0, 1.58, 0.1]}>
      <mesh ref={l} position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.25]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <mesh ref={r} position={[0.3, 0, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.25]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Spawns an incident near you every couple of minutes and plays it out. */
export function Incidents({ tel, env, onChange }: { tel: React.RefObject<{ x: number; z: number; speed: number }>; env: string; onChange: () => void }) {
  const next = useRef(performance.now() / 1000 + 50);
  const scene = useRef<THREE.Group>(null);
  const thief = useRef<THREE.Group>(null);
  const smoke = useRef<THREE.Points>(null);
  const ambu = useRef<THREE.Group>(null);
  const cop = useRef<THREE.Group>(null);
  const smokeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) p.set([(Math.random() - 0.5) * 2, Math.random() * 6, (Math.random() - 0.5) * 2], i * 3);
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const now = performance.now() / 1000;
    const me = tel.current!;
    let inc = life.incident;
    if (!inc && now > next.current && (env === "city" || env === "beach")) {
      next.current = now + 90 + Math.random() * 90;
      const kind = (["accident", "theft", "medical"] as const)[Math.floor(Math.random() * 3)];
      // at the next crossing ahead of you
      const ix = Math.round(me.x / CELL) * CELL + (Math.random() < 0.5 ? CELL : -CELL);
      const iz = Math.round(me.z / CELL) * CELL - CELL;
      const safeZ = env === "beach" ? Math.min(iz, OCEAN_Z - 60) : iz;
      const pos = Math.abs(ix) <= 100 && Math.abs(safeZ) <= 100 ? { x: ix + 200, z: safeZ } : { x: ix, z: safeZ };
      inc = life.incident = { id: Math.random(), kind, x: pos.x + (kind === "accident" ? 0 : ROAD / 2 + 2), z: pos.z, started: now, reported: false, responders: -1, thief: kind === "theft" ? { x: me.x + 3, z: me.z - 2, dir: 1 } : undefined };
      if (kind === "theft") {
        inc.x = me.x;
        inc.z = me.z;
      }
      beep(kind === "accident" ? 120 : 880, kind === "accident" ? 0.6 : 0.2, kind === "accident" ? "sawtooth" : "square", 0.12);
      if (kind === "accident") beep(90, 0.8, "sawtooth", 0.1, 0.1);
      onChange();
    }
    if (!inc) {
      if (scene.current) scene.current.visible = false;
      return;
    }
    const age = now - inc.started;
    if (scene.current) {
      scene.current.visible = true;
      scene.current.position.set(inc.x, 0, inc.z);
    }
    // the thief sprints away; chase them down
    if (inc.kind === "theft" && inc.thief && !inc.caught && !inc.done) {
      const th = inc.thief;
      const sp = 5.2;
      const ang = Math.atan2(th.x - me.x, th.z - me.z);
      th.x += Math.sin(ang) * sp * dt;
      th.z += Math.cos(ang) * sp * dt;
      if (thief.current) {
        thief.current.position.set(th.x - inc.x, 0.2, th.z - inc.z);
        thief.current.rotation.y = ang;
      }
      if (Math.hypot(th.x - me.x, th.z - me.z) < 1.8) {
        inc.caught = true;
        inc.done = "caught";
        speak("Hey! Got you. Police are on their way, well done!", "officer");
        onChange();
      } else if (age > 40) {
        inc.done = "escaped";
        onChange();
      }
    }
    // responders drive in with sirens once you call
    if (inc.reported) {
      inc.responders += dt;
      const r = inc.responders;
      const arrive = Math.max(0, 1 - r / 9);
      if (ambu.current) {
        ambu.current.visible = inc.kind !== "theft";
        ambu.current.position.set(-6, 0, 6 + arrive * 220);
      }
      if (cop.current) {
        cop.current.visible = true;
        cop.current.position.set(6, 0, -6 - arrive * 220);
      }
      if (r < 14 && Math.floor(clock.elapsedTime * 8) % 2 === 0) siren(clock.elapsedTime);
      if (r > 9 && !inc.done) {
        inc.done = "helped";
        speak(inc.kind === "accident" ? "Paramedics on scene. Thank you for calling, you may have saved lives." : inc.kind === "medical" ? "We have the patient, they're stable. Thank you for calling." : "Officers on scene. We'll take your statement.", "officer");
        onChange();
      }
    } else {
      if (ambu.current) ambu.current.visible = false;
      if (cop.current) cop.current.visible = inc.kind === "theft" && !!inc.caught;
    }
    if (smoke.current) {
      smoke.current.visible = inc.kind === "accident";
      const p = smokeGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) + dt * 1.4;
        if (y > 7) y = 0;
        p.setXYZ(i, p.getX(i) + Math.sin(now + i) * dt * 0.2, y, p.getZ(i));
      }
      p.needsUpdate = true;
    }
    // wrap up a while after it's resolved
    if ((inc.done && age > (inc.reported ? 40 : 20) + (inc.responders > 0 ? 0 : 0)) || age > 150 || Math.hypot(inc.x - me.x, inc.z - me.z) > 450) {
      life.incident = null;
      onChange();
    }
  });
  const inc = life.incident;
  return (
    <group ref={scene} visible={false}>
      {inc?.kind === "accident" && (
        <>
          <Prop root="Car" paint="#3498db" position={[-1.2, 0, 0.6]} rotation={[0, 0.5, 0.02]} />
          <Prop root="Car" paint="#e74c3c" position={[1.4, 0, -1.1]} rotation={[0, -1.1, 0]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i) * 2.6, 0.05, Math.sin(i * 1.7) * 2]} rotation={[-Math.PI / 2, 0, i]}>
              <circleGeometry args={[0.25 + (i % 2) * 0.15, 6]} />
              <meshStandardMaterial color="#cfe3f5" metalness={0.8} roughness={0.1} />
            </mesh>
          ))}
          <mesh position={[4, 0.35, 2]}>
            <coneGeometry args={[0.22, 0.7, 12]} />
            <meshStandardMaterial color="#ff6a00" />
          </mesh>
        </>
      )}
      {inc?.kind === "medical" && (
        <group position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0.6]}>
          <Hero character="scholar" anim="idle" height={1.7} />
        </group>
      )}
      {inc?.kind === "theft" && (
        <group ref={thief}>
          <Hero character="hooded" anim={inc.caught ? "idle" : "run"} height={1.7} pace={1.1} />
          <mesh position={[0.35, 0.9, 0]}>
            <boxGeometry args={[0.35, 0.3, 0.15]} />
            <meshStandardMaterial color="#8a3b6b" />
          </mesh>
        </group>
      )}
      <points ref={smoke} geometry={smokeGeo} visible={false}>
        <pointsMaterial color="#6b6b6b" size={1.6} transparent opacity={0.45} depthWrite={false} />
      </points>
      <group ref={ambu} visible={false}>
        <Prop root="Car" paint="#ffffff" scale={[1.15, 1.35, 1.25]}>
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[1.95, 0.12, 4.6]} />
            <meshStandardMaterial color="#d23a3a" />
          </mesh>
          <LightBar t0={0} />
        </Prop>
      </group>
      <group ref={cop} visible={false}>
        <Prop root="Car" paint="#1b2a4a">
          <LightBar t0={0.08} />
        </Prop>
        <group position={[2, 0, 0]}>
          <Hero character="knight" anim="interact" height={1.75} />
        </group>
      </group>
    </group>
  );
}

/** Where the nearest pedestrian is (a "victim" for medical calls). */
export function nearestNpc(x: number, z: number) {
  let best: THREE.Vector3 | null = null;
  let d = Infinity;
  for (const p of npcPos) {
    const k = Math.hypot(p.x - x, p.z - z);
    if (k < d) {
      d = k;
      best = p;
    }
  }
  return best;
}
