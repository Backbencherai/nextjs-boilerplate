"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useT } from "./LanguageProvider";

export function SafetyBanner() {
  const { t, usedFallback } = useT();
  return (
    <div className="bg-charcoal text-white" role="note">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm sm:px-6">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <p>{t("safety.banner")}</p>
        <Link href="/safety" className="underline underline-offset-2">
          {t("safety.learn")}
        </Link>
      </div>
      {usedFallback && (
        <p className="border-t border-white/10 bg-amber-900/40 px-4 py-1.5 text-center text-xs sm:px-6">
          {t("lang.fallback")}
        </p>
      )}
    </div>
  );
}
