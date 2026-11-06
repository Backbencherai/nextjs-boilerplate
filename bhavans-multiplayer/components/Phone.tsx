"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import * as E from "@/lib/game/engine";
import * as M from "@/lib/game/market";
import { RES_META, type ResKey } from "@/lib/game/rules";
import { ago, fmt, useNow, Flag } from "./ui";

type App = "home" | "stocks" | "trade" | "messages" | "calls" | "news";

const APPS: { id: App; icon: string; label: string; bg: string }[] = [
  { id: "calls", icon: "📞", label: "Phone", bg: "#3ecf6e" },
  { id: "messages", icon: "💬", label: "Messages", bg: "#2a8bd8" },
  { id: "stocks", icon: "📈", label: "Stocks", bg: "#16161d" },
  { id: "trade", icon: "🚢", label: "Trade", bg: "#ff9933" },
  { id: "news", icon: "📰", label: "News", bg: "#d23a3a" },
];

export function PhoneButton() {
  const setPhone = useGame((s) => s.setPhone);
  const offers = useGame((s) => s.nation?.offers?.length ?? 0);
  return (
    <button className="phone-fab" onClick={() => setPhone(true)} aria-label="Open your phone">
      📱{offers > 0 && <i>{offers}</i>}
    </button>
  );
}

