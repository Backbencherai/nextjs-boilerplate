"use client";
/* Living nature: bird flocks, pigeons in the plaza, street dogs, cows in Indian cities, deer in forests and snow,
   dolphins off the beach and butterflies in spring. Light, animated, and they react to you. */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL, OCEAN_Z, ROAD } from "@/lib/roam/gen";

type Me = React.RefObject<{ x: number; z: number }>;

function Bird({ color = "#3b3b46", s = 1 }: { color?: string; s?: number }) {
  const l = useRef<THREE.Mesh>(null);
  const r = useRef<THREE.Mesh>(null);
  const ph = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    const a = Math.sin(clock.elapsedTime * 9 + ph) * 0.7;
    if (l.current) l.current.rotation.z = a;
    if (r.current) r.current.rotation.z = -a;
  });
  return (
    <group scale={s}>
      <mesh scale={[0.18, 0.16, 0.55]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.06, -0.55]}>
        <coneGeometry args={[0.05, 0.16, 5]} />
        <meshStandardMaterial color="#e3a72f" />
      </mesh>
      <group>
        <mesh ref={l} position={[0, 0, 0]}>
          <mesh position={[-0.45, 0, 0]}>
            <boxGeometry args={[0.9, 0.02, 0.32]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </mesh>
        <mesh ref={r}>
          <mesh position={[0.45, 0, 0]}>
            <boxGeometry args={[0.9, 0.02, 0.32]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

/** A flock wheeling over the rooftops. */
function Flock({ me, n = 16, gull }: { me: Me; n?: number; gull?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: n }, () => [Math.random() * 6, Math.random() * 8 - 4, Math.random() * 8 - 4] as [number, number, number]), [n]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18;
    if (!g.current) return;
    const m = me.current!;
    g.current.children.forEach((b, i) => {
      const [p, oy, oz] = seeds[i];
      const a = t + p * 0.08;
      const x = m.x + Math.cos(a) * 70 + oz * 2;
      const z = m.z + Math.sin(a) * 70 - 40 + oy * 2;
      b.position.set(x, 38 + oy + Math.sin(t * 3 + p) * 3, z);
      b.rotation.y = -a - Math.PI;
    });
  });
  return (
    <group ref={g}>
      {seeds.map((_, i) => (
        <Bird key={i} color={gull ? "#f4f4f4" : "#30323a"} s={gull ? 1.6 : 1} />
      ))}
    </group>
  );
}

/** Pigeons pecking in the plaza; they scatter into the sky when you come close. */
function Pigeons({ me }: { me: Me }) {
  const g = useRef<THREE.Group>(null);
  const st = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ x: ((i * 37) % 60) - 30 + 0, z: 50 + ((i * 53) % 30), fly: 0, ph: i })), []);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const m = me.current!;
    g.current?.children.forEach((b, i) => {
      const p = st[i];
      const d = Math.hypot(m.x - p.x, m.z - p.z);
      if (d < 4 && p.fly === 0) p.fly = 0.01;
      if (p.fly > 0) p.fly += dt;
      if (p.fly > 9) p.fly = 0; // land again
      const up = p.fly > 0 ? Math.min(30, p.fly * 9) : 0;
      b.position.set(p.x + (p.fly ? p.fly * 4 * Math.cos(p.ph) : 0), 0.3 + up + (p.fly ? 0 : Math.abs(Math.sin(t * 4 + p.ph)) * 0.05), p.z + (p.fly ? p.fly * 4 * Math.sin(p.ph) : 0));
      b.rotation.x = p.fly ? 0 : Math.sin(t * 5 + p.ph) * 0.4; // pecking
      b.rotation.y = p.ph;
    });
  });
  return (
    <group ref={g}>
      {st.map((_, i) => (
        <Bird key={i} color={i % 3 ? "#8a8f9c" : "#5c6070"} s={0.55} />
      ))}
    </group>
  );
}

