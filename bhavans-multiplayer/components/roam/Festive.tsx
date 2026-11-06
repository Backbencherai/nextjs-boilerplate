"use client";
/* Festivals you can see and play: diyas, lanterns, Christmas trees, fireworks, Holi colours, snowball fights,
   plus a nightly light-and-fountain show at every monument and a realistic reflective ocean. */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import type { Deco } from "@/lib/game/festivals";

/* round soft sprite for every particle (instead of square points) */
let dotTex: THREE.Texture | null = null;
export function dot() {
  if (dotTex) return dotTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.45, "rgba(255,255,255,0.85)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

/* ───────── shared: where citizens are (for snowball / colour hits) ───────── */
export const npcPos: THREE.Vector3[] = [];
export const score = { hits: 0, gotHit: 0 };

/* ───────── realistic ocean (reflective, animated normals) ───────── */
let normals: THREE.Texture | null = null;
export function waterNormals() {
  if (normals) return normals;
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  // seamless height field from integer-frequency waves, converted to a normal map
  const h = (x: number, y: number) => {
    const u = (x / S) * Math.PI * 2;
    const v = (y / S) * Math.PI * 2;
    return Math.sin(u * 3 + v * 2) * 0.5 + Math.sin(u * 7 - v * 5) * 0.25 + Math.sin(u * 13 + v * 11) * 0.12 + Math.sin(u * 2 - v * 9) * 0.3 + Math.sin(u * 19 + v * 3) * 0.06;
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const n = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize();
      const i = (y * S + x) * 4;
      img.data[i] = (n.x * 0.5 + 0.5) * 255;
      img.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  normals = new THREE.CanvasTexture(c);
  normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
  return normals;
}

/** Rippling, reflective water for pools, fountains and the tsunami wave (cheap: no extra render pass). */
export function PoolMat({ color = "#2f7fb0", scale = 6, speed = 1 }: { color?: string; scale?: number; speed?: number }) {
  const m = useMemo(() => {
    const n = waterNormals().clone();
    n.wrapS = n.wrapT = THREE.RepeatWrapping;
    n.repeat.set(scale, scale);
    n.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0.15, normalMap: n, normalScale: new THREE.Vector2(0.45, 0.45), clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4 });
  }, [color, scale]);
  useFrame((_, dt) => {
    m.normalMap!.offset.x += dt * 0.03 * speed;
    m.normalMap!.offset.y += dt * 0.017 * speed;
  });
  return <primitive object={m} attach="material" />;
}

export function Ocean({ z, size = 2600, night, sun }: { z: number; size?: number; night: boolean; sun: [number, number, number] }) {
  const water = useMemo(() => {
    const w = new Water(new THREE.PlaneGeometry(size, size), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals(),
      sunDirection: new THREE.Vector3(...sun).normalize(),
      sunColor: night ? 0x445577 : 0xfff4e0,
      waterColor: night ? 0x061a2a : 0x0f5e7a,
      distortionScale: 3.4,
      fog: true,
    });
    w.rotation.x = -Math.PI / 2;
    (w.material as THREE.ShaderMaterial).uniforms.size.value = 6;
    return w;
  }, [size, night, sun]);
  useFrame((_, dt) => {
    (water.material as THREE.ShaderMaterial).uniforms.time.value += dt * 0.6;
  });
  return <primitive object={water} position={[0, 0.1, z]} />;
}

