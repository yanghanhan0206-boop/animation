"""Blender helpers: scene reset, primitive builders, cameras, lights.

All geometry in this project is built procedurally here - no imported models.
Units: scene is in metres, but every builder takes centimetres (the puppet is
~14 cm tall, like a real stop-motion puppet), converted with CM.
"""
import math
import bpy  # noqa: F401  (must precede bmesh/mathutils)
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion

CM = 0.01


def v(*a):
    """cm tuple -> metres Vector"""
    if len(a) == 1:
        a = a[0]
    return Vector((a[0] * CM, a[1] * CM, a[2] * CM))


# --------------------------------------------------------------------------
# scene
# --------------------------------------------------------------------------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    return sc


def setup_render(res=(1280, 720), samples=12, denoise=True, seed=0,
                 percentage=100, fast=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.04
    cy.adaptive_min_samples = 0
    cy.use_denoising = denoise
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.denoising_prefilter = 'ACCURATE' if not fast else 'FAST'
    cy.denoising_quality = 'HIGH' if not fast else 'BALANCED'
    cy.max_bounces = 5
    cy.diffuse_bounces = 2
    cy.glossy_bounces = 2
    cy.transmission_bounces = 4
    cy.transparent_max_bounces = 8
    cy.volume_bounces = 0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 1.0
    cy.sample_clamp_indirect = 6.0
    cy.seed = seed
    cy.use_animated_seed = False
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = percentage
    sc.render.use_persistent_data = True
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '8'
    sc.render.image_settings.compression = 30
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    sc.view_settings.exposure = 0.0
    sc.render.dither_intensity = 1.0
    sc.render.filter_size = 1.2
    return sc


def world(color=(0.02, 0.02, 0.025), strength=1.0):
    sc = bpy.context.scene
    w = sc.world or bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*color, 1)
    bg.inputs[1].default_value = strength
    return bg


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


# --------------------------------------------------------------------------
# mesh builders (centimetre inputs)
# --------------------------------------------------------------------------
def _finish(me, name, mat, smooth, loc, rot, scale, parent, subdiv, coll):
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    link(ob, coll)
    if mat is not None:
        if isinstance(mat, (list, tuple)):
            for m in mat:
                me.materials.append(m)
        else:
            me.materials.append(mat)
    if parent is not None:
        ob.parent = parent
    ob.location = v(loc)
    ob.rotation_euler = Euler([math.radians(a) for a in rot])
    ob.scale = scale
    if subdiv:
        m = ob.modifiers.new('subd', 'SUBSURF')
        m.levels = subdiv
        m.render_levels = subdiv
    return ob


def mesh_from_bm(bm, name):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def sphere(name, r=1.0, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), mat=None,
           parent=None, seg=24, rings=12, subdiv=1, smooth=True, coll=None,
           radii=None, deform=None):
    """Ellipsoid. r in cm; radii=(rx,ry,rz) in cm overrides r. deform(x,y,z)->(x,y,z)
    is applied to unit-sphere coords before scaling (cm)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    rx, ry, rz = radii if radii else (r, r, r)
    for vt in bm.verts:
        x, y, z = vt.co
        if deform:
            x, y, z = deform(x, y, z)
        vt.co = Vector((x * rx * CM, y * ry * CM, z * rz * CM))
    me = mesh_from_bm(bm, name)
    return _finish(me, name, mat, smooth, loc, rot, scale, parent, subdiv, coll)


def box(name, size=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), mat=None, parent=None,
        bevel=0.0, bevel_segs=2, subdiv=0, coll=None, smooth=False, origin='center'):
    """Box with size in cm. origin='center' or 'bottom'."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size
    for vt in bm.verts:
        x, y, z = vt.co
        if origin == 'bottom':
            z += 0.5
        vt.co = Vector((x * sx * CM, y * sy * CM, z * sz * CM))
    me = mesh_from_bm(bm, name)
    ob = _finish(me, name, mat, smooth or bevel > 0, loc, rot, (1, 1, 1), parent, subdiv, coll)
    if bevel > 0:
        m = ob.modifiers.new('bevel', 'BEVEL')
        m.width = bevel * CM
        m.segments = bevel_segs
        m.limit_method = 'NONE'
        m.harden_normals = False
        # move bevel before subdiv
        if subdiv:
            bpy.context.view_layer.objects.active = ob
            ob.modifiers.move(len(ob.modifiers) - 1, 0)
    return ob


