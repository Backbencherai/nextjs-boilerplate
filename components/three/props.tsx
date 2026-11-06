"use client";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { seeded } from "@/lib/game/dates";

type V3 = [number, number, number];
type Clickable = { onClick?: (e: ThreeEvent<MouseEvent>) => void };

const flat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => (
  <meshStandardMaterial color={color} flatShading roughness={0.85} {...extra} />
);

/* ───────── Floating island ───────── */
export function Island({
  position,
  radius,
  grass = "#86c95b",
  seed = "isle",
  onGround,
  children,
}: {
  position: V3;
  radius: number;
  grass?: string;
  seed?: string;
  onGround?: (e: ThreeEvent<MouseEvent>) => void;
  children?: ReactNode;
}) {
  const rock = useMemo(() => {
    const g = new THREE.ConeGeometry(radius * 0.98, radius * 1.25, 11, 3, true);
    g.rotateX(Math.PI);
    const r = seeded(seed);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > radius * 0.6) continue;
      pos.setX(i, pos.getX(i) * (0.85 + r() * 0.3));
      pos.setZ(i, pos.getZ(i) * (0.85 + r() * 0.3));
      pos.setY(i, y + (r() - 0.5) * 0.5);
    }
    g.computeVertexNormals();
    return g;
  }, [radius, seed]);

  return (
    <group position={position}>
      {/* grass top */}
      <mesh position={[0, -0.15, 0]} receiveShadow onClick={onGround}>
        <cylinderGeometry args={[radius, radius * 0.97, 0.3, 28]} />
        {flat(grass)}
      </mesh>
      {/* soil band */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[radius * 0.97, radius * 0.93, 0.5, 14]} />
        {flat("#9b6a43")}
      </mesh>
      {/* rocky underside */}
      <mesh geometry={rock} position={[0, -0.8 - radius * 0.62, 0]}>
        {flat("#7a6a5c", { side: THREE.DoubleSide })}
      </mesh>
      {children}
    </group>
  );
}

export function Bridge({ from, to, onGround }: { from: [number, number]; to: [number, number]; onGround?: (e: ThreeEvent<MouseEvent>) => void }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz);
  const planks = Math.floor(len / 0.45);
  return (
    <group position={[(from[0] + to[0]) / 2, -0.08, (from[1] + to[1]) / 2]} rotation={[0, ang, 0]}>
      <mesh receiveShadow onClick={onGround} position={[0, -0.02, 0]}>
        <boxGeometry args={[1.5, 0.06, len]} />
        <meshStandardMaterial color="#6d4b31" transparent opacity={0} />
      </mesh>
      {Array.from({ length: planks }).map((_, i) => (
        <mesh key={i} position={[0, 0, -len / 2 + 0.25 + i * 0.45]} castShadow receiveShadow rotation={[0, (i % 3) * 0.02, 0]}>
          <boxGeometry args={[1.45, 0.08, 0.38]} />
          {flat(i % 2 ? "#b07b4f" : "#a06d43")}
        </mesh>
      ))}
      {[-0.75, 0.75].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.32, 0]}>
            <boxGeometry args={[0.06, 0.06, len]} />
            {flat("#7a5232")}
          </mesh>
          {Array.from({ length: Math.ceil(len / 1.6) + 1 }).map((_, i) => (
            <mesh key={i} position={[x, 0.16, -len / 2 + i * 1.6]} castShadow>
              <boxGeometry args={[0.1, 0.42, 0.1]} />
              {flat("#6b4529")}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ───────── Nature ───────── */
export function Tree({ position, scale = 1, color = "#5fae4a", variant = 0 }: { position: V3; scale?: number; color?: string; variant?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.9, 6]} />
        {flat("#7b5233")}
      </mesh>
      {variant % 2 === 0 ? (
        <>
          <mesh position={[0, 1.15, 0]} castShadow>
            <icosahedronGeometry args={[0.55, 0]} />
            {flat(color)}
          </mesh>
          <mesh position={[0.25, 1.5, 0.1]} castShadow>
            <icosahedronGeometry args={[0.38, 0]} />
            {flat(color)}
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.05, 0]} castShadow>
            <coneGeometry args={[0.55, 0.9, 7]} />
            {flat(color)}
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <coneGeometry args={[0.4, 0.7, 7]} />
            {flat(color)}
          </mesh>
        </>
      )}
    </group>
  );
}

