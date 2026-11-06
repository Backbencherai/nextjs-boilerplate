"""
Bhavan's Multiplayer: vehicles and nature props built in Blender (bpy), exported as one GLB.
Each prop is split per material (Paint, Glass, Trim, Light, Tyre, Rim / Trunk, Crown) so the game can
instance hundreds of them cheaply and tint the paint or leaves per instance.
Blender is Z-up and forward +Y here; the glTF exporter turns that into Y-up with forward -Z (the game's forward).
Run:  python blender/make_props.py -- public/models/props.glb
"""
import bpy, bmesh, math, random, sys
from mathutils import Vector, noise, Matrix

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "props.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(11)


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


MATS = {}


def mat(name, hexc, rough=0.6, metal=0.0, emit=None, alpha=1.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*lin(hexc), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*lin(emit), 1)
        b.inputs["Emission Strength"].default_value = 2.0
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
    MATS[name] = m
    return m


def obj_from_bm(name, bm, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    for p in me.polygons:
        p.use_smooth = True
    return o


def box(bm, cx, cy, cz, sx, sy, sz, taper_top=(1.0, 1.0), lift=0.0):
    """Add a box (optionally tapered at the top) to a bmesh."""
    vs = []
    for z in (-1, 1):
        tx, ty = taper_top if z > 0 else (1, 1)
        for y in (-1, 1):
            for x in (-1, 1):
                vs.append(bm.verts.new((cx + x * sx * tx, cy + y * sy * ty + (lift if z > 0 else 0), cz + z * sz)))
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    for a in f:
        bm.faces.new([vs[i] for i in a])


def cyl(bm, center, radius, depth, axis="x", seg=24, r2=None):
    m = Matrix.Identity(4)
    if axis == "x":
        m = Matrix.Rotation(math.pi / 2, 4, "Y")
    elif axis == "y":
        m = Matrix.Rotation(math.pi / 2, 4, "X")
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=radius, radius2=r2 if r2 is not None else radius, depth=depth, matrix=Matrix.Translation(center) @ m)
    return res


def bevel_mod(o, w=0.06, seg=3):
    b = o.modifiers.new("bevel", "BEVEL")
    b.width = w
    b.segments = seg
    b.limit_method = "ANGLE"


def group(name, parts):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    for p in parts:
        p.parent = e
    return e


def wheels(prefix, positions, r=0.36, w=0.26):
    tb = bmesh.new()
    rb = bmesh.new()
    for x, y in positions:
        cyl(tb, Vector((x, y, r)), r, w, "x", 28)
        cyl(rb, Vector((x + (0.02 if x > 0 else -0.02), y, r)), r * 0.62, w + 0.02, "x", 18)
    t = obj_from_bm(prefix + "_Tyre", tb, mat("tyre", "#1a1a1d", 0.9))
    rr = obj_from_bm(prefix + "_Rim", rb, mat("rim", "#c9ccd2", 0.25, 0.9))
    bevel_mod(t, 0.05, 2)
    return [t, rr]


