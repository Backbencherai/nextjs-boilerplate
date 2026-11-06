"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import qrcode from "qrcode-generator";
import { Asset } from "../three/assets";

/* ───────── sound: chime, original in-flight music, cabin voice ───────── */
let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());
function chime() {
  try {
    const a = ac();
    [880, 660].forEach((f, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, a.currentTime + i * 0.45);
      g.gain.linearRampToValueAtTime(0.25, a.currentTime + i * 0.45 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + i * 0.45 + 1.2);
      o.connect(g).connect(a.destination);
      o.start(a.currentTime + i * 0.45);
      o.stop(a.currentTime + i * 0.45 + 1.3);
    });
  } catch {}
}
/** A gentle generated lo-fi loop: pad chords + soft arpeggio. Original, made in-browser. */
function startMusic() {
  const a = ac();
  const master = a.createGain();
  master.gain.value = 0.12;
  master.connect(a.destination);
  const chords = [
    [220, 277.2, 329.6],
    [196, 246.9, 293.7],
    [174.6, 220, 261.6],
    [196, 246.9, 311.1],
  ];
  let step = 0;
  const tick = () => {
    const t = a.currentTime;
    const ch = chords[Math.floor(step / 8) % chords.length];
    if (step % 8 === 0)
      ch.forEach((f) => {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "triangle";
        o.frequency.value = f / 2;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.35, t + 0.4);
        g.gain.linearRampToValueAtTime(0, t + 3.6);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 3.8);
      });
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.value = ch[step % 3] * (step % 4 === 3 ? 2 : 1);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.45);
    step++;
  };
  tick();
  const iv = setInterval(tick, 450);
  return () => {
    clearInterval(iv);
    master.gain.linearRampToValueAtTime(0, a.currentTime + 0.4);
  };
}
function say(text: string, voice: boolean) {
  if (!voice || typeof speechSynthesis === "undefined") return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  } catch {}
}

/* ───────── the view out of your window ───────── */
function WindowScene({ alt, speed }: { alt: React.MutableRefObject<number>; speed: React.MutableRefObject<number> }) {
  const clouds = useRef<THREE.Group>(null);
  const ground = useRef<THREE.Group>(null);
  const wing = useRef<THREE.Group>(null);
  useFrame(({ camera, clock }, dt) => {
    const a = alt.current;
    camera.position.set(0, 1.2 + a * 14, 0);
    camera.lookAt(-12, 1.2 + a * 14 - 1.6 - a * 2, -3);
    if (clouds.current) {
      clouds.current.children.forEach((c) => {
        c.position.z += dt * speed.current * 14;
        if (c.position.z > 40) c.position.z -= 90;
      });
      clouds.current.position.y = 9;
    }
    if (ground.current) ground.current.children.forEach((c) => {
      c.position.z += dt * speed.current * 10;
      if (c.position.z > 60) c.position.z -= 120;
    });
    if (wing.current) {
      wing.current.position.set(-3.4, 0.25 + a * 14, 1.9);
      wing.current.rotation.z = Math.sin(clock.elapsedTime * 1.3) * 0.015 + (a > 0.05 && a < 0.6 ? 0.04 : 0);
    }
  });
  const trees = useMemo(() => Array.from({ length: 40 }, (_, i) => [-8 - (i % 7) * 4, 0, -60 + i * 3] as [number, number, number]), []);
  return (
    <>
      <color attach="background" args={["#a7d3f2"]} />
      <fog attach="fog" args={["#cbe6f8", 20, 110]} />
      <hemisphereLight args={["#ffffff", "#9fbf8a", 1.3]} />
      <directionalLight position={[-10, 30, 10]} intensity={1.6} />
      <group ref={ground}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, -0.01, 0]}>
          <planeGeometry args={[160, 400]} />
          <meshStandardMaterial color="#9cc77a" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0, 0]}>
          <planeGeometry args={[4, 400]} />
          <meshStandardMaterial color="#4d4f57" />
        </mesh>
        {trees.map((p, i) => (
          <Asset key={i} name={i % 2 ? "Tree_Round" : "Tree_Pine"} position={p} scale={1.2} />
        ))}
      </group>
      <group ref={clouds}>
        {Array.from({ length: 18 }).map((_, i) => (
          <Asset key={i} name="Cloud" position={[-6 - (i % 5) * 5, (i % 3) * 3 - 2, -50 + i * 5]} scale={2 + (i % 3)} />
        ))}
      </group>
      <group ref={wing} scale={0.6}>
        <mesh rotation={[0, 0.25, 0]}>
          <boxGeometry args={[4.2, 0.12, 1.3]} />
          <meshStandardMaterial color="#e9edf2" />
        </mesh>
        <mesh position={[-1.4, -0.35, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 1.1, 16]} />
          <meshStandardMaterial color="#c9ced6" />
        </mesh>
        <mesh position={[-2.05, 0.2, 0.4]}>
          <boxGeometry args={[0.08, 0.5, 0.4]} />
          <meshStandardMaterial color="#ff9933" />
        </mesh>
      </group>
    </>
  );
}

