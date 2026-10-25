/**
 * Tissue → PBR material parameters. The key logic mirrors scripts/render/render_atlas_images.py (`pick`) so the
 * live viewer and the pre-rendered images use the same colour language.
 */
import type { ManifestNode } from "./atlas";

export type MatKey =
  | "bone" | "enamel" | "cartilage" | "muscle" | "tendon" | "fascia" | "heart" | "artery" | "vein"
  | "brain" | "nerve" | "eye" | "liver" | "lung" | "gut" | "spleen" | "gall" | "pancreas" | "organ";

export type MatParams = { color: string; roughness: number; clearcoat: number; clearcoatRoughness?: number; sheen?: number; sheenColor?: string };

export const MATS: Record<MatKey, MatParams> = {
  bone: { color: "#d8cdb6", roughness: 0.52, clearcoat: 0.05 },
  enamel: { color: "#efece2", roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.1 },
  cartilage: { color: "#b9c9cc", roughness: 0.4, clearcoat: 0.25 },
  muscle: { color: "#8f1d1a", roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, sheen: 0.6, sheenColor: "#ff6a5a" },
  tendon: { color: "#e2d3b8", roughness: 0.36, clearcoat: 0.4 },
  fascia: { color: "#e6dcc6", roughness: 0.5, clearcoat: 0.2 },
  heart: { color: "#9b1c20", roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  artery: { color: "#c0221f", roughness: 0.3, clearcoat: 0.7 },
  vein: { color: "#34389a", roughness: 0.3, clearcoat: 0.7 },
  brain: { color: "#d9a29d", roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  nerve: { color: "#ecd77f", roughness: 0.38, clearcoat: 0.45 },
  eye: { color: "#f0ede7", roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.05 },
  liver: { color: "#6b1a12", roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  lung: { color: "#e8909c", roughness: 0.55, clearcoat: 0.15, sheen: 0.5, sheenColor: "#ffc0c8" },
  gut: { color: "#d98275", roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.2 },
  spleen: { color: "#5a1f3a", roughness: 0.36, clearcoat: 0.5 },
  gall: { color: "#3b6a22", roughness: 0.3, clearcoat: 0.65 },
  pancreas: { color: "#d9b283", roughness: 0.5, clearcoat: 0.3 },
  organ: { color: "#d58a85", roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.25 },
};

export function matKeyFor(n: Pick<ManifestNode, "name" | "groups" | "system">): MatKey {
  const name = n.name.toLowerCase();
  const groups = n.groups.join(" ").toLowerCase();
  const both = `${name} ${groups}`;
  switch (n.system) {
    case "skeletal":
      if (/tooth|teeth|incisor|molar|canine|premolar/.test(name)) return "enamel";
      if (/cartilage|disc/.test(both)) return "cartilage";
      return "bone";
    case "muscular":
      if (/\bfascia\b|iliotibial tract|investing/.test(name)) return "fascia";
      return /tendon|aponeuro|ligament|retinaculum|tendinous|raphe|sheath/.test(name) ? "tendon" : "muscle";
    case "cardiovascular":
      if (/vein|vena|sinus/.test(name) || groups.includes("veins")) return "vein";
      if (groups.includes("heart") || /atrium|ventricle|heart|auricle|septum|valve/.test(name)) return "heart";
      return "artery";
    case "nervous":
      if (/eye|sclera|cornea|lens|iris/.test(name)) return "eye";
      if (/nerve|ganglion/.test(both)) return "nerve";
      return "brain";
    default:
      if (/liver/.test(both)) return "liver";
      if (/lung|bronch|trachea|lobe/.test(name) || /lungs|bronchi|respiratory/.test(groups)) return "lung";
      if (/spleen/.test(name)) return "spleen";
      if (/gallbladder|bile|cystic/.test(name)) return "gall";
      if (/pancrea/.test(name)) return "pancreas";
      if (/stomach|intestin|colon|duoden|jejun|ileum|caecum|rectum|oesophag|esophag|anal|appendix|gaster|digestive/.test(both)) return "gut";
      return "organ";
  }
}
