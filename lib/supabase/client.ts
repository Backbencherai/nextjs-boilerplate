"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let pending: Promise<SupabaseClient | null> | null = null;

/**
 * Browser client, or null when Supabase is not configured / unreachable.
 * Config is fetched at runtime from /api/supabase-config (not inlined at build time) and memoised.
 */
export function getBrowserSupabase(): Promise<SupabaseClient | null> {
  return (pending ??= fetch("/api/supabase-config", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((c) => (c?.configured ? createBrowserClient(c.url, c.key) : null))
    .catch(() => {
      pending = null; // allow a retry after a transient failure
      return null;
    }));
}