/* ───────── the journey ───────── */
type Stage = "checkin" | "security" | "gate" | "cabin" | "arrived";

export function Journey({ passenger, fromName, toName, km, onArrive, onCancel }: { passenger: string; fromName: string; toName: string; km: number; onArrive: () => void; onCancel: () => void }) {
  const [stage, setStage] = useState<Stage>("checkin");
  const [voice, setVoice] = useState(true);
  const flight = useMemo(() => `BM ${100 + Math.floor(Math.random() * 899)}`, []);
  const seat = useMemo(() => `${10 + Math.floor(Math.random() * 20)}${"ACDF"[Math.floor(Math.random() * 4)]}`, []);
  const gate = useMemo(() => `${"ABC"[Math.floor(Math.random() * 3)]}${1 + Math.floor(Math.random() * 18)}`, []);
  const mins = Math.round(40 + km / 13);
  const pass = useMemo(() => {
    const q = qrcode(0, "L");
    q.addData(`${flight}|${passenger}|${seat}`);
    q.make();
    return q.createSvgTag({ cellSize: 3, margin: 1, scalable: true });
  }, [flight, passenger, seat]);

  return (
    <div className="journey">
      <AnimatePresence mode="wait">
        {stage === "checkin" && (
          <motion.div key="c" className="j-step" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <p className="kicker">step 1 · check-in desk</p>
            <h2 className="page-title">Your boarding pass</h2>
            <div className="bpass">
              <div className="bp-main">
                <div className="row between">
                  <b className="display">BHAVAN&apos;S AIR</b>
                  <span className="tiny">BOARDING PASS</span>
                </div>
                <div className="bp-route">
                  <div>
                    <small>FROM</small>
                    <b>{fromName}</b>
                  </div>
                  <span>✈</span>
                  <div>
                    <small>TO</small>
                    <b>{toName}</b>
                  </div>
                </div>
                <div className="bp-grid">
                  <div>
                    <small>PASSENGER</small>
                    <b>{passenger.toUpperCase()}</b>
                  </div>
                  <div>
                    <small>FLIGHT</small>
                    <b>{flight}</b>
                  </div>
                  <div>
                    <small>GATE</small>
                    <b>{gate}</b>
                  </div>
                  <div>
                    <small>SEAT</small>
                    <b>{seat}</b>
                  </div>
                  <div>
                    <small>BOARDING</small>
                    <b>NOW</b>
                  </div>
                  <div>
                    <small>DURATION</small>
                    <b>{mins} min</b>
                  </div>
                </div>
              </div>
              <div className="bp-stub" dangerouslySetInnerHTML={{ __html: pass }} />
            </div>
            <p className="small muted">1 cabin bag allowed · liquids under 100 ml · have your passport ready.</p>
            <div className="row between">
              <button className="btn" onClick={onCancel}>
                Cancel trip
              </button>
              <button className="btn primary" onClick={() => setStage("security")}>
                To security →
              </button>
            </div>
          </motion.div>
        )}
        {stage === "security" && <Security key="s" onDone={() => setStage("gate")} />}
        {stage === "gate" && <Gate key="g" gate={gate} flight={flight} to={toName} voice={voice} setVoice={setVoice} onBoard={() => setStage("cabin")} />}
        {stage === "cabin" && <Cabin key="k" seat={seat} to={toName} from={fromName} flight={flight} km={km} voice={voice} onLanded={() => setStage("arrived")} />}
        {stage === "arrived" && (
          <motion.div key="a" className="j-step center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="kicker">arrivals · immigration</p>
            <h2 className="page-title">Welcome to {toName}</h2>
            <motion.div className="stamp" initial={{ scale: 3, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: -12, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.3 }}>
              ADMITTED
              <small>{new Date().toLocaleDateString()}</small>
            </motion.div>
            <p className="muted">Your passport has been stamped. Enjoy the city, and your visit pays them tourism income.</p>
            <button className="btn saffron lg" onClick={onArrive}>
              Explore {toName} →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Security({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0); // 0 tray, 1 scanning, 2 walk, 3 clear
  useEffect(() => {
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 2200);
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 1600);
      return () => clearTimeout(t);
    }
  }, [phase]);
  return (
    <motion.div className="j-step" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <p className="kicker">step 2 · security check</p>
      <h2 className="page-title">Security</h2>
      <div className="xray">
        <div className="belt" />
        <motion.div className="tray" animate={{ x: phase >= 1 ? "210%" : "0%" }} transition={{ duration: 2.1, ease: "easeInOut" }}>
          🎒💻📱
        </motion.div>
        <div className="scanner">X-RAY</div>
      </div>
      <div className="row center" style={{ gap: 18, fontSize: 40 }}>
        <motion.span animate={{ x: phase >= 2 ? 90 : 0 }} transition={{ duration: 1.4 }}>
          🚶
        </motion.span>
        <span className={`gate-arch ${phase === 3 ? "ok" : ""}`}>⛩</span>
      </div>
      <p className="center small">{["Put your bag, laptop and phone in the tray.", "Scanning your bag…", "Walk through the metal detector…", "✅ All clear. Collect your things."][phase]}</p>
      <div className="row center">
        {phase === 0 && (
          <button className="btn primary" onClick={() => setPhase(1)}>
            Put tray on the belt
          </button>
        )}
        {phase === 3 && (
          <button className="btn primary" onClick={onDone}>
            To the gate →
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Gate({ gate, flight, to, voice, setVoice, onBoard }: { gate: string; flight: string; to: string; voice: boolean; setVoice: (v: boolean) => void; onBoard: () => void }) {
  const [called, setCalled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setCalled(true);
      chime();
      say(`Good day passengers. Flight ${flight} to ${to} is now boarding at gate ${gate}. Please have your boarding pass ready.`, voice);
    }, 1800);
    return () => clearTimeout(t);
  }, [flight, to, gate, voice]);
  return (
    <motion.div className="j-step" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <p className="kicker">step 3 · gate {gate}</p>
      <h2 className="page-title">At the gate</h2>
      <div className="fids">
        <div>
          <small>FLIGHT</small>
          {flight}
        </div>
        <div>
          <small>TO</small>
          {to}
        </div>
        <div>
          <small>GATE</small>
          {gate}
        </div>
        <div className={called ? "blink" : ""}>
          <small>STATUS</small>
          {called ? "BOARDING" : "ON TIME"}
        </div>
      </div>
      <label className="row small">
        <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> Voice announcements
      </label>
      <button className="btn saffron lg block" disabled={!called} onClick={onBoard}>
        {called ? "🎫 Scan pass & board" : "Waiting for boarding call…"}
      </button>
    </motion.div>
  );
}

const ANN = {
  welcome: (to: string, f: string) => `Welcome aboard Bhavan's Air flight ${f} to ${to}. Please stow your bag under the seat in front of you and fasten your seatbelt.`,
  safety: "For your safety: to fasten your seatbelt, insert the metal tip into the buckle and pull tight. Oxygen masks will drop from above if needed. Emergency exits are at the front, over the wings and at the rear. Please keep your phone in flight mode.",
  takeoff: "Cabin crew, prepare for take-off.",
  cruise: "We have reached our cruising altitude. The seatbelt sign is now off. Feel free to put on your headphones and enjoy the view.",
  descent: "Ladies and gentlemen, we have begun our descent. Please return to your seat and fasten your seatbelt.",
  landed: (to: string) => `Welcome to ${to}. Please remain seated until the aircraft has come to a complete stop. Thank you for flying Bhavan's Air.`,
};

function Cabin({ seat, from, to, flight, km, voice, onLanded }: { seat: string; from: string; to: string; flight: string; km: number; voice: boolean; onLanded: () => void }) {
  const [phase, setPhase] = useState<"safety" | "taxi" | "takeoff" | "cruise" | "descent" | "landed">("safety");
  const [belt, setBelt] = useState(false);
  const [sign, setSign] = useState(true);
  const [phones, setPhones] = useState(false);
  const [shade, setShade] = useState(false);
  const [line, setLine] = useState(ANN.welcome(to, flight));
  const alt = useRef(0);
  const speed = useRef(0);
  const stopMusic = useRef<null | (() => void)>(null);
  const t0 = useRef(0);

  useEffect(() => {
    chime();
    say(ANN.welcome(to, flight), voice);
    const t = setTimeout(() => {
      setLine(ANN.safety);
      say(ANN.safety, voice);
    }, 6500);
    return () => clearTimeout(t);
  }, [to, flight, voice]);

  // flight profile once you're buckled up
  useEffect(() => {
    if (phase === "safety" || phase === "landed") return;
    let raf = 0;
    const loop = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const k = (ts - t0.current) / 1000;
      if (k < 3) {
        speed.current = k / 3;
        alt.current = 0;
        if (phase !== "taxi") setPhase("taxi");
      } else if (k < 8) {
        speed.current = 1.4;
        alt.current = Math.min(1, ((k - 3) / 5) ** 1.5);
        if (phase !== "takeoff") {
          setPhase("takeoff");
          setLine(ANN.takeoff);
          say(ANN.takeoff, voice);
        }
      } else if (k < 22) {
        speed.current = 1.6;
        alt.current = 1;
        if (phase !== "cruise") {
          setPhase("cruise");
          setSign(false);
          chime();
          setLine(ANN.cruise);
          say(ANN.cruise, voice);
        }
      } else if (k < 30) {
        speed.current = 1.4 - (k - 22) * 0.12;
        alt.current = Math.max(0, 1 - ((k - 22) / 8) ** 0.8);
        if (phase !== "descent") {
          setPhase("descent");
          setSign(true);
          chime();
          setLine(ANN.descent);
          say(ANN.descent, voice);
        }
      } else {
        speed.current = 0;
        alt.current = 0;
        setPhase("landed");
        setLine(ANN.landed(to));
        say(ANN.landed(to), voice);
        stopMusic.current?.();
        setTimeout(onLanded, 3500);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, voice, to, onLanded]);

  useEffect(() => () => stopMusic.current?.(), []);

  const toggleMusic = () => {
    if (phones) {
      stopMusic.current?.();
      stopMusic.current = null;
      setPhones(false);
    } else {
      stopMusic.current = startMusic();
      setPhones(true);
    }
  };

  return (
    <motion.div className="cabin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="cabin-top">
        <div className={`sign ${sign ? "on" : ""}`}>
          <span>🪢</span> FASTEN SEATBELT
        </div>
        <div className="sign">
          <span>🚭</span> NO SMOKING
        </div>
        <span className="tiny">
          {flight} · seat {seat} · {from} → {to}
        </span>
      </div>
      <div className="window">
        <div className="window-view">
          <Canvas camera={{ fov: 55, near: 0.1, far: 300 }} dpr={[1, 1.5]}>
            <WindowScene alt={alt} speed={speed} />
          </Canvas>
        </div>
        <motion.div className="shade" animate={{ height: shade ? "100%" : "0%" }} />
      </div>
      <div className="attendant">
        <span className="fa">👩‍✈️</span>
        <p>{line}</p>
      </div>
      <div className="progress">
        <span>{phase === "safety" ? "Safety briefing" : phase === "taxi" ? "Taxiing" : phase === "takeoff" ? "Take-off" : phase === "cruise" ? `Cruising · ${Math.round(km).toLocaleString()} km` : phase === "descent" ? "Descending" : "Landed"}</span>
        <div className="bar">
          <i style={{ width: `${{ safety: 5, taxi: 12, takeoff: 30, cruise: 65, descent: 88, landed: 100 }[phase]}%`, background: "#1f3a93" }} />
        </div>
      </div>
      <div className="cabin-ctrls">
        {phase === "safety" ? (
          <button
            className={`btn lg ${belt ? "green" : "saffron"} pulse`}
            onClick={() => {
              setBelt(true);
              chime();
              setTimeout(() => setPhase("taxi"), 600);
            }}
          >
            {belt ? "✅ Seatbelt fastened" : "🪢 Fasten seatbelt"}
          </button>
        ) : (
          <>
            <button className={`btn ${phones ? "navy" : ""}`} onClick={toggleMusic}>
              🎧 {phones ? "Music on" : "Headphones"}
            </button>
            <button className="btn" onClick={() => setShade((s) => !s)}>
              🪟 {shade ? "Open shade" : "Close shade"}
            </button>
            <button className="btn" onClick={() => (stopMusic.current?.(), onLanded())}>
              Skip ⏭
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
