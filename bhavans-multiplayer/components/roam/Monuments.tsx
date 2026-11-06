"use client";
/* Chunky cartoon monuments at roughly real-world size, so a tiny president looks up at them. */
import { Html } from "@react-three/drei";
import type { ReactNode } from "react";
import * as THREE from "three";

const M = ({ c, r = 0.75, e, m = 0 }: { c: string; r?: number; e?: string; m?: number }) => <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000"} emissiveIntensity={e ? 0.35 : 0} flatShading />;

function Box({ p, s, c, rot }: { p: [number, number, number]; s: [number, number, number]; c: string; rot?: [number, number, number] }) {
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={s} />
      <M c={c} />
    </mesh>
  );
}
function Cyl({ p, r1, r2, h, c, seg = 16 }: { p: [number, number, number]; r1: number; r2: number; h: number; c: string; seg?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r2, r1, h, seg]} />
      <M c={c} />
    </mesh>
  );
}
function Dome({ p, r, c, onion = 1.25, spire = true }: { p: [number, number, number]; r: number; c: string; onion?: number; spire?: boolean }) {
  return (
    <group position={p}>
      <mesh scale={[1, onion, 1]} castShadow>
        <sphereGeometry args={[r, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <M c={c} r={0.5} />
      </mesh>
      {spire && (
        <mesh position={[0, r * onion * 0.95 + r * 0.35, 0]}>
          <coneGeometry args={[r * 0.12, r * 0.8, 8]} />
          <M c="#e2b33c" r={0.3} m={0.6} />
        </mesh>
      )}
    </group>
  );
}

function Taj() {
  const W = "#f6f3ec";
  return (
    <group>
      <Box p={[0, 1.5, 0]} s={[70, 3, 70]} c="#efe7d8" />
      <Box p={[0, 3 + 12, 0]} s={[30, 24, 30]} c={W} />
      {/* arches */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, 0, 0]}>
          <mesh position={[0, 13, 15.05]}>
            <planeGeometry args={[9, 16]} />
            <M c="#cfc6b4" />
          </mesh>
        </mesh>
      ))}
      <Cyl p={[0, 30, 0]} r1={10} r2={10} h={6} c={W} seg={24} />
      <Dome p={[0, 33, 0]} r={11} c={W} onion={1.35} />
      {[
        [-10, -10],
        [10, -10],
        [-10, 10],
        [10, 10],
      ].map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl p={[x, 28.5, z]} r1={3.2} r2={3.2} h={3} c={W} />
          <Dome p={[x, 30, z]} r={3.4} c={W} />
        </group>
      ))}
      {[
        [-31, -31],
        [31, -31],
        [-31, 31],
        [31, 31],
      ].map(([x, z]) => (
        <group key={`m${x}${z}`}>
          <Cyl p={[x, 3 + 20, z]} r1={2.1} r2={1.6} h={40} c={W} />
          {[12, 24, 36].map((y) => (
            <Cyl key={y} p={[x, 3 + y, z]} r1={2.6} r2={2.6} h={0.8} c="#e4dccd" />
          ))}
          <Dome p={[x, 43.5, z]} r={2.2} c={W} onion={1} />
        </group>
      ))}
      {/* the long reflecting pool and cypress trees */}
      <mesh position={[0, 0.25, 85]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 90]} />
        <meshStandardMaterial color="#5fb7e0" roughness={0.1} metalness={0.3} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <group key={i}>
          {[-9, 9].map((x) => (
            <mesh key={x} position={[x, 5, 44 + i * 7.5]} castShadow>
              <coneGeometry args={[1.5, 10, 8]} />
              <M c="#2f7a46" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Qutub() {
  const tiers: [number, number, number][] = [
    [7, 6, 24],
    [5.8, 5, 16],
    [4.8, 4.1, 13],
    [4, 3.4, 10],
    [3.3, 2.6, 10],
  ];
  let y = 0;
  return (
    <group>
      <Box p={[0, 0.6, 0]} s={[30, 1.2, 30]} c="#d8c2a0" />
      {tiers.map(([a, b, h], i) => {
        const g = (
          <group key={i}>
            <Cyl p={[0, y + 1.2 + h / 2, 0]} r1={a} r2={b} h={h} c={i % 2 ? "#c9a274" : "#b5653d"} seg={20} />
            <Cyl p={[0, y + 1.2 + h, 0]} r1={b + 1.2} r2={b + 1.2} h={0.9} c="#e8d6b8" seg={20} />
          </group>
        );
        y += h;
        return g;
      })}
      <Dome p={[0, y + 1.6, 0]} r={2.2} c="#e8d6b8" onion={0.9} />
      {/* ruins nearby */}
      {[-18, -12, 12, 18].map((x) => (
        <Box key={x} p={[x, 4, -12]} s={[2, 8, 2]} c="#c9a274" />
      ))}
      <Box p={[0, 8.5, -12]} s={[40, 1.5, 2.5]} c="#c9a274" />
    </group>
  );
}

function Eiffel() {
  const C = "#9a6b45";
  const legs: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  return (
    <group>
      {legs.map(([sx, sz]) => (
        <Box key={`${sx}${sz}`} p={[sx * 18, 22, sz * 18]} s={[7, 50, 7]} c={C} rot={[sz * 0.36, 0, -sx * 0.36]} />
      ))}
      <Box p={[0, 44, 0]} s={[44, 3, 44]} c="#7d5638" />
      {/* arches between legs */}
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation={[0, r, 0]} position={[0, 30, 0]}>
          <torusGeometry args={[16, 1.2, 8, 24, Math.PI]} />
          <M c={C} />
        </mesh>
      ))}
      <mesh position={[0, 75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[6, 17, 60, 4]} />
        <M c={C} />
      </mesh>
      <Box p={[0, 106, 0]} s={[14, 2.5, 14]} c="#7d5638" />
      <mesh position={[0, 135, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[1.2, 6, 56, 4]} />
        <M c={C} />
      </mesh>
      <Cyl p={[0, 168, 0]} r1={0.6} r2={0.2} h={12} c="#c8c8c8" />
    </group>
  );
}

function Gateway() {
  const S = "#e0b98a";
  return (
    <group>
      <Box p={[-11, 13, 0]} s={[10, 26, 12]} c={S} />
      <Box p={[11, 13, 0]} s={[10, 26, 12]} c={S} />
      <Box p={[0, 29, 0]} s={[32, 6, 12]} c={S} />
      <mesh position={[0, 24, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[6, 6, 12, 24, 1, false, 0, Math.PI]} />
        <M c={S} />
      </mesh>
      {[-14, -5, 5, 14].map((x) => (
        <Dome key={x} p={[x, 32, 0]} r={2.2} c="#f0d2a8" onion={1} />
      ))}
      <Box p={[0, 0.4, 25]} s={[60, 0.8, 30]} c="#d9d0bf" />
    </group>
  );
}

function BigBen() {
  return (
    <group>
      <Box p={[0, 30, 0]} s={[12, 60, 12]} c="#c9a06a" />
      <Box p={[0, 66, 0]} s={[14, 12, 14]} c="#d8b47c" />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[0, 66, 7.05]}>
            <circleGeometry args={[4.6, 32]} />
            <meshStandardMaterial color="#fffdf2" emissive="#fff2c0" emissiveIntensity={0.25} />
          </mesh>
        </mesh>
      ))}
      <mesh position={[0, 82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[9.5, 20, 4]} />
        <M c="#3d5a4a" />
      </mesh>
      <Box p={[-40, 12, 0]} s={[60, 24, 14]} c="#c9a06a" />
    </group>
  );
}

