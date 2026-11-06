"use client";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import { CHARACTERS, ROLES, type CharId, type RoleId } from "@/lib/game/rules";
import { countryAt, countryList, spotIn } from "@/lib/geo";
import { Hero, type Anim } from "./three/Hero";
import { Ink } from "./three/Ink";
import { Crowd } from "./three/Crowd";
import { Asset } from "./three/assets";
import { Logo } from "./Logo";
import { WorldMap } from "./WorldMap";
import { askLocation } from "@/lib/device";

type Step = "landing" | "auth" | "found";

export function Entry() {
  const account = useGame((s) => s.account);
  const [step, setStep] = useState<Step>(account ? "found" : "landing");
  useEffect(() => {
    if (account) setStep("found");
  }, [account]);
  return (
    <AnimatePresence mode="wait">
      {step === "landing" && <Landing key="l" onPlay={() => setStep("auth")} />}
      {step === "auth" && <Auth key="a" onBack={() => setStep("landing")} />}
      {step === "found" && <Found key="f" />}
    </AnimatePresence>
  );
}

const CAST: CharId[] = ["knight", "scholar", "barbarian", "explorer", "mage", "rogue", "hooded"];

function Landing({ onPlay }: { onPlay: () => void }) {
  const players = useGame((s) => Object.keys(s.world).length);
  const relays = useGame((s) => s.relays);
  return (
    <motion.div className="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="landing-3d">
        <Canvas shadows camera={{ position: [0, 5.5, 13], fov: 40 }} dpr={[1, 1.75]}>
          <color attach="background" args={["#ffe9d2"]} />
          <Ink wash={0.25} />
          <hemisphereLight args={["#ffffff", "#e8d9c0", 1.15]} />
          <directionalLight position={[6, 12, 8]} intensity={1.8} castShadow />
          <group position={[0, -0.3, -1.2]}>
            {CAST.map((c, i) => (
              <group key={c} position={[(i - 3) * 1.25, 0, Math.abs(i - 3) * -0.35]} rotation={[0, (3 - i) * 0.12, 0]}>
                <Hero character={c} anim={i % 3 === 0 ? "cheer" : "idle"} height={1.6} />
              </group>
            ))}
            <Crowd count={30} radius={8} avoid={4.5} seed="landing" />
            <Asset name="Island_A" scale={9.5} position={[0, 0, 0]} />
            <Asset name="Cloud" position={[-6, 4.5, -6]} scale={1.6} />
            <Asset name="Cloud" position={[7, 5.2, -8]} scale={2} />
          </group>
        </Canvas>
      </div>
      <div className="landing-copy">
        <Logo size={74} animated />
        <h1 className="title-xl">
          BHAVAN&apos;S<span className="s">MULTIPLAYER</span>
        </h1>
        <p className="tag">Build a country with your real life. Study, train, eat well and drink water to grow a city, then trade, travel, ally and go to war with players everywhere.</p>
        <button className="btn saffron lg" onClick={onPlay}>
          ▶ Play
        </button>
        <p className="tiny muted">
          {relays ? `● online · ${players} countries this season` : "connecting to the world…"} · <a className="link" href="/install/">install the app</a>
        </p>
      </div>
    </motion.div>
  );
}

