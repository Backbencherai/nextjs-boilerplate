"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { useStore } from "@/lib/store";
import { ACHIEVEMENTS, TIER_COLORS, progressOf } from "@/lib/game/achievements";
import { PLAYER_META, type PlayerId } from "@/lib/types";
import { Trophy } from "../three/Trophy";
import { Character } from "../three/Character";
import { fmtDate } from "@/lib/game/dates";
import { certFor } from "../fame/Fame";

type Who = PlayerId | "together";
const R = 6.4;

export default function Museum({ who }: { who: Who }) {
  const u = useStore((s) => s.universe);
  const list = useMemo(() => {
    const l = ACHIEVEMENTS.filter((a) => (who === "together" ? a.scope === "shared" : a.scope === "solo"));
    const un = u.unlocks[who];
    return [...l].sort((a, b) => Number(un.has(b.id)) - Number(un.has(a.id)));
  }, [u, who]);
  const [focus, setFocus] = useState<number | null>(null);
  const unlocked = u.unlocks[who];
  const sel = focus !== null ? list[focus] : null;
  const title = who === "together" ? "The Shared Museum" : `${PLAYER_META[who].name}'s Museum`;
  const count = list.filter((a) => unlocked.has(a.id)).length;

  return (
    <div className="world-root museum">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 7, 8.4], fov: 50 }}>
        <MuseumScene who={who} list={list} focus={focus} setFocus={setFocus} />
      </Canvas>
      <div className="hud-top">
        <Link href="/fame" className="hud-chip" aria-label="Back">
          ←
        </Link>
        <div className="hud-chip">
          <b>{title}</b>
          <span className="mono">
            {count}/{list.length}
          </span>
        </div>
      </div>
      <div className="museum-nav">
        <button className="hud-chip" onClick={() => setFocus((f) => (f === null ? 0 : (f - 1 + list.length) % list.length))} aria-label="Previous">
          ‹
        </button>
        <button className="hud-chip" onClick={() => setFocus(null)}>
          overview
        </button>
        <button className="hud-chip" onClick={() => setFocus((f) => (f === null ? 0 : (f + 1) % list.length))} aria-label="Next">
          ›
        </button>
      </div>
      <AnimatePresence>
        {sel && (
          <motion.div key={sel.id} className="zone-card museum-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <div className="zone-icon">{unlocked.has(sel.id) ? sel.icon : "🔒"}</div>
            <div className="zone-text">
              <b>{sel.name}</b>
              <span>{sel.desc}</span>
              {unlocked.has(sel.id) ? (
                <span className="mono small">
                  {TIER_COLORS[sel.tier].label} · unlocked {fmtDate(unlocked.get(sel.id)!)}
                </span>
              ) : (
                <span className="mono small">
                  {(() => {
                    const [c, t] = progressOf(sel, u, who);
                    return `progress ${Math.floor(Math.min(c, t) * 10) / 10} / ${t}`;
                  })()}
                </span>
              )}
            </div>
            {unlocked.has(sel.id) && (
              <button className="btn btn-primary" onClick={() => certFor(sel, who, unlocked.get(sel.id)!)}>
                ⬇ Certificate
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MuseumScene({ who, list, focus, setFocus }: { who: Who; list: typeof ACHIEVEMENTS; focus: number | null; setFocus: (n: number | null) => void }) {
  const u = useStore((s) => s.universe);
  const unlocked = u.unlocks[who];
  const controls = useRef<OrbitImpl>(null);
  const { camera } = useThree();
  const anim = useRef(0);
  const lastFocus = useRef<number | null>(null);
  const target = useRef(new THREE.Vector3(0, 1.2, 0));
  const camGoal = useRef(new THREE.Vector3(0, 7, 8.4));

  useFrame((_, dt) => {
    if (focus !== lastFocus.current) {
      lastFocus.current = focus;
      anim.current = 1.6;
      if (focus === null) {
        target.current.set(0, 1.2, 0);
        camGoal.current.set(0, 7, 8.4);
      } else {
        const a = ((focus + 0.5) / list.length) * Math.PI * 2;
        const px = Math.sin(a) * R,
          pz = Math.cos(a) * R;
        target.current.set(px, 1.5, pz);
        camGoal.current.set(Math.sin(a) * (R - 3.2), 2.2, Math.cos(a) * (R - 3.2));
      }
    }
    if (anim.current > 0 && controls.current) {
      anim.current -= dt;
      const k = 1 - Math.exp(-dt * 4);
      controls.current.target.lerp(target.current, k);
      camera.position.lerp(camGoal.current, k);
      controls.current.update();
    }
  });

  const accent = who === "together" ? "#ffb23f" : PLAYER_META[who].color;

  return (
    <>
      <color attach="background" args={["#1a110b"]} />
      <fog attach="fog" args={["#1a110b", 12, 30]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffe9cc", "#2a1a10", 0.5]} />
      <spotLight position={[0, 9, 0]} angle={0.6} penumbra={0.8} intensity={60} color="#ffd9a8" castShadow />
      <Environment resolution={128}>
        <Lightformer intensity={2.5} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#fff1dd" />
        <Lightformer intensity={1.5} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#ff9d5c" />
        <Lightformer intensity={1.2} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#8fc6ff" />
      </Environment>
      <OrbitControls
        ref={controls as never}
        enablePan={false}
        minDistance={2.2}
        maxDistance={9}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 1.2, 0]}
        onStart={() => (anim.current = 0)}
      />

      {/* floor & walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={() => setFocus(null)}>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color="#5a3a26" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.4, 2.55, 64]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[10, 10, 6, 48, 1, true]} />
        <meshStandardMaterial color="#efe2cd" side={THREE.BackSide} roughness={0.9} />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 9.7, 2.5, Math.cos(a) * 9.7]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.5, 5, 0.3]} />
            <meshStandardMaterial color="#d9c5a6" />
          </mesh>
        );
      })}

      {/* centre statue */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.7, 0.6, 32]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.4} />
        </mesh>
        {who === "together" ? (
          <>
            <group position={[-0.5, 0.6, 0]} scale={1.2}>
              <Character player="adarsh" />
            </group>
            <group position={[0.5, 0.6, 0]} scale={1.2}>
              <Character player="devanshi" />
            </group>
          </>
        ) : (
          <group position={[0, 0.6, 0]} scale={1.3}>
            <Character player={who} />
          </group>
        )}
      </group>

      {list.map((a, i) => {
        const ang = ((i + 0.5) / list.length) * Math.PI * 2;
        const on = unlocked.has(a.id);
        return (
          <group
            key={a.id}
            position={[Math.sin(ang) * R, 0, Math.cos(ang) * R]}
            rotation={[0, ang + Math.PI, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setFocus(i);
            }}
          >
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.8, 1, 0.8]} />
              <meshStandardMaterial color={on ? "#f4ebdd" : "#3b2a1f"} roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.02, 0]}>
              <boxGeometry args={[0.9, 0.05, 0.9]} />
              <meshStandardMaterial color={on ? TIER_COLORS[a.tier].base : "#2a1d14"} metalness={0.5} roughness={0.3} />
            </mesh>
            <Floating on={on} active={focus === i}>
              <Trophy shape={a.shape} tier={a.tier} locked={!on} />
            </Floating>
            {on && <pointLight position={[0, 2.6, 0.4]} intensity={focus === i ? 4 : 1.2} distance={3} color={TIER_COLORS[a.tier].glow} />}
            {focus === i && (
              <Html position={[0, 2.5, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
                <div className="zone-label">{on ? a.name : "???"}</div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}

function Floating({ children, on, active }: { children: React.ReactNode; on: boolean; active: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * (active ? 1.4 : on ? 0.5 : 0.1);
    g.current.position.y = 1.65 + (on ? Math.sin(s.clock.elapsedTime * 1.5) * 0.06 : 0);
    const sc = active ? 1.25 : 1;
    g.current.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.1);
  });
  return <group ref={g}>{children}</group>;
}
