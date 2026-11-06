"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import { Trophy } from "./three/Trophy";
import { Pip } from "./three/Pip";
import type { AchievementDef } from "@/lib/game/achievements";

function Spinner({ children }: { children: ReactNode }) {
  const g = useRef<Group>(null);
  useFrame((s, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * 1.4;
    g.current.position.y = Math.sin(s.clock.elapsedTime * 2) * 0.06;
  });
  return <group ref={g}>{children}</group>;
}

export default function CelebrationCanvas({ ach }: { ach?: AchievementDef }) {
  return (
    <Canvas camera={{ position: [0, 0, 2.4], fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 2]} intensity={2.5} />
      <Environment resolution={64}>
        <Lightformer intensity={3} position={[0, 2, 3]} scale={[6, 2, 1]} color="#fff4dd" />
        <Lightformer intensity={2} position={[-3, 0, -2]} scale={[2, 6, 1]} color="#ffb27a" />
        <Lightformer intensity={2} position={[3, -1, 1]} scale={[2, 4, 1]} color="#9ad7ff" />
      </Environment>
      <Spinner>
        {ach ? (
          <group scale={1.5}>
            <Trophy shape={ach.shape} tier={ach.tier} />
          </group>
        ) : (
          <group scale={0.9}>
            <Pip bounce />
          </group>
        )}
      </Spinner>
    </Canvas>
  );
}
