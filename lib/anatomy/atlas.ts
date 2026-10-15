/**
 * Types and helpers for the Z-Anatomy-derived atlas (public/models/anatomy).
 * Files are produced by scripts/anatomy/export_z_anatomy.py and are CC BY-SA 4.0 derivatives.
 */
import { PropertyBinding } from "three";

export type SystemKey = "skeletal" | "muscular" | "cardiovascular" | "nervous" | "visceral";

export type ManifestNode = {
  node: string; // original Blender object name
  id: string;
  name: string;
  side: "left" | "right" | null;
  system: SystemKey;
  groups: string[];
  tris_source: number;
  bbox: [[number, number, number], [number, number, number]]; // glTF Y-up world bounds
};

export type Manifest = {
  source: string;
  source_licence: string;
  derived_from: string;
  systems: Record<SystemKey, { file: string; bytes: number; objects: number; nodes: ManifestNode[] }>;
  excluded: { name: string; system: string; reason: string; tris: number }[];
};

export type LayerDef = {
  id: string;
  label: string;
  system: SystemKey;
  /** For layers carved out of a shared system file: first matching rule wins. Omit for "whole system". */
  groups?: string[];
  fallback?: boolean;
  defaultOn: boolean;
  color: string;
  note?: string;
};

export const LAYERS: LayerDef[] = [
  { id: "skeletal", label: "Skeleton", system: "skeletal", defaultOn: true, color: "#d9d4c7" },
  { id: "muscular", label: "Muscles", system: "muscular", defaultOn: false, color: "#b5524a", note: "Largest layer (about 1 MB)." },
  { id: "cardiovascular", label: "Heart & major vessels", system: "cardiovascular", defaultOn: true, color: "#c0392b", note: "Heart and major vessels only — not a complete vessel network." },
  { id: "nervous", label: "Brain, cranial nerves & sense organs", system: "nervous", defaultOn: false, color: "#e0b84f", note: "Cortical gyri/sulci and white-matter meshes are omitted (reuse terms unverified). No peripheral nerve network." },
  { id: "digestive", label: "Digestive system", system: "visceral", groups: ["Digestive system", "Digestive canal", "Liver", "Mouth", "Peritoneal structures"], defaultOn: true, color: "#c27a3a" },
  { id: "respiratory", label: "Respiratory system", system: "visceral", groups: ["Respiratory system", "Lungs", "Bronchi"], defaultOn: true, color: "#d98aa0" },
  { id: "urinary", label: "Urinary system", system: "visceral", groups: ["Urinary system"], defaultOn: false, color: "#7b5ea7", note: "Kidneys are omitted: the source kidney model is licensed non-commercial." },
  { id: "reproductive", label: "Reproductive anatomy", system: "visceral", groups: ["Genital systems'"], defaultOn: false, color: "#a8658a" },
  { id: "endocrine", label: "Endocrine glands", system: "visceral", groups: ["Endocrine glands"], defaultOn: false, color: "#6d9a5b" },
  { id: "other-visceral", label: "Other organs", system: "visceral", fallback: true, defaultOn: false, color: "#8a9a9a" },
];

export const layerById = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<string, LayerDef>;

export function layerOf(n: ManifestNode): LayerDef {
  const sys = LAYERS.filter((l) => l.system === n.system);
  if (sys.length === 1) return sys[0];
  for (const l of sys) if (l.groups?.some((g) => n.groups.includes(g))) return l;
  return sys.find((l) => l.fallback) ?? sys[0];
}

/** Three.js renames glTF nodes (spaces -> _, strips . [ ] : /). Mirror it to map clicked meshes back to the manifest. */
export const threeName = (blenderName: string) => PropertyBinding.sanitizeNodeName(blenderName);

export type AtlasEntry = ManifestNode & { layerId: string };

export async function loadManifest(): Promise<Manifest> {
  const r = await fetch("/models/anatomy/manifest.json");
  if (!r.ok) throw new Error(`manifest ${r.status}`);
  return r.json();
}
