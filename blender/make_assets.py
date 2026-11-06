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



def cylinder_x(r, w, loc, seg=24):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=w)
    for v in bm.verts:
        y, z = v.co.y, v.co.z
        v.co.x, v.co.y, v.co.z = z + loc[0], y + loc[1], v.co.x + loc[2]
    return bm

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

# ───────────────────────── characters (clean build) ─────────────────────────
# Design rules: every part is ONE smooth surface; colour changes happen by material on the
# same surface (no intersecting blobs); tiny face details use "detail_*" materials, which the
# app renders without outlines so faces stay crisp.
DET_INK = mat("detail_ink", "#14140f", 0.25)
DET_WHITE = mat("detail_white", "#ffffff", 0.2)
DET_CHEEK = mat("detail_cheek", "#f5a9a4", 0.9)
DET_GOLD = mat("detail_gold", "#f2c31a", 0.5)
HAIRC = mat("hair_clean", "#24211c", 0.45)
SKINC = mat("skin_clean", "#f9e3d2", 0.55)
PANTSC = mat("pants_clean", "#5d6170", 0.75)
SHOEC = mat("shoe_clean", "#ffffff", 0.45)


def uv_capsule(r, length, seg=32, rings=24, centre=(0, 0, 0), taper=0.0, squash=1.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        k = 1 + taper * (-v.co.z / r) * 0.5
        v.co.x *= k
        v.co.y *= k * squash
        v.co.z += length / 2 if v.co.z > 1e-6 else (-length / 2 if v.co.z < -1e-6 else 0)
        v.co += Vector(centre)
    return bm


def two_tone(bm, z_split, top_idx, bottom_idx):
    for f in bm.faces:
        f.material_index = top_idx if f.calc_center_median().z > z_split else bottom_idx


def obj_from(bm, name, mats, origin, keep=False, no_line=False):
    for v in bm.verts:
        v.co -= Vector(origin)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o)
    for m in mats:
        o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    o.location = origin
    if keep:
        o["keep"] = True
    if no_line:
        o["noLine"] = True
    return o