# ───────────────────────── sedan car (≈4.5 m) ─────────────────────────
def car():
    paint = bmesh.new()
    box(paint, 0, 0, 0.62, 0.9, 2.25, 0.3)  # lower body
    box(paint, 0, -0.12, 1.33, 0.74, 0.86, 0.02, (0.98, 0.98))  # roof panel
    p = obj_from_bm("Car_Paint", paint, mat("paint", "#ffffff", 0.22, 0.55))
    bevel_mod(p, 0.12, 4)
    glass = bmesh.new()
    box(glass, 0, -0.12, 1.1, 0.82, 1.3, 0.22, (0.9, 0.66))  # cabin greenhouse
    g = obj_from_bm("Car_Glass", glass, mat("glass", "#1c2a3a", 0.05, 0.3))
    bevel_mod(g, 0.08, 3)
    trim = bmesh.new()
    box(trim, 0, 2.27, 0.46, 0.86, 0.05, 0.13)  # front bumper
    box(trim, 0, -2.27, 0.46, 0.86, 0.05, 0.13)  # rear bumper
    box(trim, 0, 2.26, 0.66, 0.42, 0.03, 0.07)  # grille
    for x in (-0.93, 0.93):
        box(trim, x, 0.55, 1.0, 0.05, 0.08, 0.05)  # mirrors
    t = obj_from_bm("Car_Trim", trim, mat("trim", "#2a2d33", 0.5, 0.3))
    bevel_mod(t, 0.03, 2)
    light = bmesh.new()
    for x in (-0.62, 0.62):
        box(light, x, 2.25, 0.72, 0.18, 0.03, 0.06)
    lt = obj_from_bm("Car_Light", light, mat("headlight", "#fff6d8", 0.1, 0, "#fff3c0"))
    tail = bmesh.new()
    for x in (-0.66, 0.66):
        box(tail, x, -2.25, 0.74, 0.18, 0.03, 0.06)
    tl = obj_from_bm("Car_Tail", tail, mat("taillight", "#c01818", 0.2, 0, "#ff2020"))
    w = wheels("Car", [(-0.84, 1.42), (0.84, 1.42), (-0.84, -1.42), (0.84, -1.42)])
    return group("Car", [p, g, t, lt, tl, *w])


# ───────────────────────── city bus (≈11 m) ─────────────────────────
def bus():
    paint = bmesh.new()
    box(paint, 0, 0, 0.95, 1.26, 5.5, 0.55)
    box(paint, 0, 0, 2.95, 1.26, 5.5, 0.16)
    p = obj_from_bm("Bus_Paint", paint, mat("buspaint", "#ffffff", 0.35, 0.2))
    bevel_mod(p, 0.12, 3)
    glass = bmesh.new()
    box(glass, 0, 0, 2.15, 1.25, 5.45, 0.66)
    g = obj_from_bm("Bus_Glass", glass, mat("glass", "#1c2a3a", 0.05, 0.3))
    bevel_mod(g, 0.06, 2)
    trim = bmesh.new()
    box(trim, 0, 5.52, 0.45, 1.2, 0.06, 0.18)
    box(trim, 0, -5.52, 0.45, 1.2, 0.06, 0.18)
    box(trim, 1.28, 3.9, 1.5, 0.02, 0.5, 1.1)  # front door
    box(trim, 1.28, -0.5, 1.5, 0.02, 0.5, 1.1)  # middle door
    t = obj_from_bm("Bus_Trim", trim, mat("trim", "#2a2d33", 0.5, 0.3))
    light = bmesh.new()
    for x in (-0.9, 0.9):
        box(light, x, 5.5, 0.8, 0.18, 0.03, 0.08)
    box(light, 0, 5.5, 2.95, 0.7, 0.03, 0.1)  # destination sign
    lt = obj_from_bm("Bus_Light", light, mat("headlight", "#fff6d8", 0.1, 0, "#fff3c0"))
    w = wheels("Bus", [(-1.1, 3.8), (1.1, 3.8), (-1.1, -3.6), (1.1, -3.6)], 0.5, 0.34)
    return group("Bus", [p, g, t, lt, *w])


