"""Desk-top props, all built from primitives: laptop, phone, desk lamp, chair,
instant-noodle cups, mug, books, envelopes, sticky notes, paper sheets."""
import math
import random

import bpy
from mathutils import Vector

from . import bl, imgs, tex
from . import mats as M
from .bl import CM, v


def _cyl_uv(name, r0, r1, h, seg=32, mat=None, loc=(0, 0, 0), rot=(0, 0, 0), parent=None,
            coll=None, cap_bottom=True):
    """Tapered open cylinder with a wrap-around UV (for printed labels)."""
    verts, faces, uvs = [], [], []
    for j in range(2):
        r = r0 if j == 0 else r1
        z = 0 if j == 0 else h
        for i in range(seg + 1):
            a = 2 * math.pi * i / seg
            verts.append((math.cos(a) * r, math.sin(a) * r, z))
            uvs.append((i / seg, j))
    for i in range(seg):
        a, b = i, i + 1
        faces.append((a, b, b + seg + 1, a + seg + 1))
    if cap_bottom:
        c = len(verts)
        verts.append((0, 0, 0))
        uvs.append((0.5, 0.0))
        for i in range(seg):
            faces.append((i + 1, i, c))
    return bl.grid_mesh(name, verts, faces, uvs=uvs, mat=mat, loc=loc, rot=rot, parent=parent,
                        coll=coll, smooth=True)


# --------------------------------------------------------------------------
class Laptop:
    """Open laptop facing -Y. Screen image can be swapped every frame."""

    def __init__(self, name='laptop', loc=(0, 0, 0), yaw=0.0, open_deg=108, coll=None,
                 body='#b8bcc3', screen_strength=3.0, light=True):
        self.root = bl.empty(name, loc=loc, rot=(0, 0, yaw), coll=coll)
        mb = M.plastic(name + '_body', body, rough=0.35)
        self.body_mat = mb
        self.base = bl.box(name + '_base', (6.6, 4.2, 0.28), (0, 0, 0), mat=mb, parent=self.root,
                           bevel=0.12, origin='bottom', coll=coll)
        kb = imgs.to_bpy(tex.keyboard(), name + '_kbtex')
        self.kb = bl.plane(name + '_kb', 5.8, 2.2, loc=(0, 0.5, 0.285),
                           mat=M.paper(name + '_kbmat', image=kb, rough=0.5, translucent=0, fibers=0.2),
                           parent=self.root, coll=coll)
        self.pad = bl.plane(name + '_pad', 2.1, 1.1, loc=(0, -1.3, 0.283),
                            mat=M.plastic(name + '_padm', '#a9adb4', rough=0.25), parent=self.root,
                            coll=coll)
        self.pivot = bl.empty(name + '_hinge', loc=(0, 2.05, 0.28), parent=self.root, coll=coll)
        self.lid = bl.box(name + '_lid', (6.6, 0.18, 4.2), (0, 0.0, 2.1), mat=mb, parent=self.pivot,
                          bevel=0.08, coll=coll)
        self.img = imgs.to_bpy(tex.scr_off(), name + '_screen')
        self.smat = M.screen(name + '_scrmat', self.img, strength=screen_strength)
        self.tex_node = self.smat.node_tree.nodes['screen_tex']
        self.name = name
        self.screen = bl.plane(name + '_scr', 6.2, 3.875, loc=(0, -0.096, 2.2), rot=(90, 0, 0),
                               mat=self.smat, parent=self.pivot, coll=coll)
        st = imgs.to_bpy(tex.wood_grain_sticker(), name + '_stk')
        self.sticker = bl.plane(name + '_sticker', 1.0, 1.0, loc=(1.5, 0.096, 2.7), rot=(90, 0, 180),
                                mat=M.paper(name + '_stkm', image=st, alpha=True, translucent=0),
                                parent=self.pivot, coll=coll)
        self.light = None
        if light:
            self.light = bl.area_light(name + '_glow', (0, 0, 0), (0, -10, 0), energy=0.0, size=6.2,
                                       size_y=3.9, color=(0.8, 0.88, 1.0), coll=coll)
            self.light.parent = self.pivot
            self.light.location = v(0, -0.4, 2.2)
            self.light.rotation_euler = (math.radians(-90), 0, 0)
        self.set_open(open_deg)
        self.strength = screen_strength

    def set_open(self, deg):
        self.pivot.rotation_euler = (math.radians(-(deg - 90)), 0, 0)

    def show(self, pil, strength=None, glow=None, color=None):
        self.img = imgs.swap(self.tex_node, pil, self.name + '_screen')
        if strength is not None:
            M.set_strength(self.smat, strength)
        if self.light is not None:
            if glow is not None:
                self.light.data.energy = glow
            if color is not None:
                self.light.data.color = color


