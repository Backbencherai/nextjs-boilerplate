"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { TIER_COLORS, type Tier, type TrophyShape } from "@/lib/game/achievements";

function starShape(points = 5, outer = 0.45, inner = 0.2) {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}
function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.35);
  s.bezierCurveTo(-0.55, 0.05, -0.35, 0.45, 0, 0.2);
  s.bezierCurveTo(0.35, 0.45, 0.55, 0.05, 0, -0.35);
  return s;
}
function moonShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.42, Math.PI * 0.25, Math.PI * 1.75, false);
  s.absarc(0.16, 0, 0.32, Math.PI * 1.6, Math.PI * 0.4, true);
  return s;
}

const extrude = { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 };

export function Trophy({ shape, tier, locked = false }: { shape: TrophyShape; tier: Tier; locked?: boolean }) {
  const c = TIER_COLORS[tier];
  const mat = useMemo(
    () =>
      locked
        ? new THREE.MeshStandardMaterial({ color: "#2a2420", roughness: 0.9, transparent: true, opacity: 0.55 })
        : new THREE.MeshStandardMaterial({ color: c.base, metalness: 0.75, roughness: 0.22, emissive: new THREE.Color(c.base).multiplyScalar(0.18) }),
    [locked, c.base]
  );
  const geo = useMemo(() => {
    switch (shape) {
      case "star":
        return new THREE.ExtrudeGeometry(starShape(), extrude).center();
      case "heart":
        return new THREE.ExtrudeGeometry(heartShape(), extrude).center();
      case "moon":
        return new THREE.ExtrudeGeometry(moonShape(), extrude).center();
      case "cup": {
        const pts = [
          [0, 0],
          [0.22, 0],
          [0.22, 0.04],
          [0.06, 0.1],
          [0.05, 0.3],
          [0.12, 0.36],
          [0.3, 0.5],
          [0.34, 0.8],
          [0.31, 0.8],
          [0.27, 0.52],
          [0, 0.44],
        ].map(([x, y]) => new THREE.Vector2(x, y));
        const g = new THREE.LatheGeometry(pts, 24);
        g.translate(0, -0.4, 0);
        return g;
      }
      case "drop": {
        const pts: THREE.Vector2[] = [];
        // teardrop curve: x = sin θ · sin(θ/2), y = cos θ
        for (let i = 0; i <= 24; i++) {
          const th = Math.PI - (i / 24) * Math.PI;
          pts.push(new THREE.Vector2(Math.sin(th) * Math.sin(th / 2) * 0.38, Math.cos(th) * 0.42));
        }
        return new THREE.LatheGeometry(pts, 20);
      }
      case "crystal": {
        const g = new THREE.OctahedronGeometry(0.4, 0);
        g.scale(0.7, 1.3, 0.7);
        return g;
      }
      default:
        return null;
    }
  }, [shape]);

  return (
    <group>
      {geo && <mesh geometry={geo} material={mat} castShadow />}
      {shape === "cup" && (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.33, 0.15, 0]} rotation={[0, 0, s * 0.2]} material={mat}>
              <torusGeometry args={[0.1, 0.025, 8, 14, Math.PI * 1.3]} />
            </mesh>
          ))}
        </>
      )}
      {shape === "medal" && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.07, 28]} />
          </mesh>
          <mesh position={[0, 0, 0.04]} material={mat}>
            <torusGeometry args={[0.25, 0.025, 8, 28]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0.45, -0.02]} rotation={[0, 0, s * -0.35]}>
              <boxGeometry args={[0.13, 0.4, 0.02]} />
              <meshStandardMaterial color={locked ? "#2a2420" : s < 0 ? "#e63946" : "#457b9d"} />
            </mesh>
          ))}
        </group>
      )}
      {shape === "book" && (
        <group rotation={[0, 0.3, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.03 - 0.03, -0.2 + i * 0.16, 0]} rotation={[0, i * 0.25, 0]} material={mat} castShadow>
              <boxGeometry args={[0.55, 0.14, 0.4]} />
            </mesh>
          ))}
          <mesh position={[0, 0.25, 0]} material={mat}>
            <octahedronGeometry args={[0.1, 0]} />
          </mesh>
        </group>
      )}
      {shape === "dumbbell" && (
        <group rotation={[0, 0, 0.3]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mat}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 10]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.33, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat} castShadow>
              <cylinderGeometry args={[0.17, 0.17, 0.14, 16]} />
            </mesh>
          ))}
        </group>
      )}
      {shape === "key" && (
        <group rotation={[0, 0, -0.6]}>
          <mesh position={[0, 0.25, 0]} material={mat}>
            <torusGeometry args={[0.15, 0.045, 10, 20]} />
          </mesh>
          <mesh position={[0, -0.1, 0]} material={mat}>
            <boxGeometry args={[0.07, 0.55, 0.06]} />
          </mesh>
          {[0, 1].map((i) => (
            <mesh key={i} position={[0.08, -0.25 - i * 0.12, 0]} material={mat}>
              <boxGeometry args={[0.12, 0.06, 0.06]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
