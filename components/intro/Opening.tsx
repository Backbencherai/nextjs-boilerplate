"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Character } from "../three/Character";
import { Pip } from "../three/Pip";
import { Bridge, Cloud, Flower, House, Island, Tree } from "../three/props";
import { useStore } from "@/lib/store";
import { hashSpace, cloudConfigured } from "@/lib/sync/backend";
import { PLAYER_META, type PlayerId } from "@/lib/types";

/* ───────────────────────── Loader ───────────────────────── */

export function Loader({ onDone }: { onDone: () => void }) {
  const ready = useStore((s) => s.ready);
  const [steps, setSteps] = useState({ fonts: false, engine: false, data: false });
  const [shown, setShown] = useState(0);
  const pokes = useRef(0);
  const findSecret = useStore((s) => s.findSecret);
  const me = useStore((s) => s.me);

  useEffect(() => {
    document.fonts?.ready.then(() => setSteps((s) => ({ ...s, fonts: true })));
    import("../world/World").then(() => setSteps((s) => ({ ...s, engine: true })));
  }, []);
  useEffect(() => {
    if (ready) setSteps((s) => ({ ...s, data: true }));
  }, [ready]);

  const real = (Number(steps.fonts) + Number(steps.engine) + Number(steps.data)) / 3;
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setShown((v) => {
        const next = v + Math.max(0.002, (real - v) * 0.06);
        return Math.min(real, next);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [real]);
  useEffect(() => {
    if (shown >= 0.999) {
      const t = setTimeout(onDone, 450);
      return () => clearTimeout(t);
    }
  }, [shown, onDone]);

  const line = !steps.fonts ? "waking Pip up…" : !steps.engine ? "growing the islands…" : !steps.data ? "syncing your universe…" : "ready.";

  return (
    <motion.div className="loader" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}>
      <div className="loader-grain" />
      <div className="loader-top mono">
        <span>A×D / UNIVERSE</span>
        <span>{new Date().getFullYear()}</span>
      </div>
      <div className="loader-stage">
        <Canvas camera={{ position: [0, 0.6, 3.2], fov: 40 }} dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 3]} intensity={2.2} color="#fff1dc" />
          <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#ff9a5a" />
          <group position={[0, -0.3, 0]}>
            <Pip
              progress={shown}
              onPoke={() => {
                pokes.current++;
                if (pokes.current === 10 && me) findSecret("pip");
              }}
            />
          </group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]}>
            <circleGeometry args={[0.6, 32]} />
            <meshBasicMaterial color="#000" transparent opacity={0.35} />
          </mesh>
        </Canvas>
      </div>
      <div className="loader-bottom">
        <div className="loader-pct display">{Math.round(shown * 100)}</div>
        <div className="loader-line mono">{line}</div>
        <div className="loader-bar">
          <i style={{ transform: `scaleX(${shown})` }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Story ───────────────────────── */

const CHAPTERS = [
  { kicker: "Once upon a now,", big: ["two", "people."], sub: "" },
  { kicker: "meet", big: ["Adarsh", "& Devanshi."], sub: "Two worlds, side by side." },
  { kicker: "every single day,", big: ["study.", "lift. rest.", "grow."], sub: "Small things, done again and again." },
  { kicker: "and here, every real hour", big: ["becomes", "a tree."], sub: "Each glass of water, a flower. Each streak, a fire." },
  { kicker: "so —", big: ["grow alone.", "grow together."], sub: "" },
];

const CAMS: [number, number, number][] = [
  [0, 3, 16],
  [0, 4.5, 13],
  [-5, 3.5, 9],
  [5, 5, 11],
  [0, 7, 14],
];

function StoryScene({ ch }: { ch: number }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const bridge = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((state, dt) => {
    const sep = ch < 3 ? 7.5 : ch === 3 ? 5.8 : 4.8;
    if (left.current) left.current.position.x += (-sep - left.current.position.x) * dt * 1.2;
    if (right.current) right.current.position.x += (sep - right.current.position.x) * dt * 1.2;
    if (left.current) left.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
    if (right.current) right.current.position.y = Math.sin(state.clock.elapsedTime * 0.6 + 1.5) * 0.15;
    if (bridge.current) {
      const s = ch >= 4 ? 1 : 0.0001;
      bridge.current.scale.x += (s - bridge.current.scale.x) * dt * 2;
      bridge.current.visible = bridge.current.scale.x > 0.01;
    }
    const c = CAMS[ch];
    // portrait phones see far less horizontally: pull back so both islands stay in frame
    const f = Math.min(2.1, Math.max(1, 1.15 / state.viewport.aspect));
    camera.position.lerp(new THREE.Vector3(c[0] * (f > 1 ? 0.6 : 1) + state.pointer.x * 0.6, c[1] * f + state.pointer.y * 0.3, c[2] * f), dt * 1.1);
    look.current.lerp(new THREE.Vector3((ch === 2 ? -4 : ch === 3 ? 4 : 0) * (f > 1 ? 0.6 : 1), f > 1 ? -1.2 : 0.8, 0), dt * 1.5);
    camera.lookAt(look.current);
  });
  const grow = ch >= 3 ? 1 : 0.4;
  return (
    <>
      <color attach="background" args={["#ff9c5b"]} />
      <fog attach="fog" args={["#ffb27a", 14, 40]} />
      <hemisphereLight args={["#fff0de", "#a15a2e", 0.9]} />
      <directionalLight position={[6, 10, 6]} intensity={2.4} color="#ffe2b8" />
      <Cloud position={[-8, -3, -6]} scale={2} />
      <Cloud position={[9, 4, -10]} scale={2.4} speed={0.1} />
      <Cloud position={[0, -6, 2]} scale={3} speed={0.06} />
      <group ref={left} position={[-7.5, 0, 0]}>
        <Island position={[0, 0, 0]} radius={3.2} grass="#80c7a0" seed="story-a" />
        <House position={[-0.6, 0, -1.2]} wall="#dfeefa" roof={PLAYER_META.adarsh.accent} />
        <group position={[0.9, 0, 0.9]} rotation={[0, 0.5, 0]}>
          <Character player="adarsh" />
        </group>
        <Tree position={[-2, 0, 0.9]} scale={grow} />
        <Tree position={[1.8, 0, -1.2]} scale={grow * 0.8} variant={1} />
        {ch >= 3 && [0, 1, 2, 3, 4].map((i) => <Flower key={i} position={[-1 + i * 0.5, 0, 2]} color={i % 2 ? "#3fa9ff" : "#ffd166"} />)}
      </group>
      <group ref={right} position={[7.5, 0, 0]}>
        <Island position={[0, 0, 0]} radius={3.2} grass="#a8d36a" seed="story-d" />
        <House position={[0.6, 0, -1.2]} wall="#fde6ee" roof={PLAYER_META.devanshi.accent} />
        <group position={[-0.9, 0, 0.9]} rotation={[0, -0.5, 0]}>
          <Character player="devanshi" />
        </group>
        <Tree position={[2, 0, 0.9]} scale={grow} variant={1} />
        <Tree position={[-1.8, 0, -1.2]} scale={grow * 0.8} />
        {ch >= 3 && [0, 1, 2, 3, 4].map((i) => <Flower key={i} position={[-1 + i * 0.5, 0, 2]} color={i % 2 ? "#ff7eb3" : "#ffffff"} />)}
      </group>
      <group ref={bridge} scale={[0.0001, 1, 1]}>
        <Bridge from={[-1.7, 0.4]} to={[1.7, 0.4]} />
      </group>
    </>
  );
}

export function Story({ onDone }: { onDone: () => void }) {
  const [ch, setCh] = useState(0);
  const last = ch === CHAPTERS.length - 1;
  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setCh((c) => c + 1), 4200);
    return () => clearTimeout(t);
  }, [ch, last]);
  const c = CHAPTERS[ch];
  return (
    <motion.div className="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !last && setCh(ch + 1)}>
      <div className="story-canvas">
        <Canvas camera={{ position: [0, 3, 16], fov: 40 }} dpr={[1, 1.75]}>
          <StoryScene ch={ch} />
        </Canvas>
      </div>
      <div className="window-light" />
      <div className="loader-grain" />
      <div className="story-top mono">
        <span>
          {String(ch + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
        </span>
        <button
          className="link-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
        >
          skip story →
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={ch} className="story-text" initial="hide" animate="show" exit="out">
          <motion.p className="serif story-kicker" variants={{ hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 }, out: { opacity: 0 } }}>
            {c.kicker}
          </motion.p>
          {c.big.map((w, i) => (
            <div key={i} className="mask">
              <motion.h1
                className="display story-big"
                variants={{
                  hide: { y: "110%", rotate: 4 },
                  show: { y: "0%", rotate: 0, transition: { delay: 0.15 + i * 0.12, type: "spring", stiffness: 120, damping: 18 } },
                  out: { y: "-110%", transition: { duration: 0.35 } },
                }}
              >
                {w}
              </motion.h1>
            </div>
          ))}
          {c.sub && (
            <motion.p className="story-sub" variants={{ hide: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.6 } }, out: { opacity: 0 } }}>
              {c.sub}
            </motion.p>
          )}
          {last && (
            <motion.button
              className="btn btn-cream story-cta"
              variants={{ hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { delay: 0.7 } }, out: { opacity: 0 } }}
              onClick={(e) => {
                e.stopPropagation();
                onDone();
              }}
            >
              Enter the universe »
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
      {!last && <div className="story-tap mono">tap to continue</div>}
    </motion.div>
  );
}