# ───────────────────────── speedboat (≈7 m) ─────────────────────────
def boat():
    hull = bmesh.new()
    rings = []
    L = 12
    for i in range(L + 1):
        u = i / L
        y = -3.4 + u * 7.0
        wdt = 1.35 * math.sin(min(1.0, (1 - u) * 1.6 + 0.25) * math.pi / 2) * (0.25 + 0.75 * math.sqrt(max(0, 1 - max(0, u - 0.62) / 0.38)))
        deck = 0.95 + 0.25 * max(0, u - 0.6)
        keel = 0.0 + 0.25 * u * u
        ring = [hull.verts.new((-wdt, y, deck)), hull.verts.new((-wdt * 0.7, y, keel + 0.3)), hull.verts.new((0, y, keel)), hull.verts.new((wdt * 0.7, y, keel + 0.3)), hull.verts.new((wdt, y, deck))]
        rings.append(ring)
    for i in range(L):
        for k in range(4):
            hull.faces.new([rings[i][k], rings[i][k + 1], rings[i + 1][k + 1], rings[i + 1][k]])
    for i in range(L):
        hull.faces.new([rings[i][0], rings[i + 1][0], rings[i + 1][4], rings[i][4]])  # deck
    hull.faces.new(rings[0])
    h = obj_from_bm("Boat_Paint", hull, mat("hull", "#ffffff", 0.2, 0.1))
    trim = bmesh.new()
    box(trim, 0, -0.4, 1.35, 0.8, 0.9, 0.38, (0.85, 0.7))  # console / cabin
    box(trim, 0, -2.4, 1.15, 0.9, 0.5, 0.18)  # rear seat
    t = obj_from_bm("Boat_Trim", trim, mat("boatseat", "#e8dcc8", 0.6))
    bevel_mod(t, 0.06, 2)
    glass = bmesh.new()
    box(glass, 0, 0.32, 1.8, 0.78, 0.04, 0.24, (0.95, 1), -0.2)
    g = obj_from_bm("Boat_Glass", glass, mat("glass", "#1c2a3a", 0.05, 0.3))
    stripe = bmesh.new()
    for x in (-1, 1):
        box(stripe, x * 1.34, -0.4, 0.78, 0.02, 2.6, 0.06)
    s = obj_from_bm("Boat_Light", stripe, mat("stripe", "#1f3a93", 0.3))
    return group("Boat", [h, t, g, s])


# ───────────────────────── jet ski (≈3 m) ─────────────────────────
def jetski():
    b = bmesh.new()
    bmesh.ops.create_uvsphere(b, u_segments=24, v_segments=14, radius=1, matrix=Matrix.Diagonal((0.55, 1.5, 0.32, 1)) @ Matrix.Translation((0, 0, 1.0)))
    p = obj_from_bm("JetSki_Paint", b, mat("jetpaint", "#ffffff", 0.2, 0.3))
    seat = bmesh.new()
    box(seat, 0, -0.35, 0.68, 0.24, 0.6, 0.1)
    box(seat, 0, 0.55, 0.78, 0.04, 0.05, 0.22)  # steering column
    box(seat, 0, 0.55, 1.0, 0.36, 0.04, 0.03)  # handlebar
    s = obj_from_bm("JetSki_Trim", seat, mat("trim", "#2a2d33", 0.5, 0.3))
    bevel_mod(s, 0.05, 2)
    return group("JetSki", [p, s])


# ───────────────────────── trees ─────────────────────────
def displaced_blob(bm, c, r, amp=0.28, freq=1.4, sub=3):
    res = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r, matrix=Matrix.Translation(c))
    for v in res["verts"]:
        d = v.co - c
        n = noise.noise(v.co * freq) * 0.6 + noise.noise(v.co * freq * 2.7) * 0.4
        v.co = c + d * (1 + n * amp) * Vector((1, 1, 0.85))


def shade_leaves(o, top=1.0, bottom=0.55):
    """Vertex colours: sunlit tops, darker undersides and inner leaves (cheap ambient occlusion)."""
    me = o.data
    zs = [v.co.z for v in me.vertices]
    lo, hi = min(zs), max(zs)
    col = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]
            k = (v.co.z - lo) / max(0.001, hi - lo)
            s = bottom + (top - bottom) * k
            s *= 0.85 + 0.15 * (0.5 + 0.5 * v.normal.z)
            col.data[li].color = (s, s, s, 1)


