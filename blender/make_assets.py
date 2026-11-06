"""
A×D Universe — procedural asset build in Blender (bpy).
Produces one GLB with named, rig-ready parts:
  A_/D_ Body, Head, Eyes, ArmL, ArmR, LegL, LegR    (origins at the joints)
  Island_A, Island_B                                  (unit radius, flat walkable top at y=0)
  Tree_Round, Tree_Pine, Tree_Blossom, Bush, Rock_A, Rock_B, Cloud, Sprout
Blender is Z-up / faces -Y; the glTF exporter converts to Y-up / faces +Z.
"""
import bpy, bmesh, math, random, sys
from mathutils import Vector, noise

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "axd.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(7)


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


MATS = {}


def mat(name, hexc, rough=0.7):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*lin(hexc), 1)
    b.inputs["Roughness"].default_value = rough
    MATS[name] = m
    return m


def link(o):
    bpy.context.collection.objects.link(o)
    return o


def mesh_obj(name, bm, material=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o)
    if material:
        o.data.materials.append(material)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def sphere(r=1, seg=24, rings=16, loc=(0, 0, 0), scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * scale[0] + loc[0], v.co.y * scale[1] + loc[1], v.co.z * scale[2] + loc[2]))
    return bm


def capsule(r, length, seg=20, rings=14, loc=(0, 0, 0), taper=0.0):
    """Vertical capsule centred at loc. taper>0 makes the bottom wider (pear)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        s = 1.0
        if taper:
            s = 1 + taper * (-v.co.z / r) * 0.5
        v.co.x *= s
        v.co.y *= s
        v.co.z += length / 2 if v.co.z > 0 else -length / 2
        v.co += Vector(loc)
    return bm


def rounded_box(size, radius, loc=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bmesh.ops.bevel(bm, geom=list(bm.verts) + list(bm.edges), offset=radius, segments=4, affect="EDGES", profile=0.5)
    for v in bm.verts:
        v.co += Vector(loc)
    return bm


def torus(R, r, loc=(0, 0, 0), seg=28, ring=10, rot_x=0):
    bm = bmesh.new()
    for i in range(seg):
        for j in range(ring):
            pass
    me = bpy.data.meshes.new("t")
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=ring, location=loc, rotation=(rot_x, 0, 0))
    o = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.transform(bm, matrix=o.matrix_world, verts=bm.verts)
    bpy.data.objects.remove(o)
    return bm


def merge(parts, name, origin=(0, 0, 0), keep=False):
    """parts: list of (bmesh, material). Joins into one object with material slots, origin at `origin`."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    slots = []
    for pbm, m in parts:
        if m not in slots:
            slots.append(m)
        idx = slots.index(m)
        tmp = bpy.data.meshes.new("tmp")
        pbm.to_mesh(tmp)
        pbm.free()
        for p in tmp.polygons:
            p.material_index = idx
        bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
    for v in bm.verts:
        v.co -= Vector(origin)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o)
    for m in slots:
        o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    o.location = origin
    if keep:
        o["keep"] = True
    return o


# ───────────────────────── materials ─────────────────────────
SKIN = mat("skin", "#f6e1cf", 0.6)
INKM = mat("ink", "#14140f", 0.3)
CHEEK = mat("cheek", "#f3a3a0", 0.8)
PANTS = mat("pants", "#8b8980", 0.8)
SHOE = mat("shoe", "#ffffff", 0.5)
HAIR = mat("hair", "#1d1c18", 0.55)
GOLD = mat("gold", "#f2c31a", 0.5)
SHIRT = {"A": mat("shirt_A", "#2b5a9b", 0.7), "D": mat("shirt_D", "#c0342a", 0.7)}
WHITE = mat("white", "#ffffff", 0.6)
GRASS = mat("grass", "#b5d68a", 0.9)
SOIL = mat("soil", "#a9805e", 0.9)
ROCK = mat("rock", "#9c968c", 0.9)
BARK = mat("bark", "#8a6a50", 0.9)
LEAF = mat("leaf", "#9cc77a", 0.8)
PINE = mat("pine", "#7fb27a", 0.8)
BLOSSOM = mat("blossom", "#f6b8c4", 0.8)
CLOUD = mat("cloud", "#ffffff", 1.0)

# ───────────────────────── characters ─────────────────────────
# three.js layout (y up, +z forward):  hips y=.48, body centre .78, shoulders y=.98 x=±.3, head .31 above
# Blender: z = three.y, y = -three.z