class Phone:
    def __init__(self, name='phone', loc=(0, 0, 0), rot=(0, 0, 0), coll=None, color='#2b3a55',
                 strength=2.5, light=True):
        self.root = bl.empty(name, loc=loc, rot=rot, coll=coll)
        self.body = bl.box(name + '_body', (2.2, 4.7, 0.22), (0, 0, 0), mat=M.plastic(name + '_bm', color, rough=0.3),
                           parent=self.root, bevel=0.1, origin='bottom', coll=coll)
        self.img = imgs.to_bpy(tex.ph_black(), name + '_screen')
        self.smat = M.screen(name + '_sm', self.img, strength=strength)
        self.tex_node = self.smat.node_tree.nodes['screen_tex']
        self.name = name
        self.screen = bl.plane(name + '_scr', 2.04, 4.42, loc=(0, 0, 0.226), mat=self.smat,
                               parent=self.root, coll=coll)
        self.light = None
        if light:
            self.light = bl.area_light(name + '_glow', (0, 0, 0), (0, 0, 10), energy=0.0, size=2.0,
                                       size_y=4.4, color=(0.85, 0.9, 1.0), coll=coll)
            self.light.parent = self.root
            self.light.location = v(0, 0, 0.5)
            self.light.rotation_euler = (math.pi, 0, 0)

    def show(self, pil, strength=None, glow=None):
        self.img = imgs.swap(self.tex_node, pil, self.name + '_screen')
        if strength is not None:
            M.set_strength(self.smat, strength)
        if self.light is not None and glow is not None:
            self.light.data.energy = glow


class DeskLamp:
    def __init__(self, name='lamp', loc=(0, 0, 0), yaw=0.0, coll=None, color='#7fa392'):
        self.root = bl.empty(name, loc=loc, rot=(0, 0, yaw), coll=coll)
        m = M.plastic(name + '_m', color, rough=0.4)
        mm = M.metal(name + '_metal', '#c9c9c9', rough=0.35)
        bl.cylinder(name + '_base', r=1.35, h=0.35, mat=m, parent=self.root, bevel=0.1, coll=coll)
        bl.cylinder(name + '_arm1', r=0.16, h=6.2, loc=(0, 0.2, 0.3), rot=(-14, 0, 0), mat=mm,
                    parent=self.root, coll=coll)
        bl.sphere(name + '_j1', r=0.32, loc=(0, 1.7, 6.3), mat=m, parent=self.root, coll=coll)
        bl.cylinder(name + '_arm2', r=0.14, h=5.0, loc=(0, 1.7, 6.3), rot=(112, 0, 0), mat=mm,
                    parent=self.root, coll=coll)
        head = bl.empty(name + '_head', loc=(0, -2.9, 4.4), rot=(-30, 0, 0), parent=self.root, coll=coll)
        bl.cylinder(name + '_shade', r=0.55, r2=1.55, h=1.9, loc=(0, 0, 0), rot=(180, 0, 0), mat=m,
                    parent=head, cap=False, coll=coll)
        self.bulb_mat = M.emissive(name + '_bulbm', '#ffe2b0', 0.0)
        bl.sphere(name + '_bulb', r=0.5, loc=(0, 0, -0.6), mat=self.bulb_mat, parent=head, coll=coll)
        self.head = head
        self.light = bl.spot_light(name + '_spot', (0, 0, 0), (0, 0, -10), energy=0.0, radius=0.35,
                                   angle=100, blend=0.6, color=(1.0, 0.82, 0.6), coll=coll)
        self.light.parent = head
        self.light.location = v(0, 0, -0.7)
        self.light.rotation_euler = (0, 0, 0)

    def set(self, on, power=1.0):
        self.light.data.energy = 1.2 * power if on else 0.0
        M.set_strength(self.bulb_mat, 12.0 * power if on else 0.0)


