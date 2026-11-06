"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame, kmTo } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { AI_ID, ROLES } from "@/lib/game/rules";
import { calamitiesBetween, CAL_META } from "@/lib/game/world";
import { WorldMap } from "../WorldMap";
import { LANDMARKS, LM_BY_ID } from "@/lib/game/landmarks";
import { distanceKm } from "@/lib/game/world";
import { Journey } from "../city/Journey";
import { Sheet, Stat, ago, fmt, left, useNow, Flag } from "../ui";

const STATUS: Record<string, string> = { study: "📚 studying", workout: "🏋️ working out", meditation: "🧘 meditating", plotting: "🏫 plotting" };

export function World() {
  const n = useGame((s) => s.nation)!;
  const season = useGame((s) => s.season)!;
  const world = useGame((s) => s.world);
  const news = useGame((s) => s.news);
  const pub = useGame((s) => s.pub);
  const now = useNow(5000);
  const [tab, setTab] = useState<"map" | "list" | "partners" | "news" | "chat">("map");
  const [open, setOpen] = useState<string | null>(null);
  const [trip, setTrip] = useState<string | null>(null);
  const [lmOpen, setLmOpen] = useState<string | null>(null);
  const [lmTrip, setLmTrip] = useState<string | null>(null);
  const [showLm, setShowLm] = useState(true);
  const visitLandmark = useGame((s) => s.visitLandmark);
  const [q, setQ] = useState("");
  const router = useRouter();
  const fly = useGame((s) => s.fly);
  const ally = useGame((s) => s.ally);

  const nations = useMemo(() => {
    const me = E.toPublic(n, now);
    const ai = E.aiPublic(season, now);
    return [ai, me, ...Object.values(world).filter((p) => p.id !== n.id)];
  }, [world, n, season, now]);
  const links = useMemo(() => {
    const out: [string, string][] = [];
    for (const p of nations) for (const q of p.partners ?? []) if (p.id < q) out.push([p.id, q]);
    return out;
  }, [nations]);
  const cals = calamitiesBetween(season, now, now + 1);
  const list = nations.filter((p) => !q || `${p.name} ${p.president} ${p.home.country}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.power - a.power);
  const target = trip ? pub(trip) : null;

  const lmT = lmTrip ? LM_BY_ID.get(lmTrip) : null;
  if (lmT)
    return (
      <Journey
        passenger={n.president}
        fromName={n.name}
        toName={lmT.name}
        km={distanceKm(n.home, lmT)}
        onCancel={() => setLmTrip(null)}
        onArrive={() => {
          if (visitLandmark(lmT.id)) router.push("/landmark/");
          setLmTrip(null);
        }}
      />
    );
  if (trip && target)
    return (
      <Journey
        passenger={n.president}
        fromName={n.name}
        toName={target.name}
        km={kmTo(n, target)}
        onCancel={() => setTrip(null)}
        onArrive={() => {
          if (fly(trip)) router.push("/visit/");
          setTrip(null);
        }}
      />
    );

  return (
    <main className="page">
      <header>
        <p className="kicker">season {season.n} · {nations.length} countries</p>
        <h1 className="page-title">The World</h1>
      </header>
      <div className="seg">
        {(
          [
            ["map", "🗺️ Map"],
            ["list", "🏳️ Nations"],
            ["partners", `🤝 Partners${n.allyReqs.length ? ` (${n.allyReqs.length})` : ""}`],
            ["news", "📰 News"],
            ["chat", "💬 Chat"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {tab === "map" && (
        <>
          <WorldMap nations={nations} me={n.id} onNation={setOpen} links={links} landmarks={showLm ? LANDMARKS : []} onLandmark={setLmOpen} />
          <div className="row wrap">
            <button className={`chip ${showLm ? "on" : ""}`} onClick={() => setShowLm(!showLm)}>
              🏛️ landmarks ({n.stamps.filter((s) => s.id.startsWith("lm:")).length}/{LANDMARKS.length} visited)
            </button>
            {cals.map((c) => (
              <span key={c.id} className="chip">
                {CAL_META[c.type].icon} {CAL_META[c.type].name}
                {c.region ? ` · ${c.region.name}` : " · tropics"} · ends {left(c.end - now)}
              </span>
            ))}
            <span className="chip">🟢 online now</span>
            <span className="chip">🤝 green lines = partnerships</span>
          </div>
        </>
      )}

      {tab === "list" && (
        <section className="card">
          <input className="input" placeholder="Search nations, presidents, countries…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="list">
            {list.map((p) => (
              <button key={p.id} className="nation-row" onClick={() => setOpen(p.id)}>
                <span className="flag" style={{ background: p.ai ? "#5a5a66" : p.color }}>
                  <Flag code={p.flag} />
                </span>
                <div className="grow">
                  <b>
                    {p.name} {p.id === n.id && <span className="chip">you</span>}
                  </b>
                  <div className="tiny muted">
                    {p.ai ? "AI rival" : `${ROLES[p.role]?.icon} ${p.president}`} · {p.home.country} · {p.status ? STATUS[p.status.kind] ?? p.status.kind : Date.now() - p.lastSeen < 180_000 ? "online" : `seen ${ago(p.lastSeen)}`}
                  </div>
                </div>
                <div className="tiny" style={{ textAlign: "right" }}>
                  ⚡{fmt(p.power)}
                  <br />👥{fmt(p.pop)}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "partners" && (
        <section className="card">
          <h3 className="h3">Partnerships ({n.partners.length}/3)</h3>
          <p className="small muted" style={{ margin: 0 }}>
            Partners get +5% coin income each, can send each other aid, and can&apos;t attack each other.
          </p>
          {n.allyReqs.map((r) => (
            <div key={r.id} className="banner gold">
              <span className="e">🤝</span>
              <b className="grow">{r.name} wants to partner</b>
              <button className="btn sm green" onClick={() => ally(r.id, "accept")}>
                Accept
              </button>
              <button className="btn sm" onClick={() => ally(r.id, "decline")}>
                ✕
              </button>
            </div>
          ))}
          <div className="list">
            {n.partners.map((p) => (
              <div key={p.id} className="row">
                <b className="grow">{p.name}</b>
                <button className="btn sm" onClick={() => setOpen(p.id)}>
                  Open
                </button>
                <button className="btn sm red" onClick={() => confirm(`End partnership with ${p.name}?`) && ally(p.id, "end")}>
                  End
                </button>
              </div>
            ))}
            {!n.partners.length && <p className="small muted">No partners yet. Open a nation and tap 🤝 Partner.</p>}
          </div>
        </section>
      )}

      {tab === "news" && (
        <section className="card">
          <div className="list">
            {news.map((x) => (
              <div key={x.id} className="row small">
                <span>{x.icon}</span>
                <span className="grow">{x.text}</span>
                <span className="tiny muted">{ago(x.at)}</span>
              </div>
            ))}
            {!news.length && <p className="small muted">No news yet.</p>}
          </div>
        </section>
      )}

      {tab === "chat" && <Chat />}

      <NationSheet id={open} onClose={() => setOpen(null)} onTrip={(id) => (setOpen(null), setTrip(id))} />
      <LandmarkSheet id={lmOpen} onClose={() => setLmOpen(null)} onTrip={(id) => (setLmOpen(null), setLmTrip(id))} />
    </main>
  );
}

function Chat() {
  const chat = useGame((s) => s.chat);
  const me = useGame((s) => s.nation!.id);
  const say = useGame((s) => s.say);
  const [t, setT] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: 1e6 });
  }, [chat.length]);
  return (
    <section className="card">
      <h3 className="h3">💬 World chat</h3>
      <div className="chat" ref={box}>
        {chat.map((m) => (
          <div key={m.id} className={`msg ${m.from === me ? "me" : ""}`}>
            <small>
              <Flag code={m.flag} /> {m.name} · {ago(m.at)}
            </small>
            {m.text}
          </div>
        ))}
        {!chat.length && <p className="small muted">Say hi to the world 👋</p>}
      </div>
      <div className="row">
        <input className="input" value={t} maxLength={240} placeholder="Message everyone…" onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (say(t), setT(""))} />
        <button className="btn primary" onClick={() => (say(t), setT(""))}>
          Send
        </button>
      </div>
      <p className="tiny muted">Be kind. Chat is visible to everyone in this world.</p>
    </section>
  );
}

export function NationSheet({ id, onClose, onTrip }: { id: string | null; onClose: () => void; onTrip: (id: string) => void }) {
  const n = useGame((s) => s.nation)!;
  const pub = useGame((s) => s.pub);
  const ally = useGame((s) => s.ally);
  const sendMoney = useGame((s) => s.sendMoney);
  const sendAid = useGame((s) => s.sendAid);
  const router = useRouter();
  const [amt, setAmt] = useState("100");
  const p = id ? pub(id) : null;
  const now = Date.now();
  const me = p?.id === n.id;
  const partner = p ? n.partners.some((x) => x.id === p.id) : false;
  const canFly = p && !me ? E.fly(n, p, now) : null;
  return (
    <Sheet open={!!p} onClose={onClose}>
      {p && (
        <div className="stack">
          <div className="row">
            <span className="flag" style={{ background: p.ai ? "#5a5a66" : p.color, width: 56, height: 56, fontSize: 32 }}>
              <Flag code={p.flag} />
            </span>
            <div className="grow">
              <h3 className="h3" style={{ fontSize: 24 }}>
                {p.name}
              </h3>
              <div className="small muted">
                {p.ai ? "AI rival school · in every country" : `${ROLES[p.role]?.icon} ${ROLES[p.role]?.name} ${p.president}`} · {p.home.country}
                {!me && ` · ${Math.round(kmTo(n, p)).toLocaleString()} km away`}
              </div>
              {p.status && <span className="chip">{STATUS[p.status.kind] ?? p.status.kind} now</span>}
            </div>
            <button className="x" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="grid3">
            <Stat icon="⚡" v={fmt(p.power)} l="power" />
            <Stat icon="👥" v={fmt(p.pop)} l="people" />
            <Stat icon="🪙" v={fmt(p.coins)} l="coins" />
            <Stat icon="🎖️" v={fmt(p.soldiers)} l="soldiers" />
            <Stat icon="🛡️" v={fmt(p.defense)} l="defence" />
            <Stat icon="🏙️" v={p.cityLevel} l="city level" />
          </div>
          <div className="row wrap small">
            <span className="chip">😊 {p.happiness}%</span>
            <span className="chip">🏆 {p.stats.wins} wins</span>
            <span className="chip">🏫 beat Centerpoint ×{p.stats.aiWins}</span>
            <span className="chip">🧳 {p.stats.tourists} tourists</span>
            {p.airport && <span className="chip">✈️ airport</span>}
            {!p.ai && p.shieldUntil > now && <span className="chip">🕊️ shield {left(p.shieldUntil - now)}</span>}
            {partner && <span className="chip on">🤝 partner</span>}
          </div>
          {!me && (
            <>
              <div className="grid2">
                <button className="btn navy" disabled={!canFly?.ok} onClick={() => onTrip(p.id)} title={canFly && !canFly.ok ? canFly.err : ""}>
                  ✈️ Fly & visit
                </button>
                <button className="btn red" onClick={() => router.push(`/war/?target=${p.id}`)}>
                  ⚔️ Plan attack
                </button>
              </div>
              {canFly && !canFly.ok && <p className="tiny muted" style={{ margin: 0 }}>✈️ {canFly.err}</p>}
              {!p.ai && (
                <>
                  {!partner ? (
                    <button className="btn green" onClick={() => ally(p.id, "request")}>
                      🤝 Propose partnership
                    </button>
                  ) : (
                    <button className="btn" onClick={() => sendAid(p.id, { food: 50, water: 50 })}>
                      🎁 Send aid (50 🌾 + 50 💧)
                    </button>
                  )}
                  <div className="row">
                    <input className="input" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, "").slice(0, 7))} />
                    <button className="btn" onClick={() => sendMoney(p.id, +amt)}>
                      💸 Send coins
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

export { AI_ID };

function LandmarkSheet({ id, onClose, onTrip }: { id: string | null; onClose: () => void; onTrip: (id: string) => void }) {
  const n = useGame((s) => s.nation)!;
  const lm = id ? LM_BY_ID.get(id) : null;
  const dry = lm ? E.visitLandmark(n, lm, Date.now()) : null;
  const been = lm ? n.stamps.some((s) => s.id === "lm:" + lm.id) : false;
  return (
    <Sheet open={!!lm} onClose={onClose}>
      {lm && (
        <div className="stack">
          <div className="row">
            <span className="flag" style={{ width: 56, height: 56, fontSize: 32, background: "#fff1bd" }}>
              {lm.icon}
            </span>
            <div className="grow">
              <h3 className="h3" style={{ fontSize: 22 }}>
                {lm.name}
              </h3>
              <div className="small muted">
                {lm.country} · {Math.round(distanceKm(n.home, lm)).toLocaleString()} km away {been && "· ✅ visited"}
              </div>
            </div>
            <button className="x" onClick={onClose}>
              ✕
            </button>
          </div>
          <p style={{ margin: 0 }}>💡 {lm.fact}</p>
          <button className="btn navy lg" disabled={!dry?.ok} onClick={() => onTrip(lm.id)}>
            ✈️ Fly there {dry?.ok ? `· 🪙${dry.ticket}` : ""}
          </button>
          {dry && !dry.ok && <p className="tiny muted" style={{ margin: 0 }}>{dry.err}</p>}
          <a className="btn lg" href={`/explore/?lm=${lm.id}`}>
            🧭 Walk around it in real 3D
          </a>
          <p className="tiny muted" style={{ margin: 0 }}>First visit: +40 💡 and a passport stamp. Recent trips also make your people happier.</p>
        </div>
      )}
    </Sheet>
  );
}
