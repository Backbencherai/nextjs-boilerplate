"use client";
import { useEffect, useState } from "react";

/** useState persisted to localStorage (per-browser). Hydrates after mount to avoid SSR mismatch. */
export function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v, ready]);
  return [v, setV, ready] as const;
}
