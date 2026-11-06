"""Bhavan's Multiplayer cast — KayKit Adventurers (CC0, Kay Lousberg) trimmed for the web.
Keeps costume pieces (hats, hoods, capes), removes weapons/props, keeps everyday + battle animations.
Usage: python make_cast.py -- <source.glb> <out.glb> [texture.png]"""
import bpy, sys
args = sys.argv[sys.argv.index("--") + 1:]
src, out = args[0], args[1]
tex = args[2] if len(args) > 2 else None
plain = len(args) > 3 and args[3] == "plain"
KEEP = {"Idle", "Walking_A", "Running_A", "Cheer", "Interact", "Sit_Floor_Idle", "Unarmed_Idle", "Use_Item", "1H_Melee_Attack_Chop", "Hit_A", "Jump_Full_Short"}
DROP = ("Knife", "Crossbow", "Throwable", "Spellbook", "Wand", "Staff", "Axe", "Sword", "Shield", "Mug", "Arrow", "Quiver", "Smoke", "Dagger")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if (plain and ("Hat" in o.name or "Cape" in o.name)) or any(d.lower() in o.name.lower() for d in DROP) or o.name.startswith("1H_") or o.name.startswith("2H_"):
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    if a.name.split("|")[-1] not in KEEP:
        bpy.data.actions.remove(a)
if tex:
    img = bpy.data.images.load(tex); img.pack()
    for m in bpy.data.materials:
        if m.node_tree:
            for n in m.node_tree.nodes:
                if n.type == "TEX_IMAGE":
                    n.image = img
for o in bpy.data.objects:
    if o.animation_data:
        o.animation_data.action = None
        for t in list(o.animation_data.nla_tracks):
            o.animation_data.nla_tracks.remove(t)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_animations=True, export_animation_mode="ACTIONS", export_yup=True)
print("CAST", out, len(bpy.data.actions), [o.name for o in bpy.data.objects if o.type == "MESH"])