def uv_quad_cards(bm, uvl, centers, size, tilt=1.0, droop=0.0):
    """Crossed leaf cards (two quads each) with full 0..1 UVs, like game foliage."""
    for c, r in centers:
        n = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.3, 1) * tilt)).normalized()
        up = Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))
        a = n.cross(up).normalized()
        b = n.cross(a).normalized()
        sz = size * random.uniform(0.75, 1.25)
        for ax, bx in ((a, b), (b, -a)):
            vs = [bm.verts.new(c + (ax * x + bx * y) * sz - Vector((0, 0, droop * (y + 1)))) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            f = bm.faces.new(vs)
            for loop, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
                loop[uvl].uv = uv


def on_blobs(blobs, n):
    pts = []
    for _ in range(n):
        c, r = random.choice(blobs)
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.6, 1))).normalized()
        pts.append((Vector(c) + d * r * random.uniform(0.55, 1.05), r))
    return pts


def broadleaf():
    tb = bmesh.new()
    cyl(tb, Vector((0, 0, 1.3)), 0.26, 2.6, "z", 12, 0.16)
    for i in range(5):
        a = i * 2 * math.pi / 5 + 0.4
        m = Matrix.Translation((math.cos(a) * 0.55, math.sin(a) * 0.55, 2.6 + (i % 2) * 0.4)) @ Matrix.Rotation(0.8, 4, Vector((-math.sin(a), math.cos(a), 0)))
        bmesh.ops.create_cone(tb, cap_ends=True, segments=7, radius1=0.11, radius2=0.04, depth=1.9, matrix=m)
    t = obj_from_bm("TreeBroad_Trunk", tb, mat("bark", "#6b4a33", 0.95))
    blobs = [((0, 0, 4.2), 1.9), ((1.3, 0.3, 3.7), 1.35), ((-1.2, -0.4, 3.8), 1.4), ((0.2, 1.2, 4.5), 1.25), ((-0.3, -1.2, 4.6), 1.2), ((0.1, 0.0, 5.4), 1.2)]
    core = bmesh.new()
    for c, r in blobs:
        displaced_blob(core, Vector(c), r * 0.78, 0.2, 1.4, 2)
    co = obj_from_bm("TreeBroad_Core", core, mat("leafcore", "#ffffff", 0.9))
    shade_leaves(co, 0.55, 0.3)
    cb = bmesh.new()
    uvl = cb.loops.layers.uv.new("UVMap")
    uv_quad_cards(cb, uvl, on_blobs(blobs, 150), 0.75)
    cr = obj_from_bm("TreeBroad_Crown", cb, mat("leafcard", "#ffffff", 0.8))
    shade_leaves(cr, 1.0, 0.5)
    return group("TreeBroad", [t, co, cr])


def pine():
    tb = bmesh.new()
    cyl(tb, Vector((0, 0, 3.0)), 0.24, 6.0, "z", 10, 0.06)
    t = obj_from_bm("TreePine_Trunk", tb, mat("bark", "#6b4a33", 0.95))
    core = bmesh.new()
    cb = bmesh.new()
    uvl = cb.loops.layers.uv.new("UVMap")
    tiers = 7
    for i in range(tiers):
        z = 1.3 + i * 0.95
        r = 2.4 * (1 - i / (tiers + 0.5)) + 0.25
        bmesh.ops.create_cone(core, cap_ends=True, segments=10, radius1=r * 0.7, radius2=0.05, depth=1.5, matrix=Matrix.Translation((0, 0, z + 0.5)))
        pts = []
        for k in range(int(10 + r * 8)):
            a = random.random() * math.pi * 2
            rr = r * random.uniform(0.4, 1.0)
            pts.append((Vector((math.cos(a) * rr, math.sin(a) * rr, z + 0.6 - rr * 0.35)), r))
        uv_quad_cards(cb, uvl, pts, 0.6, 0.5, 0.15)
    co = obj_from_bm("TreePine_Core", core, mat("needlecore", "#ffffff", 0.9))
    shade_leaves(co, 0.5, 0.25)
    cr = obj_from_bm("TreePine_Crown", cb, mat("needlecard", "#ffffff", 0.85))
    shade_leaves(cr, 1.0, 0.5)
    return group("TreePine", [t, co, cr])


