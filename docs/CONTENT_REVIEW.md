# Content review status

- **First aid** (`lib/content/firstAid.ts`): all modules `pending-verification`, with no steps. The Red Cross pages could not be fetched during the build, so nothing was written from memory. To publish a module: read the cited source, write steps in your own words, record the review date, have an Indian clinician review, then set `status: "published"`.
- **Medicines** (`lib/content/medicines.ts`): empty. Each entry needs source URLs and a review date.
- **Anatomy descriptions**: draft, unreviewed.
- **Translations** (hi/mr/kn): interface-text drafts, no professional review. Clinical content is not translated.
- **Emergency numbers**: 112 is shown; verify against an official source and any state-specific numbers before launch.
