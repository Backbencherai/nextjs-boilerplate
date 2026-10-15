"use client";

import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { LAYERS, threeName, type AtlasEntry, type Manifest, type SystemKey } from "@/lib/anatomy/atlas";

export type AtlasHandle = { reset: () => void };

type Props = {
  manifest: Manifest;
  entries: Map<string, AtlasEntry>; // keyed by Three.js node name
  loadSystems: Set<SystemKey>;
  layerOn: Record<string, boolean>;
  selected: AtlasEntry | null;
  onSelect: (e: AtlasEntry | null) => void;
  xray: boolean;
  onLoaded: (s: SystemKey) => void;
};

function SystemModel({
  system, file, entries, layerOn, selected, onSelect, xray, onLoaded,
}: Omit<Props, "manifest" | "loadSystems"> & { system: SystemKey; file: string }) {
  // useGLTF suspends until loaded; meshopt decoder is bundled (no CDN), Draco disabled.
  const gltf = useGLTF(`/models/anatomy/${file}`, false, true);
  const root = gltf.scene;

  const mats = useMemo(() => {
    const m: Record<string, THREE.MeshStandardMaterial> = {};
    for (const l of LAYERS.filter((x) => x.system === system))
      m[l.id] = new THREE.MeshStandardMaterial({ color: l.color, roughness: 0.65, side: THREE.DoubleSide });
    m.__hi = new THREE.MeshStandardMaterial({ color: "#14b8a6", emissive: "#0f766e", emissiveIntensity: 0.6, side: THREE.DoubleSide });
    return m;
  }, [system]);

  useEffect(() => onLoaded(system), [onLoaded, system]);

  useEffect(() => {
    for (const k of Object.keys(mats)) {
      if (k === "__hi") continue;
      mats[k].transparent = xray;
      mats[k].opacity = xray ? 0.3 : 1;
      mats[k].depthWrite = !xray;
      mats[k].needsUpdate = true;
    }
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const e = entries.get(mesh.name);
      if (!e) return;
      mesh.material = selected && e.node === selected.node ? mats.__hi : mats[e.layerId];
      // Hidden meshes go to layer 1: invisible to both the camera and the picking raycaster.
      mesh.layers.set(layerOn[e.layerId] ? 0 : 1);
    });
  }, [root, entries, layerOn, selected, xray, mats]);

  return (
    <primitive
      object={root}
      onClick={(ev: { object: THREE.Object3D; stopPropagation: () => void }) => {
        ev.stopPropagation();
        const e = entries.get(ev.object.name);
        if (e) onSelect(e);
      }}
    />
  );
}

function Rig({ selected, handle }: { selected: AtlasEntry | null; handle: React.Ref<AtlasHandle> }) {
  const controls = useThree((s) => s.controls) as unknown as (THREE.EventDispatcher & {
    target: THREE.Vector3; update: () => void; saveState: () => void; reset: () => void;
  }) | null;
  const camera = useThree((s) => s.camera);

  useEffect(() => controls?.saveState(), [controls]);
  useImperativeHandle(handle, () => ({ reset: () => controls?.reset() }), [controls]);

  useEffect(() => {
    if (!controls || !selected) return;
    const [mn, mx] = selected.bbox;
    const c = new THREE.Vector3((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2);
    const r = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2], 0.05);
    const dir = camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(c);
    camera.position.copy(c.clone().add(dir.multiplyScalar(Math.min(3.4, Math.max(0.5, r * 3.2)))));
    controls.update();
  }, [selected, controls, camera]);
  return null;
}

export const AtlasScene = forwardRef<AtlasHandle, Props>(function AtlasScene(props, ref) {
  const { manifest, loadSystems } = props;
  const [mn, mx] = props.selected?.bbox ?? [[0, 0, 0], [0, 0, 0]];
  return (
    <Canvas camera={{ position: [0, 1, 3.4], fov: 40, near: 0.05, far: 50 }} dpr={[1, 1.75]} onPointerMissed={() => props.onSelect(null)} aria-label="Interactive 3D anatomy atlas">
      <color attach="background" args={["#f4f6f6"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 4]} intensity={1.3} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} />
      {[...loadSystems].map((s) => (
        <Suspense key={s} fallback={null}>
          <SystemModel
            system={s}
            file={manifest.systems[s].file}
            entries={props.entries}
            layerOn={props.layerOn}
            selected={props.selected}
            onSelect={props.onSelect}
            xray={props.xray}
            onLoaded={props.onLoaded}
          />
        </Suspense>
      ))}
      {props.selected && (
        <Html position={[(mn[0] + mx[0]) / 2, mx[1] + 0.03, (mn[2] + mx[2]) / 2]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded bg-charcoal/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {props.selected.name}{props.selected.side ? ` (${props.selected.side})` : ""}
          </span>
        </Html>
      )}
      <OrbitControls makeDefault enableDamping target={[0, 0.9, 0]} minDistance={0.15} maxDistance={6} />
      <Rig selected={props.selected} handle={ref} />
    </Canvas>
  );
});

export { threeName };
