import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** POST only (so a third-party page cannot sign users out with an <img>/link). */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
