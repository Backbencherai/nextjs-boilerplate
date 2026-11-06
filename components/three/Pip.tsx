"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

/**
 * Pip — the A×D mascot. A soft white cube-creature with a sprout on its head.
 * Its eyes track the pointer, it squashes when it lands and spins when poked.
 */
export function Pip({
  onPoke,
  bounce = true,
  progress,
}: {
  onPoke?: () => void;
  bounce?: boolean;
  /** 0..1 — grows the sprout during loading */
  progress?: number;
}) {
  const g = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const sprout = useRef<Group>(null);
  const spin = useRef(0);
  const t = useRef(0);

  useFrame((state, dt) => {
    t.current += dt;
    const tt = t.current;
    if (g.current) {
      const hop = bounce ? Math.abs(Math.sin(tt * 3.2)) : 0.3 + Math.sin(tt * 1.5) * 0.08;
      g.current.position.y = hop * 0.45;
      if (spin.current > 0) {
        spin.current = Math.max(0, spin.current - dt * 1.6);
        g.current.rotation.y = (1 - spin.current) * Math.PI * 4;
      } else {
        g.current.rotation.y += (state.pointer.x * 0.5 - g.current.rotation.y) * 0.08;
      }
      g.current.rotation.x += (-state.pointer.y * 0.25 - g.current.rotation.x) * 0.08;
      if (bodyRef.current) {
        const squash = bounce ? 1 - Math.max(0, 0.18 - hop) * 1.6 : 1;
        bodyRef.current.scale.set(2 - squash, squash, 2 - squash);
      }
    }
    if (eyes.current) {
      eyes.current.position.x = state.pointer.x * 0.06;
      eyes.current.position.y = 0.08 + state.pointer.y * 0.04;
      eyes.current.scale.y = tt % 3.3 < 0.12 ? 0.1 : 1;
    }
    if (sprout.current) {
      const target = progress === undefined ? 1 : 0.2 + progress * 0.8;
      const s = sprout.current.scale.x + (target - sprout.current.scale.x) * 0.1;
      sprout.current.scale.setScalar(s);
      sprout.current.rotation.z = Math.sin(tt * 2.5) * 0.15;
    }
  });

  return (
    <group
      ref={g}
      onClick={(e) => {
        e.stopPropagation();
        spin.current = 1;
        onPoke?.();
      }}
    >
      <group ref={bodyRef}>
        <RoundedBox args={[0.8, 0.7, 0.7]} radius={0.18} smoothness={4} castShadow>
          <meshStandardMaterial color="#fbf7ef" roughness={0.35} />
        </RoundedBox>
        <group ref={eyes} position={[0, 0.08, 0.36]}>
          <mesh position={[-0.15, 0, 0]}>
            <capsuleGeometry args={[0.04, 0.07, 4, 8]} />
            <meshBasicMaterial color="#1c140f" />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <capsuleGeometry args={[0.04, 0.07, 4, 8]} />
            <meshBasicMaterial color="#1c140f" />
          </mesh>
        </group>
        <mesh position={[-0.26, -0.06, 0.355]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color="#ffa8a8" />
        </mesh>
        <mesh position={[0.26, -0.06, 0.355]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color="#ffa8a8" />
        </mesh>
        <group ref={sprout} position={[0, 0.35, 0]} scale={0.2}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.24, 6]} />
            <meshStandardMaterial color="#5c9e3c" />
          </mesh>
          <mesh position={[0.09, 0.25, 0]} rotation={[0, 0, -0.7]} scale={[1, 0.45, 0.6]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color="#7ed957" roughness={0.5} />
          </mesh>
          <mesh position={[-0.09, 0.22, 0]} rotation={[0, 0, 0.7]} scale={[1, 0.45, 0.6]}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color="#9be36b" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
