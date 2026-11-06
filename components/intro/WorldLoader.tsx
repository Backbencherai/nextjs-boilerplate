"use client";

export function WorldLoader({ label = "Building the islands…" }: { label?: string }) {
  return (
    <div className="world-loader">
      <div className="cube-hop">
        <i />
      </div>
      <p className="mono">{label}</p>
    </div>
  );
}
