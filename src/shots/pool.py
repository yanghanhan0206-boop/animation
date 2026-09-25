"""S09 - 人才库 (the 'talent pool'): a swimming pool full of identical grey
graduates floating on their backs. Xiaoman drops in, floats, fades, sinks."""
import math
import random

import bpy
from mathutils import Vector

from lib import bl, tex, imgs, props
from lib import mats as M
from lib.anim import jit, jit3, ease, Keys, Pose, blink
from lib.bl import v, CM
from lib.puppet import Puppet, bake

PX, PY, DEPTH = 46.0, 30.0, 12.0          # half-sizes of the pool, depth


def water_mat():
    """Stop-motion 'cellophane' water: tinted transparency + fresnel gloss. Being transparent
    (not refractive) it lets the light reach the tiles below, without caustics."""
    m = bpy.data.materials.new('water')
    m.use_nodes = True
    nb = M.NB(m)
    nb.clear()
    co = nb.coords(scale=100.0, name='ripple')
    n1 = nb.noise(co.outputs[0], 0.35, detail=3, rough=0.55, dims='4D')
    n1.name = 'ripple_noise'
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.3
    bp.inputs['Distance'].default_value = 0.004
    nb.link(n1.outputs['Fac'], bp.inputs['Height'])
    tr = nb.node('ShaderNodeBsdfTransparent')
    tr.inputs['Color'].default_value = (*M.srgb('#86d9e0'), 1)
    gl = nb.node('ShaderNodeBsdfGlossy')
    gl.inputs['Roughness'].default_value = 0.05
    nb.link(bp.outputs['Normal'], gl.inputs['Normal'])
    fr = nb.node('ShaderNodeFresnel')
    fr.inputs['IOR'].default_value = 1.33
    nb.link(bp.outputs['Normal'], fr.inputs['Normal'])
    mx = nb.node('ShaderNodeMixShader')
    nb.link(fr.outputs[0], mx.inputs[0])
    nb.link(tr.outputs[0], mx.inputs[1])
    nb.link(gl.outputs[0], mx.inputs[2])
    # a faint turquoise body so the pool reads as water from above
    dif = nb.node('ShaderNodeBsdfDiffuse')
    dif.inputs['Color'].default_value = (*M.srgb('#3fb7c4'), 1)
    mx2 = nb.node('ShaderNodeMixShader')
    mx2.inputs[0].default_value = 0.12
    nb.link(mx.outputs[0], mx2.inputs[1])
    nb.link(dif.outputs[0], mx2.inputs[2])
    nb.output(mx2.outputs[0])
    return m


FLOAT = dict(root_pitch=-90, lean=0, head_pitch=0, eyes=0.95, look=(0, 0), smile=-0.05, blush=0.0,
             arm_r=(-4.1, 0.3, 4.3), arm_l=(4.1, 0.3, 4.3), elbow_r=(-0.3, 1, 1), elbow_l=(0.3, 1, 1),
             leg_r=(-1.9, 0.2, -3.2), leg_l=(1.9, 0.2, -3.2), knee_r=(0, -1, 0), knee_l=(0, -1, 0),
             foot_pitch=-70, ahoge=0.0)


