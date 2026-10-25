"""
Photoreal-ish studio renders of the Swasth Setu anatomy atlas (Blender Cycles, CPU, offline).

    python -I scripts/render/render_atlas_images.py -- --glb-dir <export dir with *.glb + manifest.json> \
        --out public/images/atlas [--scale 1.0] [--samples 64] [--only hero,atlas]

Input is the licence-filtered Z-Anatomy export (see scripts/anatomy). The images are DERIVATIVES of Z-Anatomy /
BodyParts3D and therefore CC BY-SA 4.0 (attribute + share alike), same as the .glb files.
Run python with -I; never name a script inspect.py next to bpy.
"""
import argparse, json, math, os, re, sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--glb-dir", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--scale", type=float, default=1.0); ap.add_argument("--samples", type=int, default=64)
ap.add_argument("--only", default="")
a = ap.parse_args(argv)
manifest = json.load(open(os.path.join(a.glb_dir, "manifest.json"), encoding="utf-8"))
node_info = {n["node"]: n for s in manifest["systems"].values() for n in s["nodes"]}

bpy.ops.wm.read_factory_settings(use_empty=True)  # must run before any datablock is created
# ------------------------------------------------------------------ materials
def mat(name, color, rough=0.5, sss=0.0, sss_radius=(1.0, 0.3, 0.2), coat=0.0, sheen=0.0, spec=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    def put(keys, val):
        for k in keys:
            if k in b.inputs: b.inputs[k].default_value = val; return
    put(["Base Color"], (*color, 1)); put(["Roughness"], rough)
    put(["Subsurface Weight", "Subsurface"], sss); put(["Subsurface Radius"], sss_radius); put(["Subsurface Scale"], 0.02)
    put(["Coat Weight", "Clearcoat"], coat); put(["Coat Roughness", "Clearcoat Roughness"], 0.12)
    put(["Sheen Weight", "Sheen"], sheen); put(["Specular IOR Level", "Specular"], spec)
    return m

M = {
    "bone": mat("bone", (0.80, 0.72, 0.58), 0.48, 0.15, (0.9, 0.7, 0.5), spec=0.45),
    "enamel": mat("enamel", (0.92, 0.90, 0.84), 0.25, 0.1, coat=0.3),
    "cartilage": mat("cartilage", (0.70, 0.78, 0.80), 0.35, 0.25, (0.6, 0.8, 0.9), coat=0.2),
    "muscle": mat("muscle", (0.36, 0.045, 0.04), 0.38, 0.45, (1.0, 0.2, 0.12), coat=0.25, sheen=0.4),
    "tendon": mat("tendon", (0.82, 0.74, 0.62), 0.32, 0.2, coat=0.35),
    "heart": mat("heart", (0.42, 0.04, 0.05), 0.35, 0.4, (1.0, 0.25, 0.15), coat=0.5),
    "artery": mat("artery", (0.65, 0.05, 0.05), 0.3, 0.2, coat=0.6),
    "vein": mat("vein", (0.14, 0.12, 0.38), 0.3, 0.2, coat=0.6),
    "brain": mat("brain", (0.72, 0.52, 0.50), 0.45, 0.5, (0.9, 0.5, 0.4), coat=0.35),
    "nerve": mat("nerve", (0.88, 0.80, 0.45), 0.35, 0.3, coat=0.4),
    "eye": mat("eye", (0.93, 0.91, 0.88), 0.15, 0.1, coat=0.8),
    "liver": mat("liver", (0.24, 0.05, 0.03), 0.3, 0.35, (1.0, 0.2, 0.1), coat=0.55),
    "lung": mat("lung", (0.80, 0.42, 0.48), 0.5, 0.5, (1.0, 0.4, 0.4), coat=0.15, sheen=0.3),
    "gut": mat("gut", (0.78, 0.40, 0.34), 0.35, 0.45, (1.0, 0.3, 0.2), coat=0.5),
    "spleen": mat("spleen", (0.27, 0.07, 0.15), 0.35, 0.3, coat=0.4),
    "gall": mat("gall", (0.15, 0.30, 0.10), 0.3, 0.2, coat=0.6),
    "pancreas": mat("pancreas", (0.78, 0.60, 0.40), 0.5, 0.3),
    "organ": mat("organ", (0.74, 0.42, 0.40), 0.4, 0.4, (1.0, 0.3, 0.2), coat=0.35),
}

def pick(info, sysname):
    n = info["name"].lower(); g = " ".join(info["groups"]).lower()
    if sysname == "skeletal":
        if re.search(r"tooth|teeth|incisor|molar|canine|premolar", n): return "enamel"
        if "cartilage" in n or "cartilage" in g or "disc" in n: return "cartilage"
        return "bone"
    if sysname == "muscular":
        return "tendon" if re.search(r"tendon|aponeuro|fascia|ligament|retinaculum|tendinous|raphe|sheath", n) else "muscle"
    if sysname == "cardiovascular":
        if re.search(r"vein|vena|sinus", n) or "veins" in g: return "vein"
        if "heart" in g or re.search(r"atrium|ventricle|heart|auricle|septum|valve", n): return "heart"
        return "artery"
    if sysname == "nervous":
        if re.search(r"eye|sclera|cornea|lens|iris", n): return "eye"
        if "nerve" in n or "nerve" in g or "ganglion" in n: return "nerve"
        return "brain"
    # visceral
    if "liver" in n or "liver" in g: return "liver"
    if re.search(r"lung|bronch|trachea|lobe", n) or "lungs" in g or "bronchi" in g or "respiratory" in g: return "lung"
    if re.search(r"spleen", n): return "spleen"
    if re.search(r"gallbladder|bile|cystic", n): return "gall"
    if re.search(r"pancrea", n): return "pancreas"
    if re.search(r"stomach|intestin|colon|duoden|jejun|ileum|caecum|rectum|oesophag|esophag|anal|appendix|gaster|digestive", n + " " + g): return "gut"
    return "organ"

# ------------------------------------------------------------------ scene
bysys = {}
for sysname in ["skeletal", "muscular", "cardiovascular", "nervous", "visceral"]:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(a.glb_dir, f"{sysname}.glb"))
    objs = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    for o in objs:
        info = node_info.get(o.name) or node_info.get(re.sub(r"\.\d{3}$", "", o.name)) or {"name": o.name, "groups": []}
        o.data.materials.clear(); o.data.materials.append(M[pick(info, sysname)])
        o.data.polygons.foreach_set("use_smooth", [True] * len(o.data.polygons))
        o["system"] = sysname
        # Fascia / iliotibial-tract sheets wrap whole limbs and hide the muscles underneath: keep them out of renders.
        o["shell"] = bool(sysname == "muscular" and re.search(r"\bfascia\b|iliotibial tract|investing", info["name"].lower()))
    bysys[sysname] = objs
    print(sysname, len(objs), "objects")

def bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))

sc = bpy.context.scene
sc.render.engine = "CYCLES"; cy = sc.cycles
cy.device = "CPU"; cy.samples = a.samples; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.02
cy.use_denoising = True; cy.denoiser = "OPENIMAGEDENOISE"; cy.max_bounces = 6; cy.transmission_bounces = 4
sc.view_settings.view_transform = "AgX" if "AgX" in [t.identifier for t in sc.view_settings.bl_rna.properties["view_transform"].enum_items] else "Filmic"
sc.render.image_settings.file_format = "JPEG"; sc.render.image_settings.quality = 90
sc.render.threads = 4

world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = (0.008, 0.016, 0.017, 1); bg.inputs["Strength"].default_value = 1.0

def light(kind, loc, target, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new("l", kind); d.energy = energy; d.color = color
    if kind == "AREA": d.size = size
    o = bpy.data.objects.new("l", d); sc.collection.objects.link(o); o.location = loc
    t = (Vector(target) - Vector(loc)); o.rotation_euler = t.to_track_quat("-Z", "Y").to_euler(); return o

floor = None
def shoot(name, systems, w, h, az_deg, elev_deg, fov_mm, frame_objs=None, margin=1.15, target_shift=(0, 0, 0)):
    for s, objs in bysys.items():
        for o in objs: o.hide_render = (s not in systems) or bool(o.get('shell')); o.hide_viewport = o.hide_render
    vis = [o for s in systems for o in bysys[s] if not o.get('shell')] if frame_objs is None else frame_objs
    lo, hi = bbox(vis); c = (lo + hi) / 2 + Vector(target_shift); size = hi - lo
    sc.render.resolution_x = int(w * a.scale); sc.render.resolution_y = int(h * a.scale)
    cam_d = bpy.data.cameras.new("c"); cam_d.lens = fov_mm; cam_d.sensor_width = 36; cam_d.sensor_fit = 'HORIZONTAL'
    cam = bpy.data.objects.new("c", cam_d); sc.collection.objects.link(cam); sc.camera = cam
    # distance so the larger of (height, width-scaled) fits
    sensor_h = cam_d.sensor_width * h / w
    need_h = size.z * margin; need_w = max(size.x, size.y) * margin * (h / w)
    dist = fov_mm * max(need_h, need_w) / sensor_h
    az, el = math.radians(az_deg), math.radians(elev_deg)
    cam.location = c + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * dist
    cam.rotation_euler = (c - cam.location).to_track_quat("-Z", "Y").to_euler()
    # lights relative to the subject
    for o in [x for x in bpy.data.objects if x.type == "LIGHT"]: bpy.data.objects.remove(o)
    r = max(size) * 1.2
    right = Vector((math.cos(az), math.sin(az), 0))
    light("AREA", c + right * -r + Vector((0, -r, r * 0.9)), c, 120 * (r / 2) ** 2, r * 1.2, (1.0, 0.96, 0.92))      # key
    light("AREA", c + right * r * 1.1 + Vector((0, r * 0.6, r * 0.5)), c, 160 * (r / 2) ** 2, r, (0.35, 0.85, 0.8))       # teal rim
    light("AREA", c + Vector((0, r * 1.3, r * 0.2)), c, 100 * (r / 2) ** 2, r * 1.4, (0.5, 0.65, 1.0))                     # cool back
    light("AREA", c + right * r * 0.4 + Vector((0, -r * 1.2, -r * 0.2)), c, 40 * (r / 2) ** 2, r * 1.6, (1.0, 0.9, 0.85))   # soft fill
    path = os.path.join(a.out, name + ".jpg"); sc.render.filepath = path
    print("render", name, sc.render.resolution_x, "x", sc.render.resolution_y); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)