def character(P):
    shirt = SHIRT[P]
    # Body: pear capsule + accessory
    parts = [(capsule(0.235, 0.26, loc=(0, 0, 0.79), taper=0.18), shirt)]
    # little hips in pants colour
    parts.append((sphere(0.2, loc=(0, 0, 0.57), scale=(1.12, 1.0, 0.55)), PANTS))
    if P == "A":
        parts.append((rounded_box((0.3, 0.14, 0.34), 0.05, loc=(0, 0.25, 0.83)), GOLD))  # backpack
        parts.append((rounded_box((0.06, 0.03, 0.34), 0.012, loc=(-0.11, -0.2, 0.86)), GOLD))  # strap
        parts.append((rounded_box((0.06, 0.03, 0.34), 0.012, loc=(0.11, -0.2, 0.86)), GOLD))
    else:
        parts.append((torus(0.175, 0.055, loc=(0, 0, 1.03)), GOLD))  # scarf
        parts.append((capsule(0.045, 0.12, loc=(0.09, -0.21, 0.93)), GOLD))  # scarf tail
    merge(parts, f"{P}_Body", origin=(0, 0, 0), keep=True)

    # Head (+ hair) — origin at head centre
    hc = (0, 0, 1.31)
    hp = [(sphere(0.275, 32, 22, loc=hc, scale=(1.04, 1.0, 0.97)), SKIN)]
    hp.append((sphere(0.042, 12, 8, loc=(-0.16, -0.235, 1.25), scale=(1, 0.4, 0.75)), CHEEK))
    hp.append((sphere(0.042, 12, 8, loc=(0.16, -0.235, 1.25), scale=(1, 0.4, 0.75)), CHEEK))
    # tiny smile
    sm = torus(0.045, 0.009, loc=(0, -0.262, 1.24), seg=16, ring=6, rot_x=math.pi / 2)
    for v in list(sm.verts):
        if v.co.z > 1.24:
            sm.verts.remove(v)
    hp.append((sm, INKM))
    # hair cap: sphere slightly bigger, keep top/back
    cap = sphere(0.295, 32, 22, loc=hc, scale=(1.05, 1.03, 1.0))
    drop = [v for v in cap.verts if (v.co.z - hc[2]) < (0.02 if v.co.y < -0.05 else -0.16)]
    bmesh.ops.delete(cap, geom=drop, context="VERTS")
    hp.append((cap, HAIR))
    if P == "A":
        # swoopy fringe tufts
        for i, (x, rz) in enumerate([(-0.1, 0.5), (0.04, 0.2), (0.15, -0.2)]):
            t = sphere(0.11, 14, 10, loc=(x, -0.18, 1.5 - i * 0.015), scale=(1.1, 0.7, 0.55))
            hp.append((t, HAIR))
    else:
        hp.append((sphere(0.14, 18, 12, loc=(0, 0.17, 1.58)), HAIR))  # bun
        hp.append((capsule(0.2, 0.18, loc=(0, 0.14, 1.18)), HAIR))  # back hair
        hp.append((sphere(0.06, 12, 8, loc=(0.21, -0.14, 1.5)), GOLD))  # flower
        for k in range(5):
            a = k / 5 * math.tau
            hp.append((sphere(0.035, 8, 6, loc=(0.21 + math.cos(a) * 0.05, -0.16, 1.5 + math.sin(a) * 0.05)), WHITE))
    merge(hp, f"{P}_Head", origin=hc, keep=True)

    # Eyes (separate so they can blink)
    ec = (0, -0.25, 1.33)
    eyes = [(sphere(0.038, 14, 10, loc=(-0.092, -0.25, 1.33), scale=(1, 0.6, 1.25)), INKM), (sphere(0.038, 14, 10, loc=(0.092, -0.25, 1.33), scale=(1, 0.6, 1.25)), INKM)]
    eyes.append((sphere(0.012, 8, 6, loc=(-0.08, -0.272, 1.35)), WHITE))
    eyes.append((sphere(0.012, 8, 6, loc=(0.104, -0.272, 1.35)), WHITE))
    merge(eyes, f"{P}_Eyes", origin=ec, keep=True)

    # Arms — origin at shoulder
    for side, x in (("L", -0.3), ("R", 0.3)):
        sh = (x, 0, 0.98)
        arm = [(capsule(0.068, 0.22, loc=(x * 1.03, 0, 0.8)), shirt), (sphere(0.075, 14, 10, loc=(x * 1.05, -0.01, 0.62)), SKIN)]
        merge(arm, f"{P}_Arm{side}", origin=sh, keep=True)
    # Legs — origin at hip
    for side, x in (("L", -0.11), ("R", 0.11)):
        hip = (x, 0, 0.48)
        leg = [(capsule(0.088, 0.24, loc=(x, 0, 0.28)), PANTS), (rounded_box((0.17, 0.26, 0.1), 0.045, loc=(x, -0.045, 0.05)), SHOE)]
        merge(leg, f"{P}_Leg{side}", origin=hip)


