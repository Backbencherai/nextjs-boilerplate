"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Shows nothing when auth is not configured, so the header never advertises a feature that does not exist. */
export function AuthButton() {
  const [state, setState] = useState<"off" | "loading" | "out" | "in">("loading");

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    getBrowserSupabase().then(async (supabase) => {
      if (cancelled) return;
      if (!supabase) return setState("off");
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setState(data.user ? "in" : "out");
      } catch {
        if (!cancelled) setState("out");
      }
      const sub = supabase.auth.onAuthStateChange((_e, s) => setState(s?.user ? "in" : "out"));
      unsub = () => sub.data.subscription.unsubscribe();
    });
    return () => { cancelled = true; unsub?.(); };
  }, []);

  if (state === "off" || state === "loading") return null;
  return (
    <Link href="/auth" className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-white/15 px-3 text-sm font-medium text-white hover:border-accent-bright">
      <UserRound className="h-4 w-4" aria-hidden /> {state === "in" ? "Account" : "Sign in"}
    </Link>
  );
}
