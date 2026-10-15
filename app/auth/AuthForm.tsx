"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { magicLinkSchema, signInSchema, signUpSchema } from "@/lib/auth/validation";
import { safeNext } from "@/lib/auth/safeNext";

type Mode = "signin" | "signup" | "link";

export function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    const supabase = await getBrowserSupabase();
    if (!supabase) return setError("Sign-in is not available right now.");
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;

    setBusy(true);
    try {
      if (mode === "signin") {
        const p = signInSchema.safeParse({ email, password });
        if (!p.success) return setError(p.error.issues[0].message);
        const { error } = await supabase.auth.signInWithPassword(p.data);
        if (error) return setError("Email or password is incorrect, or the email is not confirmed yet.");
        location.assign(safeNext(next));
      } else if (mode === "signup") {
        const p = signUpSchema.safeParse({ email, password, consent });
        if (!p.success) return setError(p.error.issues[0].message);
        const { error } = await supabase.auth.signUp({ email: p.data.email, password: p.data.password, options: { emailRedirectTo: redirectTo } });
        if (error) return setError("We could not create the account. If you already have one, sign in instead.");
        // Same message whether or not the address already exists (avoids account enumeration).
        setInfo("If this email can be registered, we have sent a confirmation link. Open it to finish.");
      } else {
        const p = magicLinkSchema.safeParse({ email });
        if (!p.success) return setError(p.error.issues[0].message);
        const { error } = await supabase.auth.signInWithOtp({ email: p.data.email, options: { emailRedirectTo: redirectTo } });
        if (error) return setError("We could not send the link. Please try again in a minute.");
        setInfo("If this email can be used, a sign-in link is on its way.");
      }
    } catch {
      setError("Could not reach the sign-in service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4" noValidate>
      <div role="tablist" aria-label="Sign-in method" className="flex gap-1 rounded-xl bg-surface p-1 text-sm font-medium">
        {([["signin", "Sign in"], ["signup", "Create account"], ["link", "Email link"]] as const).map(([m, label]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); setInfo(""); }}
            className={`min-h-[40px] flex-1 rounded-lg px-2 ${mode === m ? "bg-white shadow-sm" : "text-muted"}`}>{label}</button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode !== "link" && (
        <div>
          <label className="label" htmlFor="auth-pw">Password</label>
          <input id="auth-pw" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === "signup" && <p className="mt-1 text-xs text-muted">At least 10 characters.</p>}
        </div>
      )}
      {mode === "signup" && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#0f766e]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I have read the <Link className="underline" href="/privacy">privacy policy</Link>. Swasth Setu is educational and is not a medical service.</span>
        </label>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {info && <p role="status" className="text-sm text-accent-strong">{info}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link"}
      </button>
    </form>
  );
}