/* ───────── login ───────── */
function Auth({ onBack }: { onBack: () => void }) {
  const cfg = useGame((s) => s.cfg);
  const loginEmail = useGame((s) => s.loginEmail);
  const loginGoogle = useGame((s) => s.loginGoogle);
  const loginGuest = useGame((s) => s.loginGuest);
  const [mode, setMode] = useState<"email" | "guest">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const gid = cfg?.googleClientId;

  useEffect(() => {
    if (!gid) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => {
      const g = (window as unknown as { google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } } }).google;
      g?.accounts.id.initialize({
        client_id: gid,
        callback: async (r: { credential: string }) => {
          const p = JSON.parse(decodeURIComponent(escape(atob(r.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
          setBusy(true);
          setMsg("Signing in…");
          await loginGoogle({ sub: p.sub, name: p.name, email: p.email, picture: p.picture });
        },
      });
      const el = document.getElementById("gbtn");
      if (el) g?.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", width: 280, text: "continue_with" });
    };
    document.body.appendChild(s);
  }, [gid, loginGoogle]);

  const go = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setMsg("Enter a valid email.");
    if (!/^\d{4,8}$/.test(pin)) return setMsg("Choose a 4–8 digit PIN.");
    setBusy(true);
    setMsg("Finding your country…");
    const r = await loginEmail(name, email, pin);
    setMsg(r === "restored" ? "Welcome back!" : "");
  };

  return (
    <motion.div className="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="auth-card stack">
        <div className="row">
          <button className="x" onClick={onBack} aria-label="Back">
            ←
          </button>
          <Logo size={44} />
          <b className="display" style={{ fontSize: 20 }}>
            BHAVAN&apos;S MULTIPLAYER
          </b>
        </div>
        <h2 className="page-title">Sign in</h2>
        <p className="muted" style={{ margin: 0 }}>
          Your email + PIN is your key. Use it on any phone or computer to get your country back.
        </p>
        {gid && (
          <div className="card flat center" style={{ alignItems: "center" }}>
            <div id="gbtn" />
            <span className="tiny muted">or</span>
          </div>
        )}
        <div className="seg">
          <button className={mode === "email" ? "on" : ""} onClick={() => setMode("email")}>
            ✉️ Email
          </button>
          <button className={mode === "guest" ? "on" : ""} onClick={() => setMode("guest")}>
            👤 Just a name
          </button>
        </div>
        <label className="f">
          Your name
          <input className="input" value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} placeholder="e.g. Aarav" autoComplete="name" />
        </label>
        {mode === "email" ? (
          <>
            <label className="f">
              Email
              <input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="you@example.com" />
            </label>
            <label className="f">
              PIN (4–8 digits)
              <input className="input" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="••••" />
            </label>
            <button className="btn primary lg block" disabled={busy} onClick={go}>
              {busy ? "…" : "Continue"}
            </button>
          </>
        ) : (
          <>
            <p className="small muted" style={{ margin: 0 }}>
              Quick play keeps your country on this device only. You can&apos;t restore it elsewhere.
            </p>
            <button className="btn primary lg block" disabled={!name.trim()} onClick={() => loginGuest(name)}>
              Play as {name.trim() || "…"}
            </button>
          </>
        )}
        {msg && <p className="small center">{msg}</p>}
      </div>
    </motion.div>
  );
}

/* ───────── found your nation ───────── */
const FLAGS = ["🦁", "🐯", "🦅", "🐘", "🐉", "🌞", "🌙", "⭐", "🌸", "🌊", "🏔️", "🔥", "⚡", "🍀", "🦚", "🐬", "🛡️", "👑", "🏹", "🗻", "🌵", "🍁", "🌺", "🕊️"];
const COLORS = ["#ff9933", "#1f3a93", "#138808", "#d23a3a", "#7a4fd8", "#0fa3a3", "#e0a100", "#e0407a", "#3b3b46", "#6b8e23"];

