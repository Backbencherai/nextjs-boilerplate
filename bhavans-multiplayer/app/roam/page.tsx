"use client";
import dynamic from "next/dynamic";

const Roam = dynamic(() => import("@/components/roam/Roam").then((m) => m.Roam), { ssr: false, loading: () => <div className="blank">Building the city…</div> });

export default function Page() {
  return <Roam />;
}
