"use client";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CHARACTERS, type CharId } from "@/lib/game/rules";

export type Anim = "idle" | "walk" | "run" | "cheer" | "attack" | "sit" | "interact";
const CLIP: Record<Anim, string> = {
  idle: "Idle",
  walk: "Walking_A",
  run: "Running_A",
  cheer: "Cheer",
  attack: "1H_Melee_Attack_Chop",
  sit: "Sit_Floor_Idle",
  interact: "Interact",
};
const url = (c: CharId) => `/models/${CHARACTERS[c].file}`;
export const preloadHero = (c: CharId) => useGLTF.preload(url(c), false);

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Model({ character, anim = "idle", height = 1.6, onClick }: { character: CharId; anim?: Anim; height?: number; onClick?: () => void }) {
  const { scene, animations } = useGLTF(url(character), false);
  const holder = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const c = skeletonClone(scene) as THREE.Group;
    c.traverse((o) => {
      if (o.name === "Icosphere") o.visible = false;
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.frustumCulled = false;
      }
    });
    c.userData.keep = true;
    const box = new THREE.Box3().setFromObject(c);
    const h = Math.max(0.1, box.max.y - box.min.y);
    c.scale.setScalar(height / h);
    c.position.y = -box.min.y * (height / h);
    return c;
  }, [scene, height]);
  const { actions } = useAnimations(animations, holder);
  const cur = useRef("");
  useEffect(() => {
    const name = CLIP[anim];
    const next = actions[name];
    if (!next || cur.current === name) return;
    const prev = cur.current ? actions[cur.current] : null;
    next.reset().fadeIn(0.25).play();
    if (anim === "cheer" || anim === "attack" || anim === "interact") {
      next.setLoop(THREE.LoopRepeat, Infinity);
    }
    prev?.fadeOut(0.25);
    cur.current = name;
  }, [anim, actions]);
  return (
    <group
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <group ref={holder}>
        <primitive object={model} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.13} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Placeholder({ height = 1.6 }: { height?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (g.current) g.current.position.y = Math.abs(Math.sin(s.clock.elapsedTime * 3)) * 0.08;
  });
  return (
    <group ref={g} scale={height / 1.6}>
      <mesh position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.25, 0.5, 4, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color="#f6e1cf" />
      </mesh>
    </group>
  );
}

/** A player's chosen character, animated. Falls back to a simple figure while loading/offline. */
export function Hero(props: { character: CharId; anim?: Anim; height?: number; onClick?: () => void }) {
  const fb = <Placeholder height={props.height} />;
  return (
    <Boundary fallback={fb}>
      <Suspense fallback={fb}>
        <Model {...props} />
      </Suspense>
    </Boundary>
  );
}
