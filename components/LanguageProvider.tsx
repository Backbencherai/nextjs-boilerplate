"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, lookup, type Lang } from "@/lib/i18n/dictionaries";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  /** true once any key on the page fell back to English */
  usedFallback: boolean;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ss-lang") as Lang | null;
      if (saved && saved in dictionaries) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    setUsedFallback(false);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("ss-lang", l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string) => {
      const hit = lookup(lang, key);
      if (hit !== null) return hit;
      if (lang !== "en") queueMicrotask(() => setUsedFallback(true));
      return lookup("en", key) ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t, usedFallback }), [lang, setLang, t, usedFallback]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