def hair_cap(hc, r, cut_normal, cut_offset, thickness=0.03):
    """A sphere shell cut by one plane -> perfectly clean hairline, then given thickness."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=r)
    for v in bm.verts:
        v.co.x *= 1.04
        v.co += Vector(hc)
    n = Vector(cut_normal).normalized()
    co = Vector(hc) + n * cut_offset
    res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=n, clear_inner=True)
    return bm


def character(P):
    shirt = SHIRT[P]
    # BODY: one capsule, shirt on top, trousers below — single clean surface
    bm = uv_capsule(0.235, 0.3, centre=(0, 0, 0.76), taper=0.16)
    two_tone(bm, 0.6, 0, 1)
    body = obj_from(bm, f"{P}_Body", [shirt, PANTSC], (0, 0, 0), keep=True)
    if P == "A":
        bp = rounded_box((0.3, 0.13, 0.34), 0.06, loc=(0, 0.25, 0.84))
        obj_from(bp, f"{P}_Pack", [GOLD], (0, 0, 0), keep=True).parent = body
    else:
        sc = torus(0.17, 0.06, loc=(0, 0, 1.02), seg=40, ring=14)
        obj_from(sc, f"{P}_Scarf", [GOLD], (0, 0, 0), keep=True).parent = body

    # HEAD: one sphere; face details are separate no-outline decals
    hc = (0, 0, 1.31)
    bm = sphere(0.28, 48, 32, loc=hc, scale=(1.04, 1.0, 0.97))
    head = obj_from(bm, f"{P}_Head", [SKINC], hc, keep=True)
    face = []
    face.append((sphere(0.05, 16, 10, loc=(-0.155, -0.24, 1.245), scale=(1, 0.3, 0.62)), DET_CHEEK))
    face.append((sphere(0.05, 16, 10, loc=(0.155, -0.24, 1.245), scale=(1, 0.3, 0.62)), DET_CHEEK))
    sm = torus(0.04, 0.008, loc=(0, -0.268, 1.235), seg=24, ring=6, rot_x=math.pi / 2)
    for v in list(sm.verts):
        if v.co.z > 1.236:
            sm.verts.remove(v)
    face.append((sm, DET_INK))
    f = merge(face, f"{P}_Face", origin=hc, keep=True)
    f["noLine"] = True
    f.parent = head
    f.location = (0, 0, 0)

    # HAIR: one clean shell per character
    if P == "A":
        hb = hair_cap(hc, 0.3, (0.0, 0.6, 1.0), 0.03)  # keep the top; hairline higher in front, lower at the back
        hair = obj_from(hb, f"{P}_Hair", [HAIRC], hc, keep=True)
        # one smooth side-swept fringe
        fr = metaball_like_fringe(hc)
        fr.parent = hair
        fr.location = (-hc[0], -hc[1], -hc[2])
    else:
        hb = hair_cap(hc, 0.302, (0.0, 1.0, 1.0), -0.02)  # longer at the back (bob)
        hair = obj_from(hb, f"{P}_Hair", [HAIRC], hc, keep=True)
        bun = sphere(0.11, 32, 20, loc=(0, 0.2, 1.53))
        bo = obj_from(bun, f"{P}_Bun", [HAIRC], (0, 0, 0), keep=True)
        bo.parent = hair
        bo.location = (-hc[0], -hc[1], -hc[2])
        fl = [(sphere(0.045, 16, 10, loc=(0.215, -0.13, 1.5)), DET_GOLD)]
        for k in range(5):
            a = k / 5 * math.tau
            fl.append((sphere(0.034, 12, 8, loc=(0.215 + math.cos(a) * 0.052, -0.145, 1.5 + math.sin(a) * 0.052), scale=(1, 0.5, 1)), DET_WHITE))
        fo = merge(fl, f"{P}_Flower", origin=(0, 0, 0), keep=True)
        fo["noLine"] = True
        fo.parent = hair
        fo.location = (-hc[0], -hc[1], -hc[2])
    hair.parent = head
    hair.location = (0, 0, 0)

    # EYES: separate so they blink; glossy ovals + highlights, no outlines
    ec = (0, -0.255, 1.33)
    eyes = [(sphere(0.04, 20, 14, loc=(-0.095, -0.255, 1.33), scale=(0.9, 0.45, 1.3)), DET_INK), (sphere(0.04, 20, 14, loc=(0.095, -0.255, 1.33), scale=(0.9, 0.45, 1.3)), DET_INK)]
    eyes.append((sphere(0.012, 10, 8, loc=(-0.083, -0.274, 1.352)), DET_WHITE))
    eyes.append((sphere(0.012, 10, 8, loc=(0.107, -0.274, 1.352)), DET_WHITE))
    e = merge(eyes, f"{P}_Eyes", origin=ec, keep=True)
    e["noLine"] = True

    # ARMS: shirt sleeve + hand, origin at shoulder
    for side, x in (("L", -0.29), ("R", 0.29)):
        bm = uv_capsule(0.07, 0.3, seg=24, rings=18, centre=(x * 1.02, 0, 0.78))
        two_tone(bm, 0.66, 0, 1)
        obj_from(bm, f"{P}_Arm{side}", [shirt, SKINC], (x, 0, 0.98), keep=True)
    # LEGS: trouser + clean rounded shoe, origin at hip
    for side, x in (("L", -0.105), ("R", 0.105)):
        bm = uv_capsule(0.085, 0.3, seg=24, rings=18, centre=(x, 0, 0.27))
        two_tone(bm, 0.11, 0, 1)
        obj_from(bm, f"{P}_Leg{side}", [PANTSC, SHOEC], (x, 0, 0.48))


def metaball_like_fringe(hc):
    mb = bpy.data.metaballs.new("fringe_mb")
    mb.resolution = 0.02
    o = bpy.data.objects.new("fringe_tmp", mb)
    link(o)
    for (x, y, z, r) in [(-0.13, -0.2, 1.49, 0.075), (-0.02, -0.235, 1.5, 0.08), (0.1, -0.22, 1.47, 0.065)]:
        el = mb.elements.new()
        el.co = (x, y, z)
        el.radius = r
        el.stiffness = 2.5
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(o)
    for v in me.vertices:
        v.co.z = hc[2] + (v.co.z - hc[2]) * 0.8
    fo = bpy.data.objects.new("A_Fringe", me)
    link(fo)
    me.materials.append(HAIRC)
    for p in me.polygons:
        p.use_smooth = True
    fo["keep"] = True
    return fo


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
SPW = mat("sprout", "#ffffff", 0.6)
sp = [(capsule(0.13, 0.2, loc=(0, 0, 0.27), taper=0.25), SPW), (sphere(0.135, 20, 14, loc=(0, 0, 0.56)), SPW)]
sp.append((sphere(0.02, 8, 6, loc=(-0.045, -0.12, 0.58), scale=(1, 0.6, 1.3)), DET_INK))
sp.append((sphere(0.02, 8, 6, loc=(0.045, -0.12, 0.58), scale=(1, 0.6, 1.3)), DET_INK))
merge(sp, "Sprout", keep=True)


# ───────────────────────── vehicles & decor ─────────────────────────
CARBODY = mat("car_body", "#f2c31a", 0.35)
GLASS = mat("car_glass", "#bfe0f5", 0.1)
TYRE = mat("detail_tyre", "#1d1c18", 0.6)
HUB = mat("detail_hub", "#ffffff", 0.3)
LAMP = mat("detail_lamp", "#fff6c9", 0.2)
RED = mat("car_red", "#c0342a", 0.5)
cp = [(rounded_box((0.95, 1.6, 0.42), 0.16, loc=(0, 0, 0.42)), CARBODY)]
cp.append((rounded_box((0.82, 0.86, 0.38), 0.14, loc=(0, 0.12, 0.78)), GLASS))   # cabin glass
cp.append((rounded_box((0.86, 0.6, 0.06), 0.03, loc=(0, 0.15, 0.99)), CARBODY))   # roof
cp.append((rounded_box((0.98, 0.14, 0.12), 0.05, loc=(0, -0.83, 0.33)), RED))     # bumper
for x in (-0.3, 0.3):
    cp.append((sphere(0.07, 14, 10, loc=(x, -0.79, 0.48), scale=(1, 0.5, 1)), LAMP))
for x in (-0.46, 0.46):
    for y in (-0.5, 0.52):
        t = torus(0.13, 0.075, loc=(x, y, 0.2), seg=24, ring=12)
        # rotate tyre to face sideways
        for v in t.verts:
            dx, dz = v.co.x - x, v.co.z - 0.2
            v.co.x, v.co.z = x + dz * 0.0 + (v.co.y - y) * 0, v.co.z
        cp.append((cylinder_x(0.19, 0.16, (x, y, 0.2)), TYRE))
        cp.append((cylinder_x(0.08, 0.17, (x, y, 0.2)), HUB))
merge(cp, "Car", keep=True)

FSTONE = mat("fountain_stone", "#e9e4d6", 0.8)
WATER = mat("water", "#7cc6ef", 0.05)
def lathe(profile, segs=40):
    bm = bmesh.new()
    rings = []
    for (r, z) in profile:
        ring = [bm.verts.new((math.cos(i / segs * math.tau) * r, math.sin(i / segs * math.tau) * r, z)) for i in range(segs)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))
    return bm
fp = [(lathe([(0.0, 0.0), (1.2, 0.0), (1.25, 0.08), (1.25, 0.42), (1.12, 0.46), (1.08, 0.2), (0.0, 0.2)]), FSTONE)]
fp.append((lathe([(0.0, 0.36), (1.09, 0.36), (1.09, 0.37), (0.0, 0.37)]), WATER))
fp.append((lathe([(0.16, 0.2), (0.13, 0.9), (0.16, 1.0)]), FSTONE))
fp.append((lathe([(0.0, 0.95), (0.55, 1.0), (0.6, 1.12), (0.5, 1.12), (0.4, 1.05), (0.0, 1.05)]), FSTONE))
fp.append((lathe([(0.0, 1.08), (0.42, 1.08), (0.42, 1.09), (0.0, 1.09)]), WATER))
fp.append((sphere(0.12, 16, 12, loc=(0, 0, 1.25)), WATER))
merge(fp, "Fountain")

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