class Chair:
    def __init__(self, name='chair', loc=(0, 0, 0), yaw=0.0, seat=2.9, coll=None):
        self.root = bl.empty(name, loc=loc, rot=(0, 0, yaw), coll=coll)
        m = M.plastic(name + '_m', '#5f7f9f', rough=0.45)
        mm = M.metal(name + '_legs', '#8d9196', rough=0.4)
        bl.box(name + '_seat', (5.4, 5.0, 0.45), (0, 0, seat - 0.45), mat=m, parent=self.root, bevel=0.2,
               origin='bottom', coll=coll)
        for sx in (-1, 1):
            for sy in (-1, 1):
                bl.cylinder(name + f'_leg{sx}{sy}', r=0.17, h=seat - 0.45, loc=(2.2 * sx, 2.0 * sy, 0),
                            mat=mm, parent=self.root, seg=12, coll=coll)
        for sx in (-1, 1):
            bl.cylinder(name + f'_post{sx}', r=0.15, h=4.2, loc=(2.0 * sx, 2.3, seat - 0.2), mat=mm,
                        parent=self.root, seg=12, coll=coll)
        bl.box(name + '_back', (5.0, 0.45, 2.4), (0, 2.45, seat + 1.9), rot=(-8, 0, 0), mat=m,
               parent=self.root, bevel=0.2, origin='bottom', coll=coll)


class NoodleCup:
    _label = None

    def __init__(self, name, loc=(0, 0, 0), rot=(0, 0, 0), coll=None, eaten=True, fork=False):
        if NoodleCup._label is None:
            NoodleCup._label = M.paper('noodle_label', image=imgs.to_bpy(tex.noodle_label(), 'noodle_tex'),
                                       rough=0.4, translucent=0.0, fibers=0.3)
            NoodleCup._inner = M.plastic('noodle_inner', '#f2ede2', rough=0.5)
            NoodleCup._foil = M.metal('noodle_foil', '#d8d2c0', rough=0.25)
        self.root = bl.empty(name, loc=loc, rot=rot, coll=coll)
        _cyl_uv(name + '_cup', 0.82, 1.08, 1.7, mat=NoodleCup._label, parent=self.root, coll=coll)
        _cyl_uv(name + '_in', 0.8, 1.05, 1.68, mat=NoodleCup._inner, parent=self.root, coll=coll,
                cap_bottom=True)
        bl.cylinder(name + '_rim', r=1.1, h=0.08, loc=(0, 0, 1.66), mat=NoodleCup._inner, parent=self.root,
                    seg=24, coll=coll)
        if eaten:
            # peeled foil lid folded back
            lid = bl.plane(name + '_foil', 1.9, 1.2, loc=(0, 1.2, 1.9), rot=(-62, 0, 0), mat=NoodleCup._foil,
                           parent=self.root, coll=coll, nx=4, ny=2,
                           bend=lambda u, t: 0.15 * math.sin(u * math.pi))
        if fork:
            bl.cylinder(name + '_fork', r=0.07, h=2.4, loc=(0.3, -0.2, 0.9), rot=(18, 10, 0),
                        mat=NoodleCup._inner, parent=self.root, seg=8, coll=coll)


class Mug:
    def __init__(self, name, loc=(0, 0, 0), coll=None, color='#f1efe8', band='#d9645a', pens=True):
        self.root = bl.empty(name, loc=loc, coll=coll)
        m = M.clay(name + '_m', color, rough=0.25, prints=0.2, spec=0.6)
        bl.cylinder(name + '_body', r=0.78, h=1.7, mat=m, parent=self.root, bevel=0.06, coll=coll)
        bl.cylinder(name + '_band', r=0.8, h=0.3, loc=(0, 0, 1.1), mat=M.clay(name + '_b', band, prints=0.2),
                    parent=self.root, coll=coll, cap=False)
        tube = bl.tube(name + '_handle', [(0.72, 0, 1.35), (1.25, 0, 1.25), (1.3, 0, 0.75), (0.75, 0, 0.5)],
                       0.14, m, parent=self.root, coll=coll)
        if pens:
            cols = ['#2a4d8f', '#c23b3b', '#1f1f1f', '#e2b13c']
            rng = random.Random(len(name))
            for i, c in enumerate(cols):
                a = i / len(cols) * 6.28
                bl.cylinder(name + f'_pen{i}', r=0.1, h=3.0, loc=(0.35 * math.cos(a), 0.35 * math.sin(a), 0.3),
                            rot=(rng.uniform(-12, 12), rng.uniform(-12, 12), 0),
                            mat=M.plastic(name + f'_pm{i}', c, rough=0.3), parent=self.root, seg=8, coll=coll)


