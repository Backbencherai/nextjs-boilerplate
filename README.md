# Swasth Setu

Health education and care-navigation web app (Next.js App Router, React, TypeScript, Tailwind CSS, Motion, three.js / React Three Fiber).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

Optional environment variables: `ANTHROPIC_API_KEY`, `ASSISTANT_MODEL` (assistant), `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (future auth).

## What works vs. what is a placeholder
See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md), [docs/CONTENT_REVIEW.md](docs/CONTENT_REVIEW.md) and [docs/ASSET_INVENTORY.md](docs/ASSET_INVENTORY.md). In short: the 3D lab (schematic model), report value comparison, care intake form, and dashboard work; first-aid steps, medicine data, doctor listings, AI features, auth and portals are intentionally empty or disabled until sourced, reviewed or credentialed.