class Pool:
    name = None
    dur = 8.0
    fps = 12
    seed = 40

    def build(self):
        bl.world(M.srgb('#c9d6dc'), 0.55)
        tiles = M.tiles('pooltile', c1='#cfe9ef', c2='#c3e2ea', grout='#8fb9c4', size=2.2, rough=0.25)
        deck = M.tiles('decktile', c1='#eeeeea', c2='#e6e6e0', grout='#b9b9b0', size=3.2, rough=0.4)
        lane = M.plastic('lane', '#2d5d8a', rough=0.4)
        # pool basin (floor + 4 walls), deck around
        bl.box('pfloor', (2 * PX, 2 * PY, 1.0), (0, 0, -DEPTH - 0.5), mat=tiles)
        for nm, sz, lc in [('pw_n', (2 * PX, 1.0, DEPTH), (0, PY + 0.5, -DEPTH / 2)),
                           ('pw_s', (2 * PX, 1.0, DEPTH), (0, -PY - 0.5, -DEPTH / 2)),
                           ('pw_e', (1.0, 2 * PY, DEPTH), (PX + 0.5, 0, -DEPTH / 2)),
                           ('pw_w', (1.0, 2 * PY, DEPTH), (-PX - 0.5, 0, -DEPTH / 2))]:
            bl.box(nm, sz, lc, mat=tiles)
        for k in range(5):
            y = -PY + (k + 1) * 2 * PY / 6
            bl.box(f'laneline{k}', (2 * PX - 10, 1.2, 0.05), (0, y, -DEPTH + 0.02), mat=lane)
        W = 200
        for nm, sz, lc in [('deck_n', (W, 60, 1.0), (0, PY + 31, -0.4)), ('deck_s', (W, 60, 1.0), (0, -PY - 31, -0.4)),
                           ('deck_e', (60, 2 * PY + 2, 1.0), (PX + 31, 0, -0.4)),
                           ('deck_w', (60, 2 * PY + 2, 1.0), (-PX - 31, 0, -0.4))]:
            bl.box(nm, sz, lc, mat=deck)
        # coping edge
        cope = M.plastic('coping', '#f6f6f2', rough=0.35)
        for nm, sz, lc in [('cp_n', (2 * PX + 4, 2.0, 0.6), (0, PY + 1, 0.3)), ('cp_s', (2 * PX + 4, 2.0, 0.6), (0, -PY - 1, 0.3)),
                           ('cp_e', (2.0, 2 * PY, 0.6), (PX + 1, 0, 0.3)), ('cp_w', (2.0, 2 * PY, 0.6), (-PX - 1, 0, 0.3))]:
            bl.box(nm, sz, lc, mat=cope, bevel=0.2)
        # ladder
        steel = M.metal('steel', '#d9dde0', 0.2)
        for x in (-1.6, 1.6):
            bl.tube(f'pladder{x}', [(20 + x, PY + 3.5, 1.0), (20 + x, PY + 3.5, 5.0), (20 + x, PY + 0.8, 5.5),
                                    (20 + x, PY - 0.4, 3.0), (20 + x, PY - 0.5, -DEPTH + 2)], 0.3, steel)
        # sign board, tilted to the camera
        sgn = imgs.to_bpy(tex.sign(), 'sign_tex')
        self.sign = bl.plane('sign', 28, 14, loc=(-20, PY + 11.5, 10.5), rot=(55, 0, 4),
                             mat=M.paper('sign_m', image=sgn, translucent=0, rough=0.6))
        bl.cylinder('signpost1', r=0.5, h=9.0, loc=(-31, PY + 15.5, 0), mat=steel)
        bl.cylinder('signpost2', r=0.5, h=9.0, loc=(-9, PY + 15.5, 0), mat=steel)
        # water
        self.water = bl.plane('water', 2 * PX, 2 * PY, loc=(0, 0, 0), mat=water_mat())
        self.water_mat = self.water.data.materials[0]
        # crowd of grey graduates
        fl = Puppet('fl', detail=False)
        fl.pose(reset=True, loc=(0, 0, 0), desat=1.0, **FLOAT)
        me = bake(fl, 'floater_mesh')
        fl.hide(True)
        for ob in fl.all_objects():
            ob.hide_render = True
        rng = random.Random(4)
        self.floaters = []
        spots = []
        tries = 0
        while len(spots) < 30 and tries < 4000:
            tries += 1
            x, y = rng.uniform(-PX + 8, PX - 8), rng.uniform(-PY + 8, PY - 8)
            if (all((x - a) ** 2 + (y - b) ** 2 > 12.5 ** 2 for a, b in spots) and
                    (x - 4.5) ** 2 + (y + 5.5) ** 2 > 13.5 ** 2):
                spots.append((x, y))
        for k, (x, y) in enumerate(spots):
            ob = bpy.data.objects.new(f'floater{k}', me)
            bpy.context.scene.collection.objects.link(ob)
            yaw = rng.uniform(0, 360)
            self.floaters.append(dict(ob=ob, x=x, y=y, yaw=yaw, ph=rng.uniform(0, 6.3)))
        # the hero
        self.p = Puppet('xm')
        self.key = bl.area_light('poolkey', (-20, -30, 160), (0, 0, 0), energy=420.0, size=90, color=(1.0, 0.98, 0.95))
        self.cam = bl.camera('cam', loc=(0, -30, 120), target=(0, 2, 0), lens=32, fstop=11)
        self.drops = []
        dm = M.clay('splash', '#bfeaf0', rough=0.2, gloss=0.6, prints=0.2)
        for k in range(18):
            d = bl.sphere(f'splash{k}', radii=(0.35, 0.35, 0.45), mat=dm, subdiv=1)
            d.hide_render = True
            self.drops.append(d)
        self.ring = bl.tube('ripple', [(math.cos(a), math.sin(a), 0) for a in
                                       [2 * math.pi * k / 48 for k in range(49)]], 0.07,
                            M.clay('ripplem', '#e6fbff', rough=0.2, gloss=0.5, prints=0))
        self.ring.hide_render = True
        self.setup()

    def setup(self):
        pass

    def bob(self, t, i):
        for f in self.floaters:
            z = 0.25 + 0.12 * math.sin(t * 1.3 + f['ph'])
            ob = f['ob']
            ob.location = v(f['x'], f['y'], z)
            ob.rotation_euler = (math.radians(2.0 * math.sin(t + f['ph'])), math.radians(2.0 * math.cos(t * 0.8 + f['ph'])),
                                 math.radians(f['yaw'] + 3 * math.sin(t * 0.3 + f['ph'])))
        nd = self.water_mat.node_tree.nodes.get('ripple_noise')
        if nd:
            nd.inputs['W'].default_value = t * 0.25

    def splash(self, t, t_hit, at):
        u = (t - t_hit) / 0.6
        rng = random.Random(7)
        for k, d in enumerate(self.drops):
            if 0 <= u <= 1:
                a = 2 * math.pi * k / len(self.drops) + rng.uniform(-0.2, 0.2)
                sp = rng.uniform(4, 9)
                h = rng.uniform(4, 10)
                d.location = v(at[0] + math.cos(a) * sp * u, at[1] + math.sin(a) * sp * u, 0.3 + h * 4 * u * (1 - u))
                s = 1.0 - 0.5 * u
                d.scale = (s, s, s)
                d.hide_render = False
            else:
                d.hide_render = True
        ur = (t - t_hit) / 1.6
        if 0 <= ur <= 1:
            r = 2 + 14 * ur
            self.ring.location = v(at[0], at[1], 0.12)
            self.ring.scale = (r, r, max(0.05, 1 - ur))
            self.ring.hide_render = False
        else:
            self.ring.hide_render = True


