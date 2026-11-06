"use client";
import dynamic from "next/dynamic";

const Explore = dynamic(() => import("@/components/explore/Explore").then((m) => m.Explore), { ssr: false, loading: () => <div className="blank">Loading the real world…</div> });

export default function Page() {
  return <Explore />;
}
