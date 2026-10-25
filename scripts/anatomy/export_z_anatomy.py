"""
Z-Anatomy (Blender) -> per-system glTF/GLB + manifest.json

Run with a Python that has the `bpy` module installed (pip install bpy):

    python -I scripts/anatomy/export_z_anatomy.py -- \
        --blend /path/to/Z-Anatomy/Startup.blend \
        --out public/models/anatomy \
        [--dry-run]

Source: https://github.com/Z-Anatomy/Models-of-human-anatomy (Z-Anatomy.zip -> Startup.blend)
Licence of the source: CC BY-SA 4.0. Everything this script writes is a DERIVATIVE WORK and must be
redistributed under CC BY-SA 4.0 with attribution (see public/models/anatomy/LICENSE.md).

Licence-driven exclusions (see EXCLUDE_*): Z-Anatomy's own README lists adapted third-party parts under
CC BY-NC(-SA) (inner ear, kidney) which are NOT usable in a commercial product, and Brainder / white-matter
meshes whose reuse terms we could not confirm. They are dropped and recorded in the manifest.

Compression: the pip `bpy` build has no Draco; run scripts/anatomy/optimize.sh afterwards (meshopt).

Do not name this file inspect.py / io.py etc. next to bpy: stdlib shadowing crashes bpy at import.
"""
import argparse
import json
import re
import sys
import time

import bpy
from mathutils import Vector

# system id -> (top-level Blender collection, triangle budget for the web build)
SYSTEMS = {
    "skeletal": ("1: Skeletal system", 140_000),
    "muscular": ("4: Muscular system", 160_000),
    "cardiovascular": ("5: Cardiovascular system", 60_000),
    "nervous": ("7: Nervous system & Sense organs", 120_000),
    "visceral": ("8: Visceral systems", 70_000),
}

# --- licence exclusions -------------------------------------------------------------------------
# CC BY-NC-SA "Anatomy of the Inner Ear" (University of Dundee) and CC BY-NC "Kidney" (Lissie Cowley)
EXCLUDE_NAME = re.compile(
    r"cochlea|semicircular|vestibul|labyrinth|utricle|saccule|ampulla|endolymph|perilymph|"
    r"kidney|renal|nephr|calyx|calices",
    re.I,
)
# "Brainder" and "White matter" (University of Washington): terms not verified -> excluded until confirmed.
EXCLUDE_COLLECTION = re.compile(r"neo-cortex|white matter", re.I)
# ---------------------------------------------------------------------------------------------

MIN_TRIS = 48  # never decimate a structure below this, so small bones stay recognisable


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--blend", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args(argv)


def walk(col):
    yield from col.objects
    for ch in col.children:
        yield from walk(ch)


def tri_count(mesh):
    return sum(len(p.vertices) - 2 for p in mesh.polygons)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def display(name):
    n = re.sub(r"\.(l|r)$", "", name.strip())
    return n.strip("()[]")


def main():
    a = parse_args()
    t0 = time.time()
    bpy.ops.wm.open_mainfile(filepath=a.blend)
    dg = bpy.context.evaluated_depsgraph_get()

    manifest = {
        "source": "https://github.com/Z-Anatomy/Models-of-human-anatomy",
        "source_licence": "CC BY-SA 4.0",
        "derived_from": "BodyParts3D (CC BY-SA 2.1 Japan) via Z-Anatomy",
        "systems": {},
        "excluded": [],
    }
    chosen = {}
    seen = set()

    for sid, (cname, budget) in SYSTEMS.items():
        items = []
        for o in walk(bpy.data.collections[cname]):
            if o.type != "MESH" or o.name in seen:
                continue
            if o.name.endswith(".g"):
                continue  # "<System> system.g" is the 3D title text object, not anatomy
            groups = [c.name for c in o.users_collection]
            reason = None
            if EXCLUDE_NAME.search(o.name):
                reason = "non-commercial licence (inner ear / kidney source)"
            elif any(EXCLUDE_COLLECTION.search(g) for g in groups):
                reason = "reuse terms unverified (Brainder / white matter)"
            ev = o.evaluated_get(dg)
            tris = tri_count(ev.data)
            if tris == 0:
                continue  # label-anchor helper objects (.i/.j/.g) carry no geometry
            seen.add(o.name)
            if reason:
                manifest["excluded"].append({"name": o.name, "system": sid, "reason": reason, "tris": tris})
                continue
            items.append((o, tris, groups))
        total = sum(t for _, t, _ in items)
        chosen[sid] = (items, total, budget)
        print(f"[{sid}] objects={len(items)} tris={total} budget={budget}")

    if a.dry_run:
        print("excluded:", len(manifest["excluded"]), sum(e["tris"] for e in manifest["excluded"]), "tris")
        print("elapsed", round(time.time() - t0))
        return

    import os
    os.makedirs(a.out, exist_ok=True)

    for sid, (items, total, budget) in chosen.items():
        sys_ratio = min(1.0, budget / max(total, 1))
        for ob in bpy.data.objects:  # select_all() needs a UI context; do it explicitly
            ob.select_set(False)
        nodes, exported_tris = [], 0
        smin, smax = [1e9] * 3, [-1e9] * 3
        for o, tris, groups in items:
            ratio = min(1.0, max(sys_ratio, MIN_TRIS / tris))
            if ratio < 0.999:
                m = o.modifiers.new("web_decimate", "DECIMATE")
                m.decimate_type = "COLLAPSE"
                m.ratio = ratio
            o.select_set(True)
            # world-space bounds converted from Blender (Z-up) to glTF (Y-up): (x, y, z) -> (x, z, -y)
            pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
            gp = [(q.x, q.z, -q.y) for q in pts]
            omin = [min(g[i] for g in gp) for i in range(3)]
            omax = [max(g[i] for g in gp) for i in range(3)]
            smin = [min(smin[i], omin[i]) for i in range(3)]
            smax = [max(smax[i], omax[i]) for i in range(3)]
            exported_tris += int(tris * ratio)
            nodes.append({
                "node": o.name,
                "id": slug(o.name),
                "name": display(o.name),
                "side": "left" if o.name.endswith(".l") else "right" if o.name.endswith(".r") else None,
                "system": sid,
                "groups": [g for g in groups if g not in (SYSTEMS[sid][0],)],
                "tris_source": tris,
                "bbox": [[round(v, 4) for v in omin], [round(v, 4) for v in omax]],
                "ratio": round(ratio, 3),
            })
        path = os.path.join(a.out, f"{sid}.glb")
        opts = dict(
            filepath=path, export_format="GLB", use_selection=True, export_apply=True,
            export_materials="NONE", export_cameras=False, export_lights=False, export_extras=False,
            export_yup=True, export_texcoords=False, export_normals=True,
            export_hierarchy_flatten_objs=True,
        )
        bpy.ops.export_scene.gltf(**opts)
        size = os.path.getsize(path)
        manifest["systems"][sid] = {"file": f"{sid}.glb", "bytes": size, "objects": len(nodes),
                                    "tris_source": total, "tris_exported_approx": exported_tris, "bbox": [[round(v, 4) for v in smin], [round(v, 4) for v in smax]], "nodes": nodes}
        print(f"[{sid}] wrote {path} {size/1e6:.1f} MB ~{exported_tris} tris")

    with open(os.path.join(a.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    print("done in", round(time.time() - t0), "s")


main()