export function Phone() {
  const open = useGame((s) => s.phone);
  const setPhone = useGame((s) => s.setPhone);
  const [app, setApp] = useState<App>("home");
  const now = useNow(30_000);
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="back mid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPhone(false)}>
            <motion.div className="phone" initial={{ y: 60, rotate: 4, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()}>
              <div className="ph-status">
                <b>{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b>
                <span className="ph-notch" />
                <span>📶 🔋</span>
              </div>
              <div className="ph-screen">
                {app === "home" && <HomeScreen open={setApp} />}
                {app === "stocks" && <Stocks />}
                {app === "trade" && <Trade />}
                {app === "messages" && <Messages />}
                {app === "calls" && <Calls />}
                {app === "news" && <News />}
              </div>
              <button className="ph-home" onClick={() => (app === "home" ? setPhone(false) : setApp("home"))} aria-label="Home" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <CallOverlay />
    </>
  );
}

function HomeScreen({ open }: { open: (a: App) => void }) {
  const n = useGame((s) => s.nation)!;
  return (
    <div className="ph-home-screen">
      <div className="ph-widget">
        <small>{M.currencyName(n.name)}</small>
        <b className="big">{M.currencyRate(n).toFixed(2)}×</b>
        <small>health index {Math.round(M.healthIndex(n) * 100)}% · eat well, hydrate and move to strengthen it</small>
      </div>
      <div className="ph-apps">
        {APPS.map((a) => (
          <button key={a.id} onClick={() => open(a.id)}>
            <span style={{ background: a.bg }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
        <Link href="/bank" onClick={() => useGame.getState().setPhone(false)}>
          <span style={{ background: "#e0a100" }}>🏦</span>
          Bank
        </Link>
        <Link href="/world" onClick={() => useGame.getState().setPhone(false)}>
          <span style={{ background: "#1f3a93" }}>🌍</span>
          Maps
        </Link>
        <Link href="/city" onClick={() => useGame.getState().setPhone(false)}>
          <span style={{ background: "#138808" }}>🏙️</span>
          City
        </Link>
      </div>
    </div>
  );
}

function useCountries() {
  const world = useGame((s) => s.world);
  const me = useGame((s) => s.nation?.id);
  return useMemo(() => Object.values(world).filter((p) => p.id !== me && !p.ai).sort((a, b) => b.power - a.power), [world, me]);
}

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return <svg width="70" height="22" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 70},${22 - ((v - min) / Math.max(1, max - min)) * 20 - 1}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width="70" height="22">
      <polyline points={pts} fill="none" stroke={up ? "#138808" : "#d23a3a"} strokeWidth="2" />
    </svg>
  );
}

function Stocks() {
  const n = useGame((s) => s.nation)!;
  const prices = useGame((s) => s.prices);
  const pub = useGame((s) => s.pub);
  const buy = useGame((s) => s.buyShares);
  const sell = useGame((s) => s.sellShares);
  const list = useCountries();
  const [qty, setQty] = useState(5);
  const pv = M.portfolioValue(n, pub);
  return (
    <div className="ph-app">
      <h3 className="h3">📈 Bhavan&apos;s Stock Exchange</h3>
      <div className="row between small">
        <span>Portfolio</span>
        <b>{fmt(pv)} 🪙</b>
      </div>
      <label className="f">
        Shares per trade: {qty}
        <input className="range" type="range" min={1} max={50} value={qty} onChange={(e) => setQty(+e.target.value)} />
      </label>
      {Object.entries(n.portfolio ?? {}).map(([id, h]) => {
        const p = pub(id);
        const price = p ? M.sharePrice(p) : h.avg;
        return (
          <div key={id} className="ph-row">
            <span><Flag code={h.flag} /></span>
            <div className="grow">
              <b>{h.name}</b>
              <small>
                {h.qty} @ {h.avg} → {price} ({price >= h.avg ? "+" : ""}
                {(((price - h.avg) / h.avg) * 100).toFixed(0)}%)
              </small>
            </div>
            <button className="btn sm" onClick={() => sell(id, Math.min(qty, h.qty))}>
              Sell
            </button>
          </div>
        );
      })}
      <p className="kicker">market</p>
      {list.map((p) => (
        <div key={p.id} className="ph-row">
          <span><Flag code={p.flag} /></span>
          <div className="grow">
            <b>{p.name}</b>
            <small>
              {M.sharePrice(p)} 🪙 · fx {p.fx?.toFixed(2) ?? "1.00"} · health {p.health ?? 0}%
            </small>
          </div>
          <Spark data={prices[p.id] ?? []} />
          <button className="btn sm green" onClick={() => buy(p.id, qty)}>
            Buy
          </button>
        </div>
      ))}
      {!list.length && <p className="small muted">No other countries listed yet.</p>}
      <p className="tiny muted">Prices follow each country&apos;s power, happiness and currency strength. 10% of every purchase is invested in that country.</p>
    </div>
  );
}

function Trade() {
  const n = useGame((s) => s.nation)!;
  const ex = useGame((s) => s.exportGoods);
  const im = useGame((s) => s.importGoods);
  const offer = useGame((s) => s.offerTrade);
  const answer = useGame((s) => s.answerTrade);
  const list = useCountries();
  const [k, setK] = useState<ResKey>("food");
  const [qty, setQty] = useState("50");
  const [to, setTo] = useState("");
  const [price, setPrice] = useState("40");
  const rate = M.currencyRate(n);
  const q = +qty || 0;
  return (
    <div className="ph-app">
      <h3 className="h3">🚢 Trade & customs</h3>
      {(n.offers ?? []).map((o) => (
        <div key={o.id} className="ph-row" style={{ background: "#fff1bd" }}>
          <span>📦</span>
          <div className="grow">
            <b>{o.fromName}</b>
            <small>
              sells {o.qty} {RES_META[o.res].icon} for {o.price} 🪙
            </small>
          </div>
          <button className="btn sm green" onClick={() => answer(o.id, true)}>
            Buy
          </button>
          <button className="btn sm" onClick={() => answer(o.id, false)}>
            ✕
          </button>
        </div>
      ))}
      <div className="seg">
        {M.TRADABLE.map((r) => (
          <button key={r} className={k === r ? "on" : ""} onClick={() => setK(r)}>
            {RES_META[r].icon}
          </button>
        ))}
      </div>
      <div className="row">
        <input className="input" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <span className="small">
          have {fmt(n.res[k])} {RES_META[k].icon}
        </span>
      </div>
      <p className="kicker">world market (instant)</p>
      <div className="grid2">
        <button className="btn green" onClick={() => ex(k, q)}>
          Export → +{Math.round(q * (M.BASE_PRICE[k] ?? 0) * rate)} 🪙
        </button>
        <button className="btn" onClick={() => im(k, q)}>
          Import ← −{Math.round((q * (M.BASE_PRICE[k] ?? 0) * 1.6) / rate)} 🪙
        </button>
      </div>
      <p className="tiny muted">A stronger currency (fx {rate.toFixed(2)}×) earns more on exports and makes imports cheaper.</p>
      <p className="kicker">sell to a country</p>
      <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
        <option value="">Choose a buyer…</option>
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            <Flag code={p.flag} /> {p.name}
          </option>
        ))}
      </select>
      <div className="row">
        <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))} />
        <button className="btn primary" disabled={!to} onClick={() => offer(to, k, q, +price)}>
          Offer
        </button>
      </div>
    </div>
  );
}