HERO_XY = (1.5, -2.0)


class S09a(Pool):
    """High wide: the pool of identical grey graduates. Xiaoman drops in."""
    name = 's09a'
    dur = 8.0
    seed = 41
    T_HIT = 4.3

    def setup(self):
        self.cam_path = Keys([(0.0, (0, -46, 118)), (8.0, (0, -34, 108))], ease='lin')

    def frame(self, t, i):
        self.bob(t, i)
        bl.set_cam(self.cam, self.cam_path(t), (0, 3, 0), lens=30, fstop=11)
        th = self.T_HIT
        if t < th - 1.0:
            self.p.hide(True)
        elif t < th:
            self.p.hide(False)
            u = (t - (th - 1.0)) / 1.0
            z = 80 * (1 - ease(u, 'in')) + 0.3
            self.p.pose(reset=True, frame=i, loc=(HERO_XY[0], HERO_XY[1] + 4 * (1 - u), z), yaw=20 + 200 * u,
                        root_pitch=-50 * u - 20, arm_r=(-3.5, 0.5, 6.5), arm_l=(3.5, 0.5, 6.5),
                        leg_r=(-1.4, 0.4, -3.0), leg_l=(1.4, 0.4, -3.0), eyes=1.0, mouth_open=0.7,
                        brow_raise=1.0, brow_worry=0.6, ahoge=-0.2)
        else:
            self.p.hide(False)
            k = ease((t - th) / 0.8, 'out')
            self.p.pose(reset=True, frame=i, **dict(FLOAT, loc=(HERO_XY[0], HERO_XY[1], 0.3 + 0.12 * math.sin(t * 1.3)),
                                                    yaw=220, eyes=0.95, look=(0.3, 0.2), mouth_open=0.3 * (1 - k),
                                                    brow_raise=0.6 * (1 - k), brow_worry=0.5))
        self.splash(t, th, HERO_XY)


class S09b(Pool):
    """Closer, top-down: floating among the others, colour draining away, then sinking."""
    name = 's09b'
    dur = 9.0
    seed = 42

    def setup(self):
        self.cam_path = Keys([(0.0, (HERO_XY[0] + 1.5, HERO_XY[1] - 6.0, 44.0)),
                              (9.0, (HERO_XY[0] + 0.8, HERO_XY[1] - 3.0, 36.0))], ease='lin')

    def frame(self, t, i):
        self.bob(t + 8.0, i)
        desat = 0.9 * ease((t - 1.0) / 4.5, 'io')
        sink = ease((t - 5.6) / 3.2, 'in')
        z = 0.3 + 0.12 * math.sin((t + 8) * 1.3) - 5.5 * sink
        look = (0.35 * math.sin(t * 0.9), 0.25) if t < 3.0 else (0.0, 0.0)
        eyes = 0.95 * (1 - blink(t, [1.3, 3.4])) if t < 5.0 else 0.95 - 0.5 * ease((t - 5.0) / 2.0)
        self.p.pose(reset=True, frame=i, **dict(FLOAT, loc=(HERO_XY[0], HERO_XY[1], z), yaw=220, desat=desat,
                                                eyes=eyes, look=look, brow_worry=0.6 * (1 - desat) + 0.1,
                                                smile=-0.25, blush=0.6 * (1 - desat), bags=0.6))
        bpy.context.view_layer.update()
        hc = self.p.head_pivot.matrix_world @ Vector((0, 0, 1.5 * CM))
        pv = self.p.root.matrix_world.translation
        mid = (hc * 0.6 + pv * 0.4) / CM
        h = 40.0 - 6.0 * t / self.dur
        bl.set_cam(self.cam, (mid.x, mid.y - 4.0, h), (mid.x, mid.y, 0.0), lens=40, fstop=9.0)
