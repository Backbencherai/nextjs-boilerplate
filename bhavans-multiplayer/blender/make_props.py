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


def broadleaf():
    tb = bmesh.new()
    cyl(tb, Vector((0, 0, 1.3)), 0.28, 2.6, "z", 10, 0.18)
    for i in range(4):
        a = i * math.pi / 2 + 0.4
        m = Matrix.Translation((math.cos(a) * 0.5, math.sin(a) * 0.5, 2.5)) @ Matrix.Rotation(0.75, 4, Vector((-math.sin(a), math.cos(a), 0)))
        bmesh.ops.create_cone(tb, cap_ends=True, segments=7, radius1=0.12, radius2=0.05, depth=1.6, matrix=m)
    t = obj_from_bm("TreeBroad_Trunk", tb, mat("bark", "#6b4a33", 0.95))
    cb = bmesh.new()
    for c, r in [((0, 0, 4.1), 1.9), ((1.2, 0.3, 3.6), 1.35), ((-1.1, -0.4, 3.7), 1.4), ((0.2, 1.1, 4.4), 1.25), ((-0.3, -1.1, 4.5), 1.2), ((0.1, 0.0, 5.2), 1.2)]:
        displaced_blob(cb, Vector(c), r)
    cr = obj_from_bm("TreeBroad_Crown", cb, mat("leaves", "#ffffff", 0.85))
    shade_leaves(cr)
    return group("TreeBroad", [t, cr])


def pine():
    tb = bmesh.new()
    cyl(tb, Vector((0, 0, 1.8)), 0.22, 3.6, "z", 10, 0.12)
    t = obj_from_bm("TreePine_Trunk", tb, mat("bark", "#6b4a33", 0.95))
    cb = bmesh.new()
    tiers = 6
    for i in range(tiers):
        z = 1.4 + i * 1.05
        r = 2.4 * (1 - i / (tiers + 0.6)) + 0.3
        seg = 14
        top = cb.verts.new((0, 0, z + 1.6))
        ring = []
        for k in range(seg):
            a = k / seg * math.pi * 2
            rr = r * (1.0 if k % 2 == 0 else 0.72) * (0.92 + random.random() * 0.16)
            ring.append(cb.verts.new((math.cos(a) * rr, math.sin(a) * rr, z - (0.25 if k % 2 == 0 else 0.05))))
        inner = cb.verts.new((0, 0, z + 0.2))
        for k in range(seg):
            cb.faces.new([ring[k], ring[(k + 1) % seg], top])
            cb.faces.new([ring[(k + 1) % seg], ring[k], inner])
    cr = obj_from_bm("TreePine_Crown", cb, mat("needles", "#ffffff", 0.9))
    shade_leaves(cr, 1.0, 0.5)
    return group("TreePine", [t, cr])


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
        bmesh.ops.create_cone(tb, cap_ends=True, segments=9, radius1=0.26 - i * 0.012, radius2=0.24 - i * 0.012, depth=d.length * 1.02, matrix=Matrix.Translation(mid) @ rot)
    t = obj_from_bm("Palm_Trunk", tb, mat("palmbark", "#8a6a48", 0.95))
    fb = bmesh.new()
    crown = pts[-1]
    for k in range(10):
        a = k / 10 * math.pi * 2
        dirv = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-math.sin(a), math.cos(a), 0))
        N = 10
        left, right, spine = [], [], []
        for i in range(N + 1):
            u = i / N
            p = crown + dirv * (u * 3.6) + Vector((0, 0, 0.9 * math.sin(u * math.pi * 0.9) - u * u * 1.8))
            wdt = 0.55 * math.sin(u * math.pi) + 0.05
            spine.append(fb.verts.new(p + Vector((0, 0, 0.06))))
            left.append(fb.verts.new(p + side * wdt - Vector((0, 0, 0.12 * wdt))))
            right.append(fb.verts.new(p - side * wdt - Vector((0, 0, 0.12 * wdt))))
        for i in range(N):
            fb.faces.new([left[i], spine[i], spine[i + 1], left[i + 1]])
            fb.faces.new([spine[i], right[i], right[i + 1], spine[i + 1]])
    fr = obj_from_bm("Palm_Crown", fb, mat("frond", "#ffffff", 0.8))
    shade_leaves(fr, 1.0, 0.6)
    return group("Palm", [t, fr])


for i, fn in enumerate([car, bus, boat, jetski, broadleaf, pine, palm]):
    g = fn()
    g.location.x = 0  # every prop sits at the origin; the game places them

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_vertex_color="ACTIVE")
print("wrote", OUT)