export function Rock({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow rotation={[0.3, position[0], 0.1]}>
      <dodecahedronGeometry args={[0.3, 0]} />
      {flat("#a9a29a")}
    </mesh>
  );
}

export function Flower({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.24, 4]} />
        {flat("#4f8f37")}
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color={color} flatShading emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export function Cloud({ position, scale = 1, speed = 0.2 }: { position: V3; scale?: number; speed?: number }) {
  const g = useRef<THREE.Group>(null);
  const x0 = position[0];
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = x0 + Math.sin(clock.elapsedTime * speed) * 3;
  });
  return (
    <group ref={g} position={position} scale={scale}>
      {[
        [0, 0, 0, 1],
        [0.9, -0.1, 0.1, 0.75],
        [-0.9, -0.15, 0, 0.7],
        [0.3, 0.4, -0.1, 0.65],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={s}>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial color="#fff8f0" flatShading roughness={1} transparent opacity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────── Buildings & landmarks ───────── */
export function House({ position, rotation = 0, wall, roof, onClick }: { position: V3; rotation?: number; wall: string; roof: string } & Clickable) {
  const smoke = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    smoke.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.4 + i / 3) % 1;
      c.position.y = t * 1.2;
      c.scale.setScalar(0.1 + t * 0.25);
      ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.6 * (1 - t);
    });
  });
  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={onClick}>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.4, 1.7]} />
        {flat(wall)}
      </mesh>
      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.65, 0.9, 4]} />
        {flat(roof)}
      </mesh>
      <mesh position={[0, 0.45, 0.86]}>
        <boxGeometry args={[0.45, 0.85, 0.05]} />
        {flat("#6b4529")}
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.85, 0.86]}>
          <boxGeometry args={[0.38, 0.34, 0.05]} />
          <meshStandardMaterial color="#ffe3a3" emissive="#ffb84d" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh position={[0.6, 2, -0.3]} castShadow>
        <boxGeometry args={[0.25, 0.7, 0.25]} />
        {flat("#8a7b70")}
      </mesh>
      <group ref={smoke} position={[0.6, 2.4, -0.3]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#efe9e2" transparent opacity={0.5} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Library({ position, books = 0, onClick }: { position: V3; books?: number } & Clickable) {
  const n = Math.min(24, 4 + books);
  const colors = ["#e76f51", "#2a9d8f", "#e9c46a", "#6d6875", "#457b9d", "#f4a261"];
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[3, 0.3, 2.2]} />
        {flat("#d8c7b0")}
      </mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.85]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 1.6, 8]} />
          {flat("#efe3d0")}
        </mesh>
      ))}
      <mesh position={[0, 1.1, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.6, 1.3]} />
        {flat("#c9a27e")}
      </mesh>
      <mesh position={[0, 2.15, 0.1]} castShadow>
        <boxGeometry args={[3.2, 0.25, 2.1]} />
        {flat("#8c5a3c")}
      </mesh>
      <mesh position={[0, 2.5, 0.1]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.01, 1.6, 0.5, 4, 1]} />
        {flat("#8c5a3c")}
      </mesh>
      {/* books stack grows with study hours */}
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[1.9, 0.38 + (i % 12) * 0.1, (i >= 12 ? 0.35 : -0.05) + 0.4]} rotation={[0, (i * 0.37) % 0.5, 0]} castShadow>
          <boxGeometry args={[0.5, 0.09, 0.36]} />
          {flat(colors[i % colors.length])}
        </mesh>
      ))}
    </group>
  );
}