/* ───────── nightly light & fountain show at the monument ───────── */
export function LightShow({ radius }: { radius: number }) {
  const jets = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.Group>(null);
  const lights = useRef<THREE.PointLight[]>([]);
  const N = 28;
  const fz = radius + 22; // fountain basin in front of the monument
  const m = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const pal = ["#ff3d7f", "#ffd23d", "#3dd6ff", "#7b5cff", "#3dff9a", "#ff8a3d"];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const phase = Math.floor(t / 8) % 4; // the choreography changes every 8 s
    if (jets.current) {
      for (let i = 0; i < N; i++) {
        const x = (i - (N - 1) / 2) * 1.9;
        const wave = phase === 0 ? Math.sin(t * 2 + i * 0.45) : phase === 1 ? Math.sin(t * 3) * (i % 2 ? 1 : -1) : phase === 2 ? Math.sin(t * 1.5 - Math.abs(i - N / 2) * 0.5) : Math.cos(t * 4 + i);
        const h = 3 + (wave * 0.5 + 0.5) * 16;
        m.makeScale(0.35, h, 0.35).setPosition(x, h / 2 + 0.4, fz);
        jets.current.setMatrixAt(i, m);
        jets.current.setColorAt(i, col.set(pal[(i + Math.floor(t * 1.2)) % pal.length]).multiplyScalar(1.3));
      }
      jets.current.instanceMatrix.needsUpdate = true;
      if (jets.current.instanceColor) jets.current.instanceColor.needsUpdate = true;
    }
    if (beams.current)
      beams.current.children.forEach((b, i) => {
        b.rotation.z = Math.sin(t * 0.7 + i) * 0.6;
        b.rotation.x = Math.cos(t * 0.5 + i * 2) * 0.35;
      });
    lights.current.forEach((l, i) => l && l.color.set(pal[(i + Math.floor(t / 2)) % pal.length]));
  });
  return (
    <group>
      {/* basin */}
      <mesh position={[0, 0.3, fz]}>
        <boxGeometry args={[N * 1.9 + 4, 0.6, 7]} />
        <meshStandardMaterial color="#d9d0bf" />
      </mesh>
      <mesh position={[0, 0.62, fz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[N * 1.9 + 3, 6]} />
        <PoolMat color="#1b5f9a" scale={3} />
      </mesh>
      <instancedMesh ref={jets} args={[undefined, undefined, N]}>
        <cylinderGeometry args={[0.6, 1, 1, 8, 1, true]} />
        <meshBasicMaterial transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {/* sweeping laser beams from projectors around the plaza */}
      <group ref={beams}>
        {[-60, -30, 30, 60].map((x, i) => (
          <group key={x} position={[x, 0.5, fz + 12]}>
            <mesh position={[0, 120, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 240, 6, 1, true]} />
              <meshBasicMaterial color={pal[i]} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
      {/* coloured floodlights washing over the monument */}
      {[-1, 1].map((sd, i) => (
        <pointLight key={sd} ref={(l) => void (l && (lights.current[i] = l))} position={[sd * radius * 0.9, 6, radius + 6]} intensity={1200} distance={radius * 4 + 60} decay={1.5} />
      ))}
    </group>
  );
}

/* ───────── fireworks ───────── */
function Fireworks({ big }: { big: boolean }) {
  const K = big ? 9 : 5;
  const P = 140;
  const bursts = useMemo(
    () =>
      Array.from({ length: K }, (_, k) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P * 3), 3));
        const vel = new Float32Array(P * 3);
        return { geo, vel, t: -k * 0.7, c: new THREE.Vector3(), color: new THREE.Color(), mat: new THREE.PointsMaterial({ size: 2.2, map: dot(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }) };
      }),
    [K]
  );
  const cols = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#f72585", "#ffffff", "#ff9f1c"];
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    for (const b of bursts) {
      b.t += dt;
      if (b.t > 2.6) {
        b.t = -Math.random() * 1.5;
        b.c.set((Math.random() - 0.5) * 160, 70 + Math.random() * 70, (Math.random() - 0.5) * 120 - 20);
        b.color.set(cols[Math.floor(Math.random() * cols.length)]);
        b.mat.color.copy(b.color);
        const p = b.geo.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < P; i++) {
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(2 * Math.random() - 1);
          const sp = 18 + Math.random() * 6;
          b.vel.set([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp], i * 3);
          p.setXYZ(i, b.c.x, b.c.y, b.c.z);
        }
        crackle();
      }
      if (b.t < 0) {
        b.mat.opacity = 0;
        continue;
      }
      const p = b.geo.getAttribute("position") as THREE.BufferAttribute;
      const a = p.array as Float32Array;
      for (let i = 0; i < P; i++) {
        a[i * 3] += b.vel[i * 3] * dt;
        a[i * 3 + 1] += b.vel[i * 3 + 1] * dt;
        a[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        b.vel[i * 3 + 1] -= 9 * dt;
        b.vel[i * 3] *= 0.985;
        b.vel[i * 3 + 2] *= 0.985;
      }
      p.needsUpdate = true;
      b.mat.opacity = Math.max(0, 1 - b.t / 2.4);
    }
  });
  return (
    <>
      {bursts.map((b, i) => (
        <points key={i} geometry={b.geo} material={b.mat} frustumCulled={false} />
      ))}
    </>
  );
}
let ac: AudioContext | null = null;
function crackle() {
  try {
    ac = ac ?? new AudioContext();
    if (ac.state !== "running") return;
    const len = ac.sampleRate * 0.6;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (Math.random() < 0.08 ? 1 : 0.3);
    const s = ac.createBufferSource();
    s.buffer = buf;
    const g = ac.createGain();
    g.gain.value = 0.25;
    s.connect(g).connect(ac.destination);
    s.start(ac.currentTime + 0.4 + Math.random() * 0.5);
  } catch {}
}

