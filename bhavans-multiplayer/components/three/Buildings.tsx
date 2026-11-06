"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { BType } from "@/lib/game/rules";

/* One tile = 2×2 world units. Every model sits inside ~1.8×1.8 and grows a little with level. */
const M = ({ c, e, k }: { c: string; e?: string; k?: boolean }) => <meshStandardMaterial color={c} flatShading roughness={0.8} emissive={e ?? "#000"} emissiveIntensity={e ? 0.6 : 0} userData={{}} />;
function Box({ p, s, c, keep, e }: { p: [number, number, number]; s: [number, number, number]; c: string; keep?: boolean; e?: string }) {
  return (
    <mesh position={p} castShadow receiveShadow userData={keep ? { keep: true } : {}}>
      <boxGeometry args={s} />
      <M c={c} e={e} />
    </mesh>
  );
}
function Roof({ p, r, h, c, rot = Math.PI / 4, seg = 4 }: { p: [number, number, number]; r: number; h: number; c: string; rot?: number; seg?: number }) {
  return (
    <mesh position={p} rotation={[0, rot, 0]} castShadow userData={{ keep: true }}>
      <coneGeometry args={[r, h, seg]} />
      <M c={c} />
    </mesh>
  );
}
function Cyl({ p, r, h, c, seg = 14, keep, e }: { p: [number, number, number]; r: number | [number, number]; h: number; c: string; seg?: number; keep?: boolean; e?: string }) {
  const [a, b] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={p} castShadow receiveShadow userData={keep ? { keep: true } : {}}>
      <cylinderGeometry args={[a, b, h, seg]} />
      <M c={c} e={e} />
    </mesh>
  );
}
function Win({ p, w = 0.22, h = 0.22, z = 0 }: { p: [number, number, number]; w?: number; h?: number; z?: number }) {
  return (
    <mesh position={p} rotation={[0, z, 0]} userData={{ keep: true, noLine: true }}>
      <boxGeometry args={[w, h, 0.03]} />
      <meshStandardMaterial color="#ffe7a1" emissive="#ffc04d" emissiveIntensity={0.5} />
    </mesh>
  );
}
function Spin({ children, speed = 1, axis = "y" }: { children: ReactNode; speed?: number; axis?: "y" | "z" }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation[axis] += dt * speed;
  });
  return <group ref={g}>{children}</group>;
}

const PALETTE = { wall: "#f7f1e6", wall2: "#efe6d6", roof: "#c0342a", roof2: "#2b5a9b", gold: "#f2c31a", wood: "#a06d43", stone: "#c9c3b8", green: "#7fbf5a", dark: "#3b3b42" };