/* ───────────────────────── Onboarding ───────────────────────── */

function PickScene({ hover }: { hover: PlayerId | null }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={2} color="#fff0dc" />
      {(["adarsh", "devanshi"] as PlayerId[]).map((p, i) => (
        <group key={p} position={[i === 0 ? -0.9 : 0.9, -1, 0]} rotation={[0, i === 0 ? 0.35 : -0.35, 0]} scale={hover === p ? 1.12 : 1}>
          <Character player={p} motion={{ current: { speed: 0, emote: hover === p ? 0.6 : 0 } }} />
        </group>
      ))}
    </>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const setIdentity = useStore((s) => s.setIdentity);
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<PlayerId | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const cloud = cloudConfigured();

  const finish = async () => {
    if (!who || code.trim().length < 4) return;
    setBusy(true);
    const h = await hashSpace(code);
    setIdentity(who, h);
    setStep(2);
    setBusy(false);
  };

  return (
    <motion.div className="onboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="loader-grain" />
      <div className="onboard-step mono">step {step + 1} / 3</div>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section key="who" className="onboard-card" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
            <p className="serif kicker">Pip asks —</p>
            <h2 className="display">Who&apos;s holding this phone?</h2>
            <div className="pick-canvas">
              <Canvas camera={{ position: [0, 0.3, 4], fov: 40 }} dpr={[1, 2]}>
                <PickScene hover={who} />
              </Canvas>
            </div>
            <div className="pick-row">
              {(["adarsh", "devanshi"] as PlayerId[]).map((p) => (
                <button
                  key={p}
                  className={`pick ${who === p ? "on" : ""}`}
                  style={{ ["--c" as string]: PLAYER_META[p].color }}
                  onClick={() => setWho(p)}
                >
                  I&apos;m {PLAYER_META[p].name}
                </button>
              ))}
            </div>
            <button className="btn btn-primary wide" disabled={!who} onClick={() => setStep(1)}>
              Continue
            </button>
          </motion.section>
        )}
        {step === 1 && (
          <motion.section key="code" className="onboard-card" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
            <p className="serif kicker">your private universe</p>
            <h2 className="display">Choose a secret word.</h2>
            <p className="muted">
              Both of you type the <b>same word</b> on your own phones. It becomes the key to your shared universe — nobody without it can see your data.
            </p>
            <input
              className="input big"
              type="password"
              autoComplete="off"
              placeholder="something only you two know"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && finish()}
            />
            <p className="small muted">
              {cloud
                ? "☁️ Cloud sync is on — your activity appears live on both phones."
                : "📱 Local mode — data stays on this device. Add Supabase keys (see README) to sync between both phones."}
            </p>
            <div className="row gap">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary grow" disabled={code.trim().length < 4 || busy} onClick={finish}>
                {busy ? "Opening…" : "Open our universe"}
              </button>
            </div>
          </motion.section>
        )}
        {step === 2 && (
          <motion.section key="how" className="onboard-card" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="serif kicker">how it works</p>
            <h2 className="display">Three things to know.</h2>
            <ol className="how-list">
              <li>
                <b>Log real life.</b> Tap <span className="kbd">＋</span> any time to start a study or workout timer, log a meal, water, sleep or mood. It never takes more than two taps.
              </li>
              <li>
                <b>Watch your island grow.</b> Every hour becomes trees, books, crystals and plates in the 3D world. Walk around, collect daily coins and cheer each other on.
              </li>
              <li>
                <b>Earn your place in the Hall.</b> Quests, medals, levels, certificates and records — each of you has a museum, and there&apos;s one you share.
              </li>
            </ol>
            <button className="btn btn-primary wide" onClick={onDone}>
              Let&apos;s grow »
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
