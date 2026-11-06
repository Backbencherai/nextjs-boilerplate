"use client";
import dynamic from "next/dynamic";
import { WorldLoader } from "../intro/WorldLoader";

const Museum = dynamic(() => import("./Museum"), { ssr: false, loading: () => <WorldLoader label="Polishing the trophies…" /> });

export function MuseumLoader({ who }: { who: "adarsh" | "devanshi" | "together" }) {
  return <Museum who={who} />;
}