def book(name, size=(4.2, 5.8, 0.7), loc=(0, 0, 0), rot=(0, 0, 0), color='#2e5a88', title='市场营销学',
         coll=None, parent=None):
    """Book lying or standing. size = (w along X, depth along Y, thickness along Z)."""
    root = bl.empty(name, loc=loc, rot=rot, coll=coll, parent=parent)
    cover = M.plastic(name + '_cov', color, rough=0.55, spec=0.3)
    pages = M.paper(name + '_pages', '#f3efe3', translucent=0, fibers=1.2)
    w, dpt, t = size
    bl.box(name + '_c', (w, dpt, t), (0, 0, 0), mat=cover, parent=root, bevel=0.05, origin='bottom', coll=coll)
    bl.box(name + '_p', (w - 0.1, dpt - 0.25, t - 0.14), (0.1, 0, 0.07), mat=pages, parent=root,
           origin='bottom', coll=coll)
    spine = tex.book_spine(title, color, seed=len(title))
    if dpt > t:
        spine = spine.rotate(90, expand=True)
    sp = imgs.to_bpy(spine, name + '_spt')
    bl.plane(name + '_spine', dpt * 0.98, t * 0.94, loc=(-w / 2 - 0.006, 0, t / 2), rot=(90, 0, -90),
             mat=M.paper(name + '_spm', image=sp, translucent=0, rough=0.5), parent=root, coll=coll)
    return root


def paper_sheet(name, pil, w, h, loc=(0, 0, 0), rot=(0, 0, 0), coll=None, parent=None, curl=0.0,
                alpha=False, translucent=0.12, rough=0.8, nx=6, ny=6):
    img = imgs.to_bpy(pil, name + '_tex')
    mat = M.paper(name + '_m', image=img, alpha=alpha, translucent=translucent, rough=rough)
    bend = (lambda u, t: curl * ((u - 0.5) ** 2 * 2 + (t - 0.5) ** 2)) if curl else None
    ob = bl.plane(name, w, h, loc=loc, rot=rot, mat=mat, parent=parent, coll=coll, nx=nx, ny=ny, bend=bend)
    ob['img'] = img.name
    return ob


def sticky_note(name, lines, color='y', loc=(0, 0, 0), rot=(0, 0, 0), coll=None, parent=None, seed=0,
                strike=None, size=1.7):
    pil = tex.sticky(lines, color, seed=seed, strike=strike)
    return paper_sheet(name, pil, size, size, loc=loc, rot=rot, coll=coll, parent=parent,
                       curl=0.18, translucent=0.2, nx=4, ny=4)


class Envelopes:
    """A pool of envelope objects that share a few printed variants."""

    def __init__(self, n=60, coll=None, size=(2.6, 1.6)):
        self.variants = []
        cos = ['星河科技', '远航集团', '蓝鲸互动', '北辰银行', '青橙智能', '万象传媒', '云启科技', '知行教育']
        for i in range(8):
            img = imgs.to_bpy(tex.envelope(seed=i, company=cos[i]), f'env_tex{i}')
            self.variants.append(M.paper(f'env_m{i}', image=img, translucent=0.1, rough=0.8))
        self.objs = []
        for i in range(n):
            ob = bl.plane(f'env{i:03d}', size[0], size[1], mat=self.variants[i % 8], coll=coll, nx=2, ny=2,
                          bend=lambda u, t: 0.04 * math.sin(u * math.pi))
            ob.hide_render = True
            self.objs.append(ob)
