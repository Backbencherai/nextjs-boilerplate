"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Box, BookCheck, Languages, ShieldCheck } from "lucide-react";
import { useT } from "./LanguageProvider";

export function HomeHero() {
  const { t } = useT();
  const reduce = useReducedMotion();
  const fade = (d = 0) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, delay: d, ease: "easeOut" as const } });

  return (
    <section className="on-dark relative overflow-hidden bg-charcoal text-white">
      <div className="grid-pattern pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -right-40 top-0 h-[620px] w-[620px] rounded-full bg-accent/25 blur-[140px]" aria-hidden />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-blue/20 blur-[140px]" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-0 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div className="pb-14 lg:pb-24">
          <motion.p className="eyebrow" {...fade(0)}>Health education &amp; care navigation</motion.p>
          <motion.h1 className="mt-5 text-5xl font-semibold leading-[1.04] sm:text-6xl lg:text-[4.4rem]" {...fade(0.05)}>{t("hero.title")}</motion.h1>
          <motion.p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70" {...fade(0.12)}>{t("hero.body")}</motion.p>
          <motion.div className="mt-9 flex flex-wrap gap-3" {...fade(0.2)}>
            <Link href="/explore" className="btn btn-primary">{t("hero.cta1")} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/anatomy" className="btn btn-ghost-dark"><Box className="h-4 w-4" aria-hidden /> {t("hero.cta2")}</Link>
          </motion.div>
          <motion.ul className="mt-12 grid max-w-xl gap-4 text-sm text-white/70 sm:grid-cols-3" {...fade(0.3)}>
            {[
              [ShieldCheck, "Education only", "Never diagnoses or prescribes"],
              [BookCheck, "Sources shown", "Review dates on clinical content"],
              [Languages, "4 languages", "EN · हिन्दी · मराठी · ಕನ್ನಡ"],
            ].map(([Icon, a, b]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <li key={a as string} className="flex flex-col gap-1 border-l border-white/15 pl-4">
                  <I className="h-5 w-5 text-accent-bright" aria-hidden />
                  <span className="font-semibold text-white">{a as string}</span>
                  <span className="text-xs leading-snug">{b as string}</span>
                </li>
              );
            })}
          </motion.ul>
        </div>

        <motion.div className="relative mx-auto w-full max-w-[460px] self-end" {...fade(0.15)}>
          <div className="absolute inset-x-6 bottom-0 top-10 rounded-[2rem] bg-gradient-to-b from-accent/30 to-transparent blur-2xl" aria-hidden />
          <Image
            src="/images/atlas/hero-ecorche.jpg"
            alt="Rendered 3D anatomical figure showing the superficial muscles of the human body"
            width={1000}
            height={1400}
            priority
            sizes="(min-width: 1024px) 460px, 90vw"
            className="relative w-full rounded-t-[2rem] border border-b-0 border-white/10 object-cover shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          />
          <Link href="/anatomy" className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-charcoal shadow-lg transition hover:bg-white">
            Open the live 3D lab →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
