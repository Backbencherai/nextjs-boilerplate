# A×D — Our Growth Universe

A private, explorable 3D world where Adarsh and Devanshi level up in real life.

## Run
```bash
npm install
npm run dev
```

## Real-time sync between both phones (Supabase)
1. Create a free Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e.g. in Vercel env vars).
3. On both phones, enter the **same secret word** during onboarding.

Without these keys the app runs in **local mode**: data lives in this browser and syncs live between tabs on the same device.

Privacy: rows are scoped to a SHA-256 hash of your secret word, which is sent as an `x-space-key` header and enforced by Row Level Security. Live updates use Realtime broadcast and presence on a channel named after that hash.

## What's inside
- Opening: a loader with real progress and Pip the mascot, a 5-chapter 3D story, and interactive onboarding.
- 3D world (`/world`): five floating islands, playable characters, partner shown live, daily XP coins, activity locations (Library, Spring, Forge, Garden, Well, Bonfire, Quest Board, Hall of Fame, Observatory, Bottle Dock), joystick or tap-to-walk, fast-travel map.
- Personal islands grow from real data: trees come from your level, flowers from your streak, the crystal from study hours, the cairn from workout hours.
- Quick log from anywhere: study, workout and meditation timers (they survive reloads), meals, water, sleep, mood, steps, and past sessions.
- XP and levels, 37 medals (27 solo and 10 shared), PNG certificates, Hall of Fame records, leaderboards, daily, weekly and together quests, analytics, and 3D museums (`/museum/adarsh|devanshi|together`).
- Six hidden secrets (Konami code, the sun, the duck, the glowcap, the logo, Pip).

## Design
The art direction follows dontlookup.app: off-white paper (`#f4f3ef`), near-black ink (`#14140f`), chunky hand-lettered caps, 2.5px outlines, hard offset shadows and wobbly card corners. Color is used sparingly: blue for Adarsh, red for Devanshi, yellow for rewards.

The 3D look comes from `components/three/Ink.tsx`. It gives every mesh 3-step toon shading, washes its color toward paper and adds an inverted-hull ink outline. Meshes marked `userData.keep` keep their color.

Fonts are Luckiest Guy and Nunito from Google Fonts, not the reference site's licensed FGD font. All models and code are original. Nothing is copied from the reference sites.