export function BuildingModel({ t, lvl, accent }: { t: BType; lvl: number; accent: string }) {
  const s = 0.85 + lvl * 0.06;
  const H = (x: number) => x * (0.9 + lvl * 0.12);
  switch (t) {
    case "hall":
      return (
        <group scale={s}>
          <Box p={[0, 0.12, 0]} s={[1.8, 0.24, 1.6]} c={PALETTE.stone} />
          <Box p={[0, 0.3, 0.1]} s={[1.6, 0.14, 1.3]} c={PALETTE.wall2} />
          {[-0.6, -0.2, 0.2, 0.6].map((x) => (
            <Cyl key={x} p={[x, H(0.8), 0.6]} r={0.08} h={H(0.95)} c="#ffffff" />
          ))}
          <Box p={[0, H(0.75), -0.15]} s={[1.4, H(0.9), 0.8]} c={PALETTE.wall} />
          <Box p={[0, H(1.32), 0.15]} s={[1.55, 0.12, 1.2]} c={PALETTE.wall2} />
          <mesh position={[0, H(1.38) + 0.38, 0]} castShadow userData={{ keep: true }}>
            <sphereGeometry args={[0.42, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={accent} />
          </mesh>
          <Cyl p={[0, H(1.38) + 0.95, 0]} r={0.02} h={0.5} c="#666" />
          <Box p={[0.16, H(1.38) + 1.1, 0]} s={[0.3, 0.18, 0.02]} c={accent} keep />
        </group>
      );
    case "house":
      return (
        <group scale={s}>
          {[
            [-0.45, -0.3, PALETTE.roof],
            [0.45, 0.35, PALETTE.roof2],
          ].map(([x, z, roof], i) => (
            <group key={i} position={[x as number, 0, z as number]}>
              <Box p={[0, H(0.35), 0]} s={[0.75, H(0.7), 0.7]} c={i ? PALETTE.wall : "#fff6ea"} />
              <Roof p={[0, H(0.7) + 0.22, 0]} r={0.6} h={0.45} c={roof as string} />
              <Win p={[0.18, H(0.42), 0.36]} />
              <Box p={[-0.15, 0.17, 0.36]} s={[0.18, 0.34, 0.03]} c={PALETTE.wood} />
            </group>
          ))}
          {lvl >= 3 && <Box p={[0.45, H(0.95), 0.35]} s={[0.6, H(0.4), 0.55]} c={PALETTE.wall2} />}
        </group>
      );
    case "farm":
      return (
        <group scale={s}>
          <Box p={[0, 0.04, 0]} s={[1.8, 0.08, 1.8]} c="#a6794e" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} p={[-0.72 + i * 0.36, 0.13, 0.1]} s={[0.18, 0.12, 1.3]} c={i % 2 ? "#e9c83d" : PALETTE.green} keep />
          ))}
          <Box p={[0.55, H(0.35), -0.62]} s={[0.55, H(0.6), 0.45]} c={PALETTE.roof} keep />
          <Roof p={[0.55, H(0.65) + 0.15, -0.62]} r={0.45} h={0.3} c="#7a2a22" />
          <Cyl p={[-0.6, H(0.45), -0.62]} r={0.18} h={H(0.9)} c={PALETTE.stone} />
        </group>
      );
    case "water":
      return (
        <group scale={s}>
          {[-0.35, 0.35].map((x) => [-0.35, 0.35].map((z) => <Cyl key={`${x}${z}`} p={[x, H(0.5), z]} r={0.05} h={H(1)} c="#8a8f99" seg={6} />))}
          <Cyl p={[0, H(1.15), 0]} r={0.55} h={H(0.5)} c="#4aa3e0" keep />
          <Roof p={[0, H(1.4) + 0.18, 0]} r={0.6} h={0.35} c="#2b5a9b" seg={14} rot={0} />
        </group>
      );
    case "factory":
      return (
        <group scale={s}>
          <Box p={[-0.15, H(0.4), 0]} s={[1.3, H(0.8), 1.2]} c="#d8d2c8" />
          {[-0.55, -0.15, 0.25].map((x) => (
            <mesh key={x} position={[x, H(0.8) + 0.15, 0]} rotation={[0, 0, Math.PI / 4]} castShadow userData={{ keep: true }}>
              <boxGeometry args={[0.28, 0.28, 1.2]} />
              <M c="#9aa4b1" />
            </mesh>
          ))}
          <Cyl p={[0.65, H(0.9), 0.35]} r={[0.12, 0.16]} h={H(1.8)} c={PALETTE.roof} keep />
          <Smoke p={[0.65, H(1.8) + 0.1, 0.35]} />
          <Win p={[-0.2, H(0.4), 0.61]} w={0.8} h={0.18} />
        </group>
      );
    case "market":
      return (
        <group scale={s}>
          {[-0.5, 0, 0.5].map((x, i) => (
            <group key={x} position={[x, 0, (i % 2) * 0.2 - 0.1]}>
              <Box p={[0, 0.25, 0]} s={[0.42, 0.5, 0.42]} c={PALETTE.wood} />
              <mesh position={[0, 0.62, 0.05]} rotation={[0.35, 0, 0]} castShadow userData={{ keep: true }}>
                <boxGeometry args={[0.5, 0.04, 0.55]} />
                <M c={["#c0342a", "#f2c31a", "#2b5a9b"][i]} />
              </mesh>
              <mesh position={[0, 0.53, 0.18]} userData={{ keep: true, noLine: true }}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <M c={["#ff9933", "#7fbf5a", "#e04f6f"][i]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "bank":
      return (
        <group scale={s}>
          <Box p={[0, 0.1, 0]} s={[1.6, 0.2, 1.4]} c={PALETTE.stone} />
          {[-0.55, -0.18, 0.18, 0.55].map((x) => (
            <Cyl key={x} p={[x, H(0.62), 0.5]} r={0.07} h={H(0.85)} c="#ffffff" />
          ))}
          <Box p={[0, H(0.6), -0.15]} s={[1.3, H(0.85), 0.7]} c="#f3efe6" />
          <mesh position={[0, H(1.12) + 0.2, 0.15]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 0.7]} castShadow userData={{ keep: true }}>
            <coneGeometry args={[0.75, 0.42, 4]} />
            <M c={PALETTE.gold} />
          </mesh>
          <Spin speed={1.4}>
            <Cyl p={[0, H(1.12) + 0.75, 0.15]} r={0.16} h={0.05} c={PALETTE.gold} seg={20} keep e="#c98f06" />
          </Spin>
        </group>
      );
    case "school":
      return (
        <group scale={s}>
          <Box p={[0, H(0.45), -0.2]} s={[1.7, H(0.9), 0.8]} c="#fff7ea" />
          <Box p={[-0.6, H(0.45), 0.35]} s={[0.5, H(0.9), 0.5]} c="#fff7ea" />
          <Roof p={[0, H(0.9) + 0.18, -0.2]} r={1.05} h={0.36} c="#d2691e" rot={Math.PI / 4} />
          <Box p={[0.2, H(1.1) + 0.25, -0.2]} s={[0.3, 0.5, 0.3]} c="#fff7ea" />
          <Roof p={[0.2, H(1.1) + 0.6, -0.2]} r={0.28} h={0.3} c="#d2691e" />
          {[-0.4, 0, 0.4].map((x) => (
            <Win key={x} p={[x + 0.2, H(0.5), 0.21]} />
          ))}
          {/* Bhavan's banner */}
          <Cyl p={[0.75, 0.6, 0.55]} r={0.02} h={1.2} c="#666" />
          <Box p={[0.9, 1.05, 0.55]} s={[0.3, 0.2, 0.02]} c="#ff9933" keep />
          <Box p={[0.9, 0.88, 0.55]} s={[0.3, 0.14, 0.02]} c="#138808" keep />
        </group>
      );
    case "barracks":
      return (
        <group scale={s}>
          <Box p={[0, H(0.35), 0]} s={[1.6, H(0.7), 1.0]} c="#c9b99a" />
          <Box p={[0, H(0.7) + 0.06, 0]} s={[1.7, 0.12, 1.1]} c="#6b5a3d" />
          {[-0.75, 0.75].map((x) => (
            <group key={x}>
              <Cyl p={[x, H(0.6), 0.55]} r={0.18} h={H(1.2)} c="#a99a7c" seg={8} />
              <Roof p={[x, H(1.2) + 0.15, 0.55]} r={0.22} h={0.3} c="#5a6b3d" seg={8} rot={0} />
            </group>
          ))}
          <Cyl p={[0, H(1.1), -0.3]} r={0.02} h={0.9} c="#555" />
          <Box p={[0.15, H(1.45), -0.3]} s={[0.3, 0.2, 0.02]} c={accent} keep />
        </group>
      );
    case "wall":
      return (
        <group scale={[1, 0.8 + lvl * 0.15, 1]}>
          <Box p={[0, 0.35, 0]} s={[1.9, 0.7, 0.5]} c="#bdb3a3" />
          {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => (
            <Box key={x} p={[x, 0.8, 0]} s={[0.22, 0.2, 0.5]} c="#bdb3a3" />
          ))}
          {[-0.85, 0.85].map((x) => (
            <Cyl key={x} p={[x, 0.55, 0]} r={0.3} h={1.1} c="#a89e8e" seg={8} />
          ))}
        </group>
      );
    case "hospital":
      return (
        <group scale={s}>
          <Box p={[0, H(0.55), 0]} s={[1.5, H(1.1), 1.1]} c="#ffffff" />
          <Box p={[0, H(1.1) + 0.05, 0]} s={[1.6, 0.1, 1.2]} c="#e6edf2" />
          <Box p={[0, H(0.75), 0.56]} s={[0.5, 0.14, 0.03]} c="#d3313a" keep />
          <Box p={[0, H(0.75), 0.56]} s={[0.14, 0.5, 0.03]} c="#d3313a" keep />
          {[-0.5, 0.5].map((x) => (
            <Win key={x} p={[x, H(0.4), 0.56]} />
          ))}
          <Cyl p={[0.45, H(1.1) + 0.08, -0.2]} r={0.22} h={0.04} c="#2b5a9b" keep />
        </group>
      );
    case "park":
      return (
        <group>
          <Box p={[0, 0.03, 0]} s={[1.85, 0.06, 1.85]} c="#9fd27a" />
          <Cyl p={[0, 0.08, 0]} r={0.32} h={0.06} c="#7cc6ef" keep />
          {[
            [-0.6, -0.55],
            [0.6, -0.5],
            [-0.55, 0.6],
            [0.62, 0.58],
          ].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]} scale={0.8 + lvl * 0.08}>
              <Cyl p={[0, 0.3, 0]} r={0.05} h={0.6} c={PALETTE.wood} seg={6} />
              <mesh position={[0, 0.72, 0]} castShadow userData={{ keep: true }}>
                <icosahedronGeometry args={[0.32, 1]} />
                <M c={i % 2 ? "#6db456" : "#f4a7bb"} />
              </mesh>
            </group>
          ))}
          <Box p={[0, 0.16, 0.55]} s={[0.5, 0.06, 0.16]} c={PALETTE.wood} />
        </group>
      );
    case "airport":
      return (
        <group>
          <Box p={[0, 0.03, 0.2]} s={[1.9, 0.06, 0.5]} c="#4d4f57" />
          {[-0.7, -0.3, 0.1, 0.5].map((x) => (
            <Box key={x} p={[x, 0.065, 0.2]} s={[0.2, 0.01, 0.06]} c="#ffffff" keep />
          ))}
          <Box p={[-0.45, H(0.3), -0.55]} s={[0.9, H(0.55), 0.55]} c="#e9eef4" />
          <Cyl p={[0.6, H(0.7), -0.55]} r={[0.1, 0.13]} h={H(1.4)} c="#ffffff" />
          <Cyl p={[0.6, H(1.4) + 0.12, -0.55]} r={0.22} h={0.24} c="#7fc8f5" keep />
          <Plane />
        </group>
      );
    case "monument":
      return (
        <group scale={s}>
          <Box p={[0, 0.12, 0]} s={[1.4, 0.24, 1.4]} c={PALETTE.stone} />
          <Box p={[0, 0.3, 0]} s={[1.0, 0.14, 1.0]} c={PALETTE.stone} />
          <mesh position={[0, H(1.1), 0]} castShadow userData={{ keep: true }}>
            <cylinderGeometry args={[0.08, 0.32, H(1.6), 4]} />
            <M c="#e8e2d5" />
          </mesh>
          <mesh position={[0, H(1.95) + 0.15, 0]} userData={{ keep: true }}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color={PALETTE.gold} emissive="#c98f06" emissiveIntensity={0.7} />
          </mesh>
        </group>
      );
    case "police":
      return (
        <group scale={s}>
          <Box p={[0, H(0.4), 0]} s={[1.3, H(0.8), 0.9]} c="#e7ecf5" />
          <Box p={[0, H(0.8) + 0.06, 0]} s={[1.4, 0.12, 1.0]} c="#2b3f78" />
          <Box p={[0, H(0.55), 0.46]} s={[0.6, 0.16, 0.03]} c="#2b3f78" keep />
          <Blink p={[0, H(0.8) + 0.25, 0]} />
        </group>
      );
    case "station":
      return (
        <group scale={s}>
          <Box p={[0, 0.08, 0.5]} s={[1.9, 0.16, 0.5]} c={PALETTE.stone} />
          <Box p={[-0.2, H(0.45), -0.25]} s={[1.3, H(0.8), 0.7]} c="#f3e6cf" />
          <Roof p={[-0.2, H(0.85) + 0.2, -0.25]} r={0.95} h={0.4} c="#2b5a9b" />
          <Cyl p={[0.7, H(0.7), -0.3]} r={0.14} h={H(1.4)} c="#f3e6cf" seg={8} />
          <Cyl p={[0.7, H(1.4) + 0.08, -0.3]} r={0.17} h={0.16} c="#ffffff" keep />
          {[-0.6, -0.2, 0.2].map((x) => (
            <Win key={x} p={[x, H(0.45), 0.11]} />
          ))}
          {[-0.6, 0.6].map((x) => (
            <Cyl key={x} p={[x, 0.45, 0.6]} r={0.03} h={0.7} c="#666" seg={6} />
          ))}
          <Box p={[0, 0.82, 0.6]} s={[1.5, 0.05, 0.4]} c="#c0342a" keep />
        </group>
      );
    case "bunker":
      return (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.85, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c="#8f9a7d" />
          </mesh>
          <Box p={[0, 0.25, 0.75]} s={[0.5, 0.45, 0.25]} c="#5b6452" />
          <Box p={[0, 0.22, 0.88]} s={[0.32, 0.34, 0.03]} c="#2f3329" />
          <Box p={[0.5, 0.75, 0]} s={[0.08, 0.3, 0.08]} c="#666" />
          {Array.from({ length: lvl }).map((_, i) => (
            <Box key={i} p={[-0.6 + i * 0.12, 0.5 + i * 0.02, -0.4]} s={[0.08, 0.08, 0.08]} c={PALETTE.gold} keep />
          ))}
        </group>
      );
  }
}

