"use client";
/* Blender-made vehicles and trees (public/models/props.glb), split per material for instancing and tinting. */
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export const PROPS_URL = "/models/props.glb";
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
      const leaves = /Crown/.test(mesh.name);
      const mat = src.clone();
      if (paint || leaves) mat.color.set("#ffffff"); // tinted per instance
      if (leaves) {
        mat.vertexColors = !!geo.getAttribute("color");
        mat.side = THREE.DoubleSide;
        mat.flatShading = false;
      }
      if (/Light|Tail/.test(mesh.name)) (mat as THREE.MeshStandardMaterial).toneMapped = false;
      out.push({ name: mesh.name, geo, mat, paint, leaves });
    });
    return out;
  }, [scene, root]);
}

/** A single prop (for the player's own cab, bus, boat or jet ski) with an optional paint colour. */
export function Prop({ root, paint, children, ...rest }: { root: string; paint?: string; children?: React.ReactNode } & React.ComponentProps<"group">) {
  const parts = useParts(root);
  const mats = useMemo(
    () =>
      parts.map((p) => {
        if (!p.paint || !paint) return p.mat;
        const m = (p.mat as THREE.MeshStandardMaterial).clone();
        m.color.set(paint);
        return m;
      }),
    [parts, paint]
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
