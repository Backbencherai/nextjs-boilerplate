/* Endless cartoon city generator. Deterministic per city + chunk, so every player sees the same streets. */
import { rng } from "../game/world";

export const CELL = 50; // one block incl. half a road on each side
export const ROAD = 14; // road width
export const LOT = CELL - ROAD; // buildable square
export const CHUNK = 4; // cells per chunk side
export const CHUNK_M = CELL * CHUNK;
export const PLAZA = 1; // cells around the origin kept free for the monument

export type Env = "city" | "beach" | "snow" | "forest";
export interface CityStyle {
  key: string;
  env: Env;
  tall: number; // downtown height multiplier
  base: number; // typical floors at the edge
  palette: string[];
  ground: string;
  park: number; // chance a lot is a park
  uniform?: boolean; // Paris-style even rooflines
  season?: string;
  snow?: boolean;
}

const PASTEL = ["#f6d6ad", "#f7c6c7", "#cfe3f7", "#d8eecb", "#efe2c4", "#e6d3f5", "#fbe8a6", "#c9ede6", "#f4f1ea", "#ffd2b0"];
const STYLES: Record<string, Partial<CityStyle>> = {
  "new york": { tall: 7, base: 6, palette: ["#c9d3df", "#e8ddd0", "#b7c4d4", "#efe7da", "#a9b8cc", "#d7cfc4"] },
  dubai: { tall: 9, base: 5, palette: ["#cfe8f5", "#e9f2f8", "#bcd9ec", "#f4ead8", "#a8cbe3"] },
  "hong kong": { tall: 8, base: 8, palette: PASTEL },
  shanghai: { tall: 8, base: 6, palette: ["#cfe3f7", "#e6eef5", "#b9cde0", "#f3e7d6"] },
  tokyo: { tall: 6, base: 5, palette: ["#f4f1ea", "#e7e9ee", "#f7d8d8", "#d8e4f2", "#efe2c4"] },
  singapore: { tall: 7, base: 5, palette: PASTEL },
  mumbai: { tall: 6, base: 5, palette: ["#f6d6ad", "#f7c6c7", "#cfe3f7", "#fbe8a6", "#d8eecb", "#ffd2b0"] },
  paris: { tall: 1.2, base: 6, uniform: true, palette: ["#efe2c4", "#f4ead2", "#e9dcc0", "#f6eedc"] },
  london: { tall: 3, base: 5, palette: ["#d9c4a8", "#c98f72", "#e8dccb", "#bfa58a", "#efe7da"] },
  rome: { tall: 1.1, base: 4, uniform: true, palette: ["#f0c98e", "#e8a87c", "#f4d7a1", "#e3b38b"] },
  agra: { tall: 1.3, base: 3, palette: ["#f3d9b1", "#efc59a", "#f6e3c4", "#e8b98a", "#f4f1ea"] },
  amritsar: { tall: 1.4, base: 3, palette: ["#f3d9b1", "#f6e3c4", "#e8b98a", "#fbe8a6"] },
  jaipur: { tall: 1.3, base: 3, palette: ["#f2a37c", "#f5b48c", "#e98f6a", "#f7c6a5"] },
  udaipur: { tall: 1.2, base: 3, palette: ["#f4f1ea", "#f6eedc", "#efe2c4"] },
  varanasi: { tall: 1.2, base: 3, palette: ["#f6d6ad", "#fbe8a6", "#f7c6c7", "#efe2c4"] },
  cairo: { tall: 2, base: 4, palette: ["#e8cfa2", "#dcbf8e", "#efdcb8", "#d4b07c"] },
};

export function styleFor(name: string, tags: string[] = []): CityStyle {
  const n = name.toLowerCase();
  const hit = Object.keys(STYLES).find((k) => n.includes(k));
  const env: Env = tags.includes("ski") ? "snow" : tags.includes("beach") || tags.includes("jetski") ? "beach" : tags.includes("trek") || tags.includes("camp") ? "forest" : "city";
  const s: CityStyle = { key: n, env, tall: 3.5, base: 4, palette: PASTEL, ground: "#4b5160", park: 0.12, ...(hit ? STYLES[hit] : {}) };
  if (env === "snow") Object.assign(s, { tall: 0.8, base: 2, palette: ["#8b5a3c", "#a86f4c", "#f4f1ea", "#c0392b"], ground: "#e9eef5", park: 0.35 });
  if (env === "forest") Object.assign(s, { tall: 0.6, base: 2, palette: ["#a86f4c", "#8b5a3c", "#d9b38c"], ground: "#5d7a46", park: 0.7 });
  if (env === "beach") Object.assign(s, { tall: 2, base: 3, park: 0.2 });
  return s;
}

