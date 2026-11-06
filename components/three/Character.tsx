"use client";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef, type MutableRefObject } from "react";
import { AssetBoundary, nodePos, useAssetClone, useAssets } from "./assets";
import type { Group } from "three";
import type { PlayerId } from "@/lib/types";

export interface MotionRef {
  speed: number; // 0..1
  emote: number; // >0 while emoting (seconds left)
}

const LOOKS: Record<PlayerId, { shirt: string; pants: string; hair: string; shoe: string; extra: string }> = {
  adarsh: { shirt: "#2b5a9b", pants: "#6f6d66", hair: "#14140f", shoe: "#ffffff", extra: "#f2c31a" },
  devanshi: { shirt: "#c0342a", pants: "#6f6d66", hair: "#14140f", shoe: "#ffffff", extra: "#f2c31a" },
};
const SKIN = "#f1d3bd";

function useRig(motion?: MutableRefObject<MotionRef>) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const t0 = useRef(Math.random() * 10);

  useFrame((_, dt) => {
    const m = motion?.current ?? { speed: 0, emote: 0 };
    t0.current += dt;
    const t = t0.current;
    const s = m.speed;
    const swing = Math.sin(t * 11) * 0.7 * s;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.9;
    if (armR.current) armR.current.rotation.x = swing * 0.9;
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(t * 11)) * 0.06 * s + Math.sin(t * 2) * 0.012 * (1 - s);
    }
    if (head.current) head.current.rotation.z = Math.sin(t * 1.6) * 0.04 * (1 - s);
    // blink
    if (eyes.current) eyes.current.scale.y = (t % 4) < 0.12 ? 0.1 : 1;
    // emote: hop + spin + wave
    if (root.current) {
      if (m.emote > 0) {
        m.emote = Math.max(0, m.emote - dt);
        const p = 1 - m.emote / 1.2;
        root.current.position.y = Math.sin(p * Math.PI) * 0.6;
        root.current.rotation.y = p * Math.PI * 2;
        if (armR.current) armR.current.rotation.z = -2.4 + Math.sin(t * 20) * 0.3;
        if (armL.current) armL.current.rotation.z = 2.4 - Math.sin(t * 20) * 0.3;
      } else {
        root.current.position.y *= 0.8;
        root.current.rotation.y *= 0.8;
        if (armR.current) armR.current.rotation.z *= 0.85;
        if (armL.current) armL.current.rotation.z *= 0.85;
      }
    }
  });

  return { root, body, legL, legR, armL, armR, head, eyes };
}

