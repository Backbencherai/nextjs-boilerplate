# Asset inventory — Swasth Setu

| Asset | Source | Licence | Used? | Notes |
|---|---|---|---|---|
| Anatomy atlas GLBs + `manifest.json` (`public/models/anatomy/`) | Z-Anatomy `Startup.blend`, commit `32ce380` — https://github.com/Z-Anatomy/Models-of-human-anatomy | **CC BY-SA 4.0** (derived from BodyParts3D, CC BY-SA 2.1 Japan) | **Yes** | Derivative files; must stay CC BY-SA 4.0 with attribution (see `public/models/anatomy/LICENSE.md`, `/credits`). Share-alike reach onto app code is an open question for counsel. |
| Inner-ear structures (in Z-Anatomy) | University of Dundee School of Medicine | CC BY-NC-SA 4.0 | **No — excluded** | Non-commercial. |
| Kidney structures (in Z-Anatomy) | Lissie Cowley | CC BY-NC 4.0 | **No — excluded** | Non-commercial. |
| Neo-cortex / white-matter meshes (in Z-Anatomy) | "Brainder" / University of Washington | Not verified | **No — excluded** | Re-include only after confirming terms. |
| Cranial-nerve content (in Z-Anatomy) | University of Dundee CAHID | CC BY 4.0 | Yes | Attribution given. |
| Z-Anatomy text definitions | Wikipedia-derived | CC BY-SA 3.0 | **No** | Not imported; needs review + attribution handling first. |
| Schematic fallback shapes (`lib/anatomy/structures.ts`) | Authored in this repo | Project code | Yes (fallback only) | Used if WebGL / atlas loading fails. |
| nqwrc/3d-anatomy | https://nqwrc.github.io/3d-anatomy/ | Not checked | No | Reference only. |
| Red Cross text and images | redcross.org / redcross.org.uk | Not checked; assume all rights reserved | No | Link only. |

## Regenerating the atlas
```bash
git clone --depth 1 https://github.com/Z-Anatomy/models-of-human-anatomy && cd models-of-human-anatomy && unzip Z-Anatomy.zip
python3 -m venv venv && venv/bin/pip install bpy        # ~400 MB; Python 3.13 wheel exists for bpy 5.x
venv/bin/python -I <repo>/scripts/anatomy/export_z_anatomy.py -- --blend Z-Anatomy/Startup.blend --out out
<repo>/scripts/anatomy/optimize.sh out <repo>/public/models/anatomy
```
Run Python with `-I` and never name a script `inspect.py` (it shadows the stdlib and crashes `bpy` at import).

## Result of the current export
| Layer file | Meshes | Triangles (web) | Size |
|---|---|---|---|
| skeletal | 277 | ~140k | 0.65 MB |
| muscular | 683 | ~163k | 1.0 MB |
| cardiovascular (heart + major vessels only) | 22 | ~60k | 0.29 MB |
| nervous (brain structures, cranial nerves, sense organs) | 187 | ~120k | 0.72 MB |
| visceral (digestive, respiratory, urinary*, reproductive, endocrine, other) | 71 | ~70k | 0.40 MB |

\*kidneys excluded. Exact counts and the excluded list are in `manifest.json`.

## Still missing
Skin/external surface, complete vessel network, peripheral nerves, kidneys, cortical surface, white matter, and reviewed text for almost every structure.