/* ───────── strings of lights around the plaza ───────── */
function StringLights({ colors }: { colors: string[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    const posts: [number, number][] = [];
    for (let k = -84; k <= 84; k += 21) posts.push([k, -90], [k, 90], [-90, k], [90, k]);
    // drooping strands between neighbouring posts along each side
    const side = (fixed: number, axis: "x" | "z") => {
      for (let k = -84; k < 84; k += 21)
        for (let s = 0; s <= 14; s++) {
          const u = s / 14;
          const a = k + u * 21;
          const y = 7.5 - Math.sin(u * Math.PI) * 2;
          out.push(axis === "x" ? [a, y, fixed] : [fixed, y, a]);
        }
    };
    side(-90, "x");
    side(90, "x");
    side(-90, "z");
    side(90, "z");
    // and across the plaza in an X
    for (let s = 0; s <= 60; s++) {
      const u = s / 60;
      const y = 14 - Math.sin(u * Math.PI) * 5;
      out.push([-90 + u * 180, y, -90 + u * 180], [-90 + u * 180, y, 90 - u * 180]);
    }
    return { out, posts };
  }, []);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    pts.out.forEach((p, i) => {
      ref.current!.setMatrixAt(i, m.makeTranslation(...p));
      ref.current!.setColorAt(i, c.set(colors[i % colors.length]).multiplyScalar(2.2));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
  }, [pts, colors]);
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, pts.out.length]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {pts.posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 3.9, z]}>
          <cylinderGeometry args={[0.08, 0.1, 7.8, 6]} />
          <meshStandardMaterial color="#3b4150" />
        </mesh>
      ))}
    </>
  );
}

