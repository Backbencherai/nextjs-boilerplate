import type { Metadata } from "next";
import AnatomyLabLoader from "@/components/anatomy/AnatomyLabLoader";

export const metadata: Metadata = { title: "Anatomy lab" };

export default function AnatomyPage() {
  return (
    <section className="on-dark relative overflow-hidden bg-charcoal text-white">
      <div className="grid-pattern pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6">
        <p className="eyebrow">Interactive anatomy lab</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-5xl">Explore the body, layer by layer</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
          Rotate, zoom and select structures of a 3D human anatomy atlas, toggle body systems, and search structures by name.
        </p>
        <div className="mt-8 text-foreground">
          <AnatomyLabLoader />
        </div>
      </div>
    </section>
  );
}