def cylinder(name, r=1.0, h=1.0, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, parent=None,
             seg=24, bevel=0.0, subdiv=0, coll=None, r2=None, origin='bottom', cap=True):
    """Cylinder/cone along +Z, radius r (bottom) r2 (top), height h, in cm."""
    bm = bmesh.new()
    r2 = r if r2 is None else r2
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg,
                          radius1=r * CM, radius2=r2 * CM, depth=h * CM)
    if origin == 'bottom':
        for vt in bm.verts:
            vt.co.z += h * CM / 2
    me = mesh_from_bm(bm, name)
    ob = _finish(me, name, mat, True, loc, rot, (1, 1, 1), parent, subdiv, coll)
    # flat caps shading: use auto smooth by angle via edge split
    es = ob.modifiers.new('edges', 'EDGE_SPLIT')
    es.split_angle = math.radians(50)
    if bevel > 0:
        m = ob.modifiers.new('bevel', 'BEVEL')
        m.width = bevel * CM
        m.segments = 2
        ob.modifiers.move(len(ob.modifiers) - 1, 0)
    return ob


def plane(name, w=1.0, h=1.0, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, parent=None,
          coll=None, nx=1, ny=1, bend=None):
    """XY plane w x h cm centred at origin, UVs 0..1, subdivided nx*ny.
    bend(u, v) -> z offset in cm (for curled paper etc.)."""
    verts, uvs, faces = [], [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            u, t = i / nx, j / ny
            z = bend(u, t) if bend else 0.0
            verts.append(((u - 0.5) * w, (t - 0.5) * h, z))
            uvs.append((u, t))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    return grid_mesh(name, verts, faces, uvs=uvs, mat=mat, loc=loc, rot=rot,
                     parent=parent, coll=coll, smooth=bend is not None)


def grid_mesh(name, verts, faces, uvs=None, mat=None, loc=(0, 0, 0), rot=(0, 0, 0),
              parent=None, coll=None, smooth=True, subdiv=0):
    """Arbitrary mesh from verts (cm) and faces; uvs per loop optional."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([Vector(p) * CM for p in verts], [], faces)
    if uvs is not None:
        uvl = me.uv_layers.new(name='UVMap')
        i = 0
        for poly in me.polygons:
            for li in poly.loop_indices:
                uvl.data[li].uv = uvs[me.loops[li].vertex_index]
    me.update()
    return _finish(me, name, mat, smooth, loc, rot, (1, 1, 1), parent, subdiv, coll)


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, coll=None):
    ob = bpy.data.objects.new(name, None)
    link(ob, coll)
    ob.empty_display_size = 0.02
    if parent is not None:
        ob.parent = parent
    ob.location = v(loc)
    ob.rotation_euler = Euler([math.radians(a) for a in rot])
    return ob


# --------------------------------------------------------------------------
# curves (tubes) - used for limbs, brows, mouths, hair strands
# --------------------------------------------------------------------------
def tube(name, pts, radius=0.5, mat=None, parent=None, caps=True, bevel_res=4,
         radii=None, coll=None, resolution=1):
    """Poly-curve tube. pts in cm (local to parent). radius in cm."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_mode = 'ROUND'
    cu.bevel_depth = radius * CM
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = caps
    cu.resolution_u = resolution
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    sp.use_smooth = True
    ob = bpy.data.objects.new(name, cu)
    link(ob, coll)
    if mat is not None:
        cu.materials.append(mat)
    if parent is not None:
        ob.parent = parent
    set_tube(ob, pts, radii)
    return ob


def set_tube(ob, pts, radii=None):
    sp = ob.data.splines[0]
    n = len(pts)
    if len(sp.points) != n:
        # rebuild spline with the new count
        cu = ob.data
        cu.splines.clear()
        sp = cu.splines.new('POLY')
        sp.points.add(n - 1)
        sp.use_smooth = True
    if radii is not None and len(radii) != n:
        # resample radius profile to the point count
        m = len(radii)
        rs = []
        for i in range(n):
            t = i / max(1, n - 1) * (m - 1)
            k = min(int(t), m - 2) if m > 1 else 0
            f = t - k
            rs.append(radii[k] * (1 - f) + radii[min(k + 1, m - 1)] * f if m > 1 else radii[0])
        radii = rs
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0] * CM, p[1] * CM, p[2] * CM, 1.0)
        sp.points[i].radius = 1.0 if radii is None else radii[i]