def palm():
    tb = bmesh.new()
    pts = []
    for i in range(9):
        u = i / 8
        pts.append(Vector((math.sin(u * 1.2) * 0.9, 0, u * 7.2)))
    for i in range(8):
        a, b = pts[i], pts[i + 1]
        d = b - a
        mid = (a + b) / 2
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        bmesh.ops.create_cone(tb, cap_ends=True, segments=9, radius1=0.27 - i * 0.012, radius2=0.22 - i * 0.012, depth=d.length * 1.02, matrix=Matrix.Translation(mid) @ rot)
    t = obj_from_bm("Palm_Trunk", tb, mat("palmbark", "#8a6a48", 0.95))
    fb = bmesh.new()
    uvl = fb.loops.layers.uv.new("UVMap")
    crown = pts[-1]
    for k in range(12):
        a = k / 12 * math.pi * 2 + random.random() * 0.2
        dirv = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-math.sin(a), math.cos(a), 0))
        N = 10
        L = random.uniform(3.2, 4.0)
        lift = random.uniform(0.6, 1.2)
        rows = []
        for i in range(N + 1):
            u = i / N
            p = crown + dirv * (u * L) + Vector((0, 0, lift * math.sin(u * math.pi * 0.9) - u * u * 2.0))
            wdt = 0.75
            rows.append([fb.verts.new(p + side * wdt - Vector((0, 0, 0.15))), fb.verts.new(p + Vector((0, 0, 0.05))), fb.verts.new(p - side * wdt - Vector((0, 0, 0.15)))])
        for i in range(N):
            for c in range(2):
                f = fb.faces.new([rows[i][c], rows[i][c + 1], rows[i + 1][c + 1], rows[i + 1][c]])
                for loop, uv in zip(f.loops, ((c / 2, i / N), ((c + 1) / 2, i / N), ((c + 1) / 2, (i + 1) / N), (c / 2, (i + 1) / N))):
                    loop[uvl].uv = uv
    fr = obj_from_bm("Palm_Crown", fb, mat("frond", "#ffffff", 0.8))
    shade_leaves(fr, 1.0, 0.65)
    return group("Palm", [t, fr])


# ───────────────────────── apartment furniture ─────────────────────────
def furn(name, parts):
    """parts: list of (material, [boxes]) where a box is (cx, cy, cz, sx, sy, sz[, bevel])."""
    objs = []
    for mname, hexc, rough, boxes, bev in parts:
        bm = bmesh.new()
        for bx in boxes:
            box(bm, *bx)
        o = obj_from_bm(f"{name}_{mname}", bm, mat(f"f_{mname}", hexc, rough))
        if bev:
            bevel_mod(o, bev, 3)
        objs.append(o)
    return group(name, objs)


def sofa():
    return furn("Sofa", [
        ("Fabric", "#5b6b8c", 0.95, [(0, 0, 0.25, 1.1, 0.45, 0.15), (0, -0.38, 0.6, 1.1, 0.1, 0.32), (-1.02, 0, 0.45, 0.1, 0.45, 0.25), (1.02, 0, 0.45, 0.1, 0.45, 0.25)], 0.06),
        ("Cushion", "#7b8db0", 0.95, [(-0.5, 0.05, 0.45, 0.46, 0.36, 0.07), (0.5, 0.05, 0.45, 0.46, 0.36, 0.07), (-0.5, -0.24, 0.72, 0.4, 0.06, 0.2), (0.5, -0.24, 0.72, 0.4, 0.06, 0.2)], 0.05),
        ("Wood", "#3b2a1e", 0.6, [(x, y, 0.05, 0.04, 0.04, 0.05) for x in (-1, 1) for y in (-0.38, 0.38)], 0),
    ])


