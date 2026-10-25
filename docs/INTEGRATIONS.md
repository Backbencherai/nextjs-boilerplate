# Integrations and credentials

| Feature | Status | What is needed |
|---|---|---|
| AI assistant (`/api/assistant`) | Works only if `ANTHROPIC_API_KEY` is set (optional `ASSISTANT_MODEL`). Otherwise returns 503 with an honest message. | API key, server-side only. Add shared rate limiting (current limiter is per-instance memory). |
| Report explainer | Deterministic comparison against the range printed on the same line. No AI, no storage. | AI explanations need a provider, consent flow and clinically reviewed prompts. PDF/image OCR not implemented. |
| Care intake | Validates input and shows generic safety guidance. No AI analysis; photos stay in the browser. | AI provider + clinical review before any analysis is shown. |
| Doctor directory | No provider connected (`lib/doctors/provider.ts` returns null). | ABDM (https://abdm.gov.in/) and UHI (https://abdm.gov.in/UHI) require onboarding/credentials not assumed here. Document actual requirements before integrating. |
| Auth / roles | Implemented for Supabase (email+password, email link). See `docs/AUTH.md`. Off when env vars are absent. | Supabase project, migration, redirect URLs, SMTP. Test against a live project. |
| Doctor portal / admin | Server-side role gate in place; contents are synthetic / empty. No doctor verification, patient data or appointments. | Real verification process, data model, audit logging. |
| Reminders | Stored in the user's account (signed in) or localStorage; no notifications are sent. | Push/email/SMS service for real reminders. |
