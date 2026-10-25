"use client";

import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { threeName, type AtlasEntry, type Manifest, type SystemKey } from "@/lib/anatomy/atlas";
import { MATS, matKeyFor, type MatKey } from "@/lib/anatomy/materials";

export type AtlasHandle = { reset: () => void };

type Props = {
  manifest: Manifest;
  entries: Map<string, AtlasEntry>; // keyed by Three.js node name
  loadSystems: Set<SystemKey>;
  layerOn: Record<string, boolean>;
  selected: AtlasEntry | null;
  onSelect: (e: AtlasEntry | null) => void;
  xray: boolean;
  autoRotate?: boolean;
  onLoaded: (s: SystemKey) => void;
};

function SystemModel({
  system, file, entries, layerOn, selected, onSelect, xray, onLoaded,
}: Omit<Props, "manifest" | "loadSystems" | "autoRotate"> & { system: SystemKey; file: string }) {
  // useGLTF suspends until loaded; meshopt decoder is bundled (no CDN), Draco disabled.
  const gltf = useGLTF(`/models/anatomy/${file}`, false, true);
  const root = gltf.scene;

  const { mats, hi } = useMemo(() => {
    const m = {} as Record<MatKey, THREE.MeshPhysicalMaterial>;
    (Object.keys(MATS) as MatKey[]).forEach((k) => {
      const p = MATS[k];
      m[k] = new THREE.MeshPhysicalMaterial({
        color: p.color, roughness: p.roughness, metalness: 0, clearcoat: p.clearcoat, clearcoatRoughness: p.clearcoatRoughness ?? 0.3,
        sheen: p.sheen ?? 0, sheenColor: new THREE.Color(p.sheenColor ?? "#ffffff"), sheenRoughness: 0.5, side: THREE.DoubleSide,
      });
    });
    const h = new THREE.MeshPhysicalMaterial({ color: "#5eead4", emissive: "#0f9488", emissiveIntensity: 0.55, roughness: 0.35, clearcoat: 0.4, side: THREE.DoubleSide });
    return { mats: m, hi: h };
  }, []);

  useEffect(() => onLoaded(system), [onLoaded, system]);

  useEffect(() => {
    (Object.keys(mats) as MatKey[]).forEach((k) => {
      mats[k].transparent = xray;
      mats[k].opacity = xray ? 0.28 : 1;
      mats[k].depthWrite = !xray;
      mats[k].needsUpdate = true;
    });
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const e = entries.get(mesh.name);
      if (!e) return;
      mesh.material = selected && e.node === selected.node ? hi : mats[matKeyFor(e)];
      // Hidden meshes go to layer 1: invisible to both the camera and the picking raycaster.
      mesh.layers.set(layerOn[e.layerId] ? 0 : 1);
    });
  }, [root, entries, layerOn, selected, xray, mats, hi]);

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
    <Canvas
      camera={{ position: [0, 1, 3.4], fov: 40, near: 0.05, far: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      onPointerMissed={() => props.onSelect(null)}
      aria-label="Interactive 3D anatomy atlas"
    >
      {/* Image-based lighting from a bundled CC0 studio HDR (no network CDN). */}
      <Suspense fallback={null}>
        <Environment files="/hdri/studio.exr" environmentIntensity={0.85} />
      </Suspense>
      <directionalLight position={[3, 4, 4]} intensity={1.1} color="#fff4e6" />
      <directionalLight position={[-4, 2.5, -3]} intensity={1.4} color="#5eead4" />
      <directionalLight position={[0, 1, -4]} intensity={0.9} color="#7aa7ff" />
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
      <ContactShadows position={[0, 0.005, 0]} opacity={0.55} scale={3.2} blur={2.6} far={1.6} color="#000000" />
      {props.selected && (
        <Html position={[(mn[0] + mx[0]) / 2, mx[1] + 0.03, (mn[2] + mx[2]) / 2]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-charcoal shadow-lg">
            {props.selected.name}{props.selected.side ? ` (${props.selected.side})` : ""}
          </span>
        </Html>
      )}
      <OrbitControls makeDefault enableDamping autoRotate={props.autoRotate && !props.selected} autoRotateSpeed={0.9} target={[0, 0.9, 0]} minDistance={0.15} maxDistance={6} />
      <Rig selected={props.selected} handle={ref} />
    </Canvas>
  );
});

export { threeName };
