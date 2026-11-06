"use client";
import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useMemo, type ComponentProps, type ReactNode } from "react";
import * as THREE from "three";

/** Blender-built asset pack (see /blender/make_assets.py). */
export const ASSET_URL = "/models/axd.glb";

export function useAssets() {
  const { nodes } = useGLTF(ASSET_URL, false);
  return nodes as Record<string, THREE.Object3D>;
}

if (typeof window !== "undefined") useGLTF.preload(ASSET_URL, false);

/** A fresh clone of a named node, re-centred at its own origin, with shadows on. */
export function useAssetClone(name: string) {
  const nodes = useAssets();
  return useMemo(() => {
    const src = nodes[name];
    if (!src) return null;
    const o = src.clone(true);
    o.position.set(0, 0, 0);
    o.rotation.set(0, 0, 0);
    o.scale.set(1, 1, 1);
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return o;
  }, [nodes, name]);
}

function AssetInner({ name, ...rest }: { name: string } & ComponentProps<"group">) {
  const obj = useAssetClone(name);
  if (!obj) return null;
  return (
    <group {...rest}>
      <primitive object={obj} />
    </group>
  );
}

/** If the asset file can't load (offline, blocked), quietly show the procedural fallback. */
export class AssetBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Renders a Blender asset; shows `fallback` (the procedural version) until it loads or if it fails. */
export function Asset({ name, fallback = null, ...rest }: { name: string; fallback?: ReactNode } & ComponentProps<"group">) {
  return (
    <AssetBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <AssetInner name={name} {...rest} />
      </Suspense>
    </AssetBoundary>
  );
}

/** Joint position of a node as exported (used to place rig pivots). */
export function nodePos(nodes: Record<string, THREE.Object3D>, name: string): [number, number, number] {
  const p = nodes[name]?.position;
  return p ? [p.x, p.y, p.z] : [0, 0, 0];
}