export interface Box {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roof: number; // 0 flat, 1 rooftop props, 2 pitched
  house?: boolean; // detached family house with door, chimney and garden
  face?: number; // which way the front door faces: 0 +z, 1 -z, 2 +x, 3 -x
}
export interface Chunk {
  key: string;
  cx: number;
  cz: number;
  boxes: Box[];
  lots: { x: number; z: number; park: boolean; garden?: boolean }[];
  trees: { x: number; z: number; s: number; kind: number }[];
  lamps: { x: number; z: number; r: number }[];
}

/** Is this cell open water (the beach environment has an ocean to the south)? */
export const OCEAN_Z = 160;
export function isWater(style: CityStyle, z: number) {
  return style.env === "beach" && z > OCEAN_Z;
}

export function genChunk(style: CityStyle, cx: number, cz: number): Chunk {
  const out: Chunk = { key: `${cx},${cz}`, cx, cz, boxes: [], lots: [], trees: [], lamps: [] };
  for (let i = 0; i < CHUNK; i++)
    for (let j = 0; j < CHUNK; j++) {
      const gi = cx * CHUNK + i;
      const gj = cz * CHUNK + j;
      const x0 = gi * CELL + ROAD / 2;
      const z0 = gj * CELL + ROAD / 2;
      const cxm = x0 + LOT / 2;
      const czm = z0 + LOT / 2;
      if (Math.abs(gi + 0.5) <= PLAZA + 0.5 && Math.abs(gj + 0.5) <= PLAZA + 0.5) continue; // monument plaza
      if (style.env === "beach" && z0 + LOT > OCEAN_Z - 40) {
        if (z0 < OCEAN_Z) for (let k = 0; k < 3; k++) out.trees.push({ x: x0 + 6 + k * 12, z: z0 + 10, s: 1.2, kind: 3 }); // palms on the sand
        continue;
      }
      const r = rng(`${style.key}:${gi}:${gj}`);
      const dist = Math.hypot(cxm, czm);
      const park = r() < style.park || (style.env !== "city" && style.env !== "beach" && r() < 0.5);
      const suburb = !park && (style.env === "city" ? dist > 480 && r() < 0.7 : style.env === "beach" ? dist > 260 && r() < 0.5 : true);
      out.lots.push({ x: cxm, z: czm, park, garden: suburb });
      // street trees and lamps along the sidewalk
      for (let k = 0; k < 3; k++) {
        out.trees.push({ x: x0 + 6 + k * 12, z: z0 + 1.6, s: 0.8 + r() * 0.5, kind: style.env === "snow" ? 1 : style.env === "beach" ? 3 : r() < 0.25 ? 2 : 0 });
        if (r() < 0.5) out.trees.push({ x: x0 + 1.6, z: z0 + 6 + k * 12, s: 0.8 + r() * 0.4, kind: style.env === "snow" ? 1 : 0 });
      }
      out.lamps.push({ x: x0 + 0.8, z: z0 + 0.8, r: 0 }, { x: x0 + LOT - 0.8, z: z0 + LOT - 0.8, r: Math.PI });
      if (park) {
        const n = 6 + Math.floor(r() * 8);
        for (let k = 0; k < n; k++) out.trees.push({ x: x0 + 5 + r() * (LOT - 10), z: z0 + 5 + r() * (LOT - 10), s: 1 + r() * 0.9, kind: style.env === "snow" || style.env === "forest" ? 1 : r() < 0.3 ? 2 : 0 });
        continue;
      }
      if (suburb) {
        const HOUSE = ["#f4e3c8", "#e9c6a5", "#f7d6d0", "#d9e6f2", "#e2ecd2", "#f6f0e2", "#c97b5d", "#b85c42"];
        const q = LOT / 2;
        for (const [qx, qz, face] of [
          [0, 0, 1],
          [q, 0, 1],
          [0, q, 0],
          [q, q, 0],
        ] as [number, number, number][]) {
          const w = 9 + r() * 4;
          const d = 8 + r() * 3;
          const floors = r() < 0.65 ? 2 : 1;
          out.boxes.push({ x: x0 + qx + q / 2, z: z0 + qz + q / 2 + (face ? -1.5 : 1.5), w, d, h: floors * 3.1, color: HOUSE[Math.floor(r() * HOUSE.length)], roof: 2, house: true, face });
          if (r() < 0.6) out.trees.push({ x: x0 + qx + 2.5, z: z0 + qz + (face ? q - 2.5 : 2.5), s: 0.7 + r() * 0.4, kind: style.env === "snow" ? 1 : r() < 0.2 ? 2 : 0 });
        }
        continue;
      }
      // split the lot into 1–4 buildings, taller downtown
      const split = r();
      const parts: [number, number, number, number][] =
        split < 0.3
          ? [[0, 0, LOT, LOT]]
          : split < 0.6
            ? [
                [0, 0, LOT / 2 - 1, LOT],
                [LOT / 2 + 1, 0, LOT / 2 - 1, LOT],
              ]
            : [
                [0, 0, LOT / 2 - 1, LOT / 2 - 1],
                [LOT / 2 + 1, 0, LOT / 2 - 1, LOT / 2 - 1],
                [0, LOT / 2 + 1, LOT / 2 - 1, LOT / 2 - 1],
                [LOT / 2 + 1, LOT / 2 + 1, LOT / 2 - 1, LOT / 2 - 1],
              ];
      const downtown = 1 + (style.tall - 1) * Math.exp(-dist / 420);
      for (const [px, pz, pw, pd] of parts) {
        const inset = 2.5 + r() * 2;
        const floors = style.uniform ? style.base + Math.floor(r() * 2) : Math.max(2, Math.round(style.base * downtown * (0.45 + r() * 1.1)));
        const h = floors * 3.2;
        const w = pw - inset;
        const d = pd - inset;
        const color = style.palette[Math.floor(r() * style.palette.length)];
        const roof = style.env === "snow" || style.env === "forest" || (floors <= 3 && r() < 0.4) ? 2 : r() < 0.7 ? 1 : 0;
        out.boxes.push({ x: x0 + px + pw / 2, z: z0 + pz + pd / 2, w, d, h, color, roof });
        // a setback tower on top of tall blocks
        if (floors > 14 && r() < 0.6) out.boxes.push({ x: x0 + px + pw / 2, z: z0 + pz + pd / 2, w: w * 0.62, d: d * 0.62, h: h + 4 * 3.2 + r() * 30, color, roof: 1 });
      }
    }
  return out;
}

