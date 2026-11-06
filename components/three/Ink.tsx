"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const PAPER = new THREE.Color("#f4f3ef");
export const INK = new THREE.Color("#14140f");

let gradient: THREE.DataTexture | null = null;
function toonGradient() {
  if (gradient) return gradient;
  // soft bands: clean, bright marker shading (no muddy greys)
  const data = new Uint8Array([206, 206, 206, 255, 236, 236, 236, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

/** Outline material: pushes vertices along their normal before skinning, so it works on animated characters too. */
const outlineCache = new Map<number, THREE.MeshBasicMaterial>();
function outlineMaterial(thickness: number) {
  const key = Math.round(thickness * 2000) / 2000;
  let m = outlineCache.get(key);
  if (m) return m;
  m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uThick = { value: key };
    shader.vertexShader = "uniform float uThick;\n" + shader.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = vec3( position ) + normalize( objectNormal ) * uThick;");
  };
  m.customProgramCacheKey = () => "ink-outline-" + key;
  outlineCache.set(key, m);
  return m;
}

const ws = new THREE.Vector3();
const NO_HULL = new Set(["CircleGeometry", "RingGeometry", "PlaneGeometry"]);

/**
 * Paper-and-ink look for every lit mesh in the scene:
 *  - colours washed toward paper (unless userData.keep on the mesh or an ancestor)
 *  - soft toon shading, textures preserved
 *  - an ink outline of constant world thickness (skipped for `noLine` and `detail_*` materials)
 * New meshes are picked up on the next sweep; colours keep following their source material.
 */
export function Ink({ wash = 0.45, line = 0.026 }: { wash?: number; line?: number }) {
  const { scene } = useThree();
  const tmp = useMemo(() => new THREE.Color(), []);
  const timer = useRef(0);

  const sweep = () => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.hull) return;
      let keep = false;
      let noLine = !!m.userData.noLine;
      for (let o2: THREE.Object3D | null = m, i = 0; o2 && i < 6; o2 = o2.parent, i++) {
        if (o2.userData.keep) keep = true;
        if (o2 !== m && o2.userData.noLine) noLine = true;
      }
      if (!m.userData.inked) {
        m.userData.inked = true;
        const src = m.material as THREE.Material;
        if (Array.isArray(src) || !(src instanceof THREE.MeshStandardMaterial)) return;
        const toon = new THREE.MeshToonMaterial({
          gradientMap: toonGradient(),
          map: src.map,
          transparent: src.transparent,
          opacity: src.opacity,
          side: src.side,
          depthWrite: src.depthWrite,
        });
        m.userData.src = src;
        m.material = toon;
        if (src.name.startsWith("detail_")) noLine = true;
        if (!src.transparent && !noLine && !NO_HULL.has(m.geometry.type) && m.geometry.attributes.normal) {
          m.getWorldScale(ws);
          const s = Math.max(1e-3, Math.max(ws.x, ws.y, ws.z));
          const mat = outlineMaterial(line / s);
          const sk = m as THREE.SkinnedMesh;
          let hull: THREE.Mesh;
          if (sk.isSkinnedMesh) {
            const h = new THREE.SkinnedMesh(m.geometry, mat);
            h.bind(sk.skeleton, sk.bindMatrix);
            h.bindMode = sk.bindMode;
            hull = h;
          } else hull = new THREE.Mesh(m.geometry, mat);
          hull.userData.hull = true;
          hull.raycast = () => {};
          hull.frustumCulled = m.frustumCulled;
          m.add(hull);
        }
      }
      const src = m.userData.src as THREE.MeshStandardMaterial | undefined;
      if (!src) return;
      const t = m.material as THREE.MeshToonMaterial;
      t.color.copy(src.color).lerp(PAPER, keep ? 0.06 : wash);
      tmp.copy(src.emissive).multiplyScalar(src.emissiveIntensity * (keep ? 0.6 : 0.35));
      t.emissive.copy(tmp);
    });
  };

  useEffect(() => {
    sweep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  useFrame((_, dt) => {
    timer.current += dt;
    if (timer.current > 0.6) {
      timer.current = 0;
      sweep();
    }
  });
  return null;
}
