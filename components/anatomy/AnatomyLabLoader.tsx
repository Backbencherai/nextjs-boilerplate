"use client";

import dynamic from "next/dynamic";

/** Lazy-loads the three.js bundle only when the viewer is rendered. Falls back to the schematic model inside. */
const AtlasLab = dynamic(() => import("./AtlasLab"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-line bg-surface text-sm text-muted">
      Loading anatomy lab…
    </div>
  ),
});

export default function AnatomyLabLoader({ compact }: { compact?: boolean }) {
  return <AtlasLab compact={compact} />;
}