export function Gym({ position, plates = 0, onClick }: { position: V3; plates?: number } & Clickable) {
  const dumb = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (dumb.current) dumb.current.position.y = 1.15 + Math.max(0, Math.sin(clock.elapsedTime * 1.8)) * 0.5;
  });
  const n = Math.min(6, 1 + Math.floor(plates / 2));
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[3, 0.2, 2.4]} />
        {flat("#3d3a4b")}
      </mesh>
      {/* squat rack */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 1, -0.5]} castShadow>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          {flat("#e63946")}
        </mesh>
      ))}
      <group ref={dumb} position={[0, 1.15, -0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
          <meshStandardMaterial color="#cfd6df" metalness={0.6} roughness={0.3} />
        </mesh>
        {Array.from({ length: n }).map((_, i) =>
          [-1, 1].map((s) => (
            <mesh key={`${i}${s}`} position={[s * (0.75 + i * 0.07), 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.3 - i * 0.02, 0.3 - i * 0.02, 0.06, 14]} />
              {flat("#22223b")}
            </mesh>
          ))
        )}
      </group>
      {/* bench */}
      <mesh position={[0, 0.45, 0.5]} castShadow>
        <boxGeometry args={[0.5, 0.12, 1.2]} />
        {flat("#1d3557")}
      </mesh>
      {[-0.4, 0.4].map((z) => (
        <mesh key={z} position={[0, 0.27, 0.5 + z]}>
          <boxGeometry args={[0.1, 0.35, 0.1]} />
          {flat("#999")}
        </mesh>
      ))}
      {/* kettlebells */}
      {[-1.2, 1.2].map((x) => (
        <group key={x} position={[x, 0.38, 0.7]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 10, 10]} />
            {flat("#ff9f1c")}
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.1, 0.03, 6, 12]} />
            {flat("#333")}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Garden({ position, growth = 0, onClick }: { position: V3; growth?: number } & Clickable) {
  const s = 0.35 + Math.min(1, growth / 30) * 0.65;
  const veg = ["#e63946", "#ff9f1c", "#7ed957", "#9b5de5"];
  return (
    <group position={position} onClick={onClick}>
      {[-0.8, 0.8].map((x, bi) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.3, 2.4]} />
            {flat("#8b5a3c")}
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[1.05, 0.04, 2.25]} />
            {flat("#5a3b28")}
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => (
            <group key={i} position={[(i % 2) * 0.45 - 0.22, 0.33, -0.9 + Math.floor(i / 2) * 0.6]} scale={s}>
              <mesh position={[0, 0.15, 0]}>
                <coneGeometry args={[0.15, 0.35, 5]} />
                {flat("#5fae4a")}
              </mesh>
              <mesh position={[0, 0.35, 0]}>
                <icosahedronGeometry args={[0.09, 0]} />
                {flat(veg[(i + bi) % veg.length])}
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* scarecrow-ish sign */}
      <mesh position={[0, 0.6, -1.5]} castShadow>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        {flat("#7b5233")}
      </mesh>
      <mesh position={[0, 1.05, -1.48]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.06]} />
        {flat("#f1e3c6")}
      </mesh>
    </group>
  );
}

export function Spring({ position, onClick, onDuck, night }: { position: V3; onDuck?: () => void; night?: boolean } & Clickable) {
  const duck = useRef<THREE.Group>(null);
  const hop = useRef(0);
  useFrame(({ clock }, dt) => {
    if (!duck.current) return;
    const t = clock.elapsedTime * 0.4;
    duck.current.position.set(Math.cos(t) * 0.8, 0.12 + Math.sin(hop.current * Math.PI) * 0.6, Math.sin(t) * 0.8);
    duck.current.rotation.y = -t + (hop.current > 0 ? hop.current * Math.PI * 2 : 0);
    hop.current = Math.max(0, hop.current - dt * 1.5);
  });
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.06, 20]} />
        <meshStandardMaterial color={night ? "#2b6f9e" : "#58c4e8"} roughness={0.1} metalness={0.2} transparent opacity={0.9} emissive="#2aa4d6" emissiveIntensity={night ? 0.4 : 0.1} />
      </mesh>
      {Array.from({ length: 11 }).map((_, i) => {
        const a = (i / 11) * Math.PI * 2;
        return <Rock key={i} position={[Math.cos(a) * 1.6, 0.08, Math.sin(a) * 1.6]} scale={0.7 + (i % 3) * 0.2} />;
      })}
      {/* meditation stone */}
      <mesh position={[0, 0.12, 2.2]} castShadow>
        <cylinderGeometry args={[0.45, 0.5, 0.2, 10]} />
        {flat("#d9d3cc")}
      </mesh>
      <group
        ref={duck}
        onClick={(e) => {
          e.stopPropagation();
          hop.current = 1;
          onDuck?.();
        }}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.16, 10, 10]} />
          {flat("#ffd23f")}
        </mesh>
        <mesh position={[0.12, 0.14, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          {flat("#ffd23f")}
        </mesh>
        <mesh position={[0.22, 0.13, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.1, 5]} />
          {flat("#ff7b00")}
        </mesh>
      </group>
    </group>
  );
}