function Pyramids() {
  return (
    <group>
      {[
        [0, 0, 70],
        [-62, -58, 46],
        [60, 48, 32],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, (s * 0.64) / 2, z]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <coneGeometry args={[s * 0.75, s * 0.64 * 1, 4]} />
          <M c={i ? "#d9b47a" : "#e3c08a"} />
        </mesh>
      ))}
    </group>
  );
}

function Burj() {
  const tiers: [number, number][] = [
    [26, 80],
    [20, 70],
    [15, 70],
    [11, 60],
    [7, 50],
    [4, 40],
  ];
  let y = 0;
  return (
    <group>
      {tiers.map(([w, h], i) => {
        const g = (
          <mesh key={i} position={[0, y + h / 2, 0]} castShadow>
            <cylinderGeometry args={[w * 0.5, w * 0.58, h, 6]} />
            <meshStandardMaterial color="#c8dbe8" roughness={0.15} metalness={0.7} />
          </mesh>
        );
        y += h;
        return g;
      })}
      <Cyl p={[0, y + 30, 0]} r1={1.5} r2={0.3} h={60} c="#d7e3ec" />
    </group>
  );
}

function Liberty() {
  const G = "#7fbfa8";
  return (
    <group>
      <Box p={[0, 6, 0]} s={[28, 12, 28]} c="#c9bba3" />
      <Box p={[0, 20, 0]} s={[14, 16, 14]} c="#d8ccb5" />
      <mesh position={[0, 38, 0]} castShadow>
        <coneGeometry args={[6, 22, 12]} />
        <M c={G} />
      </mesh>
      <mesh position={[0, 51, 0]}>
        <sphereGeometry args={[3.2, 16, 12]} />
        <M c={G} />
      </mesh>
      <Box p={[3, 54, 0]} s={[1.6, 12, 1.6]} c={G} rot={[0, 0, -0.25]} />
      <mesh position={[4.6, 61, 0]}>
        <sphereGeometry args={[1.4, 12, 8]} />
        <meshStandardMaterial color="#ffd24a" emissive="#ffb000" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function Golden() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#5fb7e0" roughness={0.08} metalness={0.3} />
      </mesh>
      <Box p={[0, 0.6, 30]} s={[6, 1.2, 40]} c="#f4f1ea" />
      <Box p={[0, 7, 0]} s={[20, 13, 20]} c="#e7b931" />
      <Dome p={[0, 13.5, 0]} r={6} c="#f1c232" onion={1.2} />
      {[-8, 8].map((x) => [-8, 8].map((z) => <Dome key={`${x}${z}`} p={[x, 13.5, z]} r={1.6} c="#f1c232" onion={1.1} />))}
      <Box p={[0, 6, -60]} s={[120, 12, 10]} c="#f4f1ea" />
    </group>
  );
}

