"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HeartPulse, Menu, X, Languages } from "lucide-react";
import { useT } from "./LanguageProvider";
import { LANGS, type Lang } from "@/lib/i18n/dictionaries";

const NAV = [
  { href: "/explore", key: "nav.explore" },
  { href: "/anatomy", key: "nav.anatomy" },
  { href: "/care", key: "nav.care" },
  { href: "/first-aid", key: "nav.firstAid" },
  { href: "/reports", key: "nav.reports" },
  { href: "/medicines", key: "nav.medicines" },
  { href: "/doctors", key: "nav.doctors" },
  { href: "/assistant", key: "nav.assistant" },
  { href: "/dashboard", key: "nav.dashboard" },
];

export function Header() {
  const { t, lang, setLang } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="Swasth Setu home">
          <HeartPulse className="h-6 w-6 text-accent" aria-hidden />
          <span className="text-lg tracking-tight">Swasth Setu</span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface ${
                pathname.startsWith(n.href) ? "text-accent" : "text-foreground"
              }`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm">
            <Languages className="h-4 w-4 text-muted" aria-hidden />
            <span className="sr-only">{t("nav.language")}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="min-h-[40px] rounded-lg border border-line bg-white px-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t("nav.menu")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            className="border-t border-line bg-white xl:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-1 p-3 sm:grid-cols-3">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium hover:bg-surface"
                  >
                    {t(n.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