def armchair():
    return furn("Armchair", [
        ("Fabric", "#b5523b", 0.95, [(0, 0, 0.25, 0.45, 0.42, 0.15), (0, -0.36, 0.6, 0.45, 0.08, 0.3), (-0.42, 0, 0.42, 0.07, 0.42, 0.2), (0.42, 0, 0.42, 0.07, 0.42, 0.2)], 0.06),
        ("Wood", "#3b2a1e", 0.6, [(x, y, 0.05, 0.03, 0.03, 0.05) for x in (-0.4, 0.4) for y in (-0.36, 0.36)], 0),
    ])


def coffee_table():
    return furn("CoffeeTable", [
        ("Wood", "#8a5a3b", 0.4, [(0, 0, 0.4, 0.6, 0.35, 0.03)], 0.02),
        ("Metal", "#2a2d33", 0.4, [(x, y, 0.2, 0.025, 0.025, 0.19) for x in (-0.55, 0.55) for y in (-0.3, 0.3)], 0),
        ("Decor", "#e8dcc8", 0.5, [(0.25, 0.05, 0.47, 0.12, 0.08, 0.04), (-0.2, -0.05, 0.46, 0.08, 0.08, 0.03)], 0.01),
    ])


def tv_unit():
    return furn("TVUnit", [
        ("Wood", "#d9c6a5", 0.5, [(0, 0, 0.25, 1.0, 0.22, 0.25)], 0.02),
        ("Screen", "#0b0d12", 0.15, [(0, 0.05, 1.05, 0.85, 0.03, 0.5)], 0.01),
        ("Metal", "#2a2d33", 0.4, [(0, 0.05, 0.56, 0.08, 0.05, 0.06)], 0),
    ])


def bed():
    return furn("Bed", [
        ("Wood", "#6b4a33", 0.55, [(0, 0, 0.18, 0.85, 1.05, 0.12), (0, -1.08, 0.55, 0.85, 0.05, 0.5)], 0.03),
        ("Sheet", "#f4f1ea", 0.9, [(0, 0.05, 0.38, 0.8, 1.0, 0.1)], 0.05),
        ("Blanket", "#4a7fb5", 0.95, [(0, 0.4, 0.5, 0.82, 0.62, 0.035)], 0.03),
        ("Pillow", "#ffffff", 0.95, [(-0.4, -0.8, 0.53, 0.3, 0.16, 0.06), (0.4, -0.8, 0.53, 0.3, 0.16, 0.06)], 0.05),
    ])


def wardrobe():
    return furn("Wardrobe", [
        ("Wood", "#efe7d8", 0.5, [(0, 0, 1.05, 0.9, 0.3, 1.05)], 0.02),
        ("Metal", "#9aa3ad", 0.3, [(-0.05, 0.31, 1.05, 0.015, 0.02, 0.15), (0.05, 0.31, 1.05, 0.015, 0.02, 0.15)], 0),
        ("Line", "#c9bfae", 0.6, [(0, 0.305, 1.05, 0.005, 0.005, 1.02)], 0),
    ])


def dining():
    chairs = []
    for x, y in ((-0.45, -0.55), (0.45, -0.55), (-0.45, 0.55), (0.45, 0.55)):
        s = 1 if y > 0 else -1
        chairs += [(x, y, 0.45, 0.2, 0.2, 0.03), (x, y + s * 0.18, 0.75, 0.2, 0.025, 0.28)]
    legs = [(x + dx, y + dy, 0.22, 0.02, 0.02, 0.22) for x, y in ((-0.45, -0.55), (0.45, -0.55), (-0.45, 0.55), (0.45, 0.55)) for dx in (-0.17, 0.17) for dy in (-0.17, 0.17)]
    return furn("Dining", [
        ("Wood", "#8a5a3b", 0.45, [(0, 0, 0.75, 0.75, 0.45, 0.03)] + [(x, y, 0.37, 0.03, 0.03, 0.37) for x in (-0.7, 0.7) for y in (-0.4, 0.4)], 0.015),
        ("Chair", "#3b2a1e", 0.6, chairs + legs, 0.01),
        ("Decor", "#e8dcc8", 0.5, [(0, 0, 0.82, 0.1, 0.1, 0.05)], 0.02),
    ])


