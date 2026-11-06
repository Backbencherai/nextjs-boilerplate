# Bhavan's Multiplayer

A 30-day multiplayer world where **real life builds your country**. Unlimited players, every device, no server to run.

## Deploy on Vercel (5 minutes)

The game runs on a real server: every action is checked and calculated there, so nobody can cheat by editing their phone.

1. Push this repo to GitHub (or upload the zip to a new GitHub repo).
2. On vercel.com → **Add New → Project** → import the repo. If the game is in a sub-folder, set **Root Directory** to `bhavans-multiplayer`. Framework: Next.js (auto).
3. In the project → **Storage** (or **Marketplace**) → add **Upstash for Redis** (free tier) and connect it to the project. This adds `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `_TOKEN`) automatically. **Without it, data is kept only in memory and is lost when the server sleeps.**
4. Settings → Environment Variables (recommended):
   - `AUTH_SECRET`: any long random text (signs logins).
   - `SEASON_START`: optional, e.g. `2026-11-06T00:00:00Z`. Seasons last 30 days and roll over automatically.
   - `GOOGLE_CLIENT_ID`: optional, to enable "Continue with Google" (add your Vercel domain as an authorised JavaScript origin).
   - Calls that work on every network (mobile data, school Wi-Fi): `METERED_API_KEY` + `METERED_DOMAIN` from metered.ca (free 50 GB), or `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL`. Without these a free public relay is used (best effort).
5. **Deploy**. Open the URL on each phone → Share → *Add to Home Screen* (iPhone) or *Install app* (Android).

Local: `npm install && npm run dev` (http://localhost:3400, in-memory data).

### Fair play (anti-cheat)
- The server owns every country. The app only sends requests ("build a farm here"); the server checks the cost, time and rules with the same game engine and replies with the result.
- Study, workout and meditation timers are timed by the **server clock**. Forgetting the timer lets you add at most **60 self-reported minutes a day**. Water, meals, steps and sleep have daily caps.
- Logins are signed (HMAC). PINs are salted and hashed, and 5 wrong PINs lock the account for 10 minutes.
- **One president per country**: each real country (with its real name and flag) can be claimed by exactly one player per season.

## How it plays
- **Real life → resources:**
  - study gives 💡 knowledge and coins;
  - workouts give ⚡ energy, which trains soldiers;
  - meditation gives ☮️ peace, which adds defence;
  - healthy meals give 🌾 food;
  - water gives 💧 water;
  - steps give 🧱 materials;
  - sleep gives 😊 happiness.

  Daily caps keep it fair, and daily goals pay bonuses.
- **Country:** pick a real country on the world map, name your nation and choose an emblem, colour, ruler (7 characters) and role (7 roles, switchable daily).
- **3D city:** 17 buildings with 5 levels each. One school per country: **Bhavan's BP Vidya Mandir, Civil Lines**.
  - Construction takes time and shows scaffolding.
  - Little workers (doctors, engineers, teachers, soldiers, farmers, bankers, pilots) work at their buildings.
  - Traffic runs on the ring road, and trains run once you build a Railway Station.
  - You stand at the edge as a giant crowned ruler.
- **Economy:**
  - taxes, factories, markets, the railway and savings interest;
  - a **national currency** that gets stronger when your citizens live healthy, which boosts income and trade;
  - a full **money-flow** breakdown and **net worth** balance sheet.
- **Banking:** savings with daily interest, loans, transfers between players, and a statement.
- **Stock market:** every country has shares priced from public power, happiness and currency strength. 10% of each purchase is invested in that country. Price charts are included.
- **Trade:** instant world-market exports and imports, plus player-to-player offers with goods held in escrow.
- **In-game phone:** Phone (real **voice calls** between presidents over WebRTC), Messages, Stocks, Trade, News, Bank, Maps and City.
- **Travel:** build an Airport, then go through check-in (boarding pass), security X-ray, the gate, and the cabin. On board: a safety briefing (spoken aloud), the seatbelt sign, take-off, a window view, headphones with original generated music, and landing. Then a passport stamp, and you tour their city. Tourism pays the host country.
- **Landmarks:** 40 real places, famous and lesser-known, with postcards and facts.
- **Partnerships:** up to 3 partners. Each gives +5% income, partners can send aid and can't attack each other, and green lines link you on the map.
- **War:** unlocks after 8 buildings including Barracks. Armies march in real time and the target gets a warning. Winners loot coins and materials and may gain land. There's a 3-day new-player shield and an 8-hour shield after being raided.
- **Rival:** **Centerpoint School**, an AI with a campus in every country. It raids each nation on its own schedule and grows daily. There's a global Bhavan's vs Centerpoint scoreboard.
- **Natural disasters:**
  - rain, thunderstorms (power cuts), typhoons, whirlwinds, El Niño drought and tsunamis hit real regions;
  - walls, hospitals and the bunker reduce the damage;
  - there are forecasts, map overlays and 3D weather.
- **The Red Meteor:** every 7 days at 14:00 UTC, after a 24-hour warning, a fictional meteor strikes. A bunker plus tapping **Take cover** saves your people, and survivors get rewards.
- **Seasons:** each lasts 30 days and they roll automatically. There are rankings by power, population, wealth, victories, Centerpoint wins and tourism.

## Roam (the open world)
Tap **🧭 Roam** in the menu. You get an endless cartoon city with towers, streets, traffic, citizens, parks and street lamps, and a monument in the centre (Taj Mahal, Qutub Minar, Eiffel Tower, Gateway of India, Big Ben, Pyramids, Burj Khalifa, Statue of Liberty, Golden Temple, Colosseum).
- Search any city, monument, beach or mountain. Each city has its own look: New York and Dubai skyscrapers, Paris boulevards, Agra and Jaipur low-rise. Beaches get an ocean; ski places get snow.
- Walk, run, cab, bus, metro, ski, jet ski, boat and cruise. Fares, gear (ski kit, life jacket…) and stamps are checked by the server.
- Camera: 3rd person, 1st person or drone (button or **V**). Drag with a finger or mouse to orbit all the way around, pinch or scroll to zoom, Q/E to turn. Joystick on phones, WASD on computers.
- Vehicles (car, bus, speedboat, jet ski) and trees (broadleaf, fir, palm) are modelled in Blender: `python blender/make_props.py -- public/models/props.glb`.
- Animated advert screens on downtown towers.
- **Walk into any building** (🚪 Enter apartment). Inside is a furnished flat: living room with sofa, rug and a TV playing ads, kitchen and dining, bedroom with wardrobe, wood floors, ceiling lights and a window over the city. All the furniture is made in Blender. Add `?home=1` to a Roam link to start indoors.
- Leaf-card trees (broadleaf, fir, palm) with real leaf textures, furnished windows (curtains, blinds, plants, lamps) on every building, reflective rippling pools and fountains, rolling surf at beaches, and soft image-based reflections on paint, glass and water.
- Real local day and night: lit windows, street lamps and floodlit monuments.
- Optional: with `GOOGLE_MAPS_KEY` (Map Tiles API) a 🌐 button opens **real photorealistic 3D** of the same place.

### Seasons, weather, festivals and nature
- **Seasons** follow each place's real date and hemisphere: spring blossom, summer, monsoon rain, autumn gold and red, snowy winters. Tap the season chip to preview others.
- **Weather and disasters you can see:** rain, thunderstorms (lightning and thunder), typhoons (trees bend in the wind), whirlwinds, tsunami waves with flooding, and El Niño heatwaves. Disasters from the game's forecast show up live where they strike.
- **Festivals** on their real dates by country: Diwali, Holi, Christmas, New Year, Chinese New Year, Eid, Ramadan, Rio and Venice Carnival, Songkran, Hanami, Oktoberfest, Halloween, Thanksgiving, Ganesh Chaturthi, Navratri and more.
  - Decorations to match: diyas and rangoli, lanterns, light strings, Christmas trees, pumpkins, bunting, bonfires and fireworks.
  - Notifications when a festival is on in your country, and holiday ideas a few days ahead (Home → Festivals & holidays).
- **Play:** throw Holi colours or Songkran water, and have snowball fights in the snow (button or **F**). Citizens throw back.
- **Nightly light & fountain show** at every monument, a reflective ocean at beaches, and lifts to the roof of tall buildings.
- **Nature:** bird flocks, pigeons that scatter, street dogs, cows in Indian cities, deer in forests and snow, dolphins and gulls at the beach, butterflies in spring.
- **Every country** in the world is searchable in Roam.

### Everyday life
- **Traffic lights** at every crossing (one shared cycle), zebra crossings and stop lines. Cars brake for red, queue behind each other and stop for you. You can see the drivers through the glass.
- Pedestrians wait at the kerb for the walk signal, and a **traffic police officer** in a hi-vis vest directs traffic from a podium.
- **Incidents** happen near you: car crashes (smoke, glass), bag thieves you can chase down, and people collapsing.
  - Call the real local emergency number (🚨 112 / 911 / 999 / 000…). A spoken operator answers, then police cars and ambulances race in with sirens and flashing lights.
  - Up to 3 reports a day earn a civic reward (server-checked).
- **Sound everywhere** (🔊 to mute), all generated in the browser: breaking waves at beaches, city traffic hum, horns, birdsong, footsteps, your engine, sirens, rain and thunder, fireworks.
- **The ocean** is a real rolling sea: Gerstner swells, fresnel sky reflections, sun glints and whitecaps. It gets rougher in storms.

## Multiplayer
- `app/api/auth`: sign-in (email + PIN, Google, or name only).
- `app/api/sync`: each phone checks in about every 3 seconds (about every second during a call). The server advances your country, resolves battles and delivers news, chat, messages, raids, trades and call signals.
- `app/api/act`: every action, validated by the engine in `lib/game/*`.
- `app/api/ice`: STUN/TURN servers for **voice and video calls**. Media goes phone-to-phone over WebRTC and is relayed through TURN when networks are strict.
- Data: Upstash Redis (`lib/server/db.ts`). Seasons, disasters and the Red Meteor are deterministic, so every player sees the same world.

**Realism:** real countries, names and flags; one president each. Real local time (day/night: cities sleep at night and earn 55% less). A 7-day disaster forecast warns you a week, a day and an hour ahead, so you can buy sandbags, plan an evacuation or stockpile in advance.

## Credits
- Characters: **KayKit Adventurers** by Kay Lousberg (CC0), trimmed and re-dressed in Blender (`blender/make_cast.py`).
- Scenery: generated in Blender (`blender/make_assets.py`).
- World map: Natural Earth via `world-atlas`.

All game code, buildings, UI and music are original.
