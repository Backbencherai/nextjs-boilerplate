import { NextResponse } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

// Read at request time so the browser works even if env vars were not present at build time.
// The URL and anon/publishable key are public by design (access is enforced by row-level security).
export const dynamic = "force-dynamic";

export function GET() {
  const cfg = supabaseConfig();
  return NextResponse.json(cfg ? { configured: true, ...cfg } : { configured: false }, { headers: { "Cache-Control": "no-store" } });
}
