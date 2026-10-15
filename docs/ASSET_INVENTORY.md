# Asset inventory — Swasth Setu

| Asset | Source | Licence | Used? | Notes |
|---|---|---|---|---|
| Schematic body shapes (`lib/anatomy/structures.ts`) | Authored in this repo from three.js primitives | Project code | Yes | Not anatomically accurate. Demonstration only. |
| Z-Anatomy models | https://github.com/Z-Anatomy/Models-of-human-anatomy | **Not yet checked** by this project (network was blocked when building). Z-Anatomy is publicly described as CC BY-SA, derived from BodyParts3D — share-alike and attribution obligations must be confirmed before use. | **No** | Roadmap item. Confirm licence for every file, comply with attribution/share-alike, and keep a per-mesh record here. |
| nqwrc/3d-anatomy | https://nqwrc.github.io/3d-anatomy/ | Not checked | No | Reference only. |
| Red Cross first-aid text and images | redcross.org / redcross.org.uk | Not checked; assume all rights reserved | No | Link only. Do not copy text or illustrations without written permission. |

## Roadmap for real anatomy
1. Confirm licence terms for each Z-Anatomy file (including share-alike effect on derivatives).
2. Convert to glTF/GLB, split by system, compress with Draco/Meshopt, lazy-load per layer.
3. Map mesh names to `Structure` records and have a clinician review all descriptions.
4. Add layers only for systems actually present in the loaded files.