export function HallOfFame({ position, glow = 0, onClick }: { position: V3; glow?: number } & Clickable) {
  return (
    <group position={position} onClick={onClick}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.1 + i * 0.2, 0.3 - i * 0.12]} receiveShadow castShadow>
          <boxGeometry args={[3.6 - i * 0.3, 0.2, 2.4 - i * 0.2]} />
          {flat("#efe4d2")}
        </mesh>
      ))}
      {[-1.3, -0.45, 0.45, 1.3].map((x) => (
        <mesh key={x} position={[x, 1.45, 0.75]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 1.9, 10]} />
          {flat("#fbf4e8")}
        </mesh>
      ))}
      <mesh position={[0, 1.4, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.9, 1]} />
        {flat("#e9dcc6")}
      </mesh>
      <mesh position={[0, 2.5, 0.2]} castShadow>
        <boxGeometry args={[3.4, 0.25, 1.9]} />
        {flat("#d8c3a0")}
      </mesh>
      <mesh position={[0, 2.95, 0.2]} rotation={[0, Math.PI / 4, 0]} scale={[1.7, 1, 0.8]} castShadow>
        <coneGeometry args={[1.3, 0.7, 4]} />
        {flat("#c9a227")}
      </mesh>
      {/* golden trophy on top */}
      <mesh position={[0, 3.55, 0.2]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={0.5 + glow * 0.1} metalness={0.5} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1.4, 1.2]} intensity={2 + glow} distance={5} color="#ffcf7a" />
    </group>
  );
}

export function QuestBoard({ position, rotation = 0, notes = 3, onClick }: { position: V3; rotation?: number; notes?: number } & Clickable) {
  const paper = ["#fff3c4", "#ffd6e0", "#d0f4de", "#cde7ff", "#ffe5b4"];
  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={onClick}>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]} castShadow>
          <boxGeometry args={[0.12, 1.6, 0.12]} />
          {flat("#6b4529")}
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.8, 1, 0.08]} />
        {flat("#b98552")}
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[2, 0.12, 0.3]} />
        {flat("#7b4a2b")}
      </mesh>
      {Array.from({ length: Math.min(7, notes) }).map((_, i) => (
        <mesh key={i} position={[-0.6 + (i % 4) * 0.4, 1.35 - Math.floor(i / 4) * 0.42, 0.05]} rotation={[0, 0, ((i * 7) % 5) * 0.05 - 0.1]}>
          <boxGeometry args={[0.3, 0.34, 0.01]} />
          {flat(paper[i % paper.length])}
        </mesh>
      ))}
    </group>
  );
}

export function Bonfire({ position, power = 0, onClick }: { position: V3; power?: number } & Clickable) {
  const flames = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flames.current?.children.forEach((c, i) => {
      c.scale.y = 1 + Math.sin(t * 9 + i * 2) * 0.18;
      c.rotation.y = t * (0.5 + i * 0.3);
    });
    if (light.current) light.current.intensity = 3 + power * 0.4 + Math.sin(t * 13) * 0.5;
  });
  const s = 0.7 + Math.min(1, power / 10) * 0.6;
  return (
    <group position={position} onClick={onClick}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, (i * Math.PI) / 4]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1, 6]} />
          {flat("#6b4529")}
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Rock key={i} position={[Math.cos(a) * 0.65, 0.05, Math.sin(a) * 0.65]} scale={0.5} />;
      })}
      <group ref={flames} scale={s}>
        <mesh position={[0, 0.5, 0]}>
          <coneGeometry args={[0.32, 0.9, 6]} />
          <meshBasicMaterial color="#ff7b00" />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.2, 0.6, 6]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 1, 0]} color="#ff9d4d" distance={8} intensity={3} />
    </group>
  );
}

export function Observatory({ position, onClick }: { position: V3 } & Clickable) {
  const scope = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (scope.current) scope.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.8;
  });
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.1, 1.4, 12]} />
        {flat("#f1e6d6")}
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {flat("#5b6c8f")}
      </mesh>
      <group ref={scope} position={[0, 1.9, 0]}>
        <mesh rotation={[0.9, 0, 0]} position={[0, 0.2, 0.3]} castShadow>
          <cylinderGeometry args={[0.1, 0.16, 1, 10]} />
          <meshStandardMaterial color="#ffb23f" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
      <mesh position={[0, 0.4, 1.02]}>
        <boxGeometry args={[0.45, 0.8, 0.05]} />
        {flat("#6b4529")}
      </mesh>
    </group>
  );
}