character("A")
character("D")

# ───────────────────────── islands ─────────────────────────


def island(name, seed):
    random.seed(seed)
    off = Vector((seed * 3.1, seed * 1.7, 0.3))
    n = 72
    # top disc with wobbly rim, flat at z=0
    bm = bmesh.new()
    rim_top, rim_lip = [], []
    for i in range(n):
        a = i / n * math.tau
        r = 1 + 0.025 * noise.noise(Vector((math.cos(a) * 2, math.sin(a) * 2, 0)) + off)
        rim_top.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, 0)))
    centre = bm.verts.new((0, 0, 0))
    for i in range(n):
        bm.faces.new((centre, rim_top[i], rim_top[(i + 1) % n]))
    # inset ring for a softer grass edge
    rings = [rim_top]
    for depth, scale in ((-0.035, 1.0), (-0.07, 0.985)):
        ring = [bm.verts.new((v.co.x * scale, v.co.y * scale, depth)) for v in rim_top]
        prev = rings[-1]
        for i in range(n):
            bm.faces.new((prev[i], ring[i], ring[(i + 1) % n], prev[(i + 1) % n]))
        rings.append(ring)
    rim = [v.co.copy() for v in rim_top]
    grass = mesh_obj(name + "_g", bm, GRASS)

    # soil band
    bm = bmesh.new()
    ringA = [bm.verts.new((c.x * 0.985, c.y * 0.985, -0.07)) for c in rim]
    ringB = []
    for i, c in enumerate(rim):
        w = 0.96 + 0.02 * noise.noise(c * 3 + off)
        ringB.append(bm.verts.new((c.x * w, c.y * w, -0.17 + 0.03 * noise.noise(c * 4 + off))))
    for i in range(n):
        bm.faces.new((ringA[i], ringB[i], ringB[(i + 1) % n], ringA[(i + 1) % n]))
    ringB_coords = [v.co.copy() for v in ringB]
    soil = mesh_obj(name + "_s", bm, SOIL)

    # rocky underside: displaced cone
    bm = bmesh.new()
    levels = 9
    vrings = [[bm.verts.new(c) for c in ringB_coords]]
    for L in range(1, levels + 1):
        t = L / levels
        rad = (1 - t) ** 1.25 * 0.96
        z = -0.17 - t * 1.15
        ring = []
        for i in range(n):
            a = i / n * math.tau
            p = Vector((math.cos(a), math.sin(a), 0))
            d = 1 + 0.22 * noise.noise(p * 2.2 + Vector((0, 0, z * 2.5)) + off) + 0.08 * noise.noise(p * 6 + Vector((0, 0, z * 7)) + off)
            ring.append(bm.verts.new((p.x * rad * d, p.y * rad * d, z + 0.05 * noise.noise(p * 5 + off))))
        vrings.append(ring)
    tip = bm.verts.new((0.05, -0.03, -1.42))
    for L in range(levels):
        a, b = vrings[L], vrings[L + 1]
        for i in range(n):
            bm.faces.new((a[i], b[i], b[(i + 1) % n], a[(i + 1) % n]))
    last = vrings[-1]
    for i in range(n):
        bm.faces.new((last[i], tip, last[(i + 1) % n]))
    rock = mesh_obj(name + "_r", bm, ROCK)
    for p in rock.data.polygons:
        p.use_smooth = False  # faceted rock reads better under ink

    bpy.ops.object.select_all(action="DESELECT")
    for o in (grass, soil, rock):
        o.select_set(True)
    bpy.context.view_layer.objects.active = grass
    bpy.ops.object.join()
    grass.name = name
    grass.data.name = name


island("Island_A", 1)
island("Island_B", 2)

# ───────────────────────── nature ─────────────────────────


