"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Box } from "lucide-react";
import { useT } from "./LanguageProvider";
import AnatomyLabLoader from "./anatomy/AnatomyLabLoader";

export function HomeHero() {
  const { t } = useT();
  const reduce = useReducedMotion();
  return (
    <section className="bg-gradient-to-b from-surface to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{t("hero.title")}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t("hero.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="btn btn-primary">
              {t("hero.cta1")} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/anatomy" className="btn btn-secondary">
              <Box className="h-4 w-4" aria-hidden /> {t("hero.cta2")}
            </Link>
          </div>
        </motion.div>
        <div>
          <AnatomyLabLoader compact />
        </div>
      </div>
    </section>
  );
}