/* ───────── Diwali diyas and rangoli ───────── */
function Diyas() {
  const clay = useRef<THREE.InstancedMesh>(null);
  const flame = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const out: [number, number][] = [];
    for (let k = -80; k <= 80; k += 2.5) out.push([k, -27], [k, 27], [-27, k], [27, k]);
    return out.filter(([x, z]) => Math.hypot(x, z) > 18);
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useEffect(() => {
    spots.forEach(([x, z], i) => clay.current!.setMatrixAt(i, m.makeTranslation(x, 0.35, z)));
    clay.current!.instanceMatrix.needsUpdate = true;
  }, [spots, m]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    spots.forEach(([x, z], i) => {
      const f = 0.8 + Math.sin(t * 12 + i * 1.7) * 0.15 + Math.sin(t * 23 + i) * 0.08;
      flame.current!.setMatrixAt(i, m.makeScale(f, f * 1.6, f).setPosition(x, 0.62, z));
    });
    flame.current!.instanceMatrix.needsUpdate = true;
  });
  const rangoli = ["#ff4d6d", "#ffd166", "#06d6a0", "#4361ee", "#f72585"];
  return (
    <>
      <instancedMesh ref={clay} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.22, 0.12, 0.16, 10]} />
        <meshStandardMaterial color="#a0522d" />
      </instancedMesh>
      <instancedMesh ref={flame} args={[undefined, undefined, spots.length]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} />
      </instancedMesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 40, 0.33, 40]}>
          {rangoli.map((c, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, (i * Math.PI) / 5]} position={[0, i * 0.005, 0]}>
              <ringGeometry args={[1 + i * 1.1, 1.9 + i * 1.1, 8 + i * 4]} />
              <meshStandardMaterial color={c} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function Lanterns({ red }: { red: boolean }) {
  const items = useMemo(() => Array.from({ length: 36 }, (_, i) => [((i * 47) % 170) - 85, 9 + (i % 4) * 1.5, ((i * 83) % 170) - 85] as [number, number, number]), []);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => g.current?.children.forEach((c, i) => (c.rotation.z = Math.sin(clock.elapsedTime * 1.3 + i) * 0.08)));
  return (
    <group ref={g}>
      {items.map((p, i) => (
        <group key={i} position={p}>
          <mesh scale={[1, 1.25, 1]}>
            <sphereGeometry args={[0.7, 12, 10]} />
            <meshStandardMaterial color={red ? "#e0262f" : ["#ffb703", "#fb8500", "#ffd60a"][i % 3]} emissive={red ? "#ff3b30" : "#ffb347"} emissiveIntensity={1.3} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.18, 10]} />
            <meshStandardMaterial color="#d4a017" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ChristmasTree({ z }: { z: number }) {
  const baubles = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const y = 3 + (i / 90) * 22;
        const r = 9 * (1 - (y - 2) / 26) + 0.4;
        const a = i * 2.4;
        return [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number];
      }),
    []
  );
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1, 1.2, 3, 10]} />
        <meshStandardMaterial color="#6b4226" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 7 + i * 5.2, 0]} castShadow>
          <coneGeometry args={[10 - i * 2.2, 9, 12]} />
          <meshStandardMaterial color="#1f6b3a" flatShading />
        </mesh>
      ))}
      {baubles.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.38, 8, 6]} />
          <meshBasicMaterial color={["#ff3b30", "#ffd60a", "#ffffff", "#34c3ff"][i % 4]} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 30, 0]}>
        <octahedronGeometry args={[1.6, 0]} />
        <meshBasicMaterial color="#ffe27a" toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={"g" + i} position={[Math.cos(i) * 6, 0.7, Math.sin(i) * 6]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color={["#e63946", "#457b9d", "#f1c40f"][i % 3]} />
        </mesh>
      ))}
    </group>
  );
}

function Pumpkins() {
  const items = useMemo(() => Array.from({ length: 40 }, (_, i) => [((i * 41) % 160) - 80, ((i * 67) % 160) - 80] as [number, number]).filter(([x, z]) => Math.hypot(x, z) > 30), []);
  return (
    <>
      {items.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.75, 12, 10]} />
          <meshStandardMaterial color="#f77f00" emissive="#ff8c1a" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </>
  );
}

