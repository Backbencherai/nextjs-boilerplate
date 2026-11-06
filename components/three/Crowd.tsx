"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { seeded } from "@/lib/game/dates";
import { Asset } from "./assets";

/**
 * A crowd of tiny doodle "sprouts" that amble around inside a circle.
 * Purely ambient life for the scenery — each one hops when poked.
 */
export function Crowd({
  count = 24,
  radius = 6,
  center = [0, 0] as [number, number],
  seed = "crowd",
  accents = ["#2b5a9b", "#c0342a", "#f2c31a"],
  avoid = 0,
}: {
  count?: number;
  radius?: number;
  center?: [number, number];
  seed?: string;
  accents?: string[];
  /** keep this radius around the centre clear */
  avoid?: number;
}) {
  const agents = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = avoid + r() * (radius - avoid);
      return {
        x: center[0] + Math.cos(a) * d,
        z: center[1] + Math.sin(a) * d,
        heading: r() * Math.PI * 2,
        speed: 0.35 + r() * 0.5,
        turn: (r() - 0.5) * 0.8,
        phase: r() * 10,
        hat: i % 4 === 0 ? accents[i % accents.length] : null,
        scale: 0.8 + r() * 0.35,
        hop: 0,
        pause: 0,
      };
    });
  }, [count, radius, center, seed, accents, avoid]);
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = s.clock.elapsedTime;
    agents.forEach((a, i) => {
      const g = refs.current[i];
      if (!g) return;
      if (a.pause > 0) a.pause -= dt;
      else {
        a.heading += Math.sin(t * 0.3 + a.phase) * a.turn * dt;
        let nx = a.x + Math.sin(a.heading) * a.speed * dt;
        let nz = a.z + Math.cos(a.heading) * a.speed * dt;
        const dx = nx - center[0],
          dz = nz - center[1];
        const d = Math.hypot(dx, dz);
        if (d > radius || d < avoid) {
          a.heading += Math.PI * (0.6 + Math.random() * 0.4);
          nx = a.x;
          nz = a.z;
        }
        a.x = nx;
        a.z = nz;
        if (Math.random() < 0.002) a.pause = 1 + Math.random() * 2;
      }
      a.hop = Math.max(0, a.hop - dt * 1.8);
      const walking = a.pause <= 0;
      g.position.set(a.x, Math.abs(Math.sin(t * 9 + a.phase)) * (walking ? 0.05 : 0) + Math.sin(a.hop * Math.PI) * 0.7, a.z);
      g.rotation.y = a.heading;
      g.rotation.z = walking ? Math.sin(t * 9 + a.phase) * 0.08 : 0;
    });
  });

  return (
    <group>
      {agents.map((a, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          scale={a.scale}
          onClick={(e) => {
            e.stopPropagation();
            a.hop = 1;
          }}
        >
          <Asset name="Sprout" fallback={<group>
          <mesh position={[0, 0.28, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.22, 4, 10]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.58, 0]} castShadow>
            <sphereGeometry args={[0.13, 14, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.045, 0.6, 0.115]} userData={{ noLine: true }}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshBasicMaterial color="#14140f" />
          </mesh>
          <mesh position={[0.045, 0.6, 0.115]} userData={{ noLine: true }}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshBasicMaterial color="#14140f" />
          </mesh>
          </group>} />
          {a.hat && (
            <mesh position={[0, 0.7, 0]} userData={{ keep: true }}>
              <cylinderGeometry args={[0.08, 0.11, 0.07, 10]} />
              <meshStandardMaterial color={a.hat} />
            </mesh>
          )}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[0.2, 16]} />
            <meshBasicMaterial color="#000" transparent opacity={0.12} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
