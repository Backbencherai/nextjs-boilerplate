"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Layers, RotateCcw, Search } from "lucide-react";
import { LAYERS, layerById, layerOf, loadManifest, threeName, type AtlasEntry, type Manifest, type SystemKey } from "@/lib/anatomy/atlas";
import { STRUCTURES } from "@/lib/anatomy/structures";
import { AtlasScene, type AtlasHandle } from "./AtlasScene";
import { ErrorBoundary, hasWebGL } from "./ErrorBoundary";
import AnatomyLab from "./AnatomyLab";

/** Reviewed plain-language text exists only for the few structures in lib/anatomy/structures.ts. */
const reviewedText = (name: string) => STRUCTURES.find((s) => s.name.toLowerCase() === name.toLowerCase());

function Atlas({ manifest, compact }: { manifest: Manifest; compact: boolean }) {
  const entries = useMemo(() => {
    const byThree = new Map<string, AtlasEntry>();
    for (const sys of Object.values(manifest.systems))
      for (const n of sys.nodes) byThree.set(threeName(n.node), { ...n, layerId: layerOf(n).id });
    return byThree;
  }, [manifest]);
  const all = useMemo(() => [...entries.values()], [entries]);

  const [layerOn, setLayerOn] = useState<Record<string, boolean>>(() => Object.fromEntries(LAYERS.map((l) => [l.id, l.defaultOn])));
  const [load, setLoad] = useState<Set<SystemKey>>(() => new Set(LAYERS.filter((l) => l.defaultOn).map((l) => l.system)));
  const [loaded, setLoaded] = useState<Set<SystemKey>>(new Set());
  const [selected, setSelected] = useState<AtlasEntry | null>(null);
  const [xray, setXray] = useState(false);
  const [query, setQuery] = useState("");
  const scene = useRef<AtlasHandle>(null);

  const toggle = useCallback((id: string) => {
    setLayerOn((p) => ({ ...p, [id]: !p[id] }));
    const l = layerById[id];
    setLoad((p) => (p.has(l.system) ? p : new Set(p).add(l.system)));
  }, []);

  const pick = useCallback((e: AtlasEntry | null) => {
    setSelected(e);
    if (e) {
      setLayerOn((p) => (p[e.layerId] ? p : { ...p, [e.layerId]: true }));
      setLoad((p) => (p.has(e.system) ? p : new Set(p).add(e.system)));
    }
  }, []);

  const onLoaded = useCallback((s: SystemKey) => setLoaded((p) => (p.has(s) ? p : new Set(p).add(s))), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return all
      .filter((e) => e.name.toLowerCase().includes(q) || e.groups.some((g) => g.toLowerCase().includes(q)))
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 60);
  }, [all, query]);

  const reviewed = selected ? reviewedText(selected.name) : null;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of all) c[e.layerId] = (c[e.layerId] ?? 0) + 1;
    return c;
  }, [all]);
  const pending = [...load].filter((s) => !loaded.has(s));

  return (
    <div className={compact ? "" : "grid gap-4 lg:grid-cols-[1fr_360px]"}>
      <div>
        <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_30%,#21423e_0%,#0f1e1d_55%,#091110_100%)] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)] ${compact ? "h-[420px] sm:h-[520px]" : "h-[62vh] min-h-[380px] lg:h-[720px]"}`}>
          <AtlasScene
            ref={scene}
            manifest={manifest}
            entries={entries}
            loadSystems={load}
            layerOn={layerOn}
            selected={selected}
            onSelect={pick}
            xray={xray}
            autoRotate={compact}
            onLoaded={onLoaded}
          />
          {pending.length > 0 && (
            <p className="absolute right-3 top-3 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur" role="status">Loading {pending.join(", ")}…</p>
          )}
          <p className="pointer-events-none absolute bottom-3 left-3 right-3 text-[11px] text-white/55 sm:right-auto">
            Drag to rotate · scroll or pinch to zoom · right-drag or two fingers to pan · tap a structure to select
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="toolbar" aria-label="Viewer controls">
          <button className={"btn btn-ghost-dark"} onClick={() => scene.current?.reset()}><RotateCcw className="h-4 w-4" aria-hidden /> Reset camera</button>
          <button className={"btn btn-ghost-dark"} aria-pressed={xray} onClick={() => setXray((v) => !v)}><Eye className="h-4 w-4" aria-hidden /> {xray ? "X-ray view" : "Solid view"}</button>
          <button className={"btn btn-ghost-dark"} disabled={!selected} onClick={() => setSelected(null)}>Clear selection</button>
        </div>

        <p className="mt-3 text-xs text-white/55">
          Model: <a className="underline" href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noopener noreferrer">Z-Anatomy</a> — CC BY-SA 4.0, derived from BodyParts3D (CC BY-SA 2.1 Japan).
          Modified: mesh simplified and compressed; some parts omitted. Shared under the same licence — see <a className="underline" href="/credits">credits</a>.
        </p>

        {!compact && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
            <p className="font-semibold">What this atlas does not include</p>
            <ul className="mt-1 list-disc pl-5">
              <li>No skin or external body surface, and no complete artery/vein or peripheral-nerve network.</li>
              <li>{manifest.excluded.length} meshes were left out for licence reasons (kidneys, inner ear, cortical surface and white matter).</li>
              <li>Shapes are simplified for the web. This is an education atlas, not a diagnostic or surgical-planning tool.</li>
              <li>Only a handful of structures have reviewed plain-language text. Others show name and location in the hierarchy only.</li>
            </ul>
          </div>
        )}
      </div>

      {!compact && (
      <aside className="space-y-4" aria-label="Structure explorer">
        <div role="group" aria-labelledby="layers-h" className="card">
          <h2 id="layers-h" className="flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4" aria-hidden /> Layers</h2>
          <div className="mt-2 space-y-1">
            {LAYERS.map((l) => (
              <div key={l.id}>
                <label className="flex min-h-[40px] items-center gap-2 text-sm">
                  <input type="checkbox" checked={layerOn[l.id]} onChange={() => toggle(l.id)} className="h-4 w-4 accent-[#0f766e]" />
                  <span className="h-3 w-3 rounded-full" style={{ background: l.color }} aria-hidden />
                  <span className="flex-1">{l.label}</span>
                  <span className="text-xs text-muted">{counts[l.id] ?? 0}</span>
                </label>
                {l.note && <p className="pl-6 text-xs text-muted">{l.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {selected ? (
          <section className="card" aria-live="polite">
            <h2 className="text-xl font-semibold">{selected.name}{selected.side && <span className="text-base font-normal text-muted"> ({selected.side})</span>}</h2>
            <p className="mt-1 text-xs font-semibold uppercase text-accent">{layerById[selected.layerId].label}</p>
            <dl className="mt-3 space-y-2 text-sm">
              {selected.groups.length > 0 && (
                <div><dt className="font-semibold">Part of</dt><dd>{selected.groups.slice(0, 5).join(" · ")}</dd></div>
              )}
              {reviewed ? (
                <>
                  <div><dt className="font-semibold">In simple words</dt><dd>{reviewed.beginner}</dd></div>
                  <div><dt className="font-semibold">Main function</dt><dd>{reviewed.function}</dd></div>
                </>
              ) : (
                <div><dt className="font-semibold">Explanation</dt><dd className="text-muted">No reviewed plain-language explanation for this structure yet.</dd></div>
              )}
            </dl>
            {reviewed && <p className="mt-3 text-xs text-muted">Draft educational text — pending clinical review. Not medical advice.</p>}
          </section>
        ) : (
          <p className="card text-sm text-muted">Click a structure in the 3D view, or search below.</p>
        )}

        <div className="card">
          <label htmlFor="atlas-search" className="label">Search {all.length.toLocaleString()} structures</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
            <input id="atlas-search" type="search" className="input pl-9" placeholder="e.g. femur, heart, liver, brainstem" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="mt-3 max-h-72 overflow-y-auto pr-1">
            {query.trim() === "" ? (
              <p className="text-sm text-muted">Type a name or a group (for example “Lungs” or “Heart”).</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted">No structures match “{query}”.</p>
            ) : (
              <ul>
                {results.map((e) => (
                  <li key={e.node}>
                    <button onClick={() => pick(e)} aria-pressed={selected?.node === e.node} className={`min-h-[40px] w-full rounded-lg px-2 text-left text-sm hover:bg-surface ${selected?.node === e.node ? "bg-surface font-semibold text-accent" : ""}`}>
                      {e.name}{e.side ? ` (${e.side})` : ""} <span className="text-xs text-muted">· {layerById[e.layerId].label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
      )}
    </div>
  );
}

/** Loads the manifest, then the atlas. Falls back to the schematic model if anything fails. */
export default function AtlasLab({ compact = false }: { compact?: boolean }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [failed, setFailed] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(hasWebGL());
    loadManifest().then(setManifest).catch(() => setFailed(true));
  }, []);

  if (failed || webgl === false) return <AnatomyLab compact={compact} />;
  if (!manifest || webgl === null)
    return <div className="flex h-[360px] items-center justify-center rounded-2xl border border-line bg-surface text-sm text-muted">Loading anatomy atlas…</div>;

  return (
    <ErrorBoundary fallback={<AnatomyLab compact={compact} />}>
      <Atlas manifest={manifest} compact={compact} />
    </ErrorBoundary>
  );
}
