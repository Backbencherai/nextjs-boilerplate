"use client";
/* A furnished apartment you can walk into from any building: living room with TV (playing ads),
   kitchen and dining, bedroom with wardrobe, wood floors, ceiling lights and a window over the city. */
import { useMemo } from "react";
import * as THREE from "three";
import { Prop, woodTex } from "./props";

export const ROOM = { x0: -6.5, x1: 6.5, z0: -4.5, z1: 4.5, h: 2.9 };

/** Furniture footprints you bump into (x, z, w, d). */
export const FURNITURE: { x: number; z: number; w: number; d: number }[] = [
  { x: -2.6, z: 0.6, w: 2.3, d: 1.0 }, // sofa
  { x: -2.6, z: -1.0, w: 1.3, d: 0.8 }, // coffee table
  { x: -2.6, z: -3.95, w: 2.1, d: 0.5 }, // TV unit
  { x: -5.6, z: -1.2, w: 1.0, d: 1.0 }, // armchair
  { x: 1.4, z: -3.9, w: 3.3, d: 0.7 }, // kitchen
  { x: 1.4, z: -1.3, w: 1.6, d: 1.6 }, // dining
  { x: 4.9, z: 1.9, w: 1.8, d: 2.2 }, // bed
  { x: 6.1, z: -2.4, w: 0.7, d: 1.9 }, // wardrobe
  { x: -6.2, z: 2.9, w: 0.4, d: 1.1 }, // bookshelf
  // the partition wall between living room and bedroom (with a doorway)
  { x: 3.2, z: 3.3, w: 0.15, d: 2.4 },
  { x: 3.2, z: -2.6, w: 0.15, d: 3.8 },
];