function Messages() {
  const dms = useGame((s) => s.dms);
  const dm = useGame((s) => s.dm);
  const list = useCountries();
  const [peer, setPeer] = useState<string | null>(null);
  const [t, setT] = useState("");
  const threads = useMemo(() => {
    const m = new Map<string, { name: string; last: (typeof dms)[number] }>();
    for (const d of dms) m.set(d.with, { name: d.withName, last: d });
    return [...m.entries()].sort((a, b) => b[1].last.at - a[1].last.at);
  }, [dms]);
  if (peer) {
    const conv = dms.filter((d) => d.with === peer);
    const name = threads.find((x) => x[0] === peer)?.[1].name ?? list.find((p) => p.id === peer)?.name ?? "President";
    return (
      <div className="ph-app">
        <div className="row">
          <button className="x" onClick={() => setPeer(null)}>
            ←
          </button>
          <b className="grow">{name}</b>
          <button className="btn sm green" onClick={() => useGame.getState().dial(peer)} aria-label="Voice call">
            📞
          </button>
          <button className="btn sm" onClick={() => useGame.getState().dial(peer, true)} aria-label="Video call">
            🎥
          </button>
        </div>
        <div className="chat" style={{ maxHeight: 320 }}>
          {conv.map((d) => (
            <div key={d.id} className={`msg ${d.mine ? "me" : ""}`}>
              {d.text}
              <small>{ago(d.at)}</small>
            </div>
          ))}
        </div>
        <div className="row">
          <input className="input" value={t} placeholder="Message…" onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (dm(peer, t), setT(""))} />
          <button className="btn primary" onClick={() => (dm(peer, t), setT(""))}>
            Send
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="ph-app">
      <h3 className="h3">💬 Messages</h3>
      {threads.map(([id, th]) => (
        <button key={id} className="ph-row" onClick={() => setPeer(id)}>
          <span>💬</span>
          <div className="grow" style={{ textAlign: "left" }}>
            <b>{th.name}</b>
            <small>{th.last.text.slice(0, 40)}</small>
          </div>
          <small>{ago(th.last.at)}</small>
        </button>
      ))}
      <p className="kicker">new message</p>
      {list.slice(0, 30).map((p) => (
        <button key={p.id} className="ph-row" onClick={() => setPeer(p.id)}>
          <span><Flag code={p.flag} /></span>
          <div className="grow" style={{ textAlign: "left" }}>
            <b>{p.president}</b>
            <small>{p.name}</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function Calls() {
  const list = useCountries();
  const dial = useGame((s) => s.dial);
  return (
    <div className="ph-app">
      <h3 className="h3">📞 Call a president</h3>
      <p className="tiny muted">Real voice calls, anywhere in the world. Your browser will ask for the microphone.</p>
      {list.map((p) => {
        const online = Date.now() - p.lastSeen < 3 * 60_000;
        return (
          <div key={p.id} className="ph-row">
            <span><Flag code={p.flag} /></span>
            <div className="grow">
              <b>{p.president}</b>
              <small>
                {p.name} · <span className={online ? "dot on" : "dot"} /> {online ? "online" : "offline"}
              </small>
            </div>
            <button className="btn sm green" disabled={!online} onClick={() => dial(p.id)} aria-label="Voice call">
              📞
            </button>
            <button className="btn sm" disabled={!online} onClick={() => dial(p.id, true)} aria-label="Video call">
              🎥
            </button>
          </div>
        );
      })}
      {!list.length && <p className="small muted">Nobody else is here yet.</p>}
    </div>
  );
}

function News() {
  const news = useGame((s) => s.news);
  return (
    <div className="ph-app">
      <h3 className="h3">📰 World News</h3>
      {news.slice(0, 40).map((x) => (
        <div key={x.id} className="ph-row">
          <span>{x.icon}</span>
          <div className="grow">
            <small style={{ color: "var(--ink)", fontSize: 13 }}>{x.text}</small>
          </div>
          <small>{ago(x.at)}</small>
        </div>
      ))}
    </div>
  );
}

function Video({ stream, mine }: { stream: MediaStream | null; mine?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  });
  if (!stream || !stream.getVideoTracks().length) return null;
  return <video ref={ref} className={mine ? "vid-me" : "vid-peer"} autoPlay playsInline muted />;
}

function CallOverlay() {
  const call = useGame((s) => s.call);
  const caller = useGame((s) => s.caller);
  const accept = useGame((s) => s.acceptCall);
  const decline = useGame((s) => s.declineCall);
  const hangup = useGame((s) => s.hangup);
  const mute = useGame((s) => s.mute);
  const camera = useGame((s) => s.camera);
  const flip = useGame((s) => s.flipCamera);
  const [, bump] = useState(0);
  const now = useNow(1000);
  useEffect(() => {
    if (caller) caller.onMedia = () => bump((x) => x + 1);
  }, [caller]);
  if (call.state === "idle") return null;
  const secs = call.since ? Math.floor((now - call.since) / 1000) : 0;
  const peerVideo = !!caller?.remote?.getVideoTracks().length;
  const status =
    call.state === "ringing" ? (call.video ? "Incoming video call…" : "Incoming call…") : call.state === "calling" ? "Calling…" : call.state === "connecting" ? "Connecting…" : `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div className={`call ${call.video && call.state !== "ringing" ? "video" : ""}`}>
      {call.video && call.state !== "ringing" && (
        <div className="vid-wrap">
          <Video stream={peerVideo ? caller!.remote : null} />
          {!peerVideo && <div className="call-av">🎥</div>}
          {!call.camOff && <Video stream={caller?.local ?? null} mine />}
        </div>
      )}
      {!(call.video && call.state !== "ringing") && <div className="call-av">{call.video ? "🎥" : "📞"}</div>}
      <b className="display" style={{ fontSize: 20, textAlign: "center" }}>
        {call.peerName}
      </b>
      <span>{status}</span>
      <div className="row center wrap">
        {call.state === "ringing" ? (
          <>
            <button className="btn red lg" onClick={() => decline()}>
              Decline
            </button>
            {call.video && (
              <button className="btn lg" onClick={() => accept(false)}>
                🎙️ Voice only
              </button>
            )}
            <button className="btn green lg" onClick={() => accept()}>
              {call.video ? "🎥 Answer" : "Answer"}
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => mute(!call.muted)}>
              {call.muted ? "🔇 Unmute" : "🎙️ Mute"}
            </button>
            {call.video && (
              <>
                <button className="btn" onClick={() => camera(!call.camOff)}>
                  {call.camOff ? "📷 Camera on" : "🚫 Camera off"}
                </button>
                <button className="btn" onClick={() => flip()}>
                  🔄 Flip
                </button>
              </>
            )}
            <button className="btn red lg" onClick={() => hangup()}>
              End call
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { E };
