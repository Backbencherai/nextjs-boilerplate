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

## Reference note
The creative reference sites could not be reached from the build environment. The design comes from the screenshots provided. Every model is original procedural geometry, and no third-party assets are used.
