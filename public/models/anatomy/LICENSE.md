# Anatomy model files — licence and attribution

The `.glb` files and `manifest.json` in this folder are **derivative works** of the Z-Anatomy project and are
distributed under the **Creative Commons Attribution-ShareAlike 4.0 International** licence (CC BY-SA 4.0):
https://creativecommons.org/licenses/by-sa/4.0/

## Attribution
- **Z-Anatomy – The libre 3D atlas of anatomy – CC BY-SA 4.0** — https://www.z-anatomy.com/ ,
  https://github.com/Z-Anatomy/Models-of-human-anatomy (authors: Gauthier Kervyn, Marcin Zielinski and contributors)
- **BodyParts3D – The Database Center for Life Science – CC BY-SA 2.1 Japan** — original model by Kousaku Okubo et al.
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Cranial-nerve content adapted by Z-Anatomy from "Cranial Nerves and Foramina", University of Dundee CAHID (CC BY 4.0).

## Changes made by Swasth Setu
- Exported from `Startup.blend` (source commit 32ce380) to glTF with modifiers applied.
- Meshes decimated to a web triangle budget per system; compressed with meshopt; materials removed.
- Helper/label objects removed.
- **Removed for licence reasons:** inner-ear structures and kidney structures (the upstream README marks their sources
  CC BY-NC(-SA) / CC BY-NC, i.e. not commercial-use compatible), and meshes in "Neo-cortex" / "White matter"
  collections (Brainder / University of Washington; reuse terms not verified). `manifest.json` → `excluded` lists each one.

Regenerate with `scripts/anatomy/export_z_anatomy.py` and `scripts/anatomy/optimize.sh`.
No endorsement by the original authors is implied.
