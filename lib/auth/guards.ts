import "server-only";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export type Role = "user" | "doctor" | "admin";

export type Session =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "signed-in"; userId: string; email: string | null; role: Role };

/** Verified on the auth server (getUser), never from the unverified cookie. Role comes from the RLS-protected profiles table. */
export async function getSession(): Promise<Session> {
  const supabase = await getServerSupabase();
  if (!supabase) return { status: "unconfigured" };
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { status: "anonymous" };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role: Role = profile?.role === "admin" || profile?.role === "doctor" ? profile.role : "user";
    return { status: "signed-in", userId: data.user.id, email: data.user.email ?? null, role };
  } catch {
    return { status: "anonymous" }; // auth server unreachable: deny rather than allow
  }
}

/**
 * Server-side gate. Returns the session only if the caller holds one of the roles; otherwise redirects.
 * When Supabase is not configured it returns { status: "unconfigured" } so pages can show their labelled demo state.
 */
export async function requireRole(roles: Role[], next: string) {
  const s = await getSession();
  if (s.status === "unconfigured") return s;
  if (s.status === "anonymous") redirect(`/auth?next=${encodeURIComponent(next)}`);
  if (s.status === "signed-in" && !roles.includes(s.role)) redirect("/auth?denied=1");
  return s;
}
