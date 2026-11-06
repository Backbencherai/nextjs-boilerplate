# Bhavan's Multiplayer

A 30-day multiplayer world where **real life builds your country**. Unlimited players, every device, no server to run.

## Deploy
- **Vercel:** import the GitHub repo, set **Root Directory** to `bhavans-multiplayer`, and deploy. `vercel.json` is already set.
- **Netlify:** drag the unzipped `Bhavans-Multiplayer-site` folder onto https://app.netlify.com/drop, or import the repo with base directory `bhavans-multiplayer`.
- **Locally:** run `npm install && npm run dev` (port 3400). `npm run build` writes a static site to `out/`. Run `npm test` for the engine tests.

Players install it from the browser like an app: iPhone uses Share → Add to Home Screen; Android, Mac, Windows and Linux get an Install button. The `/install` page shows the steps for each device and a QR code.

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

## Multiplayer (no setup)
Everything syncs through two free public MQTT-over-WebSocket relays, EMQX and HiveMQ, used at once. There is no server and no API keys.

| Topic | What it carries |
|---|---|
| `n/<id>` | each nation's public state (retained) |
| `in/<id>/<event>` | inboxes for raids, transfers, tourists, partnerships, trade, investments and DMs |
| `news/*`, `chat/*` | ring buffers |
| `sig/<id>` | live call signalling |
| `save/<key>` | your **AES-GCM-encrypted** full save, decryptable only with your email + PIN |

**Login:** email + PIN restores your country on any device. Quick play needs only a name. **Google Sign-In** turns on when you put your OAuth Client ID (Google Cloud Console → Credentials, with your domain as an authorised origin) into `public/game-config.json` → `googleClientId`.

`public/game-config.json` also sets the relays, the world name (use a different name for a private world) and the season start.

Honest notes:
- **Cheating:** the game is client-authoritative, which keeps it serverless and unlimited. A technical player could cheat. A dedicated server would fix that.
- **Voice calls:** they use public STUN servers. A few strict mobile networks need a TURN server, which you'd add in `lib/net/call.ts`.

## Credits
- Characters: **KayKit Adventurers** by Kay Lousberg (CC0), trimmed and re-dressed in Blender (`blender/make_cast.py`).
- Scenery: generated in Blender (`blender/make_assets.py`).
- World map: Natural Earth via `world-atlas`.

All game code, buildings, UI and music are original.
