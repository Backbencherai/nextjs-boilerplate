"use client";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Renders children only once this device knows who it is and which universe it's in. */
export function RequireUser({ children }: { children: ReactNode }) {
  const ok = useStore((s) => s.hydrated && !!s.me && !!s.space);
  return ok ? <>{children}</> : <div className="blank" />;
}