function Quad({ kind, color }: { kind: "dog" | "cow" | "deer"; color: string }) {
  const legs = useRef<THREE.Mesh[]>([]);
  const tail = useRef<THREE.Mesh>(null);
  const ph = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (kind === "dog" ? 9 : 4) + ph;
    legs.current.forEach((l, i) => l && (l.rotation.x = Math.sin(t + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.5));
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.5) * 0.6;
  });
  const S = kind === "cow" ? 1.6 : kind === "deer" ? 1.2 : 0.7;
  const h = kind === "deer" ? 0.95 : 0.75;
  return (
    <group scale={S}>
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[0.55, 0.45, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {kind === "cow" && (
        <mesh position={[0, h + 0.3, -0.25]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      <mesh position={[0, h + 0.28, -0.72]} castShadow>
        <boxGeometry args={[0.36, 0.34, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.2, -0.98]}>
        <boxGeometry args={[0.22, 0.18, 0.18]} />
        <meshStandardMaterial color={kind === "dog" ? "#2b2b2b" : "#d9b8a0"} />
      </mesh>
      {kind === "cow" &&
        [-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.2, h + 0.5, -0.72]} rotation={[0, 0, sd * -0.6]}>
            <coneGeometry args={[0.04, 0.25, 5]} />
            <meshStandardMaterial color="#efe6d0" />
          </mesh>
        ))}
      {kind === "deer" &&
        [-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.12, h + 0.55, -0.72]} rotation={[0.2, 0, sd * 0.4]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.025, 0.03, 0.5, 4]} />
              <meshStandardMaterial color="#6b4a2b" />
            </mesh>
            <mesh position={[sd * 0.1, 0.4, 0]} rotation={[0, 0, sd * 0.8]}>
              <cylinderGeometry args={[0.02, 0.02, 0.25, 4]} />
              <meshStandardMaterial color="#6b4a2b" />
            </mesh>
          </group>
        ))}
      {kind === "dog" &&
        [-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.12, h + 0.5, -0.66]}>
            <coneGeometry args={[0.07, 0.16, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      {[
        [-0.18, -0.45],
        [0.18, -0.45],
        [-0.18, 0.45],
        [0.18, 0.45],
      ].map(([x, z], i) => (
        <mesh key={i} ref={(m) => void (m && (legs.current[i] = m))} position={[x, h - 0.22, z]}>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.12, h - 0.1, 0.12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </mesh>
      ))}
      <mesh ref={tail} position={[0, h + 0.1, 0.62]}>
        <mesh position={[0, 0, 0.18]} rotation={[0.6, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </mesh>
    </group>
  );
}

/** Animals that wander along the sidewalks near you. */
function Walkers({ me, kind, n, colors, speed }: { me: Me; kind: "dog" | "cow" | "deer"; n: number; colors: string[]; speed: number }) {
  const g = useRef<THREE.Group>(null);
  const st = useMemo(() => Array.from({ length: n }, (_, i) => ({ axis: i % 2, line: 0, t: 0, dir: i % 2 ? 1 : -1, init: false, off: (i % 2 ? 1 : -1) * (ROAD / 2 + (kind === "cow" ? -2.5 : 2.2)) })), [n, kind]);
  useFrame((_, dt) => {
    const m = me.current!;
    g.current?.children.forEach((a, i) => {
      const p = st[i];
      const along = p.axis ? m.x : m.z;
      if (!p.init || Math.abs(p.t - along) > 120) {
        const base = p.axis ? m.z : m.x;
        p.line = (Math.round(base / CELL) + (i % 3) - 1) * CELL;
        if (Math.abs(p.line) < 100) p.line = (p.line >= 0 ? 3 : -3) * CELL;
        p.t = along + (Math.random() - 0.5) * 160;
        p.init = true;
      }
      p.t += p.dir * speed * Math.min(dt, 0.05);
      const x = p.axis ? p.t : p.line + p.off;
      const z = p.axis ? p.line + p.off : p.t;
      a.position.set(x, 0.22, z);
      a.rotation.y = p.axis ? (p.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : p.dir > 0 ? Math.PI : 0;
    });
  });
  return (
    <group ref={g}>
      {st.map((_, i) => (
        <Quad key={i} kind={kind} color={colors[i % colors.length]} />
      ))}
    </group>
  );
}

/** Dolphins arcing out of the sea. */
function Dolphins() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    g.current?.children.forEach((d, i) => {
      const t = (clock.elapsedTime * 0.5 + i * 0.8) % 4;
      const a = Math.min(1, t / 1.6);
      d.position.set(-40 + i * 25 + t * 6, Math.sin(a * Math.PI) * 3 - 0.8, OCEAN_Z + 60 + i * 12);
      d.rotation.z = -(a - 0.5) * 2.2;
      d.visible = t < 1.7;
    });
  });
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, Math.PI / 2, 0]}>
          <mesh scale={[0.45, 0.45, 1.6]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#6f8796" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.5, 0.1]} rotation={[-0.4, 0, 0]}>
            <coneGeometry args={[0.15, 0.6, 4]} />
            <meshStandardMaterial color="#5d7482" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Butterflies() {
  const g = useRef<THREE.Group>(null);
  const cols = ["#ffbe0b", "#ff006e", "#8338ec", "#3a86ff", "#ffffff"];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current?.children.forEach((b, i) => {
      b.position.set(((i * 29) % 140) - 70 + Math.sin(t * 0.7 + i) * 4, 1 + Math.abs(Math.sin(t * 2 + i)) * 1.5, ((i * 47) % 140) - 70 + Math.cos(t * 0.6 + i) * 4);
      b.scale.x = 0.4 + Math.abs(Math.sin(t * 14 + i)) * 0.6;
    });
  });
  return (
    <group ref={g}>
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.35, 0.22]} />
          <meshStandardMaterial color={cols[i % cols.length]} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export function Animals({ me, env, india, season, night }: { me: Me; env: string; india: boolean; season: string; night: boolean }) {
  return (
    <>
      {!night && <Flock me={me} gull={env === "beach"} n={env === "beach" ? 12 : 16} />}
      {!night && env !== "snow" && <Pigeons me={me} />}
      {(env === "city" || env === "beach") && <Walkers me={me} kind="dog" n={5} colors={["#c49a6c", "#3b2f2f", "#e8d7b9", "#8a5a3b"]} speed={1.6} />}
      {india && env === "city" && <Walkers me={me} kind="cow" n={3} colors={["#f1ece2", "#c9b49a", "#8b6b4e"]} speed={0.5} />}
      {(env === "forest" || env === "snow") && <Walkers me={me} kind="deer" n={5} colors={["#a8733f", "#8f5f33"]} speed={1.2} />}
      {env === "beach" && !night && <Dolphins />}
      {(season === "spring" || season === "summer") && !night && <Butterflies />}
    </>
  );
}
