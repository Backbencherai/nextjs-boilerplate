"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Character, type MotionRef } from "../three/Character";
import { Pip } from "../three/Pip";
import { Ink } from "../three/Ink";
import { Crowd } from "../three/Crowd";
import { Trophy } from "../three/Trophy";
import { Bridge, Coin, Flower, House, Island, Tree, FocusCrystal } from "../three/props";
import { useStore } from "@/lib/store";
import { LogoMark } from "../LogoMark";
import { hashSpace, cloudConfigured } from "@/lib/sync/backend";
import { PLAYER_META, type PlayerId } from "@/lib/types";
import { notifyGranted, notifySupported, geoSupported } from "@/lib/device";

/* ───────────────────────── shared bits ───────────────────────── */

function PaperLights() {
  return (
    <>
      <color attach="background" args={["#f4f3ef"]} />
      <hemisphereLight args={["#ffffff", "#d8d6ce", 1.15]} />
      <directionalLight position={[5, 10, 6]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004} shadow-normalBias={0.04} />
      <Ink />
    </>
  );
}

function ShadowFloor({ size = 60 }: { size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <shadowMaterial opacity={0.08} />
    </mesh>
  );
}

/** Hand-lettered headline: every letter wobbles a little, and boings when tapped. */
export function Lettered({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`lettered ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="letter"
          style={{ rotate: ((i * 37) % 9) - 4 }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 320, damping: 16 }}
          whileHover={{ y: -8, rotate: ((i * 53) % 14) - 7 }}
          whileTap={{ scale: 1.3, y: -14 }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

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
      setShown((v) => Math.min(real, v + Math.max(0.003, (real - v) * 0.07)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [real]);
  useEffect(() => {
    if (shown >= 0.999) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
  }, [shown, onDone]);

  const line = !steps.fonts ? "sharpening pencils…" : !steps.engine ? "drawing the islands…" : !steps.data ? "syncing your universe…" : "ready!";

  return (
    <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <div className="loader-logo">
        <LogoMark size={104} animated />
        <p>
          <span style={{ color: PLAYER_META.adarsh.color }}>ADARSH</span> <span style={{ color: "#c98f06" }}>♥</span>{" "}
          <span style={{ color: PLAYER_META.devanshi.color }}>DEWANSHI</span>
        </p>
      </div>
      <div className="loader-stage">
        <Canvas shadows camera={{ position: [0, 1.4, 3.6], fov: 38 }} dpr={[1, 2]}>
          <PaperLights />
          <group position={[0, -0.35, 0]}>
            <Pip
              progress={shown}
              onPoke={() => {
                pokes.current++;
                if (pokes.current === 10 && me) findSecret("pip");
              }}
            />
          </group>
          <group position={[0, -0.7, 0]}>
            <ShadowFloor size={10} />
          </group>
        </Canvas>
      </div>
      <div className="loader-bottom">
        <div className="loader-pct display">{Math.round(shown * 100)}%</div>
        <div className="fee-bar">
          <i style={{ width: `${shown * 100}%` }} />
        </div>
        <div className="loader-line">{line}</div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Landing ───────────────────────── */

function LandingScene() {
  const a = useRef<MotionRef>({ speed: 0, emote: 0 });
  const d = useRef<MotionRef>({ speed: 0, emote: 0 });
  const rig = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (rig.current) {
      rig.current.rotation.y += (s.pointer.x * 0.25 - rig.current.rotation.y) * 0.04;
    }
  });
  return (
    <>
      <PaperLights />
      <group ref={rig}>
        <group position={[-0.75, 0, 0.4]} rotation={[0, 0.35, 0]} scale={2.1}>
          <Character player="adarsh" motion={a} onClick={() => (a.current.emote = 1.2)} />
        </group>
        <group position={[0.75, 0, 0.4]} rotation={[0, -0.35, 0]} scale={2.1}>
          <Character player="devanshi" motion={d} onClick={() => (d.current.emote = 1.2)} />
        </group>
        <Crowd count={46} radius={9} avoid={2.2} seed="landing" />
        <ShadowFloor />
      </group>
    </>
  );
}

function LandingCamera() {
  const { camera, viewport } = useThree();
  useEffect(() => {
    const portrait = viewport.aspect < 1;
    // frame the pair in the upper part of the screen; the lettering sits below them
    camera.position.set(0, portrait ? 12.5 : 9, portrait ? 15 : 11.5);
    camera.lookAt(0, portrait ? -1.6 : -0.6, portrait ? 2.6 : 1.6);
  }, [camera, viewport.aspect]);
  return null;
}

export function Landing({ onStart, onStory, returning }: { onStart: () => void; onStory: () => void; returning: boolean }) {
  return (
    <motion.div className="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <div className="landing-canvas">
        <Canvas shadows camera={{ position: [0, 10, 9], fov: 40 }} dpr={[1, 1.75]}>
          <LandingCamera />
          <LandingScene />
        </Canvas>
      </div>
      <div className="landing-copy">
        <h1 className="landing-title display">
          <Lettered text="LEVEL UP" />
          <Lettered text="TOGETHER" className="sm" />
        </h1>
        <p className="landing-names display">
          <span style={{ color: PLAYER_META.adarsh.color }}>Adarsh</span> <span className="x">×</span>{" "}
          <span style={{ color: PLAYER_META.devanshi.color }}>Dewanshi</span>
        </p>
        <p className="landing-sub">Two people, one tiny universe. Every hour you study, train, eat well and rest makes your world grow.</p>
        <div className="row gap center">
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            {returning ? "Continue" : "Start"}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onStory}>
            Story
          </button>
        </div>
      </div>
      <p className="landing-foot">
        a private universe for two · <a href="/install/">install the app 📲</a>
      </p>
    </motion.div>
  );
}

/* ───────────────────────── Story (illustrated cards) ───────────────────────── */

const CHAPTERS = [
  { title: "Two people", body: "Adarsh and Dewanshi. Two lives, two schedules, two separate little worlds floating side by side." },
  { title: "Real life counts", body: "Every study session, workout, healthy meal, glass of water and good night of sleep earns real XP." },
  { title: "Your island grows", body: "Hours become trees, books, crystals and weight plates. Streaks become flowers. You can walk around all of it." },
  { title: "Quests & medals", body: "Daily and weekly quests, 37 medals, certificates you can download, and a 3D museum for each of you." },
  { title: "Better together", body: "Some quests only work if you both show up. Cheer each other on, send bottles, and build the shared island." },
];

function StoryScene({ ch }: { ch: number }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const bridge = useRef<THREE.Group>(null);
  const trophy = useRef<THREE.Group>(null);
  const a = useRef<MotionRef>({ speed: 0, emote: 0 });
  const d = useRef<MotionRef>({ speed: 0, emote: 0 });
  const { camera } = useThree();
  useEffect(() => {
    if (ch === 1) {
      a.current.emote = 1.2;
      setTimeout(() => (d.current.emote = 1.2), 300);
    }
    if (ch === 4) {
      a.current.emote = 1.2;
      d.current.emote = 1.2;
    }
  }, [ch]);
  useFrame((state, dt) => {
    const sep = ch < 4 ? 4.4 : 3.3;
    if (left.current) {
      left.current.position.x += (-sep - left.current.position.x) * dt * 2;
      left.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    }
    if (right.current) {
      right.current.position.x += (sep - right.current.position.x) * dt * 2;
      right.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + 1.5) * 0.12;
    }
    if (bridge.current) {
      const s = ch >= 4 ? 1 : 0.0001;
      bridge.current.scale.x += (s - bridge.current.scale.x) * dt * 3;
      bridge.current.visible = bridge.current.scale.x > 0.02;
    }
    if (trophy.current) {
      const s = ch === 3 ? 1.4 : 0.0001;
      trophy.current.scale.setScalar(trophy.current.scale.x + (s - trophy.current.scale.x) * dt * 4);
      trophy.current.rotation.y += dt * 1.5;
      trophy.current.visible = trophy.current.scale.x > 0.02;
    }
    const target = new THREE.Vector3(0, 6.5, 10.5);
    camera.position.lerp(target, dt * 2);
    camera.lookAt(0, 0.6, 0);
  });
  const grow = ch >= 2 ? 1 : 0.45;
  return (
    <>
      <PaperLights />
      <group ref={left} position={[-4.4, 0, 0]}>
        <Island position={[0, 0, 0]} radius={2.6} grass="#cfe0a8" seed="story-a" />
        <House position={[-0.5, 0, -1]} wall="#ffffff" roof={PLAYER_META.adarsh.color} />
        <group position={[0.9, 0, 0.8]} rotation={[0, 0.5, 0]}>
          <Character player="adarsh" motion={a} />
        </group>
        <Tree position={[-1.7, 0, 0.8]} scale={grow} />
        <Tree position={[1.5, 0, -1]} scale={grow * 0.8} variant={1} />
        {ch >= 2 && <FocusCrystal position={[-0.6, 0, 1.6]} hours={9} color={PLAYER_META.adarsh.color} />}
        {ch >= 2 && [0, 1, 2, 3].map((i) => <Flower key={i} position={[-0.4 + i * 0.4, 0, 1.9]} color="#f2c31a" />)}
        {ch === 1 && <Coin position={[0.9, 1.1, 0.8]} />}
      </group>
      <group ref={right} position={[4.4, 0, 0]}>
        <Island position={[0, 0, 0]} radius={2.6} grass="#cfe0a8" seed="story-d" />
        <House position={[0.5, 0, -1]} wall="#ffffff" roof={PLAYER_META.devanshi.color} />
        <group position={[-0.9, 0, 0.8]} rotation={[0, -0.5, 0]}>
          <Character player="devanshi" motion={d} />
        </group>
        <Tree position={[1.7, 0, 0.8]} scale={grow} variant={1} />
        <Tree position={[-1.5, 0, -1]} scale={grow * 0.8} />
        {ch >= 2 && <FocusCrystal position={[0.6, 0, 1.6]} hours={9} color={PLAYER_META.devanshi.color} />}
        {ch >= 2 && [0, 1, 2, 3].map((i) => <Flower key={i} position={[-0.8 + i * 0.4, 0, 1.9]} color="#f2c31a" />)}
        {ch === 1 && <Coin position={[-0.9, 1.1, 0.8]} />}
      </group>
      <group ref={trophy} position={[0, 1.4, 0]} scale={0.0001}>
        <Trophy shape="cup" tier="gold" />
      </group>
      <group ref={bridge} scale={[0.0001, 1, 1]}>
        <Bridge from={[-1.4, 0.3]} to={[1.4, 0.3]} />
      </group>
    </>
  );
}

function Card({ children, illo }: { children: ReactNode; illo: ReactNode }) {
  return (
    <motion.div className="story-card" initial={{ y: 40, opacity: 0, rotate: -1.5 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -30, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
      <div className="story-illo">{illo}</div>
      {children}
    </motion.div>
  );
}

export function Story({ onDone }: { onDone: () => void }) {
  const [ch, setCh] = useState(0);
  const last = ch === CHAPTERS.length - 1;
  const c = CHAPTERS[ch];
  return (
    <motion.div className="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card
        illo={
          <Canvas shadows camera={{ position: [0, 6.5, 10.5], fov: 42 }} dpr={[1, 1.75]}>
            <StoryScene ch={ch} />
          </Canvas>
        }
      >
        <p className="story-count">
          {ch + 1} of {CHAPTERS.length}
        </p>
        <AnimatePresence mode="wait">
          <motion.div key={ch} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <h2 className="display story-title">{c.title}</h2>
            <p className="story-body">{c.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="row gap center">
          {!last && (
            <button className="btn btn-ghost" onClick={onDone}>
              Skip
            </button>
          )}
          <button className="btn btn-primary" onClick={() => (last ? onDone() : setCh(ch + 1))}>
            {last ? "Let's go" : "Next"}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

/* ───────────────────────── Onboarding ───────────────────────── */

function PickScene({ who }: { who: PlayerId | null }) {
  const a = useRef<MotionRef>({ speed: 0, emote: 0 });
  const d = useRef<MotionRef>({ speed: 0, emote: 0 });
  useEffect(() => {
    if (who === "adarsh") a.current.emote = 1.2;
    if (who === "devanshi") d.current.emote = 1.2;
  }, [who]);
  return (
    <>
      <PaperLights />
      <group position={[-0.85, -1.1, 0]} rotation={[0, 0.35, 0]} scale={who === "adarsh" ? 1.15 : 1}>
        <Character player="adarsh" motion={a} />
      </group>
      <group position={[0.85, -1.1, 0]} rotation={[0, -0.35, 0]} scale={who === "devanshi" ? 1.15 : 1}>
        <Character player="devanshi" motion={d} />
      </group>
      <group position={[0, -1.1, 0]}>
        <ShadowFloor size={8} />
      </group>
    </>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const setIdentity = useStore((s) => s.setIdentity);
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<PlayerId | null>(null);
  const [code, setCode] = useState("LOVE");
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
    <motion.div className="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <Card
            key="who"
            illo={
              <Canvas shadows camera={{ position: [0, 0.4, 4.2], fov: 40 }} dpr={[1, 2]}>
                <PickScene who={who} />
              </Canvas>
            }
          >
            <p className="story-count">1 of 4</p>
            <h2 className="display story-title">Who are you?</h2>
            <p className="story-body">Pick who&apos;s holding this phone. Your partner picks the other one on theirs.</p>
            <div className="pick-row">
              {(["adarsh", "devanshi"] as PlayerId[]).map((p) => (
                <button key={p} className={`pick ${who === p ? "on" : ""}`} style={{ ["--c" as string]: PLAYER_META[p].color }} onClick={() => setWho(p)}>
                  {PLAYER_META[p].name}
                </button>
              ))}
            </div>
            <div className="row gap center">
              <button className="btn btn-primary" disabled={!who} onClick={() => setStep(1)}>
                Next
              </button>
            </div>
          </Card>
        )}
        {step === 1 && (
          <Card
            key="code"
            illo={
              <Canvas shadows camera={{ position: [0, 1.4, 3.6], fov: 38 }} dpr={[1, 2]}>
                <PaperLights />
                <group position={[0, -0.4, 0]}>
                  <Pip bounce={false} />
                </group>
                <group position={[0, -0.75, 0]}>
                  <ShadowFloor size={8} />
                </group>
              </Canvas>
            }
          >
            <p className="story-count">2 of 4</p>
            <h2 className="display story-title">Join code</h2>
            <p className="story-body">
              You both enter the <b>same join code</b> on your own phones, anywhere in the world, and you&apos;re in one live multiplayer universe. Everything is encrypted with it.
            </p>
            <input
              className="input big join-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="LOVE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && finish()}
            />
            <p className="small muted center">{cloud ? "💞 Multiplayer is on. You'll see each other walk, cheer and level up live." : "📱 This browser can't do multiplayer. Your progress stays on this device."}</p>
            <div className="row gap center">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary" disabled={code.trim().length < 4 || busy} onClick={finish}>
                {busy ? "Joining…" : "Join"}
              </button>
            </div>
          </Card>
        )}
        {step === 2 && <PermissionsCard onNext={() => setStep(3)} />}
        {step === 3 && (
          <Card
            key="how"
            illo={
              <Canvas shadows camera={{ position: [0, 1.2, 3.4], fov: 38 }} dpr={[1, 2]}>
                <PaperLights />
                <group position={[0, -0.1, 0]} scale={1.6}>
                  <Trophy shape="star" tier="gold" />
                </group>
              </Canvas>
            }
          >
            <p className="story-count">4 of 4</p>
            <h2 className="display story-title">How it works</h2>
            <ul className="how-list">
              <li>
                <b>Log real life.</b> Tap <span className="kbd">＋</span> any time: timers, meals, water, sleep, mood. Two taps, never more.
              </li>
              <li>
                <b>Watch your island grow.</b> Walk the 3D world, collect daily coins, cheer each other.
              </li>
              <li>
                <b>Earn your place.</b> Quests, medals, levels, certificates and museums.
              </li>
            </ul>
            <div className="row gap center">
              <button className="btn btn-primary" onClick={onDone}>
                Let&apos;s grow
              </button>
            </div>
          </Card>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Step 3: stay close — notifications + location (both optional, both ask the OS properly). */
function PermissionsCard({ onNext }: { onNext: () => void }) {
  const enableNotifications = useStore((s) => s.enableNotifications);
  const enableLocation = useStore((s) => s.enableLocation);
  const [notif, setNotif] = useState<"idle" | "on" | "off">(notifyGranted() ? "on" : "idle");
  const [loc, setLoc] = useState<"idle" | "on" | "off" | "busy">("idle");
  const ios = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || !!(navigator as unknown as { standalone?: boolean }).standalone);
  return (
    <Card
      key="perm"
      illo={
        <Canvas shadows camera={{ position: [0, 0.4, 4.2], fov: 40 }} dpr={[1, 2]}>
          <PickScene who={null} />
        </Canvas>
      }
    >
      <p className="story-count">3 of 4</p>
      <h2 className="display story-title">Stay close</h2>
      <p className="story-body">Get a ping when your partner cheers or wins something, and see how far apart you are.</p>
      <div className="stack">
        <div className="perm-row">
          <span style={{ fontSize: 26 }}>🔔</span>
          <div className="grow">
            <b>Notifications</b>
            <small>{!notifySupported() ? (ios && !standalone ? "On iPhone, install the app first (Share → Add to Home Screen)." : "Not supported in this browser.") : "Cheers, bottles, medals, builds, a gentle daily nudge."}</small>
          </div>
          {notif === "on" ? (
            <span className="ok">✓ On</span>
          ) : (
            <button className="btn btn-primary sm" disabled={!notifySupported()} onClick={async () => setNotif((await enableNotifications()) ? "on" : "off")}>
              {notif === "off" ? "Blocked" : "Allow"}
            </button>
          )}
        </div>
        <div className="perm-row">
          <span style={{ fontSize: 26 }}>📍</span>
          <div className="grow">
            <b>Location</b>
            <small>Only to show the distance between you two. Rounded to about 100 m, encrypted, shared with no one else.</small>
          </div>
          {loc === "on" ? (
            <span className="ok">✓ On</span>
          ) : (
            <button
              className="btn btn-primary sm"
              disabled={!geoSupported() || loc === "busy"}
              onClick={async () => {
                setLoc("busy");
                setLoc((await enableLocation()) ? "on" : "off");
              }}
            >
              {loc === "busy" ? "…" : loc === "off" ? "Blocked" : "Allow"}
            </button>
          )}
        </div>
      </div>
      <p className="small muted center">You can change both any time in Settings.</p>
      <div className="row gap center">
        <button className="btn btn-primary" onClick={onNext}>
          {notif === "on" || loc === "on" ? "Next" : "Maybe later"}
        </button>
      </div>
    </Card>
  );
}
