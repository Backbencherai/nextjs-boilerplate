"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Search, Tag, Layers, Eye } from "lucide-react";
import { STRUCTURES, SYSTEMS, MISSING_LAYERS, type SystemId } from "@/lib/anatomy/structures";
import { BodyScene, type SceneHandle, type ViewMode } from "./BodyScene";
import { ErrorBoundary, hasWebGL } from "./ErrorBoundary";

const ALL = Object.keys(SYSTEMS) as SystemId[];

function Fallback({ reason }: { reason: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface p-6 text-center text-sm text-muted">
      <p>
        The 3D view could not start ({reason}). You can still browse every structure using the list and search —
        they work without 3D.
      </p>
    </div>
  );
}

export default function AnatomyLab({ compact = false }: { compact?: boolean }) {
  const [visible, setVisible] = useState<Set<SystemId>>(new Set(ALL));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labels, setLabels] = useState(false);
  const [outline, setOutline] = useState(true);
  const [mode, setMode] = useState<ViewMode>("solid");
  const [query, setQuery] = useState("");
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const scene = useRef<SceneHandle>(null);

  useEffect(() => setWebgl(hasWebGL()), []);

  const selected = STRUCTURES.find((s) => s.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STRUCTURES.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || (s.anatomicalName ?? "").toLowerCase().includes(q) || SYSTEMS[s.system].label.toLowerCase().includes(q),
    );
  }, [query]);

  function toggle(id: SystemId) {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function pick(id: string | null) {
    setSelectedId(id);
    // Make sure a selected structure is visible.
    const s = STRUCTURES.find((x) => x.id === id);
    if (s && !visible.has(s.system)) toggle(s.system);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className={`relative overflow-hidden rounded-2xl border border-line ${compact ? "h-[360px]" : "h-[55vh] min-h-[340px] lg:h-[640px]"}`}>
          {webgl === null && <div className="flex h-full items-center justify-center text-sm text-muted">Loading 3D viewer…</div>}
          {webgl === false && <Fallback reason="WebGL is not available in this browser" />}
          {webgl && (
            <ErrorBoundary fallback={<Fallback reason="an error occurred" />}>
              <BodyScene
                ref={scene}
                visibleSystems={visible}
                selectedId={selectedId}
                onSelect={pick}
                showLabels={labels}
                showOutline={outline}
                mode={mode}
              />
            </ErrorBoundary>
          )}
          <p className="pointer-events-none absolute bottom-2 left-3 rounded bg-white/85 px-2 py-1 text-[11px] text-muted">
            Drag to rotate · scroll/pinch to zoom · right-drag/two fingers to pan
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="toolbar" aria-label="Viewer controls">
          <button className="btn btn-secondary" onClick={() => scene.current?.reset()}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset camera
          </button>
          <button className="btn btn-secondary" aria-pressed={labels} onClick={() => setLabels((v) => !v)}>
            <Tag className="h-4 w-4" aria-hidden /> Labels {labels ? "on" : "off"}
          </button>
          <button className="btn btn-secondary" aria-pressed={mode === "xray"} onClick={() => setMode((m) => (m === "solid" ? "xray" : "solid"))}>
            <Eye className="h-4 w-4" aria-hidden /> {mode === "solid" ? "Solid view" : "X-ray view"}
          </button>
          <button className="btn btn-secondary" aria-pressed={outline} onClick={() => setOutline((v) => !v)}>
            Body outline {outline ? "on" : "off"}
          </button>
        </div>

        {!compact && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
            <p className="font-semibold">Limitations of this build</p>
            <p className="mt-1">
              This is a <strong>schematic</strong> model made of simple shapes to demonstrate the viewer. It is not
              anatomically accurate. Layers requested but not yet available: {MISSING_LAYERS.join("; ")}. A
              licensed, accurate model (for example from Z-Anatomy, subject to its CC BY-SA terms) is on the roadmap —
              see <code>docs/ASSET_INVENTORY.md</code>.
            </p>
          </div>
        )}
      </div>

      <aside className="space-y-4" aria-label="Structure explorer">
        <fieldset className="card">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
            <Layers className="h-4 w-4" aria-hidden /> Layers
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ALL.map((id) => (
              <label key={id} className="flex min-h-[44px] items-center gap-2 text-sm">
                <input type="checkbox" checked={visible.has(id)} onChange={() => toggle(id)} className="h-4 w-4 accent-[#0f766e]" />
                <span className="h-3 w-3 rounded-full" style={{ background: SYSTEMS[id].color }} aria-hidden />
                {SYSTEMS[id].label}
              </label>
            ))}
          </div>
        </fieldset>

        {selected ? (
          <section className="card" aria-live="polite">
            <h2 className="text-xl font-semibold">{selected.name}</h2>
            {selected.anatomicalName && <p className="text-sm italic text-muted">{selected.anatomicalName}</p>}
            <p className="mt-1 text-xs font-semibold uppercase text-accent">{SYSTEMS[selected.system].label}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="font-semibold">In simple words</dt><dd>{selected.beginner}</dd></div>
              <div><dt className="font-semibold">Location</dt><dd>{selected.location}</dd></div>
              <div><dt className="font-semibold">Main function</dt><dd>{selected.function}</dd></div>
              <div>
                <dt className="font-semibold">Related structures</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {selected.related.map((r) => {
                    const target = STRUCTURES.find((x) => x.name === r);
                    return target ? (
                      <button key={r} className="rounded-md bg-surface px-2 py-1 text-xs font-medium hover:bg-line" onClick={() => pick(target.id)}>{r}</button>
                    ) : (
                      <span key={r} className="rounded-md bg-surface px-2 py-1 text-xs text-muted" title="Not modelled in this build">{r}</span>
                    );
                  })}
                </dd>
              </div>
              {selected.note && <div><dt className="font-semibold">Educational note</dt><dd>{selected.note}</dd></div>}
            </dl>
            <p className="mt-3 text-xs text-muted">Draft educational text — pending clinical review. Not medical advice.</p>
          </section>
        ) : (
          <p className="card text-sm text-muted">Select a structure in the 3D view or from the list below.</p>
        )}

        <div className="card">
          <label htmlFor="anat-search" className="label">Search structures</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
            <input id="anat-search" type="search" className="input pl-9" placeholder="e.g. heart, kidney, skeletal" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
            {ALL.map((sys) => {
              const items = filtered.filter((s) => s.system === sys);
              if (!items.length) return null;
              return (
                <div key={sys}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{SYSTEMS[sys].label}</h3>
                  <ul>
                    {items.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => pick(s.id)}
                          aria-pressed={s.id === selectedId}
                          className={`min-h-[40px] w-full rounded-lg px-2 text-left text-sm hover:bg-surface ${s.id === selectedId ? "bg-surface font-semibold text-accent" : ""}`}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-muted">No structures match “{query}”.</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