/** Simple collision: push a circle out of every building it overlaps. */
export function collide(boxes: { x: number; z: number; w: number; d: number }[], x: number, z: number, rad: number): [number, number, boolean] {
  let hit = false;
  for (const b of boxes) {
    const hx = b.w / 2 + rad;
    const hz = b.d / 2 + rad;
    const dx = x - b.x;
    const dz = z - b.z;
    if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
      hit = true;
      const ox = hx - Math.abs(dx);
      const oz = hz - Math.abs(dz);
      if (ox < oz) x += Math.sign(dx || 1) * ox;
      else z += Math.sign(dz || 1) * oz;
    }
  }
  return [x, z, hit];
}

/** City-centre monument for each place. */
export function monumentFor(placeId: string, name: string): string | null {
  const id = placeId.replace(/^lm:/, "");
  const known = ["taj", "qutub", "eiffel", "gateway", "bigben", "pyramids", "burj", "liberty", "golden", "colosseum"];
  if (known.includes(id)) return id;
  const n = name.toLowerCase();
  const byCity: Record<string, string> = { agra: "taj", "new delhi": "qutub", paris: "eiffel", mumbai: "gateway", london: "bigben", cairo: "pyramids", dubai: "burj", "new york": "liberty", amritsar: "golden", rome: "colosseum" };
  const k = Object.keys(byCity).find((c) => n.includes(c));
  return k ? byCity[k] : placeId.startsWith("lm:") ? "generic" : "fountain";
}
