"use client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { useMemo, useRef, useState } from "react";
import { countries } from "@/lib/geo";
import type { PublicNation } from "@/lib/game/engine";
import type { Landmark } from "@/lib/game/landmarks";

const W = 960;
const H = 500;

export interface MapProps {
  nations?: PublicNation[];
  me?: string;
  onNation?: (id: string) => void;
  onCountry?: (id: string, name: string, lonlat: [number, number]) => void;
  picked?: string | null;
  links?: [string, string][];
  flight?: { from: [number, number]; to: [number, number] } | null;
  height?: string;
  landmarks?: Landmark[];
  onLandmark?: (id: string) => void;
}

export function WorldMap({ nations = [], me, onNation, onCountry, picked, links = [], flight, height, landmarks = [], onLandmark }: MapProps) {
  const proj = useMemo(() => geoNaturalEarth1().fitExtent([[10, 10], [W - 10, H - 10]], { type: "Sphere" }), []);
  const path = useMemo(() => geoPath(proj), [proj]);
  const feats = useMemo(() => countries().features, []);
  const paths = useMemo(() => feats.map((f) => ({ id: String(f.id), name: f.properties.name, d: path(f) ?? "" })), [feats, path]);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; dist?: number; k?: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const myHome = nations.find((n) => n.id === me)?.home.cc;
  // one president per country: a claimed country is painted in its president's colour
  const owner = useMemo(() => new Map(nations.filter((n) => !n.ai).map((n) => [n.home.cc, n])), [nations]);

  const toSvg = (cx: number, cy: number) => {
    const r = svg.current!.getBoundingClientRect();
    const sx = W / r.width;
    const sy = H / r.height;
    const s = Math.max(sx, sy);
    return { x: (cx - r.left) * s - (r.width * s - W) / 2, y: (cy - r.top) * s - (r.height * s - H) / 2 };
  };
  const zoomAt = (f: number, cx = W / 2, cy = H / 2) =>
    setView((v) => {
      const k = Math.max(1, Math.min(14, v.k * f));
      const q = k / v.k;
      return clamp({ k, x: cx - (cx - v.x) * q, y: cy - (cy - v.y) * q });
    });
  const clamp = (v: { k: number; x: number; y: number }) => ({ k: v.k, x: Math.min(0, Math.max(W - W * v.k, v.x)), y: Math.min(0, Math.max(H - H * v.k, v.y)) });

  const pin = (n: PublicNation) => proj([n.home.lon, n.home.lat]) ?? [0, 0];
  const byId = new Map(nations.map((n) => [n.id, n]));
  const k = view.k;
  const r = Math.max(3.2, 9 / Math.sqrt(k));

  return (
    <div className="map-wrap" style={height ? { height } : undefined}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={(e) => {
          const p = toSvg(e.clientX, e.clientY);
          zoomAt(e.deltaY < 0 ? 1.25 : 0.8, p.x, p.y);
        }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
          if (pts.current.size === 2) {
            const [a, b] = [...pts.current.values()];
            drag.current.dist = Math.hypot(a.x - b.x, a.y - b.y);
            drag.current.k = view.k;
          }
        }}
        onPointerMove={(e) => {
          if (!drag.current || !pts.current.has(e.pointerId)) return;
          pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const rect = svg.current!.getBoundingClientRect();
          const s = Math.max(W / rect.width, H / rect.height);
          if (pts.current.size === 2 && drag.current.dist) {
            const [a, b] = [...pts.current.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const c = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
            const target = Math.max(1, Math.min(14, (drag.current.k ?? 1) * (d / drag.current.dist)));
            setView((v) => {
              const q = target / v.k;
              return clamp({ k: target, x: c.x - (c.x - v.x) * q, y: c.y - (c.y - v.y) * q });
            });
            drag.current.moved = true;
            return;
          }
          const dx = (e.clientX - drag.current.x) * s;
          const dy = (e.clientY - drag.current.y) * s;
          if (Math.abs(dx) + Math.abs(dy) > 6) drag.current.moved = true;
          setView((v) => clamp({ k: v.k, x: drag.current!.vx + dx, y: drag.current!.vy + dy }));
        }}
        onPointerUp={(e) => {
          pts.current.delete(e.pointerId);
          if (pts.current.size === 0) setTimeout(() => (drag.current = null), 0);
        }}
      >
        <rect width={W} height={H} fill="#cfe8f7" />
        <g transform={`translate(${view.x},${view.y}) scale(${k})`}>
          <path d={path({ type: "Sphere" }) ?? ""} fill="#bfe0f3" stroke="#16161d" strokeWidth={1.5 / k} />
          {paths.map((c) => (
            <path
              key={c.id}
              d={c.d}
              className={`country-path ${c.id === myHome ? "mine" : ""} ${c.id === picked ? "pick" : ""}`}
              strokeWidth={0.6 / k}
              style={owner.get(c.id) ? { fill: owner.get(c.id)!.color, fillOpacity: c.id === myHome ? 0.9 : 0.6 } : undefined}
              onClick={(e) => {
                if (drag.current?.moved || !onCountry) return;
                const p = toSvg(e.clientX, e.clientY);
                const ll = proj.invert?.([(p.x - view.x) / k, (p.y - view.y) / k]);
                if (ll) onCountry(c.id, c.name, ll as [number, number]);
              }}
            />
          ))}
          {links.map(([a, b], i) => {
            const A = byId.get(a);
            const B = byId.get(b);
            if (!A || !B) return null;
            const d = path({ type: "LineString", coordinates: [[A.home.lon, A.home.lat], [B.home.lon, B.home.lat]] });
            return <path key={i} d={d ?? ""} fill="none" stroke="#138808" strokeWidth={2 / k} strokeDasharray={`${5 / k} ${4 / k}`} pointerEvents="none" />;
          })}
          {flight && <path d={path({ type: "LineString", coordinates: [flight.from, flight.to] }) ?? ""} fill="none" stroke="#1f3a93" strokeWidth={2.5 / k} strokeDasharray={`${6 / k} ${4 / k}`} />}
          {landmarks.map((l) => {
            const [x, y] = proj([l.lon, l.lat]) ?? [0, 0];
            const s = Math.max(2.6, 7 / Math.sqrt(k));
            return (
              <g key={l.id} transform={`translate(${x},${y})`} onClick={(e) => (e.stopPropagation(), !drag.current?.moved && onLandmark?.(l.id))} style={{ cursor: "pointer" }}>
                <rect x={-s} y={-s} width={s * 2} height={s * 2} rx={s * 0.5} fill={l.famous ? "#fff1bd" : "#ffffff"} stroke="#16161d" strokeWidth={1 / Math.sqrt(k)} />
                <text y={s * 0.55} fontSize={s * 1.4} textAnchor="middle">
                  {l.icon}
                </text>
              </g>
            );
          })}
          {nations.map((n) => {
            const [x, y] = pin(n);
            const online = Date.now() - n.lastSeen < 3 * 60_000;
            return (
              <g key={n.id} transform={`translate(${x},${y})`} onClick={(e) => (e.stopPropagation(), !drag.current?.moved && onNation?.(n.id))} style={{ cursor: "pointer" }}>
                <rect x={-r * 1.35} y={-r * 1.05} width={r * 2.7} height={r * 2.1} rx={r * 0.3} fill={n.id === me ? "#ff9933" : n.ai ? "#5a5a66" : n.color} stroke="#16161d" strokeWidth={1.6 / Math.sqrt(k)} />
                {/^[a-z]{2}/.test(n.flag) ? (
                  <image href={`/flags/${n.flag}.svg`} x={-r * 1.1} y={-r * 0.8} width={r * 2.2} height={r * 1.6} preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <text y={r * 0.55} fontSize={r * 1.5} textAnchor="middle">
                    {n.flag}
                  </text>
                )}
                {online && !n.ai && <circle cx={r * 1.2} cy={-r * 1.2} r={r * 0.45} fill="#3ecf6e" stroke="#16161d" strokeWidth={1 / Math.sqrt(k)} />}
                {k > 2.2 && (
                  <text y={r * 3.2} fontSize={11 / Math.sqrt(k)} textAnchor="middle" fontWeight={900} stroke="#fff" strokeWidth={3 / Math.sqrt(k)} paintOrder="stroke">
                    {n.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="map-tools">
        <button onClick={() => zoomAt(1.5)} aria-label="Zoom in">
          +
        </button>
        <button onClick={() => zoomAt(1 / 1.5)} aria-label="Zoom out">
          −
        </button>
        <button onClick={() => setView({ k: 1, x: 0, y: 0 })} aria-label="Reset map">
          ⟲
        </button>
      </div>
    </div>
  );
}