def kitchen():
    return furn("Kitchen", [
        ("Cabinet", "#f4f1ea", 0.5, [(0, 0, 0.45, 1.6, 0.3, 0.45), (0, -0.05, 1.85, 1.6, 0.2, 0.35)], 0.015),
        ("Counter", "#3a3f4b", 0.25, [(0, 0, 0.92, 1.62, 0.32, 0.025)], 0.005),
        ("Steel", "#c9ccd2", 0.2, [(-0.5, 0.02, 0.95, 0.25, 0.2, 0.01), (0.9 + 0.35, 0, 0.95, 0.35, 0.33, 0.95)], 0.01),
        ("Handle", "#2a2d33", 0.4, [(x, 0.31, 0.75, 0.08, 0.01, 0.01) for x in (-1.2, -0.6, 0, 0.6, 1.2)], 0),
    ])


def bookshelf():
    books = []
    for sh in range(4):
        z = 0.3 + sh * 0.5
        x = -0.48
        while x < 0.45:
            w = random.uniform(0.02, 0.05)
            h = random.uniform(0.15, 0.2)
            books.append((x + w, 0, z + h, w * 0.9, 0.12, h))
            x += w * 2 + 0.005
    return furn("Bookshelf", [
        ("Wood", "#6b4a33", 0.55, [(0, 0, 1.0, 0.55, 0.16, 0.02), (0, 0, 0.05, 0.55, 0.16, 0.05)] + [(0, 0, 0.27 + i * 0.5, 0.53, 0.15, 0.015) for i in range(5)] + [(-0.54, 0, 1.0, 0.015, 0.16, 1.0), (0.54, 0, 1.0, 0.015, 0.16, 1.0), (0, 0.16, 1.0, 0.55, 0.01, 1.0)], 0),
        ("Books", "#ffffff", 0.7, books, 0),
    ])


def plant():
    bm = bmesh.new()
    cyl(bm, Vector((0, 0, 0.2)), 0.18, 0.4, "z", 16, 0.22)
    pot = obj_from_bm("Plant_Pot", bm, mat("pot", "#c7664a", 0.8))
    lb = bmesh.new()
    for c, r in [((0, 0, 0.75), 0.32), ((0.15, 0.1, 0.95), 0.24), ((-0.12, -0.1, 0.98), 0.22)]:
        displaced_blob(lb, Vector(c), r, 0.35, 4, 2)
    lv = obj_from_bm("Plant_Crown", lb, mat("leaves", "#ffffff", 0.85))
    shade_leaves(lv, 1, 0.5)
    return group("Plant", [pot, lv])


def lamp():
    bm = bmesh.new()
    cyl(bm, Vector((0, 0, 0.02)), 0.18, 0.04, "z", 16)
    cyl(bm, Vector((0, 0, 0.8)), 0.015, 1.6, "z", 8)
    pole = obj_from_bm("Lamp_Metal", bm, mat("f_Metal", "#2a2d33", 0.4))
    sh = bmesh.new()
    cyl(sh, Vector((0, 0, 1.6)), 0.22, 0.3, "z", 20, 0.14)
    shade = obj_from_bm("Lamp_Light", sh, mat("lampshade", "#fff3d6", 0.6, 0, "#ffe2a8"))
    return group("Lamp", [pole, shade])


def rug():
    bm = bmesh.new()
    box(bm, 0, 0, 0.005, 1.2, 0.8, 0.005)
    return group("Rug", [obj_from_bm("Rug_Fabric", bm, mat("rug", "#b5523b", 1.0))])


for i, fn in enumerate([car, bus, boat, jetski, broadleaf, pine, palm, sofa, armchair, coffee_table, tv_unit, bed, wardrobe, dining, kitchen, bookshelf, plant, lamp, rug]):
    g = fn()
    g.location.x = 0  # every prop sits at the origin; the game places them

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_vertex_color="ACTIVE", export_texcoords=True)
print("wrote", OUT)
