# Master build prompt — Swasth Setu (paste into any AI app builder)

> Written tool-agnostic. If your builder cannot run Blender/Python or install npm packages, use the "No-Blender fallback" in section 7.

---

## 0. ROLE
You are a senior product designer + full-stack engineer + 3D graphics engineer + healthcare-safety reviewer. Build **Swasth Setu** (always written exactly like this, two words) as a polished, production-oriented web app. Not a landing-page mock: every nav item must lead to a working page, every button must do something, and anything not truly working must be labelled as such on screen.

## 1. PRODUCT
A health **education and care-navigation** platform for ordinary people in India (EN / हिन्दी / मराठी / ಕನ್ನಡ). It helps users: explore the human body in real 3D; understand a medical report's values against the ranges printed on that report; learn first aid from cited sources; look up medicine information; find real doctors (only from a genuine directory); keep reminders/notes; ask an education-only assistant.
It **never** diagnoses, prescribes, gives doses, or says an image shows an infection/disease.

## 2. STACK
Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Motion (`motion/react`) · three.js · @react-three/fiber · @react-three/drei · lucide-react · zod · Supabase (`@supabase/ssr`) for optional auth · sharp. Fonts from npm: `@fontsource-variable/inter`, `@fontsource-variable/fraunces`, `@fontsource/noto-sans-devanagari`, `@fontsource/noto-sans-kannada`. No runtime CDN dependencies for fonts/HDRI/models.

## 3. VISUAL DESIGN — "clinical editorial, cinematic"
Goal: looks like a premium medical-tech brand, **photoreal anatomy imagery**, calm and trustworthy. Not a generic AI dashboard.
- **Palette:** charcoal `#0b1514` / `#12201f` (dark sections), warm off-white `#fbfaf7` + `#f3f1ec` (light), teal accent `#0f766e` (bright `#2dd4bf` on dark), muted blue `#3b6ea5`, amber/red only for warnings.
- **Type:** Fraunces (variable, optical sizing) for H1/H2, Inter for UI/body, Noto Sans Devanagari/Kannada fallbacks. Hero H1 ≈ 4.4rem desktop, tight leading, `-0.015em` tracking (0 for Indic scripts).
- **Layout rhythm:** alternate dark cinematic bands and light bands. 12-col grid, max-width 1280px, generous spacing (py-20 sections), 16px mobile gutters, 44px+ touch targets.
- **Components:** dark sticky header (logo mark = bridge-arc over a cross, SVG), thin dark safety banner on top of every page, rounded-2xl/3xl cards with 1px borders and soft shadow, "eyebrow" labels (tiny uppercase teal text with a leading line), status pills (live = green, partial = amber, pending = grey), faint grid + blurred teal radial glows behind hero/anatomy sections.
- **Motion:** scroll-reveal (fade-up 14–16px, 0.4–0.55s, staggered), button press feedback, mobile menu height animation, hero image fade-in, 3D auto-rotate on the landing preview. Respect `prefers-reduced-motion` and never delay safety info.
- **No** glassmorphism overload, neon glows, random gradients, stock-photo smiling doctors, fake testimonials, fake stats, fake reviews, fake logos.

## 4. IMAGERY — make it look real (priority!)
1. **Hero:** a photoreal 3/4 front **écorché (muscle) figure** on a near-black teal background, rim-lit teal + cool blue, warm key light. Portrait 1000×1400, framed in a rounded card bottom-anchored to the hero with a glow behind it and a pill button "Open the live 3D lab →".
2. **Bento grid (landing):** three more renders — skeleton with lungs/liver/stomach visible in the ribcage (portrait), lungs+heart+liver close-up, skull+cervical spine 3/4 view. Overlay gradient caption bottom-left (serif title + one line).
3. **Where do the renders come from (real ones, not AI-art):** render the licensed 3D model yourself — see section 7 (Blender Cycles, subsurface scattering on muscle/organs, clearcoat "wetness", ivory bone, enamel teeth, blue veins, red arteries, yellow nerves; fascia sheets hidden so muscles are visible; 4 area lights: warm key, teal rim, cool back, soft fill; AgX/Filmic tone mapping; 96 samples + OIDN denoise).
4. If you may use online photography/illustration, use only **CC0 / public-domain / permissively-licensed** sources (e.g. Unsplash/Pexels licence, Wikimedia Commons with correct licence, Poly Haven CC0), keep an `ASSET_INVENTORY.md` with URL + licence + attribution, never imply a real person endorses the product, and no identifiable patient/people photos without release.
5. Serve images with `next/image` (+ `sharp`), proper `alt`, `sizes`, `priority` on the hero only.