def catmull(points, samples=6):
    """Centripetal-ish Catmull-Rom through points (list of 3-tuples) -> dense list."""
    P = [Vector(p) for p in points]
    if len(P) < 2:
        return [tuple(p) for p in P]
    ext = [P[0] + (P[0] - P[1])] + P + [P[-1] + (P[-1] - P[-2])]
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                       (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            out.append(tuple(q))
    out.append(tuple(P[-1]))
    return out


# --------------------------------------------------------------------------
# camera & lights
# --------------------------------------------------------------------------
def look_at(ob, target_cm, roll=0.0):
    tgt = v(target_cm)
    d = tgt - ob.location
    q = d.to_track_quat('-Z', 'Y')
    if roll:
        q = q @ Quaternion((0, 0, 1), math.radians(roll))
    ob.rotation_euler = q.to_euler()


def camera(name='cam', loc=(0, -50, 20), target=(0, 0, 10), lens=50, fstop=8.0,
           focus=None, sensor=36.0, roll=0.0):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = sensor
    cd.clip_start = 0.002
    cd.clip_end = 50
    ob = bpy.data.objects.new(name, cd)
    link(ob)
    ob.location = v(loc)
    look_at(ob, target, roll)
    cd.dof.use_dof = fstop is not None
    if fstop:
        cd.dof.aperture_fstop = fstop
        cd.dof.aperture_blades = 7
        cd.dof.aperture_rotation = math.radians(12)
        dist = (v(target) - ob.location).length if focus is None else focus * CM
        cd.dof.focus_distance = dist
    bpy.context.scene.camera = ob
    return ob


def set_cam(ob, loc, target, lens=None, fstop=None, focus=None, roll=0.0):
    ob.location = v(loc)
    look_at(ob, target, roll)
    if lens:
        ob.data.lens = lens
    if fstop:
        ob.data.dof.use_dof = True
        ob.data.dof.aperture_fstop = fstop
    if ob.data.dof.use_dof:
        ob.data.dof.focus_distance = (v(target) - ob.location).length if focus is None else focus * CM


def area_light(name, loc, target, energy=10.0, size=10.0, size_y=None, color=(1, 1, 1),
               visible=False, spread=180.0, coll=None):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.color = color
    if size_y is None:
        ld.shape = 'SQUARE'
        ld.size = size * CM
    else:
        ld.shape = 'RECTANGLE'
        ld.size = size * CM
        ld.size_y = size_y * CM
    ld.spread = math.radians(spread)
    ob = bpy.data.objects.new(name, ld)
    link(ob, coll)
    ob.location = v(loc)
    look_at(ob, target)
    ob.visible_camera = visible
    return ob


def point_light(name, loc, energy=1.0, radius=0.5, color=(1, 1, 1), coll=None):
    ld = bpy.data.lights.new(name, 'POINT')
    ld.energy = energy
    ld.color = color
    ld.shadow_soft_size = radius * CM
    ob = bpy.data.objects.new(name, ld)
    link(ob, coll)
    ob.location = v(loc)
    ob.visible_camera = False
    return ob


def spot_light(name, loc, target, energy=5.0, radius=0.5, angle=60, blend=0.3,
               color=(1, 1, 1), coll=None):
    ld = bpy.data.lights.new(name, 'SPOT')
    ld.energy = energy
    ld.color = color
    ld.shadow_soft_size = radius * CM
    ld.spot_size = math.radians(angle)
    ld.spot_blend = blend
    ob = bpy.data.objects.new(name, ld)
    link(ob, coll)
    ob.location = v(loc)
    look_at(ob, target)
    ob.visible_camera = False
    return ob


def sun_light(name, direction_target, energy=3.0, angle=2.0, color=(1, 1, 1), coll=None,
              loc=(0, 0, 100)):
    ld = bpy.data.lights.new(name, 'SUN')
    ld.energy = energy
    ld.color = color
    ld.angle = math.radians(angle)
    ob = bpy.data.objects.new(name, ld)
    link(ob, coll)
    ob.location = v(loc)
    look_at(ob, direction_target)
    return ob


def hide(ob, camera=True, shadow=None, render=None):
    """camera=False hides from camera rays only (still casts light/shadow)."""
    ob.visible_camera = camera
    if shadow is not None:
        ob.visible_shadow = shadow
    if render is not None:
        ob.hide_render = not render


def hide_tree(ob, render):
    ob.hide_render = not render
    for c in ob.children_recursive:
        c.hide_render = not render


def render_to(path):
    sc = bpy.context.scene
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
