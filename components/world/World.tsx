"use client";
import { Html, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Character, type MotionRef } from "../three/Character";
import { Pip } from "../three/Pip";
import { Ink } from "../three/Ink";
import { Crowd } from "../three/Crowd";
import {
  Bonfire,
  Bottle,
  Bridge,
  Cloud,
  Coin,
  FocusCrystal,
  Flower,
  Garden,
  Glowcap,
  Gym,
  HallOfFame,
  House,
  Island,
  Lamp,
  Library,
  Observatory,
  QuestBoard,
  Rock,
  Sign,
  Spring,
  StrengthCairn,
  Tree,
} from "../three/props";
import { BRIDGES, COIN_SPOTS, ISLANDS, SPAWN, ZONES, walkable } from "./layout";
import { useStore } from "@/lib/store";
import { PLAYER_META, partnerOf, KIND_META, type PlayerId } from "@/lib/types";
import { dayKey, fmtMinutes, seeded, timeAgo } from "@/lib/game/dates";
import { coinSpawns } from "@/lib/game/secrets";

export interface Ctl {
  joy: { x: number; y: number; active: boolean };
  target: [number, number] | null;
  teleport: [number, number] | null;
  zoom: number;
}

interface Props {
  ctl: MutableRefObject<Ctl>;
  onZone: (id: string | null) => void;
  onNotes: () => void;
  unreadNotes: boolean;
}

export default function World(props: Props) {
  const night = useStore((s) => s.night);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 42, position: [0, 14, 18], near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <Scene {...props} night={night} />
    </Canvas>
  );
}

