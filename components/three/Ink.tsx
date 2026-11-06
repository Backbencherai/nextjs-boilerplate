"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const PAPER = new THREE.Color("#f4f3ef");
export const INK = new THREE.Color("#14140f");

let gradient: THREE.DataTexture | null = null;
function toonGradient() {
  if (gradient) return gradient;
  // three flat bands: shadow, mid, lit — reads like marker shading on paper
  const data = new Uint8Array([150, 150, 150, 255, 214, 214, 214, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const ws = new THREE.Vector3();
const outlineMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const NO_HULL = new Set(["CircleGeometry", "RingGeometry", "PlaneGeometry"]);

/**
 * Converts every lit mesh in the scene to the paper-and-ink look:
 *  - colors are washed toward paper (unless the mesh opts out with userData.keep)
 *  - 3-step toon shading
 *  - an inverted-hull outline of constant world thickness
 * Meshes added later (coins, unlocks) are picked up on the next sweep, and colors
 * keep following their original material, so JSX color changes still apply.
 */
export function Ink({ wash = 0.72, line = 0.035 }: { wash?: number; line?: number }) {
  const { scene } = useThree();
  const tmp = useMemo(() => new THREE.Color(), []);
  const timer = useRef(0);

  const sweep = () => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.hull) return;
      let keep = false;
      for (let o2: THREE.Object3D | null = m, i = 0; o2 && i < 5; o2 = o2.parent, i++) if (o2.userData.keep) keep = true;
      if (!m.userData.inked) {
        m.userData.inked = true;
        const src = m.material as THREE.Material;
        if (Array.isArray(src) || !(src instanceof THREE.MeshStandardMaterial)) return;
        const toon = new THREE.MeshToonMaterial({
          gradientMap: toonGradient(),
          transparent: src.transparent,
          opacity: src.opacity,
          side: src.side,
          depthWrite: src.depthWrite,
        });
        m.userData.src = src;
        m.material = toon;
        if (!src.transparent && !m.userData.noLine && !NO_HULL.has(m.geometry.type)) {
          m.geometry.computeBoundingSphere();
          m.getWorldScale(ws);
          const r = Math.max(0.02, (m.geometry.boundingSphere?.radius ?? 1) * Math.max(ws.x, ws.y, ws.z));
          const hull = new THREE.Mesh(m.geometry, outlineMat);
          hull.userData.hull = true;
          hull.scale.setScalar(1 + Math.min(0.12, line / r));
          hull.raycast = () => {};
          m.add(hull);
        }
      }
      const src = m.userData.src as THREE.MeshStandardMaterial | undefined;
      if (!src) return;
      const t = m.material as THREE.MeshToonMaterial;
      t.color.copy(src.color).lerp(PAPER, keep ? 0.08 : wash);
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