function Bunting() {
  const flags = useMemo(() => {
    const out: { p: [number, number, number]; c: string; r: number }[] = [];
    const cols = ["#ff3b30", "#ffd60a", "#34c759", "#0a84ff", "#ff9f0a", "#bf5af2"];
    for (let s = 0; s < 90; s++) {
      const u = s / 90;
      out.push({ p: [-90 + u * 180, 11 - Math.sin(u * Math.PI) * 3.5, -40], c: cols[s % cols.length], r: 0 });
      out.push({ p: [-90 + u * 180, 11 - Math.sin(u * Math.PI) * 3.5, 40], c: cols[(s + 2) % cols.length], r: 0 });
    }
    return out;
  }, []);
  return (
    <>
      {flags.map((f, i) => (
        <mesh key={i} position={f.p} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.7, 1.4, 3]} />
          <meshStandardMaterial color={f.c} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function Crescent() {
  return (
    <group position={[0, 60, -120]}>
      <mesh>
        <torusGeometry args={[10, 2.2, 12, 40, Math.PI * 1.25]} />
        <meshBasicMaterial color="#fff1a8" toneMapped={false} />
      </mesh>
      <mesh position={[9, 4, 0]}>
        <octahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#fff1a8" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Bonfire({ x, z }: { x: number; z: number }) {
  const f = useRef<THREE.Mesh>(null);
  const l = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (f.current) f.current.scale.set(1 + Math.sin(t * 9) * 0.08, 1 + Math.sin(t * 13) * 0.18, 1);
    if (l.current) l.current.intensity = 900 + Math.sin(t * 17) * 250;
  });
  return (
    <group position={[x, 0, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.5, 0]} rotation={[0.4, (i * Math.PI) / 2.5, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 3, 6]} />
          <meshStandardMaterial color="#5a3a22" />
        </mesh>
      ))}
      <mesh ref={f} position={[0, 2.2, 0]}>
        <coneGeometry args={[1.4, 4, 10, 1, true]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.85} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={l} position={[0, 3, 0]} color="#ff8a3d" distance={60} decay={1.5} />
    </group>
  );
}