function CharacterProc({
  player,
  motion,
  scale = 1,
  onClick,
}: {
  player: PlayerId;
  motion?: MutableRefObject<MotionRef>;
  scale?: number;
  onClick?: () => void;
}) {
  const L = LOOKS[player];
  const { root, body, legL, legR, armL, armR, head, eyes } = useRig(motion);

  return (
    <group
      scale={scale}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <group ref={root}>
        <group ref={body}>
          {/* legs */}
          {[
            [legL, -0.11],
            [legR, 0.11],
          ].map(([ref, x], i) => (
            <group key={i} ref={ref as MutableRefObject<Group>} position={[x as number, 0.48, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <capsuleGeometry args={[0.085, 0.26, 4, 8]} />
                <meshStandardMaterial color={L.pants} roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.42, 0.04]} castShadow>
                <boxGeometry args={[0.16, 0.09, 0.24]} />
                <meshStandardMaterial color={L.shoe} roughness={0.6} />
              </mesh>
            </group>
          ))}
          {/* torso */}
          <mesh userData={{ keep: true }} position={[0, 0.78, 0]} castShadow>
            <capsuleGeometry args={[0.23, 0.3, 6, 12]} />
            <meshStandardMaterial color={L.shirt} roughness={0.7} />
          </mesh>
          {player === "adarsh" ? (
            // backpack
            <mesh userData={{ keep: true }} position={[0, 0.8, -0.24]} castShadow>
              <boxGeometry args={[0.32, 0.36, 0.14]} />
              <meshStandardMaterial color={L.extra} roughness={0.7} />
            </mesh>
          ) : (
            // scarf
            <mesh userData={{ keep: true }} position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.17, 0.05, 8, 16]} />
              <meshStandardMaterial color={L.extra} roughness={0.7} />
            </mesh>
          )}
          {/* arms */}
          {[
            [armL, -0.3],
            [armR, 0.3],
          ].map(([ref, x], i) => (
            <group key={i} ref={ref as MutableRefObject<Group>} position={[x as number, 0.98, 0]}>
              <mesh userData={{ keep: true }} position={[0, -0.2, 0]} castShadow>
                <capsuleGeometry args={[0.065, 0.26, 4, 8]} />
                <meshStandardMaterial color={L.shirt} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.4, 0]}>
                <sphereGeometry args={[0.07, 10, 10]} />
                <meshStandardMaterial color={SKIN} roughness={0.6} />
              </mesh>
            </group>
          ))}
          {/* head */}
          <group ref={head} position={[0, 1.3, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.27, 20, 20]} />
              <meshStandardMaterial color={SKIN} roughness={0.55} />
            </mesh>
            <group ref={eyes} position={[0, 0.02, 0.24]}>
              <mesh position={[-0.09, 0, 0]}>
                <sphereGeometry args={[0.035, 10, 10]} />
                <meshBasicMaterial color="#1a120d" />
              </mesh>
              <mesh position={[0.09, 0, 0]}>
                <sphereGeometry args={[0.035, 10, 10]} />
                <meshBasicMaterial color="#1a120d" />
              </mesh>
            </group>
            <mesh position={[-0.15, -0.07, 0.2]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ff9a9a" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.15, -0.07, 0.2]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ff9a9a" transparent opacity={0.6} />
            </mesh>
            {/* hair cap */}
            <mesh userData={{ keep: true }} position={[0, 0.05, -0.02]} rotation={[-0.35, 0, 0]} castShadow>
              <sphereGeometry args={[0.29, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color={L.hair} roughness={0.9} />
            </mesh>
            {player === "adarsh" ? (
              <mesh userData={{ keep: true }} position={[0.05, 0.22, 0.14]} rotation={[0.6, 0, -0.3]} castShadow>
                <coneGeometry args={[0.12, 0.22, 6]} />
                <meshStandardMaterial color={L.hair} roughness={0.9} />
              </mesh>
            ) : (
              <>
                <mesh userData={{ keep: true }} position={[0, 0.25, -0.18]} castShadow>
                  <sphereGeometry args={[0.13, 14, 14]} />
                  <meshStandardMaterial color={L.hair} roughness={0.9} />
                </mesh>
                <mesh userData={{ keep: true }} position={[0, -0.12, -0.16]} castShadow>
                  <capsuleGeometry args={[0.2, 0.22, 4, 10]} />
                  <meshStandardMaterial color={L.hair} roughness={0.9} />
                </mesh>
                {/* flower clip */}
                <mesh userData={{ keep: true }} position={[0.2, 0.17, 0.1]}>
                  <icosahedronGeometry args={[0.055, 0]} />
                  <meshStandardMaterial color={L.extra} emissive={L.extra} emissiveIntensity={0.3} />
                </mesh>
              </>
            )}
          </group>
        </group>
      </group>
      {/* blob shadow so characters read well even without shadow maps */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.35, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

type CharProps = { player: PlayerId; motion?: MutableRefObject<MotionRef>; scale?: number; onClick?: () => void };

/** Blender-modelled character: smooth parts with origins at the joints, driven by the same rig. */
function CharacterGLB({ player, motion, scale = 1, onClick }: CharProps) {
  const P = player === "adarsh" ? "A" : "D";
  const nodes = useAssets();
  const { root, body, legL, legR, armL, armR, head, eyes } = useRig(motion);
  const bodyO = useAssetClone(`${P}_Body`);
  const headO = useAssetClone(`${P}_Head`);
  const eyesO = useAssetClone(`${P}_Eyes`);
  const armLO = useAssetClone(`${P}_ArmL`);
  const armRO = useAssetClone(`${P}_ArmR`);
  const legLO = useAssetClone(`${P}_LegL`);
  const legRO = useAssetClone(`${P}_LegR`);
  if (!bodyO || !headO || !eyesO || !armLO || !armRO || !legLO || !legRO) throw new Error("character parts missing");
  const hp = nodePos(nodes, `${P}_Head`);
  const ep = nodePos(nodes, `${P}_Eyes`);
  return (
    <group
      scale={scale}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <group ref={root}>
        <group ref={body}>
          <group ref={legL} position={nodePos(nodes, `${P}_LegL`)}>
            <primitive object={legLO} />
          </group>
          <group ref={legR} position={nodePos(nodes, `${P}_LegR`)}>
            <primitive object={legRO} />
          </group>
          <primitive object={bodyO} />
          <group ref={armL} position={nodePos(nodes, `${P}_ArmL`)}>
            <primitive object={armLO} />
          </group>
          <group ref={armR} position={nodePos(nodes, `${P}_ArmR`)}>
            <primitive object={armRO} />
          </group>
          <group ref={head} position={hp}>
            <primitive object={headO} />
            <group ref={eyes} position={[ep[0] - hp[0], ep[1] - hp[1], ep[2] - hp[2]]}>
              <primitive object={eyesO} />
            </group>
          </group>
        </group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.35, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Character(props: CharProps) {
  const fb = <CharacterProc {...props} />;
  return (
    <AssetBoundary fallback={fb}>
      <Suspense fallback={fb}>
        <CharacterGLB {...props} />
      </Suspense>
    </AssetBoundary>
  );
}
