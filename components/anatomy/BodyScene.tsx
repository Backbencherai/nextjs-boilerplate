"use client";

import { Suspense, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { STRUCTURES, SYSTEMS, type Structure, type SystemId } from "@/lib/anatomy/structures";

export type ViewMode = "solid" | "xray";
export type SceneHandle = { reset: () => void };

type Props = {
  visibleSystems: Set<SystemId>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showLabels: boolean;
  showOutline: boolean;
  mode: ViewMode;
};

function Geometry({ s }: { s: Structure }) {
  switch (s.shape.kind) {
    case "sphere":
      return <sphereGeometry args={[s.shape.args[0], 32, 24]} />;
    case "capsule":
      return <capsuleGeometry args={[s.shape.args[0], s.shape.args[1], 8, 16]} />;
    case "cylinder":
      return <cylinderGeometry args={[s.shape.args[0], s.shape.args[1], s.shape.args[2], 16]} />;
    case "torus":
      return <torusGeometry args={[s.shape.args[0], s.shape.args[1], 12, 40]} />;
  }
}

function Part({
  s, selected, onSelect, showLabel, mode,
}: { s: Structure; selected: boolean; onSelect: (id: string) => void; showLabel: boolean; mode: ViewMode }) {
  const color = SYSTEMS[s.system].color;
  return (
    <group position={s.position} rotation={s.rotation} scale={s.scale}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(s.id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <Geometry s={s} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#0f766e" : "#000000"}
          emissiveIntensity={selected ? 0.6 : 0}
          roughness={0.6}
          transparent={mode === "xray" && !selected}
          opacity={mode === "xray" && !selected ? 0.55 : 1}
        />
      </mesh>
      {(showLabel || selected) && (
        <Html center distanceFactor={4} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded bg-charcoal/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {s.name}
          </span>
        </Html>
      )}
    </group>
  );
}

export const BodyScene = forwardRef<SceneHandle, Props>(function BodyScene(
  { visibleSystems, selectedId, onSelect, showLabels, showOutline, mode },
  ref,
) {
  const controls = useRef<OrbitControlsImpl | null>(null);

  useImperativeHandle(ref, () => ({ reset: () => controls.current?.reset() }));

  useEffect(() => {
    controls.current?.saveState();
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 1, 3.4], fov: 40 }}
      dpr={[1, 1.75]}
      onPointerMissed={() => onSelect(null)}
      aria-label="Interactive schematic 3D body model"
    >
      <color attach="background" args={["#f4f6f6"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 4]} intensity={1.4} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} />
      <Suspense fallback={null}>
        {showOutline && (
          <mesh position={[0, 0.85, 0]}>
            <capsuleGeometry args={[0.36, 1.2, 8, 24]} />
            <meshStandardMaterial color="#9fb3b1" transparent opacity={0.12} depthWrite={false} />
          </mesh>
        )}
        {STRUCTURES.filter((s) => visibleSystems.has(s.system)).map((s) => (
          <Part
            key={s.id}
            s={s}
            selected={s.id === selectedId}
            onSelect={onSelect}
            showLabel={showLabels}
            mode={mode}
          />
        ))}
      </Suspense>
      <OrbitControls
        ref={controls as never}
        makeDefault
        enableDamping
        target={[0, 0.9, 0]}
        minDistance={0.8}
        maxDistance={6}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </Canvas>
  );
});