function Smoke({ p }: { p: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.45 + i / 3) % 1;
      c.position.set(Math.sin(t * 3) * 0.08, t * 1.1, 0);
      c.scale.setScalar(0.08 + t * 0.22);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t);
    });
  });
  return (
    <group ref={g} position={p}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} userData={{ noLine: true }}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#e9e6e0" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
function Blink({ p }: { p: [number, number, number] }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.color.set(Math.floor(clock.elapsedTime * 3) % 2 ? "#ff3b3b" : "#3b6bff");
  });
  return (
    <mesh position={p} userData={{ noLine: true }}>
      <boxGeometry args={[0.18, 0.1, 0.1]} />
      <meshBasicMaterial ref={m} color="#ff3b3b" />
    </mesh>
  );
}
function Plane() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = (clock.elapsedTime * 0.12) % 1;
    g.current.position.set(-1 + t * 2.4, 0.12 + Math.max(0, t - 0.45) * 2.2, 0.2);
    g.current.rotation.z = t > 0.45 ? 0.25 : 0;
    g.current.visible = t < 0.95;
  });
  return (
    <group ref={g} scale={0.55}>
      <Cyl p={[0, 0, 0]} r={0.09} h={0.8} c="#ffffff" />
      <group rotation={[0, 0, Math.PI / 2]}>
        <Cyl p={[0, 0, 0]} r={0.09} h={0.8} c="#ffffff" />
      </group>
      <Box p={[0, 0, 0]} s={[0.15, 0.04, 0.9]} c="#c0342a" keep />
    </group>
  );
}

/** Construction: wooden scaffold that rises while the builders work. */
export function Scaffold({ pct }: { pct: number }) {
  const h = 0.3 + pct * 1.1;
  return (
    <group>
      {[-0.7, 0.7].map((x) =>
        [-0.7, 0.7].map((z) => (
          <mesh key={`${x}${z}`} position={[x, h / 2, z]} castShadow>
            <boxGeometry args={[0.06, h, 0.06]} />
            <meshStandardMaterial color="#c08a52" flatShading />
          </mesh>
        ))
      )}
      {[0.3, h].map((y) => (
        <mesh key={y} position={[0, y, 0.7]}>
          <boxGeometry args={[1.45, 0.05, 0.05]} />
          <meshStandardMaterial color="#c08a52" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial color="#d9c9a8" flatShading />
      </mesh>
    </group>
  );
}