os.makedirs(a.out, exist_ok=True)
only = set(filter(None, a.only.split(",")))
def want(k): return not only or k in only

def sub(sysname, rx):  # objects of a system whose manifest name/groups match
    out = []
    for o in bysys[sysname]:
        info = node_info.get(o.name) or node_info.get(re.sub(r"\.\d{3}$", "", o.name)) or {"name": o.name, "groups": []}
        if re.search(rx, (info["name"] + " " + " ".join(info["groups"])).lower()): out.append(o)
    return out

if want("hero"):  shoot("hero-ecorche", ["skeletal", "muscular"], 1000, 1400, 18, 4, 85)
if want("atlas"): shoot("atlas-skeleton-organs", ["skeletal", "visceral", "cardiovascular"], 1000, 1250, 0, 3, 85)
if want("heart"):
    shoot("atlas-heart", ["visceral", "cardiovascular"], 1200, 900, 14, 4, 85,
          frame_objs=sub("cardiovascular", "heart") + sub("visceral", "lung|bronch"), margin=1.15)
if want("skull"):
    top = bbox(bysys["skeletal"])[1].z
    head = [o for o in bysys["skeletal"] if bbox([o])[0].z > top - 0.34 and abs(bbox([o])[0].x) < 0.2]
    shoot("atlas-skull", ["skeletal"], 1200, 900, 32, 6, 85, frame_objs=head, margin=1.2)
print("done")