function cityView(night: boolean) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 384;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, 384);
  sky.addColorStop(0, night ? "#0b1230" : "#8ec9ff");
  sky.addColorStop(1, night ? "#2a2f55" : "#e8f4ff");
  g.fillStyle = sky;
  g.fillRect(0, 0, 1024, 384);
  let x = 0;
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  while (x < 1024) {
    const w = 40 + r() * 70;
    const h = 90 + r() * 240;
    const shade = night ? 30 + r() * 30 : 150 + r() * 70;
    g.fillStyle = `rgb(${shade},${shade + 8},${shade + 20})`;
    g.fillRect(x, 384 - h, w, h);
    for (let wy = 384 - h + 8; wy < 384; wy += 14)
      for (let wx = x + 5; wx < x + w - 6; wx += 11) {
        g.fillStyle = night ? (r() < 0.5 ? "#ffd27a" : "#1a1d2b") : "rgba(80,110,150,0.6)";
        g.fillRect(wx, wy, 6, 8);
      }
    x += w + 4;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Apartment({ night, tv, wall = "#efe6d8", lightsOn }: { night: boolean; tv: THREE.Texture; wall?: string; lightsOn: boolean }) {
  const floor = useMemo(() => {
    const t = woodTex().clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  const view = useMemo(() => cityView(night), [night]);
  const W = ROOM.x1 - ROOM.x0;
  const D = ROOM.z1 - ROOM.z0;
  const H = ROOM.h;
  const wallMat = <meshStandardMaterial color={wall} roughness={0.95} side={THREE.DoubleSide} />;
  return (
    <group>
      <color attach="background" args={[night ? "#0b1230" : "#bfe3ff"]} />
      <hemisphereLight args={["#fff8ee", "#6b5a4a", lightsOn ? 0.9 : 0.25]} />
      {!night && <directionalLight position={[0, 6, 12]} intensity={1.6} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />}
      {lightsOn &&
        [
          [-2.6, -0.6],
          [1.4, -1.3],
          [4.9, 1.5],
        ].map(([x, z], i) => (
          <group key={i} position={[x, H - 0.05, z]}>
            <pointLight intensity={night ? 9 : 4} distance={9} decay={1.6} color="#ffe2b0" castShadow={i === 0} />
            <mesh>
              <cylinderGeometry args={[0.28, 0.28, 0.06, 20]} />
              <meshBasicMaterial color="#fff6dc" toneMapped={false} />
            </mesh>
          </group>
        ))}
      {/* floor, ceiling, walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#f7f4ee" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H / 2, ROOM.z0]}>
        <planeGeometry args={[W, H]} />
        {wallMat}
      </mesh>
      <mesh position={[ROOM.x0, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        {wallMat}
      </mesh>
      <mesh position={[ROOM.x1, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        {wallMat}
      </mesh>
      {/* the window wall: frames around a wide pane with the skyline outside */}
      <group position={[0, 0, ROOM.z1]}>
        <mesh position={[0, H / 2, 0.6]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={view} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[W, 0.9, 0.12]} />
          <meshStandardMaterial color={wall} roughness={0.95} />
        </mesh>
        <mesh position={[0, H - 0.2, 0]}>
          <boxGeometry args={[W, 0.4, 0.12]} />
          <meshStandardMaterial color={wall} roughness={0.95} />
        </mesh>
        {[-6.4, -3.2, 0, 3.2, 6.4].map((x) => (
          <mesh key={x} position={[x, H / 2, 0]}>
            <boxGeometry args={[0.1, H, 0.14]} />
            <meshStandardMaterial color="#2a2d33" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, H / 2 + 0.25, 0.02]}>
          <planeGeometry args={[W, H - 1.3]} />
          <meshPhysicalMaterial color="#cfe6ff" transparent opacity={0.12} roughness={0.02} metalness={0.1} />
        </mesh>
        {/* curtains */}
        {[-5.6, 5.6].map((x) => (
          <mesh key={x} position={[x, H / 2 + 0.1, -0.2]}>
            <boxGeometry args={[1.2, H - 0.3, 0.08]} />
            <meshStandardMaterial color="#c9a27a" roughness={1} />
          </mesh>
        ))}
      </group>
      {/* partition wall with a doorway into the bedroom */}
      <mesh position={[3.2, H / 2, 3.3]}>
        <boxGeometry args={[0.15, H, 2.4]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[3.2, H / 2, -2.6]}>
        <boxGeometry args={[0.15, H, 3.8]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      {/* skirting */}
      <mesh position={[0, 0.05, ROOM.z0 + 0.02]}>
        <boxGeometry args={[W, 0.1, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* furniture made in Blender */}
      <Prop root="Rug" position={[-2.6, 0.01, -0.4]} scale={[1.6, 1, 1.9]} />
      <Prop root="Sofa" position={[-2.6, 0, 0.6]} />
      <Prop root="CoffeeTable" position={[-2.6, 0, -1.0]} />
      <Prop root="TVUnit" position={[-2.6, 0, -4.15]}>
        <mesh position={[0, 1.05, -0.012]}>
          <planeGeometry args={[1.66, 0.96]} />
          <meshBasicMaterial map={tv} toneMapped={false} />
        </mesh>
      </Prop>
      <Prop root="Armchair" position={[-5.6, 0, -1.2]} rotation={[0, -Math.PI / 2 - 0.4, 0]} />
      <Prop root="Bookshelf" position={[-6.25, 0, 2.9]} rotation={[0, Math.PI / 2, 0]} />
      <Prop root="Lamp" position={[-5.7, 0, 1.2]} />
      <Prop root="Plant" position={[-6, 0, -3.9]} />
      <Prop root="Plant" position={[2.6, 0, 3.9]} scale={1.2} />
      <Prop root="Kitchen" position={[1.4, 0, -4.15]} rotation={[0, Math.PI, 0]} />
      <Prop root="Dining" position={[1.4, 0, -1.3]} />
      <Prop root="Bed" position={[4.9, 0, 2.2]} />
      <Prop root="Wardrobe" position={[6.15, 0, -2.4]} rotation={[0, Math.PI / 2, 0]} />
      <Prop root="Lamp" position={[6, 0, 3.9]} scale={0.6} />
      {/* wall art */}
      {[
        [-5.0, "#e76f51"],
        [4.9, "#2a9d8f"],
      ].map(([x, c], i) => (
        <group key={i} position={[x as number, 1.9, ROOM.z0 + 0.03]}>
          <mesh>
            <boxGeometry args={[1.1, 0.75, 0.04]} />
            <meshStandardMaterial color="#2a2d33" />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.98, 0.63]} />
            <meshStandardMaterial color={c as string} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
