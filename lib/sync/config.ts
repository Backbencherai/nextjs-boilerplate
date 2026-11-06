"use client";

export interface SyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let cached: SyncConfig | null | undefined;

/**
 * Sync settings, read at runtime so a pre-built upload can be configured without rebuilding:
 *   1. /sync-config.json (edit it in the upload folder), else
 *   2. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY baked in at build time.
 */
export async function loadSyncConfig(): Promise<SyncConfig | null> {
  if (cached !== undefined) return cached;
  let cfg: SyncConfig | null = null;
  try {
    const r = await fetch("/sync-config.json", { cache: "no-store" });
    if (r.ok) {
      const j = (await r.json()) as Partial<SyncConfig>;
      if (j.supabaseUrl && j.supabaseAnonKey && j.supabaseUrl.startsWith("https://")) cfg = { supabaseUrl: j.supabaseUrl, supabaseAnonKey: j.supabaseAnonKey };
    }
  } catch {
    /* no file — fine */
  }
  if (!cfg && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    cfg = { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
  }
  cached = cfg;
  return cfg;
}

export function syncConfigSync() {
  return cached ?? null;
}
