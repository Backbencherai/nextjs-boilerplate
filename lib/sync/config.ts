"use client";

export interface SyncConfig {
  /** Optional: your own Supabase project (takes priority when set). */
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  /** WebSocket MQTT relays for zero-setup multiplayer. Omit for the defaults; [] turns them off. */
  relays?: string[];
}

let cached: SyncConfig | undefined;

/**
 * Sync settings, read at runtime so an uploaded build can be changed without rebuilding:
 *   /sync-config.json, then NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export async function loadSyncConfig(): Promise<SyncConfig> {
  if (cached) return cached;
  let cfg: SyncConfig = {};
  try {
    const r = await fetch("/sync-config.json", { cache: "no-store" });
    if (r.ok) cfg = (await r.json()) as SyncConfig;
  } catch {
    /* no file is fine */
  }
  if (!(cfg.supabaseUrl && cfg.supabaseAnonKey) && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    cfg.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    cfg.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (cfg.supabaseUrl && !cfg.supabaseUrl.startsWith("https://")) cfg.supabaseUrl = undefined;
  cached = cfg;
  return cfg;
}

export function syncConfigSync(): SyncConfig {
  return cached ?? {};
}