function SkyDome({ night }: { night: boolean }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color() },
          mid: { value: new THREE.Color() },
          bottom: { value: new THREE.Color() },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
          void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, h)) : mix(mid, bottom, smoothstep(0.0, -0.5, h)); gl_FragColor = vec4(c,1.0);} `,
      }),
    []
  );
  useFrame(() => {
    const k = 0.05;
    const tgt = night
      ? [new THREE.Color("#1c1e26"), new THREE.Color("#2a2c35"), new THREE.Color("#15161b")]
      : [new THREE.Color("#ecebe5"), new THREE.Color("#f4f3ef"), new THREE.Color("#e6e4dc")];
    mat.uniforms.top.value.lerp(tgt[0], k);
    mat.uniforms.mid.value.lerp(tgt[1], k);
    mat.uniforms.bottom.value.lerp(tgt[2], k);
  });
  return (
    <mesh material={mat} scale={300}>
      <sphereGeometry args={[1, 32, 16]} />
    </mesh>
  );
}

function Scene({ ctl, onZone, onNotes, unreadNotes, night }: Props & { night: boolean }) {
  const me = useStore((s) => s.me) as PlayerId;
  const u = useStore((s) => s.universe);
  const activities = useStore((s) => s.activities);
  const log = useStore((s) => s.log);
  const findSecret = useStore((s) => s.findSecret);
  const setNight = useStore((s) => s.setNight);
  const sunClicks = useRef(0);
  const today = dayKey();

  const coins = useMemo(() => coinSpawns(me, today, COIN_SPOTS, 6), [me, today]);
  const collected = useMemo(() => {
    const s = new Set<number>();
    for (const a of activities) if (a.kind === "coin" && a.player === me && a.data.day === today) s.add(Number(a.data.idx));
    return s;
  }, [activities, me, today]);
  const collecting = useRef(new Set<number>());

  const onCoin = (idx: number) => {
    if (collected.has(idx) || collecting.current.has(idx)) return;
    collecting.current.add(idx);
    log("coin", { data: { day: today, idx } });
  };

  const walkTo = (x: number, z: number) => (ctl.current.target = [x, z]);
  const ground = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    walkTo(e.point.x, e.point.z);
  };
  const zoneClick = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const z = ZONES.find((zz) => zz.id === id);
    if (z) walkTo(z.door[0], z.door[1]);
  };

  const sharedLevel = u.players.adarsh.level + u.players.devanshi.level;
  const sharedMedals = u.unlocks.together.size;

  return (
    <>
      <SkyDome night={night} />
      <fog attach="fog" args={[night ? "#22242c" : "#f4f3ef", 38, 100]} />
      <Ink wash={night ? 0.4 : 0.48} />
      <hemisphereLight args={[night ? "#8a93c9" : "#ffffff", night ? "#1b1530" : "#d8d6ce", night ? 0.5 : 1.1]} />
      <directionalLight
        position={night ? [-20, 30, -10] : [18, 30, 12]}
        intensity={night ? 0.6 : 1.9}
        color={night ? "#a9b8ff" : "#ffffff"}
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
      />
      {night && <Stars radius={120} depth={40} count={2500} factor={4} fade speed={0.6} />}

      {/* Sun / Moon — knock five times */}
      <mesh
        position={night ? [-40, 45, -70] : [40, 40, -70]}
        onClick={(e) => {
          e.stopPropagation();
          sunClicks.current++;
          if (sunClicks.current >= 5) {
            sunClicks.current = 0;
            setNight(!night);
            findSecret("sun-tap");
          }
        }}
      >
        <sphereGeometry args={[6, 24, 24]} />
        <meshBasicMaterial color={night ? "#f4f3ef" : "#f2c31a"} fog={false} />
      </mesh>

      <Cloud position={[-12, 6, -14]} scale={1.6} />
      <Cloud position={[14, 8, -24]} scale={2.2} speed={0.12} />
      <Cloud position={[-26, 3, 10]} scale={1.8} speed={0.15} />
      <Cloud position={[24, 2, 16]} scale={1.4} />
      <Cloud position={[6, -6, 26]} scale={2.6} speed={0.08} />
      <Cloud position={[-8, -8, -30]} scale={3} speed={0.05} />

      {ISLANDS.map((i) => (
        <Island key={i.id} position={[i.x, 0, i.z]} radius={i.r} grass={night ? "#4f7a52" : "#b5d68a"} seed={i.id} onGround={ground} />
      ))}
      {BRIDGES.map((b, i) => (
        <Bridge key={i} from={b.from} to={b.to} onGround={ground} />
      ))}

      {/* ——— Together Isle (shared growth) ——— */}
      <HallOfFame position={[-4, 0, -4.4]} glow={sharedMedals} onClick={zoneClick("hall")} />
      <group position={[3.2, 0, -3.4]} onClick={zoneClick("hall")}>
        <Tree position={[0, 0, 0]} scale={1.1 + Math.min(2.2, sharedLevel * 0.09)} color={night ? "#3f8d5c" : "#ff9eb5"} />
      </group>
      <Bonfire position={[1.8, 0, 1.8]} power={u.shared.syncRun} onClick={zoneClick("bonfire")} />
      <QuestBoard position={[-3.8, 0, 3.6]} notes={4} onClick={zoneClick("board")} />
      <Observatory position={[4, 0, 3.8]} onClick={zoneClick("observatory")} />
      <Well position={[5, 0, -1.8]} onClick={zoneClick("well")} />
      <group onClick={zoneClick("dock")}>
        <mesh position={[6.2, -0.05, -5.2]} rotation={[0, -0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#a06d43" flatShading />
        </mesh>
        <Bottle
          position={[7.2, 0.25, -6.6]}
          glowing={unreadNotes}
          onClick={(e) => {
            e.stopPropagation();
            onNotes();
          }}
        />
      </group>
      {[[-6, 0, 3], [6.5, 0, 1.5], [-2, 0, -6.8], [-6.6, 0, -1], [1.2, 0, 6.8]].map((p, i) => (
        <Lamp key={i} position={p as [number, number, number]} on={night} />
      ))}
      {[[-1.5, 0.05, 6], [6.6, 0.05, -2.6], [-6.8, 0.05, 1], [2.5, 0.05, -7]].map((p, i) => (
        <Rock key={i} position={p as [number, number, number]} />
      ))}
      <Sparkles count={20 + sharedMedals * 12} scale={[14, 3, 14]} position={[0, 1.5, 0]} size={3} speed={0.3} color={night ? "#f8e08a" : "#f2c31a"} />
      <Crowd count={10} radius={2.6} center={[-1.2, 1.2]} seed="together-crowd" />
      <Crowd count={7} radius={2.4} center={[0, 13.6]} seed="body-crowd" />
      <Crowd count={6} radius={2.2} center={[-0.6, -13.8]} seed="mind-crowd" />

      {/* ——— Mind & Body isles (activity locations) ——— */}
      <Library position={[-1.8, 0, -18]} books={Math.floor(u.shared.studyMin / 60)} onClick={zoneClick("library")} />
      <Spring position={[2.4, 0, -17]} night={night} onClick={zoneClick("spring")} onDuck={() => findSecret("duck")} />
      <Tree position={[-4, 0, -14.5]} variant={1} />
      <Tree position={[4.2, 0, -20]} variant={0} scale={0.8} />
      <Gym position={[-2, 0, 17.2]} plates={Math.floor(u.shared.workoutMin / 60)} onClick={zoneClick("gym")} />
      <Garden position={[2.3, 0, 17.4]} growth={u.shared.healthyMeals} onClick={zoneClick("garden")} />
      <Tree position={[4.3, 0, 14]} variant={1} scale={0.9} />
      <Tree position={[-4.4, 0, 19.5]} variant={0} />

      {/* ——— Personal isles ——— */}
      <PersonalIsle player="adarsh" onHome={zoneClick("home-adarsh")} />
      <PersonalIsle player="devanshi" onHome={zoneClick("home-devanshi")} />
      <Glowcap
        position={[18.6, 0, -4]}
        found={u.players[me].secrets.has("mushroom")}
        onClick={(e) => {
          e.stopPropagation();
          findSecret("mushroom");
        }}
      />

      {/* zone labels */}
      {ZONES.map((z) => (
        <Html key={z.id} position={z.label} center distanceFactor={14} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="zone-label">
            <span>{z.icon}</span>
            {z.name}
          </div>
        </Html>
      ))}

      {coins
        .filter((c) => !collected.has(c.idx))
        .map((c) => (
          <Coin key={c.idx} position={[c.x, 0, c.z]} />
        ))}

      <Player ctl={ctl} onZone={onZone} coins={coins.filter((c) => !collected.has(c.idx))} onCoin={onCoin} />
      <Partner />
    </>
  );
}

function Well({ position, onClick }: { position: [number, number, number]; onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.65, 0.7, 12]} />
        <meshStandardMaterial color="#b8aea3" flatShading />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.05, 12]} />
        <meshStandardMaterial color="#4cc9f0" emissive="#2aa4d6" emissiveIntensity={0.3} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} castShadow>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color="#6b4529" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.95, 0.5, 4]} />
        <meshStandardMaterial color="#c0583c" flatShading />
      </mesh>
    </group>
  );
}

function PersonalIsle({ player, onHome }: { player: PlayerId; onHome: (e: ThreeEvent<MouseEvent>) => void }) {
  const u = useStore((s) => s.universe);
  const p = u.players[player];
  const isle = ISLANDS.find((i) => i.id === player)!;
  const meta = PLAYER_META[player];
  const side = player === "adarsh" ? -1 : 1;

  const spots = useMemo(() => {
    const r = seeded("trees:" + player);
    return Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + r() * 0.3;
      const d = 3.6 + r() * 1.5;
      return { x: isle.x + Math.cos(a) * d, z: isle.z + Math.sin(a) * d, v: i, s: 0.75 + r() * 0.4 };
    }).filter((s) => Math.abs(s.z - isle.z) > 1.1 || Math.sign(s.x - isle.x) === side); // keep the bridge clear
  }, [player, isle.x, isle.z, side]);
  const flowers = useMemo(() => {
    const r = seeded("flowers:" + player);
    return Array.from({ length: 30 }, () => {
      const a = r() * Math.PI * 2;
      const d = 1.6 + r() * 3.4;
      return [isle.x + Math.cos(a) * d, 0.0, isle.z + Math.sin(a) * d] as [number, number, number];
    });
  }, [player, isle.x, isle.z]);

  const trees = Math.min(spots.length, 1 + p.level);
  const nFlowers = Math.min(30, p.streak * 3 + p.activeDays.size);
  const medalCount = u.unlocks[player].size;

  return (
    <group>
      <House position={[isle.x, 0, isle.z - 2.2]} wall={player === "adarsh" ? "#dfeefa" : "#fde6ee"} roof={meta.accent} onClick={onHome} />
      {spots.slice(0, trees).map((s, i) => (
        <Tree key={i} position={[s.x, 0, s.z]} scale={s.s} variant={s.v} color={player === "adarsh" ? "#4fae6a" : "#79b84a"} />
      ))}
      {flowers.slice(0, nFlowers).map((f, i) => (
        <Flower key={i} position={f} color={i % 3 === 0 ? meta.color : i % 3 === 1 ? "#ffd166" : "#ffffff"} />
      ))}
      <FocusCrystal position={[isle.x + side * 2.6, 0, isle.z + 2.6]} hours={p.studyMin / 60} color={meta.color} />
      <StrengthCairn position={[isle.x - side * 2.4, 0, isle.z + 2.8]} hours={p.workoutMin / 60} />
      <Sign position={[isle.x + 1.4, 0, isle.z + 0.4]} rotation={-0.2} color={meta.soft} />
      {Array.from({ length: Math.min(8, medalCount) }).map((_, i) => {
        const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7;
        return (
          <mesh key={i} userData={{ keep: true }} position={[isle.x + Math.cos(a) * 1.2 * side, 1.6 + Math.sin(i) * 0.2, isle.z + 1 + Math.sin(a)]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={0.8} />
          </mesh>
        );
      })}
      <Html position={[isle.x + 1.4, 1.6, isle.z + 0.45]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div className="isle-sign" style={{ borderColor: meta.color }}>
          <b>{meta.name}</b>
          <span>
            Lv {p.level} · 🔥 {p.streak}
          </span>
        </div>
      </Html>
    </group>
  );
}

const tmpV = new THREE.Vector3();

function Player({
  ctl,
  onZone,
  coins,
  onCoin,
}: {
  ctl: MutableRefObject<Ctl>;
  onZone: (id: string | null) => void;
  coins: { idx: number; x: number; z: number }[];
  onCoin: (idx: number) => void;
}) {
  const me = useStore((s) => s.me) as PlayerId;
  const sendPos = useStore((s) => s.sendPos);
  const findSecret = useStore((s) => s.findSecret);
  const g = useRef<THREE.Group>(null);
  const pip = useRef<THREE.Group>(null);
  const motion = useRef<MotionRef>({ speed: 0, emote: 0 });
  const keys = useRef(new Set<string>());
  const zone = useRef<string | null>(null);
  const pokes = useRef(0);
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(SPAWN[me][0], 0, SPAWN[me][1]));
  const yaw = useRef(Math.PI);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  useEffect(() => {
    pos.current.set(SPAWN[me][0], 0, SPAWN[me][1]);
    camera.position.set(pos.current.x, 9, pos.current.z + 11);
  }, [me, camera]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      keys.current.add(e.key.toLowerCase());
      if (e.key === " ") motion.current.emote = 1.2;
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = ctl.current;
    const p = pos.current;
    if (c.teleport) {
      p.set(c.teleport[0], 0, c.teleport[1]);
      c.teleport = null;
      c.target = null;
      camera.position.set(p.x, 9, p.z + 11);
    }
    let dx = 0,
      dz = 0;
    const k = keys.current;
    if (k.has("w") || k.has("arrowup")) dz -= 1;
    if (k.has("s") || k.has("arrowdown")) dz += 1;
    if (k.has("a") || k.has("arrowleft")) dx -= 1;
    if (k.has("d") || k.has("arrowright")) dx += 1;
    if (c.joy.active) {
      dx = c.joy.x;
      dz = c.joy.y;
    }
    if (dx || dz) c.target = null;
    else if (c.target) {
      dx = c.target[0] - p.x;
      dz = c.target[1] - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.15) {
        c.target = null;
        dx = dz = 0;
      } else if (d > 1) {
        dx /= d;
        dz /= d;
      }
    }
    const mag = Math.min(1, Math.hypot(dx, dz));
    if (mag > 0.01) {
      const n = Math.hypot(dx, dz);
      const speed = 5.2 * mag;
      const sx = (dx / n) * speed * dt;
      const sz = (dz / n) * speed * dt;
      if (walkable(p.x + sx, p.z + sz)) {
        p.x += sx;
        p.z += sz;
      } else if (walkable(p.x + sx, p.z)) p.x += sx;
      else if (walkable(p.x, p.z + sz)) p.z += sz;
      else {
        // slide around round obstacles: try rotating the step ±60°
        for (const ang of [1.05, -1.05]) {
          const rx = sx * Math.cos(ang) - sz * Math.sin(ang);
          const rz = sx * Math.sin(ang) + sz * Math.cos(ang);
          if (walkable(p.x + rx, p.z + rz)) {
            p.x += rx;
            p.z += rz;
            break;
          }
        }
        if (c.target && Math.random() < 0.02) c.target = null;
      }
      const target = Math.atan2(dx, dz);
      let diff = target - yaw.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      yaw.current += diff * Math.min(1, dt * 12);
    }
    motion.current.speed += (mag - motion.current.speed) * Math.min(1, dt * 10);

    if (g.current) {
      g.current.position.copy(p);
      g.current.rotation.y = yaw.current;
    }
    // camera follow
    const z = c.zoom;
    tmpV.set(p.x, 7.2 * z + 0.6, p.z + 11.5 * z);
    camera.position.lerp(tmpV, 1 - Math.exp(-dt * 4));
    camera.lookAt(p.x, 0.9, p.z);

    if (pip.current) {
      tmpV.set(p.x + 0.9, 1.7, p.z + 0.2);
      pip.current.position.lerp(tmpV, 1 - Math.exp(-dt * 3));
    }

    // zones
    let best: string | null = null;
    let bestD = 2.1;
    for (const zz of ZONES) {
      const d = Math.hypot(zz.door[0] - p.x, zz.door[1] - p.z);
      if (d < bestD) {
        bestD = d;
        best = zz.id;
      }
    }
    if (best !== zone.current) {
      zone.current = best;
      onZone(best);
    }
    // coins
    for (const cn of coinsRef.current) if (Math.hypot(cn.x - p.x, cn.z - p.z) < 0.9) onCoin(cn.idx);

    sendPos({ x: p.x, z: p.z, ry: yaw.current, moving: mag > 0.05, zone: best });
  });

  return (
    <>
      <group ref={g}>
        <Character player={me} motion={motion} onClick={() => (motion.current.emote = 1.2)} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={PLAYER_META[me].color} transparent opacity={0.8} />
        </mesh>
      </group>
      <group ref={pip} scale={0.45}>
        <Pip
          bounce={false}
          onPoke={() => {
            pokes.current++;
            if (pokes.current === 10) findSecret("pip");
          }}
        />
      </group>
    </>
  );
}

function Partner() {
  const me = useStore((s) => s.me) as PlayerId;
  const who = partnerOf(me);
  const pp = useStore((s) => s.partnerPos);
  const online = useStore((s) => s.online.includes(who));
  const acts = useStore((s) => s.activities);
  const log = useStore((s) => s.log);
  const toast = useStore((s) => s.toast);
  const g = useRef<THREE.Group>(null);
  const motion = useRef<MotionRef>({ speed: 0, emote: 0 });
  const pos = useRef(new THREE.Vector3(SPAWN[who][0], 0, SPAWN[who][1]));
  const lastCheer = useRef(0);
  const hearts = useRef<THREE.Group>(null);
  const heartT = useRef(0);

  const latest = useMemo(() => {
    for (let i = acts.length - 1; i >= 0; i--) {
      const a = acts[i];
      if (a.player === who && !["coin", "quest", "secret"].includes(a.kind)) return a;
    }
    return null;
  }, [acts, who]);

  useFrame((_, dt) => {
    const live = pp && online && Date.now() - pp.t < 8000;
    const tx = live ? pp!.x : SPAWN[who][0];
    const tz = live ? pp!.z : SPAWN[who][1];
    const before = pos.current.clone();
    pos.current.lerp(tmpV.set(tx, 0, tz), 1 - Math.exp(-dt * 8));
    const moved = before.distanceTo(pos.current) / Math.max(dt, 0.001);
    motion.current.speed += (Math.min(1, moved / 4) - motion.current.speed) * 0.2;
    if (g.current) {
      g.current.position.copy(pos.current);
      if (live) g.current.rotation.y = pp!.ry;
      else g.current.rotation.y = 0;
    }
    if (hearts.current) {
      heartT.current = Math.max(0, heartT.current - dt);
      hearts.current.visible = heartT.current > 0;
      hearts.current.position.y = 1.8 + (1.5 - heartT.current) * 1.2;
      hearts.current.scale.setScalar(0.6 + (1.5 - heartT.current) * 0.4);
    }
  });

  const cheer = () => {
    motion.current.emote = 1.2;
    heartT.current = 1.5;
    if (Date.now() - lastCheer.current < 20000) {
      toast({ icon: "💛", text: `Give ${PLAYER_META[who].name} a moment — cheer again soon.` });
      return;
    }
    lastCheer.current = Date.now();
    log("cheer", { data: { to: who } });
    toast({ icon: "📣", text: `You cheered ${PLAYER_META[who].name} on! +2 XP` });
  };

  const say = latest
    ? `${KIND_META[latest.kind].icon} ${KIND_META[latest.kind].label}${latest.minutes ? " " + fmtMinutes(latest.minutes) : ""} · ${timeAgo(latest.at)}`
    : "No activity logged yet";

  return (
    <group ref={g}>
      <Character player={who} motion={motion} onClick={cheer} />
      <group ref={hearts} visible={false}>
        {[-0.3, 0, 0.3].map((x, i) => (
          <mesh key={i} position={[x, i * 0.15, 0]}>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshBasicMaterial color="#ff5d8f" />
          </mesh>
        ))}
      </group>
      <Html position={[0, 2.2, 0]} center distanceFactor={11} zIndexRange={[20, 0]}>
        <button className="bubble" onClick={cheer} style={{ borderColor: PLAYER_META[who].color }}>
          <b style={{ color: PLAYER_META[who].color }}>
            {online ? "● " : "○ "}
            {PLAYER_META[who].name}
          </b>
          <span>{say}</span>
          <em>tap to cheer</em>
        </button>
      </Html>
    </group>
  );
}