function Colosseum() {
  return (
    <group>
      <mesh position={[0, 16, 0]} scale={[1.25, 1, 1]} castShadow>
        <cylinderGeometry args={[45, 45, 32, 48, 1, true]} />
        <meshStandardMaterial color="#e2b98c" side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0, 12, 0]} scale={[1.25, 1, 1]}>
        <cylinderGeometry args={[33, 33, 24, 48, 1, true]} />
        <meshStandardMaterial color="#cfa477" side={THREE.DoubleSide} flatShading />
      </mesh>
      {Array.from({ length: 40 }).map((_, i) => {
        const a = (i / 40) * Math.PI * 2;
        return [6, 14, 22].map((y) => (
          <mesh key={`${i}${y}`} position={[Math.cos(a) * 45.3 * 1.25, y, Math.sin(a) * 45.3]} rotation={[0, -a + Math.PI / 2, 0]}>
            <planeGeometry args={[3.4, 5.5]} />
            <meshStandardMaterial color="#6b4a33" side={THREE.DoubleSide} />
          </mesh>
        ));
      })}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 1, 1]}>
        <circleGeometry args={[33, 40]} />
        <M c="#d9c19a" />
      </mesh>
    </group>
  );
}

function Generic({ label }: { label: string }) {
  return (
    <group>
      <Box p={[0, 2, 0]} s={[16, 4, 16]} c="#d9d0bf" />
      <mesh position={[0, 22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[1.4, 3.2, 36, 4]} />
        <M c="#efe7d8" />
      </mesh>
      <mesh position={[0, 41.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.9, 3, 4]} />
        <M c="#e2b33c" m={0.5} />
      </mesh>
      <Html position={[0, 6, 8.2]} center transform distanceFactor={14}>
        <div className="mon-sign">{label}</div>
      </Html>
    </group>
  );
}

function Fountain() {
  return (
    <group>
      <Cyl p={[0, 0.6, 0]} r1={14} r2={14} h={1.2} c="#d9d0bf" seg={32} />
      <mesh position={[0, 1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[12.8, 32]} />
        <meshStandardMaterial color="#6cc3ea" roughness={0.05} metalness={0.3} />
      </mesh>
      <Cyl p={[0, 3, 0]} r1={2} r2={1.2} h={4} c="#efe7d8" />
      <Cyl p={[0, 5.2, 0]} r1={4.5} r2={4.5} h={0.6} c="#efe7d8" seg={24} />
      <mesh position={[0, 7, 0]}>
        <sphereGeometry args={[1.6, 16, 12]} />
        <meshStandardMaterial color="#bfe8ff" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

export const MONUMENT_RADIUS: Record<string, number> = { taj: 36, qutub: 9, eiffel: 26, gateway: 17, bigben: 8, pyramids: 40, burj: 15, liberty: 15, golden: 12, colosseum: 50, generic: 9, fountain: 14 };

export function Monument({ id, label }: { id: string; label: string }): ReactNode {
  switch (id) {
    case "taj":
      return <Taj />;
    case "qutub":
      return <Qutub />;
    case "eiffel":
      return <Eiffel />;
    case "gateway":
      return <Gateway />;
    case "bigben":
      return <BigBen />;
    case "pyramids":
      return <Pyramids />;
    case "burj":
      return <Burj />;
    case "liberty":
      return <Liberty />;
    case "golden":
      return <Golden />;
    case "colosseum":
      return <Colosseum />;
    case "fountain":
      return <Fountain />;
    default:
      return <Generic label={label} />;
  }
}
