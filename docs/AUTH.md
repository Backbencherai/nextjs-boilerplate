# Authentication (Supabase)

Optional. With no Supabase variables set, the app runs in clearly-labelled local-only mode and `/admin` is disabled.

## Setup
1. Create a Supabase project. In **SQL editor** (or `supabase db push`) run `supabase/migrations/0001_init.sql`.
2. **Authentication → URL configuration:** Site URL = your deployed origin; add `https://<origin>/auth/callback` (and `http://localhost:3000/auth/callback` for dev) to Redirect URLs.
3. **Authentication → Providers → Email:** keep *Confirm email* ON. Set sensible rate limits and (for production) your own SMTP.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). They are read at **runtime** (`/api/supabase-config`), not inlined at build.
5. Promote a doctor/admin **manually** (service role or SQL editor), e.g. `update public.profiles set role = 'admin' where id = '<uuid>';`

## How it works
- `middleware.ts` refreshes the session cookie (`@supabase/ssr`); it fails open for page delivery only.
- `lib/auth/guards.ts` → `requireRole()` runs in server components, verifies the user with `auth.getUser()` (server round-trip, not the cookie) and reads `profiles.role`. If the auth server is unreachable it **denies**. `/admin` and `/doctor-portal` are `force-dynamic` so they can never be prerendered past the check.
- Roles live only in `profiles.role`. RLS lets users *read* their own profile and nobody update/insert it via the API, so users cannot promote themselves.
- `reminders` / `notes`: owner-only RLS. Doctors and admins have **no** access to other users' personal notes or reminders.
- Post-login redirects go through `safeNext()` (same-site paths only). Sign-out is POST-only. Sign-up/magic-link messages don't reveal whether an email exists.

## What is NOT done
- Doctor/professional **verification** (registry check, documents) — `role = 'doctor'` is just a flag an operator sets. Nothing shows a doctor as "verified".
- Patient data, appointments, consultation notes, audit logging.
- Account deletion (needs a server route using the service-role key) — dashboard "delete" removes reminders/notes only.
- MFA, OAuth providers, password reset UI (the "Email link" tab is the recovery path), CAPTCHA, shared-store rate limiting beyond Supabase's own.
- Migration of local-only items into an account (they stay on the device; the dashboard says so).
- Verified against a **mock** Supabase (local test double) and the unconfigured/unreachable cases, not a live project. Test against a real project before launch.