## 5. PAGES (all must work)
`/` landing · `/explore` tools overview · `/anatomy` 3D lab · `/care` concern intake · `/first-aid` + `/first-aid/[slug]` · `/reports` · `/medicines` · `/doctors` · `/dashboard` · `/assistant` · `/auth` (+ `/auth/callback`, `/auth/signout`) · `/doctor-portal` · `/admin` · `/privacy` · `/safety` · `/credits`.

**Landing sections, in order:** (1) dark hero — eyebrow, H1 **"Your health. Better understood."**, sub-copy *"Understand your health information, explore the human body, learn essential care skills, and find your next step with Swasth Setu."*, buttons **Explore Your Health** (primary) / **Explore the Human Body** (ghost), 3 trust facts (Education only · Sources shown · 4 languages), hero render; (2) dark "Explore the human body in real 3D" — copy left, **live auto-rotating 3D viewer** right; (3) light bento of 3 renders; (4) "Everything labelled with what really works today" — 8 tool cards with icon, one-liner and honest status pill; (5) "Four calm steps"; (6) two dark trust panels (Safety first / Privacy by default); (7) FAQ accordion; (8) full footer (nav columns, contact placeholders, legal links, 112 notice).

## 6. FEATURE REQUIREMENTS
**Anatomy lab:** rotate/zoom/pan; click-to-select with camera focus; layer toggles (Skeleton, Muscles, Fascia, Heart & major vessels, Nervous, Digestive, Respiratory, Urinary, Reproductive, Endocrine, Other); search across all structures; categorized "part of" hierarchy; X-ray mode; reset camera; selected-structure panel (name, side, layer, hierarchy; plain-language text **only** where clinically reviewed, otherwise "No reviewed explanation yet"); loading states; error boundary + schematic fallback if WebGL/model fails; lazy-load each layer's file on first toggle; hidden meshes moved to a non-rendered, non-raycast layer; PBR materials per tissue (MeshPhysicalMaterial: clearcoat for wet organs, sheen for muscle/lung), ACES tone mapping, image-based lighting from a bundled CC0 studio HDR (`@pmndrs/assets` → `public/hdri/studio.exr`), contact shadow under the figure, dark radial studio backdrop. Always show attribution + honest "what this atlas does not include".
**Care intake:** text + body area + duration + severity + optional photo (stays in browser, never analysed). Zod validation, red-flag keyword screen → prominent emergency box. If no AI configured say "automated analysis unavailable"; never fabricate a result.
**Report explainer:** paste/.txt/.csv only (validate type+size; say PDFs/images unsupported). Compare each value **only** with the range printed on the same line; otherwise "cannot interpret". Sample report clearly labelled. No diagnosis, no own reference ranges.
**First aid / medicines:** data models with `sources[]`, `reviewed` date, `status`. Ship **empty/“pending source verification”** until each statement is checked against its cited source (American Red Cross, British Red Cross; CDSCO / National Formulary / WHO / MedlinePlus for medicines) and clinician-reviewed. Never invent medical content.
**Doctors:** search UI + provider interface (`lib/doctors/provider.ts`) returning *no results* until a real directory (ABDM / UHI — requires onboarding) is connected. Never fabricate doctors/registrations/reviews/availability; never show "verified" without a documented check.
**Assistant:** server route, zod validation, consent checkbox, timeout, rate limit, no sensitive logging, key only in env; honest 503 message when unconfigured.
**Dashboard / care companion:** reminders (add/edit/complete/delete) + notes; localStorage when signed out, Supabase tables with owner-only RLS when signed in; "delete all my data"; say plainly that **no notifications are sent**.
**Auth:** Supabase email+password and email link; runtime config via `/api/supabase-config` (not build-time env); middleware session refresh; server-side `requireRole()` using `auth.getUser()` + `profiles.role`; `/admin` & `/doctor-portal` `force-dynamic`, fail closed if the auth server is unreachable; roles never writable by clients; safe `next` redirect validation; POST-only sign-out; no account enumeration. SQL migration with RLS.
**i18n:** EN/हिन्दी/मराठी/ಕನ್ನಡ for nav, buttons, safety banner, hero. Missing keys fall back to English **with a visible notice**. Clinical text is never machine-translated and presented as reviewed.
**Safety copy everywhere:** emergency box on care/first-aid/assistant pages (112 is shown but flagged "to be verified against an official source"); persistent education-only banner.

