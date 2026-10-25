import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";

/** Refreshes the auth cookie on every matched request. Fails open: an unreachable auth server must not take the site down. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const cfg = supabaseConfig();
  if (!cfg) return response;

  const supabase = createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser(); // validates the JWT with the auth server and refreshes if needed
  } catch {
    /* treated as signed out; route guards re-check on the server */
  }
  return response;
}
