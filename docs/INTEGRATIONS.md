# Integrations and credentials

| Feature | Status | What is needed |
|---|---|---|
| AI assistant (`/api/assistant`) | Works only if `ANTHROPIC_API_KEY` is set (optional `ASSISTANT_MODEL`). Otherwise returns 503 with an honest message. | API key, server-side only. Add shared rate limiting (current limiter is per-instance memory). |
| Report explainer | Deterministic comparison against the range printed on the same line. No AI, no storage. | AI explanations need a provider, consent flow and clinically reviewed prompts. PDF/image OCR not implemented. |
| Care intake | Validates input and shows generic safety guidance. No AI analysis; photos stay in the browser. | AI provider + clinical review before any analysis is shown. |
| Doctor directory | No provider connected (`lib/doctors/provider.ts` returns null). | ABDM (https://abdm.gov.in/) and UHI (https://abdm.gov.in/UHI) require onboarding/credentials not assumed here. Document actual requirements before integrating. |
| Auth / roles / portal / admin | Not implemented. | Supabase (or similar) auth, row-level security, server-side role checks. |
| Reminders | Stored in localStorage; no notifications are sent. | Push/email/SMS service for real reminders. |