## 7. 3D ASSET PIPELINE (licence-correct)
- **Source:** Z-Anatomy (`github.com/Z-Anatomy/Models-of-human-anatomy`, `Z-Anatomy.zip` → `Startup.blend`), **CC BY-SA 4.0**, derived from BodyParts3D (CC BY-SA 2.1 JP). Derivatives (GLBs, rendered images) must stay CC BY-SA 4.0 with attribution; add `/credits` page + `LICENSE.md` next to the models + visible caption under the viewer.
- **Exclude** non-commercial or unverified parts: inner ear (CC BY-NC-SA), kidney (CC BY-NC), "Brainder"/white-matter/neo-cortex (terms unverified). Record each exclusion in `manifest.json`.
- **Convert:** `pip install bpy` (Python 3.13 wheel; run python with `-I`, never name a file `inspect.py`) → script opens the blend, takes meshes from collections *Skeletal, Muscular, Cardiovascular, Nervous, Visceral*, skips zero-geometry helper objects and `.g` title meshes, applies modifiers, decimates to a per-system triangle budget (≈140k/160k/60k/120k/70k), exports one **GLB per system** (Y-up, flattened, no materials) + `manifest.json` (node, name, side, groups, bbox) → compress with `gltf-transform meshopt` (3.4 MB total) → load with drei `useGLTF(url, false, true)`.
- **Render the marketing images** with Blender Cycles (CPU is fine, ~2–4 min each): import the GLBs, assign tissue materials by name/group, hide fascia/iliotibial-tract sheets, 85 mm camera, four area lights, JPEG q90.
- **No-Blender fallback:** use a pre-made GLB/FBX human anatomy model with a clear commercial licence (check each file; CC0/CC-BY preferred), or build the viewer around a smaller licensed set of organs; **state limitations on the page** — never pass a mannequin off as a complete anatomical model.

## 8. NON-NEGOTIABLE RULES
Educational only. No diagnosis from photos/reports/text. No antibiotic/medicine/dose/cream recommendations. No fabricated doctors, reviews, stats, hotlines, or "AI analysis". Label every demo/stub/unconfigured feature. Server-side authorization (not hidden buttons). API keys never in client code. Don't collect unnecessary personal data. Log no medical content. Accessible (keyboard, focus rings, labels, contrast, `aria-live` for results, skip link). Responsive on phones → desktop with no horizontal scroll.

## 9. DELIVERABLES & ACCEPTANCE
Working repo; `README` with run steps; `.env.example`; `docs/` (ASSET_INVENTORY, CONTENT_REVIEW, INTEGRATIONS, AUTH); SQL migration; scripts for model export, optimisation, and image rendering.
Acceptance: `tsc` clean · production build passes · landing hero shows the photoreal render and the live viewer rotates · clicking a structure selects + focuses + shows panel · layer toggles lazy-load files · reduced-motion respected · every page reachable from nav/footer · unconfigured features say so · role-gated routes redirect anonymous/non-privileged users on the server · screenshots at 390px and 1440px show no overflow and readable contrast.