export function Lamp({ position, on }: { position: V3; on: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.4, 6]} />
        {flat("#3a3a3a")}
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial color={on ? "#ffe8a3" : "#f6f1e6"} emissive="#ffc35c" emissiveIntensity={on ? 1.6 : 0.05} />
      </mesh>
      {on && <pointLight position={[0, 1.5, 0]} color="#ffc35c" intensity={1.6} distance={4.5} />}
    </group>
  );
}

/** Personal focus crystal — grows with study hours. */
export function FocusCrystal({ position, hours, color }: { position: V3; hours: number; color: string }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) {
      g.current.rotation.y = clock.elapsedTime * 0.5;
      g.current.position.y = 0.6 + Math.sin(clock.elapsedTime * 1.4) * 0.08;
    }
  });
  const h = 0.4 + Math.min(2.2, Math.sqrt(hours) * 0.35);
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.2, 8]} />
        {flat("#cfc6bb")}
      </mesh>
      <group ref={g}>
        <mesh scale={[0.5, h, 0.5]} castShadow>
          <octahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} flatShading transparent opacity={0.88} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
}

/** Personal strength cairn — one stone per 2 workout hours. */
export function StrengthCairn({ position, hours }: { position: V3; hours: number }) {
  const n = Math.min(9, 1 + Math.floor(hours / 2));
  return (
    <group position={position}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[(i % 2) * 0.05, 0.12 + i * 0.2, 0]} rotation={[0, i * 0.8, 0]} scale={[1 - i * 0.07, 0.6, 1 - i * 0.07]} castShadow>
          <dodecahedronGeometry args={[0.3, 0]} />
          {flat(i % 2 ? "#a9a29a" : "#8f877e")}
        </mesh>
      ))}
    </group>
  );
}

export function Glowcap({ position, onClick, found }: { position: V3; found: boolean } & Clickable) {
  const g = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (g.current) (g.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  return (
    <group position={position} onClick={onClick} scale={found ? 1.2 : 0.8}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.2, 6]} />
        {flat("#f3ead8")}
      </mesh>
      <mesh ref={g} position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b388ff" emissive="#9d4edd" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export function Bottle({ position, glowing, onClick }: { position: V3; glowing: boolean } & Clickable) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2) * 0.06;
    g.current.rotation.z = 1.2 + Math.sin(clock.elapsedTime * 1.3) * 0.15;
  });
  return (
    <group ref={g} position={position} onClick={onClick} rotation={[0, 0.4, 1.2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.38, 10]} />
        <meshStandardMaterial color="#9ee6c9" transparent opacity={0.65} roughness={0.1} emissive="#7cf2c9" emissiveIntensity={glowing ? 0.9 : 0.05} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.14, 8]} />
        <meshStandardMaterial color="#9ee6c9" transparent opacity={0.65} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
        {flat("#a0764d")}
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 0.26, 8]} />
        {flat("#f7ecd0")}
      </mesh>
      {glowing && <pointLight color="#7cf2c9" intensity={1.5} distance={3} />}
    </group>
  );
}

export function Coin({ position, onCollected }: { position: V3; onCollected?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    t.current += dt;
    g.current.rotation.y += dt * 2.5;
    g.current.position.y = position[1] + 0.55 + Math.sin(t.current * 3) * 0.1;
    if (onCollected) {
      g.current.scale.multiplyScalar(0.85);
      g.current.position.y += t.current;
    }
  });
  return (
    <group ref={g} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.07, 18]} />
        <meshStandardMaterial color="#ffcf40" emissive="#ffa500" emissiveIntensity={0.45} metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
        <torusGeometry args={[0.18, 0.025, 6, 18]} />
        <meshStandardMaterial color="#fff1a8" emissive="#ffd166" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export function Sign({ position, rotation = 0, color }: { position: V3; rotation?: number; color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.08, 1, 0.08]} />
        {flat("#6b4529")}
      </mesh>
      <mesh position={[0, 0.9, 0.03]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.06]} />
        {flat(color)}
      </mesh>
    </group>
  );
}