def metaball_mesh(name, balls, material, resolution=0.06, flatten_below=None):
    mb = bpy.data.metaballs.new(name + "_mb")
    mb.resolution = resolution
    mb.render_resolution = resolution
    o = bpy.data.objects.new(name + "_mbo", mb)
    link(o)
    for (x, y, z, r) in balls:
        e = mb.elements.new()
        e.co = (x, y, z)
        e.radius = r
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(deps))
    bpy.data.objects.remove(o)
    obj = bpy.data.objects.new(name, me)
    link(obj)
    if flatten_below is not None:
        for v in obj.data.vertices:
            if v.co.z < flatten_below:
                v.co.z = flatten_below
    obj.data.materials.append(material)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def trunk_bm(h, r0, r1, bend=0.05):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r0, radius2=r1, depth=h)
    for v in bm.verts:
        v.co.z += h / 2
        v.co.x += bend * (v.co.z / h) ** 2
    return bm


def join(objs, name, keep=False):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = objs[0]
    o.name = name
    o.data.name = name
    if keep:
        o["keep"] = True
    return o


# Round tree
t = mesh_obj("trk", trunk_bm(0.95, 0.13, 0.08), BARK)
f = metaball_mesh("fol", [(0, 0, 1.25, 0.62), (0.32, 0.1, 1.05, 0.42), (-0.3, -0.12, 1.08, 0.45), (0.05, 0.25, 1.55, 0.42), (-0.1, -0.2, 1.5, 0.38)], LEAF, 0.07)
join([t, f], "Tree_Round")
# Blossom tree (shared tree)
t = mesh_obj("trk2", trunk_bm(1.05, 0.15, 0.09, bend=-0.08), BARK)
f = metaball_mesh("fol2", [(0, 0, 1.35, 0.6), (0.4, 0.05, 1.2, 0.45), (-0.38, 0.0, 1.22, 0.45), (0, 0.35, 1.3, 0.42), (0, -0.33, 1.3, 0.42), (0.05, 0.05, 1.7, 0.4)], BLOSSOM, 0.07)
join([t, f], "Tree_Blossom")
# Pine
t = mesh_obj("trk3", trunk_bm(0.5, 0.1, 0.07), BARK)
cones = []
for i, (z, r, h) in enumerate([(0.45, 0.6, 0.75), (0.85, 0.48, 0.65), (1.2, 0.34, 0.55)]):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=r, radius2=0.02, depth=h)
    for v in bm.verts:
        v.co.z += z + h / 2
        if v.co.z < z + 0.05:
            v.co.z -= 0.06 * math.sin(math.atan2(v.co.y, v.co.x) * 7) ** 2  # scalloped skirt
    cones.append(mesh_obj(f"cone{i}", bm, PINE))
join([t] + cones, "Tree_Pine")
# Bush
metaball_mesh("Bush", [(0, 0, 0.22, 0.32), (0.25, 0.08, 0.16, 0.24), (-0.24, -0.06, 0.17, 0.25), (0.02, 0.2, 0.2, 0.22)], LEAF, 0.05, flatten_below=0.0)
# Cloud
metaball_mesh("Cloud", [(0, 0, 0, 0.9), (0.95, 0.1, -0.1, 0.7), (-0.95, -0.05, -0.12, 0.68), (0.35, 0.05, 0.42, 0.65), (-0.4, 0.1, 0.3, 0.55)], CLOUD, 0.12, flatten_below=-0.35)


# Rocks
def rock(name, seed):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.3)
    off = Vector((seed, seed * 2, 0))
    for v in bm.verts:
        v.co *= 1 + 0.25 * noise.noise(v.co * 3 + off)
        v.co.z = max(v.co.z * 0.75, -0.05)
    o = mesh_obj(name, bm, ROCK)
    for p in o.data.polygons:
        p.use_smooth = False


rock("Rock_A", 1)
rock("Rock_B", 5)

# Sprout — the doodle crowd figure
sp = [(capsule(0.13, 0.2, loc=(0, 0, 0.27), taper=0.25), WHITE), (sphere(0.135, 20, 14, loc=(0, 0, 0.56)), WHITE)]
sp.append((sphere(0.02, 8, 6, loc=(-0.045, -0.12, 0.58), scale=(1, 0.6, 1.3)), INKM))
sp.append((sphere(0.02, 8, 6, loc=(0.045, -0.12, 0.58), scale=(1, 0.6, 1.3)), INKM))
merge(sp, "Sprout", keep=True)

# ───────────────────────── export ─────────────────────────
for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_extras=True,
    export_yup=True,
    export_normals=True,
    export_materials="EXPORT",
)
print("EXPORTED", OUT, [o.name for o in bpy.data.objects])