/** Ambient Holi colour clouds puffing up around the plaza. */
function ColourClouds() {
  const N = 600;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(N * 3);
    const c = new Float32Array(N * 3);
    const cols = ["#ff006e", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0", "#fb5607"].map((x) => new THREE.Color(x));
    for (let i = 0; i < N; i++) {
      p.set([(Math.random() - 0.5) * 150, Math.random() * 6, (Math.random() - 0.5) * 150], i * 3);
      const k = cols[i % cols.length];
      c.set([k.r, k.g, k.b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    const a = geo.getAttribute("position") as THREE.BufferAttribute;
    const p = a.array as Float32Array;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] += dt * (0.6 + (i % 5) * 0.2);
      if (p[i * 3 + 1] > 9) p[i * 3 + 1] = 0;
    }
    a.needsUpdate = true;
  });
  return (
    <points geometry={geo}>
      <pointsMaterial vertexColors size={3.2} map={dot()} transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

/* ───────── throwables: snowballs, Holi colour, water balloons ───────── */
type Ball = { p: THREE.Vector3; v: THREE.Vector3; kind: "snow" | "color" | "water"; color: THREE.Color; life: number; enemy?: boolean };
const balls: Ball[] = [];
const puffs: { p: THREE.Vector3; color: THREE.Color; t: number }[] = [];
const HOLI = ["#ff006e", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0", "#fb5607"];
export function throwBall(kind: Ball["kind"], from: THREE.Vector3, yaw: number, pitch: number) {
  const dir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch + 0.25), Math.sin(pitch + 0.25), -Math.cos(yaw) * Math.cos(pitch + 0.25));
  balls.push({ p: from.clone().add(new THREE.Vector3(0, 1.5, 0)), v: dir.multiplyScalar(19), kind, color: new THREE.Color(kind === "snow" ? "#ffffff" : kind === "water" ? "#7cd3ff" : HOLI[Math.floor(Math.random() * HOLI.length)]), life: 3 });
}
export function Throwables({ me, fight }: { me: React.RefObject<{ x: number; z: number }>; fight: "snow" | "color" | "water" | null }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const puffRef = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const nextEnemy = useRef(0);
  const { camera } = useThree();
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const now = performance.now();
    // citizens join in and throw back at you
    if (fight && now > nextEnemy.current && npcPos.length) {
      nextEnemy.current = now + 1600 + Math.random() * 1800;
      const t = me.current!;
      const from = npcPos.filter((p) => Math.hypot(p.x - t.x, p.z - t.z) < 40)[0];
      if (from) {
        const target = new THREE.Vector3(t.x + (Math.random() - 0.5) * 3, 1.2, t.z + (Math.random() - 0.5) * 3);
        const d = target.clone().sub(from);
        const dist = Math.hypot(d.x, d.z);
        const vv = new THREE.Vector3(d.x / dist, 0, d.z / dist).multiplyScalar(14);
        vv.y = (9.8 * dist) / (2 * 14) + 0.5;
        balls.push({ p: from.clone().add(new THREE.Vector3(0, 1.5, 0)), v: vv, kind: fight, color: new THREE.Color(fight === "snow" ? "#ffffff" : fight === "water" ? "#7cd3ff" : HOLI[Math.floor(Math.random() * 6)]), life: 3, enemy: true });
      }
    }
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.v.y -= 9.8 * dt;
      b.p.addScaledVector(b.v, dt);
      b.life -= dt;
      let hit = b.p.y <= 0.2 || b.life <= 0;
      if (!b.enemy)
        for (const n of npcPos)
          if (Math.hypot(n.x - b.p.x, n.z - b.p.z) < 0.9 && b.p.y < 2) {
            hit = true;
            score.hits++;
          }
      if (b.enemy) {
        const t = me.current!;
        if (Math.hypot(t.x - b.p.x, t.z - b.p.z) < 0.8 && b.p.y < 2.2) {
          hit = true;
          score.gotHit++;
          camera.position.y += 0.15;
        }
      }
      if (hit) {
        for (let k = 0; k < 10; k++) puffs.push({ p: b.p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 1.2, (Math.random() - 0.5) * 1.6)), color: b.color, t: 0 });
        balls.splice(i, 1);
      }
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      puffs[i].t += dt;
      if (puffs[i].t > 1.4) puffs.splice(i, 1);
    }
    if (puffs.length > 300) puffs.splice(0, puffs.length - 300);
    const c = new THREE.Color();
    balls.slice(0, 60).forEach((b, i) => {
      ref.current!.setMatrixAt(i, m.makeTranslation(b.p.x, b.p.y, b.p.z));
      ref.current!.setColorAt(i, c.copy(b.color));
    });
    ref.current!.count = Math.min(60, balls.length);
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
    puffs.slice(0, 300).forEach((p, i) => {
      const s = 0.4 + p.t * 1.4;
      puffRef.current!.setMatrixAt(i, m.makeScale(s, s, s).setPosition(p.p.x, p.p.y + p.t * 0.6, p.p.z));
      puffRef.current!.setColorAt(i, c.copy(p.color));
    });
    puffRef.current!.count = Math.min(300, puffs.length);
    puffRef.current!.instanceMatrix.needsUpdate = true;
    if (puffRef.current!.instanceColor) puffRef.current!.instanceColor.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, 60]} frustumCulled={false}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={puffRef} args={[undefined, undefined, 300]} frustumCulled={false}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial transparent opacity={0.6} depthWrite={false} roughness={1} />
      </instancedMesh>
    </>
  );
}

/** All the decorations for whatever festivals are on. */
export function Festive({ deco, night, monumentR }: { deco: Set<Deco>; night: boolean; monumentR: number }) {
  const any = deco.size > 0;
  const warm = ["#ffd27a", "#ffb347", "#fff1c1"];
  const party = ["#ff3b30", "#ffd60a", "#34c759", "#0a84ff", "#ff9f0a", "#bf5af2"];
  return (
    <>
      {any && <StringLights colors={deco.has("diyas") || deco.has("christmas") ? warm : party} />}
      {deco.has("diyas") && <Diyas />}
      {(deco.has("lanterns") || deco.has("skulls")) && <Lanterns red={!deco.has("diyas") && !deco.has("skulls")} />}
      {deco.has("christmas") && <ChristmasTree z={monumentR + 40} />}
      {deco.has("pumpkins") && <Pumpkins />}
      {(deco.has("flags") || deco.has("carnival") || deco.has("beer")) && <Bunting />}
      {deco.has("crescent") && <Crescent />}
      {deco.has("bonfire") && <Bonfire x={-60} z={60} />}
      {deco.has("colors") && <ColourClouds />}
      {deco.has("fireworks") && night && <Fireworks big />}
    </>
  );
}
