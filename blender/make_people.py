"""
Adarsh & Dewanshi from KayKit's CC0 Adventurers pack (Kay Lousberg, kaylousberg.com).
Removes fantasy props (hat, cape, weapons, books), keeps a small set of everyday
animations, swaps in the recoloured palette texture and exports a web-ready GLB.
Usage: python make_people.py -- <source.glb> <texture.png> <out.glb>
"""
import bpy, sys
src, tex, out = sys.argv[-3:]
KEEP_ANIMS = {"Idle", "Walking_A", "Running_A", "Cheer", "Jump_Full_Short", "Interact", "Sit_Floor_Idle", "PickUp", "Use_Item", "Unarmed_Idle"}
DROP = ("Hat", "Cape", "Spellbook", "Wand", "Staff", "Knife", "Crossbow", "Throwable", "Spellbook_open")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if any(d in o.name for d in DROP):
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    base = a.name.split("|")[-1] if "|" in a.name else a.name
    if base not in KEEP_ANIMS:
        bpy.data.actions.remove(a)
img = bpy.data.images.load(tex)
img.pack()
for m in bpy.data.materials:
    if not m.node_tree:
        continue
    for n in m.node_tree.nodes:
        if n.type == "TEX_IMAGE":
            n.image = img
            n.interpolation = "Closest"
# NLA strips from the importer reference removed actions; clear and let the exporter gather actions
for o in bpy.data.objects:
    if o.animation_data:
        o.animation_data.action = None
        for t in list(o.animation_data.nla_tracks):
            o.animation_data.nla_tracks.remove(t)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_animations=True, export_animation_mode="ACTIONS", export_yup=True, export_image_format="AUTO")
print("PEOPLE", out, sorted(a.name for a in bpy.data.actions), [o.name for o in bpy.data.objects])
