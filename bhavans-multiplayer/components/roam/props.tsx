"use client";
/* Blender-made vehicles and trees (public/models/props.glb), split per material for instancing and tinting. */
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export const PROPS_URL = "/models/props.glb";

/* procedural foliage textures (alpha-cut leaf cards, like real game trees) */
const texCache: Record<string, THREE.Texture> = {};
function canvasTex(key: string, draw: (g: CanvasRenderingContext2D, S: number) => void, S = 256) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  draw(g, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return (texCache[key] = t);
}
const rnd = (() => {
  let x = 12345;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
})();
export function leafTex() {
  return canvasTex("leaf", (g, S) => {
    for (let i = 0; i < 70; i++) {
      const x = S * 0.12 + rnd() * S * 0.76;
      const y = S * 0.12 + rnd() * S * 0.76;
      const l = 14 + rnd() * 16;
      const a = rnd() * Math.PI * 2;
      const shade = 150 + Math.floor(rnd() * 105);
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillStyle = `rgb(${shade * 0.78},${shade},${shade * 0.72})`;
      g.beginPath();
      g.ellipse(0, 0, l, l * 0.45, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = `rgba(40,60,30,0.35)`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(-l, 0);
      g.lineTo(l, 0);
      g.stroke();
      g.restore();
    }
  });
}
export function needleTex() {
  return canvasTex("needle", (g, S) => {
    g.lineCap = "round";
    for (let i = 0; i < 26; i++) {
      const x = S * 0.15 + rnd() * S * 0.7;
      const y0 = S * 0.15 + rnd() * S * 0.3;
      const shade = 120 + Math.floor(rnd() * 100);
      g.strokeStyle = `rgb(${shade * 0.6},${shade},${shade * 0.7})`;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(x + (rnd() - 0.5) * 10, y0 + S * 0.55);
      g.stroke();
      for (let k = 0; k < 18; k++) {
        const yy = y0 + (k / 18) * S * 0.55;
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(x, yy);
        g.lineTo(x - 16 + rnd() * 4, yy + 10);
        g.moveTo(x, yy);
        g.lineTo(x + 16 - rnd() * 4, yy + 10);
        g.stroke();
      }
    }
  });
}
export function frondTex() {
  return canvasTex("frond", (g, S) => {
    g.strokeStyle = "rgb(170,190,120)";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(S / 2, 0);
    g.lineTo(S / 2, S);
    g.stroke();
    for (let k = 0; k < 40; k++) {
      const y = (k / 40) * S;
      const len = S * 0.48 * Math.sin((k / 40) * Math.PI) + 10;
      const shade = 170 + Math.floor(rnd() * 70);
      g.strokeStyle = `rgb(${shade * 0.75},${shade},${shade * 0.6})`;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(S / 2, y);
      g.quadraticCurveTo(S / 2 - len * 0.6, y + 6, S / 2 - len, y + 20);
      g.moveTo(S / 2, y);
      g.quadraticCurveTo(S / 2 + len * 0.6, y + 6, S / 2 + len, y + 20);
      g.stroke();
    }
  });
}
export function fabricTex() {
  return canvasTex("fabric", (g, S) => {
    g.fillStyle = "#e9e9e9";
    g.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 2)
      for (let x = 0; x < S; x += 2) {
        const v = 215 + Math.floor(rnd() * 40) - ((x + y) % 4 === 0 ? 18 : 0);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, y, 2, 2);
      }
  });
}
export function barkTex() {
  return canvasTex("bark", (g, S) => {
    g.fillStyle = "#cfc3b4";
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * S;
      const w = 2 + rnd() * 6;
      const shade = 70 + Math.floor(rnd() * 70);
      g.fillStyle = `rgba(${shade},${shade * 0.85},${shade * 0.7},0.75)`;
      g.beginPath();
      g.moveTo(x, 0);
      for (let y = 0; y <= S; y += 16) g.lineTo(x + Math.sin(y * 0.05 + i) * 4, y);
      g.lineTo(x + w, S);
      g.lineTo(x + w, 0);
      g.fill();
    }
  });
}
/** Box/cylinder projection UVs for meshes exported without them (furniture, trunks). */
function projectUVs(geo: THREE.BufferGeometry, scale = 1.2, cylindrical = false) {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (cylindrical) {
      uv[i * 2] = (Math.atan2(z, x) / (Math.PI * 2) + 0.5) * 2;
      uv[i * 2 + 1] = y * 0.6;
      continue;
    }
    const ax = Math.abs(nor ? nor.getX(i) : 0);
    const ay = Math.abs(nor ? nor.getY(i) : 1);
    const az = Math.abs(nor ? nor.getZ(i) : 0);
    if (ay >= ax && ay >= az) uv.set([x * scale, z * scale], i * 2);
    else if (ax >= az) uv.set([z * scale, y * scale], i * 2);
    else uv.set([x * scale, y * scale], i * 2);
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

export function woodTex() {
  return canvasTex("wood", (g, S) => {
    for (let i = 0; i < 8; i++) {
      const base = 150 + Math.floor(rnd() * 40);
      g.fillStyle = `rgb(${base},${base * 0.68},${base * 0.42})`;
      g.fillRect(0, i * (S / 8), S, S / 8);
      for (let k = 0; k < 30; k++) {
        g.strokeStyle = `rgba(80,45,20,${0.08 + rnd() * 0.12})`;
        g.beginPath();
        const y = i * (S / 8) + rnd() * (S / 8);
        g.moveTo(0, y);
        g.bezierCurveTo(S * 0.3, y + rnd() * 6 - 3, S * 0.6, y + rnd() * 6 - 3, S, y);
        g.stroke();
      }
      g.fillStyle = "rgba(40,25,10,0.35)";
      g.fillRect(0, i * (S / 8), S, 2);
      g.fillRect(((i * 97) % 8) * (S / 8), i * (S / 8), 2, S / 8);
    }
  }, 512);
}
export type Part = { name: string; geo: THREE.BufferGeometry; mat: THREE.Material; paint: boolean; leaves: boolean };

/** Geometry of every mesh under a root node, baked into the root's space. */
export function useParts(root: string): Part[] {
  const { scene } = useGLTF(PROPS_URL);
  return useMemo(() => {
    const r = scene.getObjectByName(root);
    if (!r) return [];
    r.updateMatrixWorld(true);
    const inv = r.matrixWorld.clone().invert();
    const out: Part[] = [];
    r.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const geo = mesh.geometry.clone().applyMatrix4(inv.clone().multiply(mesh.matrixWorld));
      const src = mesh.material as THREE.MeshStandardMaterial;
      const paint = /Paint/.test(mesh.name);
      const leaves = /Crown|Core/.test(mesh.name);
      const mat = src.clone();
      if (paint || leaves) mat.color.set("#ffffff"); // tinted per instance
      if (leaves) {
        mat.vertexColors = !!geo.getAttribute("color");
        mat.side = THREE.DoubleSide;
        mat.flatShading = false;
        const card = /Crown/.test(mesh.name);
        if (card) {
          (mat as THREE.MeshStandardMaterial).map = /Pine/.test(mesh.name) ? needleTex() : /Palm/.test(mesh.name) ? frondTex() : leafTex();
          mat.alphaTest = 0.45;
        }
      }
      if (/Books/.test(mesh.name)) {
        // colourful spines
        const cols = ["#b5523b", "#1f3a93", "#2e6b4a", "#e0a100", "#7a4fd8", "#3b3b46", "#d23a3a"];
        const n = geo.getAttribute("position").count;
        const c = new Float32Array(n * 3);
        const col = new THREE.Color();
        for (let v = 0; v < n; v += 24) {
          col.set(cols[(v / 24) % cols.length]);
          for (let k = v; k < Math.min(n, v + 24); k++) c.set([col.r, col.g, col.b], k * 3);
        }
        geo.setAttribute("color", new THREE.BufferAttribute(c, 3));
        mat.vertexColors = true;
      }
      if (/Light|Tail/.test(mesh.name)) (mat as THREE.MeshStandardMaterial).toneMapped = false;
      // real surface textures on furniture and trunks
      const sm = mat as THREE.MeshStandardMaterial;
      if (/_(Fabric|Cushion|Sheet|Blanket|Pillow|Rug)/.test(mesh.name)) {
        if (!geo.getAttribute("uv")) projectUVs(geo, 3);
        sm.map = fabricTex();
        sm.map.wrapS = sm.map.wrapT = THREE.RepeatWrapping;
      } else if (/_(Wood|Chair|Cabinet)/.test(mesh.name) && !/Car|Bus/.test(mesh.name)) {
        if (!geo.getAttribute("uv")) projectUVs(geo, 1.6);
        const w = woodTex();
        w.wrapS = w.wrapT = THREE.RepeatWrapping;
        sm.map = w;
        sm.color.multiplyScalar(1.6);
      } else if (/Trunk/.test(mesh.name)) {
        if (!geo.getAttribute("uv")) projectUVs(geo, 1, true);
        const b = barkTex();
        b.wrapS = b.wrapT = THREE.RepeatWrapping;
        sm.map = b;
      }
      if (/Glass/.test(mesh.name)) {
        mat.transparent = true;
        mat.opacity = 0.45; // see the people inside
        (mat as THREE.MeshStandardMaterial).roughness = 0.05;
        (mat as THREE.MeshStandardMaterial).metalness = 0.6;
      }
      out.push({ name: mesh.name, geo, mat, paint, leaves });
    });
    return out;
  }, [scene, root]);
}

/** A single prop (for the player's own cab, bus, boat or jet ski) with an optional paint colour. */
export function Prop({ root, paint, leaf, children, ...rest }: { root: string; paint?: string; leaf?: string; children?: React.ReactNode } & React.ComponentProps<"group">) {
  const parts = useParts(root);
  const mats = useMemo(
    () =>
      parts.map((p) => {
        if (p.leaves) {
          const m = (p.mat as THREE.MeshStandardMaterial).clone();
          m.color.set(leaf ?? "#4f8a3c");
          return m;
        }
        if (!p.paint || !paint) return p.mat;
        const m = (p.mat as THREE.MeshStandardMaterial).clone();
        m.color.set(paint);
        return m;
      }),
    [parts, paint, leaf]
  );
  return (
    <group {...rest}>
      {parts.map((p, i) => (
        <mesh key={p.name} geometry={p.geo} material={mats[i]} castShadow receiveShadow />
      ))}
      {children}
    </group>
  );
}
useGLTF.preload(PROPS_URL);
