"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { BUILDINGS, BUILD_ORDER, MAX_LEVEL, RES_META, TECH, TECH_MAX, techCost, type BType, type ResKey, type TechId } from "@/lib/game/rules";
import { calamitiesBetween, hits, nextMeteor, COVER_OPEN_MIN, METEOR_WINDOW_MIN } from "@/lib/game/world";
import { Cost, ResBar, Sheet, fmt, left, useNow } from "../ui";
import type { TileView } from "../city/CityScene";

const CityScene = dynamic(() => import("../city/CityScene"), { ssr: false, loading: () => <div className="blank">Building your city…</div> });

export function City() {
  const n = useGame((s) => s.nation)!;
  const season = useGame((s) => s.season)!;
  const build = useGame((s) => s.build);
  const upgrade = useGame((s) => s.upgrade);
  const repair = useGame((s) => s.repair);
  const demolish = useGame((s) => s.demolish);
  const move = useGame((s) => s.move);
  const research = useGame((s) => s.research);
  const timer = useGame((s) => s.timer);
  const now = useNow(1000);
  const [sel, setSel] = useState<{ x: number; y: number } | null>(null);
  const [moving, setMoving] = useState<{ x: number; y: number } | null>(null);
  const [labs, setLabs] = useState(false);
  const land = E.landSize(n, now);
  const tiles: TileView[] = n.tiles.map((t) => [t.x, t.y, t.t, t.lvl, t.dmg ? 1 : t.doneAt > now ? 2 : 0]);
  const progress = useMemo(() => {
    const p: Record<string, number> = {};
    for (const t of n.tiles)
      if (t.doneAt > now) {
        const total = E.buildMinutes(n, t.t, t.lvl) * 60_000;
        p[`${t.x},${t.y}`] = Math.max(0, Math.min(1, 1 - (t.doneAt - now) / total));
      }
    return p;
  }, [n, now]);
  const weather = calamitiesBetween(season, now, now + 1).filter((c) => hits(c, n.home)).map((c) => c.type);
  const m = nextMeteor(season, now);
  const mm = m ? (m.at - now) / 60_000 : Infinity;
  const meteor = mm <= COVER_OPEN_MIN && mm > -METEOR_WINDOW_MIN ? (mm <= 0 ? "strike" : "alert") : "none";
  const tile = sel ? n.tiles.find((t) => t.x === sel.x && t.y === sel.y) : undefined;
  const ph = E.perHour(n, now);

  const onTile = (x: number, y: number) => {
    if (moving) {
      if (move(moving, { x, y })) setMoving(null);
      return;
    }
    setSel({ x, y });
  };

  return (
    <div className="city-root">
      <CityScene tiles={tiles} land={land} accent={n.color} character={n.character} pop={n.pop} selected={sel} onTile={onTile} progress={progress} weather={weather} meteor={meteor} heroAnim={timer ? (timer.kind === "workout" ? "attack" : "interact") : "idle"} />
      <div className="city-top">
        <div className="hud">
          <Link href="/" className="hud-chip" aria-label="Home">
            ←
          </Link>
          <span className="hud-chip">
            {n.flag} {n.name} · Lv {E.cityLevel(n, now)}
          </span>
          <span className="grow" />
          <button className="hud-chip" onClick={() => setLabs(true)}>
            🔬 Research
          </button>
        </div>
        <ResBar res={n.res} keys={["coins", "materials", "food", "water", "knowledge"]} />
        <div className="hud">
          <span className="hud-chip tiny">
            per hour: 🪙 {ph.coins >= 0 ? "+" : ""}
            {fmt(ph.coins)} · 🌾 {ph.food >= 0 ? "+" : ""}
            {fmt(ph.food)} · 💧 {ph.water >= 0 ? "+" : ""}
            {fmt(ph.water)}
          </span>
        </div>
        {moving && (
          <div className="banner gold">
            <span className="e">↔️</span>
            <b className="grow">Tap an empty plot to move it there</b>
            <button className="btn sm" onClick={() => setMoving(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {sel && !moving && (
        <div className="city-panel card">
          {tile ? (
            <BuildingPanel n={n} tile={tile} now={now} onClose={() => setSel(null)} onUpgrade={() => upgrade(tile.x, tile.y)} onRepair={() => repair(tile.x, tile.y)} onMove={() => (setMoving({ x: tile.x, y: tile.y }), setSel(null))} onDemolish={() => confirm(`Demolish ${BUILDINGS[tile.t].name}? You get half the materials back.`) && demolish(tile.x, tile.y) && setSel(null)} />
          ) : (
            <BuildMenu n={n} now={now} onPick={(t) => build(t, sel.x, sel.y) && setSel(null)} onClose={() => setSel(null)} />
          )}
        </div>
      )}
      {!sel && !moving && (
        <div className="city-panel" style={{ maxHeight: "none" }}>
          <p className="hud-chip tiny" style={{ justifyContent: "center", margin: 0 }}>
            Tap an empty plot to build · tap a building to manage it · pinch/drag to look around
          </p>
        </div>
      )}

      <Sheet open={labs} onClose={() => setLabs(false)}>
        <div className="card-h">
          <h3>🎓 Research at Bhavan&apos;s BP Vidya Mandir</h3>
          <button className="x" onClick={() => setLabs(false)}>
            ✕
          </button>
        </div>
        {!E.has(n, "school") && <p className="small">Build Bhavan&apos;s BP Vidya Mandir, Civil Lines first. Your one school powers all research.</p>}
        <p className="small muted">💡 {fmt(n.res.knowledge)} knowledge. Study in real life to earn more.</p>
        <div className="list">
          {(Object.keys(TECH) as TechId[]).map((t) => {
            const lv = n.tech[t] ?? 0;
            return (
              <div key={t} className="row">
                <span style={{ fontSize: 24 }}>{TECH[t].icon}</span>
                <div className="grow">
                  <b>
                    {TECH[t].name} {"★".repeat(lv)}
                    {"☆".repeat(TECH_MAX - lv)}
                  </b>
                  <div className="tiny muted">{TECH[t].per} per level</div>
                </div>
                <button className="btn sm" disabled={lv >= TECH_MAX || n.res.knowledge < techCost(t, lv) || !E.has(n, "school")} onClick={() => research(t)}>
                  {lv >= TECH_MAX ? "Done" : `💡${techCost(t, lv)}`}
                </button>
              </div>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

function BuildMenu({ n, now, onPick, onClose }: { n: E.Nation; now: number; onPick: (t: BType) => void; onClose: () => void }) {
  const lvl = E.cityLevel(n, now);
  return (
    <>
      <div className="card-h">
        <h3>Build here</h3>
        <button className="x" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="build-grid">
        {BUILD_ORDER.filter((t) => t !== "hall").map((t) => {
          const d = BUILDINGS[t];
          const cost = E.costOf(n, t, 1);
          const owned = n.tiles.filter((x) => x.t === t).length;
          const blocked = (d.max && owned >= d.max) || (d.unlockCity && lvl < d.unlockCity);
          const afford = E.canAfford(n, cost);
          return (
            <button key={t} className={`bopt ${blocked || !afford ? "no" : ""}`} disabled={!!blocked} onClick={() => onPick(t)}>
              <span className="i">{d.icon}</span>
              <b>{d.name}</b>
              <Cost cost={cost} have={n.res} />
              <small>{blocked ? (d.unlockCity && lvl < d.unlockCity ? `🔒 city level ${d.unlockCity}` : "✓ owned") : `${E.buildMinutes(n, t, 1)} min`}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}

function BuildingPanel({ n, tile, now, onClose, onUpgrade, onRepair, onMove, onDemolish }: { n: E.Nation; tile: E.Tile; now: number; onClose: () => void; onUpgrade: () => void; onRepair: () => void; onMove: () => void; onDemolish: () => void }) {
  const d = BUILDINGS[tile.t];
  const up = tile.lvl < MAX_LEVEL ? E.costOf(n, tile.t, tile.lvl + 1) : null;
  const busy = tile.doneAt > now;
  return (
    <>
      <div className="card-h">
        <h3>
          {d.icon} {d.name} · Lv {tile.lvl}
        </h3>
        <button className="x" onClick={onClose}>
          ✕
        </button>
      </div>
      <p className="small" style={{ margin: 0 }}>
        {d.desc}
      </p>
      {d.makes && (
        <div className="row wrap">
          {(Object.keys(d.makes) as ResKey[]).map((k) => (
            <span key={k} className="chip">
              {RES_META[k].icon} +{(d.makes![k] ?? 0) * tile.lvl}/h
            </span>
          ))}
        </div>
      )}
      {busy && <div className="banner gold">🔨 Builders at work: ready in {left(tile.doneAt - now)}</div>}
      {tile.dmg && (
        <div className="banner red">
          <span className="e">🔧</span>
          <div className="grow">
            <b>Damaged by a disaster or attack</b>
            <div className="small">It produces nothing until repaired.</div>
          </div>
          <button className="btn sm" onClick={onRepair}>
            Repair <Cost cost={E.repairCost(n, tile)} />
          </button>
        </div>
      )}
      <div className="row wrap">
        {up && !busy && !tile.dmg && (
          <button className="btn primary" disabled={!E.canAfford(n, up)} onClick={onUpgrade}>
            ⬆ Upgrade <Cost cost={up} have={n.res} />
          </button>
        )}
        {tile.lvl >= MAX_LEVEL && <span className="chip">⭐ Max level</span>}
        <button className="btn sm" onClick={onMove}>
          ↔ Move
        </button>
        {tile.t !== "hall" && (
          <button className="btn sm red" onClick={onDemolish}>
            Demolish
          </button>
        )}
      </div>
    </>
  );
}