function Found() {
  const found = useGame((s) => s.found);
  const account = useGame((s) => s.account);
  const logout = useGame((s) => s.logout);
  const world = useGame((s) => s.world);
  const [step, setStep] = useState(0);
  const [character, setCharacter] = useState<CharId>("scholar");
  const [country, setCountry] = useState<{ id: string; name: string; lat: number; lon: number } | null>(null);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("🦁");
  const [color, setColor] = useState(COLORS[0]);
  const [role, setRole] = useState<RoleId>("president");
  const [anim, setAnim] = useState<Anim>("cheer");
  const list = useMemo(() => countryList(), []);
  const matches = q ? list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const others = Object.values(world);

  const pick = (id: string, nm: string, at?: { lat: number; lon: number }) => {
    const spot = at ?? spotIn(id, Math.random());
    setCountry({ id, name: nm, ...spot });
    if (!name) setName(`${nm.split(" ")[0]} Republic`);
  };
  const steps = ["Character", "Country", "Nation", "Role"];
  const canNext = step === 1 ? !!country : step === 2 ? name.trim().length >= 3 : true;

  return (
    <motion.div className="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="auth-card stack" style={{ maxWidth: step === 1 ? 900 : 560 }}>
        <div className="row between">
          <span className="kicker">
            President {account?.name} · {steps[step]}
          </span>
          <button className="link small" onClick={logout}>
            switch account
          </button>
        </div>
        <div className="steps-dots">
          {steps.map((s, i) => (
            <i key={s} className={i <= step ? "on" : ""} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="page-title">Choose your ruler</h2>
            <div className="char-stage" onClick={() => setAnim((a) => (a === "cheer" ? "attack" : "cheer"))}>
              <Canvas shadows camera={{ position: [0, 1.3, 4.2], fov: 38 }} dpr={[1, 2]}>
                <Ink wash={0.2} />
                <hemisphereLight args={["#ffffff", "#e8d9c0", 1.2]} />
                <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
                <group position={[0, -0.85, 0]} key={character}>
                  <Hero character={character} anim={anim} height={2} />
                </group>
              </Canvas>
            </div>
            <div className="char-row">
              {CAST.map((c) => (
                <button key={c} className={character === c ? "on" : ""} onClick={() => (setCharacter(c), setAnim("cheer"))}>
                  <b>{CHARACTERS[c].name}</b>
                  <small>{CHARACTERS[c].blurb}</small>
                </button>
              ))}
            </div>
            <p className="tiny muted center">You rule as a giant over your little citizens, crowned in your nation&apos;s colours. Tap your ruler to see a move.</p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="page-title">Choose your country</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Tap a country on the map, search, or use your location. Many players can share a country, and each gets their own city in it.
            </p>
            <div className="row wrap">
              <input className="input grow" placeholder="Search countries…" value={q} onChange={(e) => setQ(e.target.value)} />
              <button
                className="btn"
                onClick={async () => {
                  const p = await askLocation();
                  if (!p) return;
                  const lat = Math.round(p.coords.latitude * 10) / 10;
                  const lon = Math.round(p.coords.longitude * 10) / 10;
                  const f = countryAt(lat, lon);
                  if (f) pick(String(f.id), f.properties.name, { lat, lon });
                }}
              >
                📍 Use my location
              </button>
            </div>
            {matches.length > 0 && (
              <div className="row wrap">
                {matches.map((m) => (
                  <button key={m.id} className="chip" onClick={() => (pick(m.id, m.name), setQ(""))}>
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            <WorldMap nations={others} picked={country?.id} onCountry={(id, nm) => pick(id, nm)} height="min(52dvh, 460px)" />
            <div className="card flat saffron">
              <b>{country ? `🏳️ ${country.name}` : "No country chosen yet"}</b>
              <span className="small">{country ? `${others.filter((o) => o.home.cc === country.id).length} other players here` : "Your capital will be placed inside it."}</span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="page-title">Name your nation</h2>
            <label className="f">
              Nation name
              <input className="input" value={name} onChange={(e) => setName(e.target.value.slice(0, 28))} placeholder="e.g. Republic of Sunrise" />
            </label>
            <label className="f">Emblem</label>
            <div className="flags">
              {FLAGS.map((f) => (
                <button key={f} className={flag === f ? "on" : ""} onClick={() => setFlag(f)}>
                  {f}
                </button>
              ))}
            </div>
            <label className="f">National colour</label>
            <div className="swatches">
              {COLORS.map((c) => (
                <button key={c} className={color === c ? "on" : ""} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
              ))}
            </div>
            <div className="card flat row" style={{ borderColor: color }}>
              <span className="flag" style={{ background: color }}>
                {flag}
              </span>
              <div>
                <b className="display" style={{ fontSize: 22 }}>
                  {name || "Your nation"}
                </b>
                <div className="small muted">
                  in {country?.name} · President {account?.name}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="page-title">Pick your role</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Your speciality. You can switch once a day.
            </p>
            <div className="roles">
              {(Object.keys(ROLES) as RoleId[]).map((r) => (
                <button key={r} className={`role ${role === r ? "on" : ""}`} onClick={() => setRole(r)}>
                  <span style={{ fontSize: 22 }}>{ROLES[r].icon}</span>
                  <b>{ROLES[r].name}</b>
                  <small>{ROLES[r].perk}</small>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="row between">
          <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </button>
          {step < 3 ? (
            <button className="btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button
              className="btn saffron lg"
              onClick={() => country && found({ name: name.trim(), flag, color, character, role, home: { cc: country.id, country: country.name, lat: country.lat, lon: country.lon } })}
            >
              🏛️ Found {name.trim() || "nation"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
