"""S08 - the AI video interview, in a black void."""
import math

import bpy
from mathutils import Vector

from lib import bl, tex, props
from lib import mats as M
from lib.anim import jit, ease, Pose, blink
from lib.bl import v
from lib.puppet import Puppet

PELV = (0.0, -2.0, 3.35)
SUIT = dict(loc=PELV, yaw=180, lean=2, leg_r=(-0.95, -1.9, -1.55), leg_l=(0.95, -1.9, -1.55),
            knee_r=(0, -1, 0.5), knee_l=(0, -1, 0.5), foot_pitch=-12,
            arm_r_w=(1.5, -0.4, 6.7), arm_l_w=(-1.5, -0.4, 6.7), elbow_r=(-1, 0.3, -0.6),
            elbow_l=(1, 0.3, -0.6), bags=0.8, hair_mess=0.1, ahoge=0.0, blush=0.5, eyes=0.95)
TALK = [0.15, 0.5, 0.3, 0.55, 0.1, 0.45, 0.25, 0.5, 0.05, 0.4, 0.2, 0.5, 0.35, 0.1]


class Interview:
    name = None
    dur = 4.0
    fps = 12
    seed = 30

    def build(self):
        bl.world((0.0, 0.0, 0.0), 0.0)
        self.p = Puppet('xm', outfit='suit')
        floor = M.plastic('voidfloor', '#16181d', rough=0.35)
        bl.box('platform', (80, 80, 6.2), (0, 40.0, 0), mat=floor, origin='bottom')
        bl.plane('voidground', 300, 300, loc=(0, 0, 0), mat=floor)
        self.chair = props.Chair('chair', loc=(0, -2.8, 0), yaw=180, seat=2.9)
        self.laptop = props.Laptop('laptop', loc=(0, 1.8, 6.2), screen_strength=3.0)
        self.ring = bl.empty('ringlight', loc=(0, 9.0, 11.5))
        ringm = M.emissive('ringm', '#f4f7ff', 3.0)
        bl.tube('ring', [(3.2 * math.cos(a), 0, 3.2 * math.sin(a)) for a in
                         [2 * math.pi * k / 40 for k in range(41)]], 0.35, ringm, parent=self.ring)
        self.pole = bl.cylinder('ringpole', r=0.25, h=11.5, loc=(0, 9.3, 0), mat=M.metal('pole', '#3a3a3a'))
        self.ringlight = bl.area_light('ringlamp', (0, 8.6, 11.5), (0, -2, 10), energy=0.22, size=6.0,
                                       color=(0.92, 0.95, 1.0))
        self.rim = bl.area_light('rim', (-10, -12, 18), (0, -2, 10), energy=2.2, size=6.0,
                                 color=(0.5, 0.65, 1.0))
        self.cam = bl.camera('cam', loc=(0, -30, 14), target=(0, 0, 9), lens=40, fstop=8)
        self.setup()

    glow = 0.35

    def setup(self):
        pass

    def screen(self, t_total, i, eye=1.0, warn=None, end=False):
        secs = max(0, 60 - int(t_total * 60 / 13.0))
        u = min(1.0, t_total / 13.0)
        stats = dict(conf=0.52 - 0.2 * u + jit('c', i // 3, 0.03), eye=0.4 - 0.25 * u + jit('e', i // 3, 0.03),
                     pace=0.45 - 0.2 * u, kw=0.3 - 0.12 * u, score=int(68 - 12 * u),
                     tags=['表情紧张', '语速偏快'] + (['眼神躲闪'] if u > 0.4 else []))
        pup = (math.sin(i * 0.37) * 0.3, math.cos(i * 0.23) * 0.3)
        img = tex.scr_ai(u, secs=secs, eye=eye, pupil=pup, stats=stats, warn=warn, end=end)
        self.laptop.show(img, strength=3.0, glow=self.glow, color=(0.55, 0.7, 1.0))

    def pose(self, i, **kw):
        kw.setdefault('frame', i)
        self.p.pose(reset=True, **kw)


class S08a(Interview):
    """OTS: the AI eye and the question, countdown starts."""
    name = 's08a'
    dur = 4.0
    seed = 31

    def setup(self):
        bl.set_cam(self.cam, (6.0, -2.6, 12.2), (-0.5, 3.9, 8.6), lens=38, fstop=8.0)

    def frame(self, t, i):
        self.screen(t, i, warn=None)
        pz = dict(SUIT, head_pitch=4, look=(0, -0.2), smile=0.2, brow_worry=0.3)
        pz['eyes'] = 0.95 * (1 - blink(t, [1.6]))
        self.pose(i, **pz)


class S08b(Interview):
    """Front CU lit blue by the screen: talking, sweating, eyes darting."""
    name = 's08b'
    dur = 5.0
    seed = 32

    def setup(self):
        for ob in [self.laptop.root] + list(self.laptop.root.children_recursive):
            ob.visible_camera = False
        bl.set_cam(self.cam, (0.5, 12.6, 13.0), (0.1, 0.3, 10.6), lens=44, fstop=11.0)
        self.P = Pose([
            (0.0, dict(SUIT, smile=0.35, brow_worry=0.3, look=(0, -0.1), sweat=0.0,
                       arm_r_w=(1.6, -0.9, 7.9), elbow_r=(-1, 0.2, -1))),
            (1.2, dict(arm_r_w=(2.2, -1.4, 8.9))),
            (2.0, dict(arm_r_w=(1.4, -1.0, 7.6), smile=0.2, brow_worry=0.7, sweat=0.3)),
            (3.0, dict(arm_r_w=(2.4, -1.5, 9.2), smile=0.0, brow_worry=0.9, sweat=0.7)),
            (5.0, dict(arm_r_w=(1.5, -0.4, 6.8), smile=-0.1, brow_worry=1.0, sweat=1.0, brow_raise=0.4)),
        ], base=SUIT)

    def frame(self, t, i):
        self.screen(4.0 + t, i, warn='检测到您的视线偏离屏幕' if t > 2.5 else None)
        pz = self.P(t)
        pz['mouth_open'] = TALK[i % len(TALK)] * (0.9 if t < 4.2 else 0.3)
        if t > 1.5:
            pz['look'] = (jit('dart', i // 2, 0.7), 0.1 + jit('dartz', i // 2, 0.2))
        pz['eyes'] = 0.95 * (1 - blink(t, [0.8, 2.9]))
        self.pose(i, **pz)


class S08c(Interview):
    """Wide, surreal: the screen towers, the puppet shrinks; time's up."""
    name = 's08c'
    dur = 5.0
    seed = 33

    def setup(self):
        for ob in [self.ring] + list(self.ring.children_recursive) + [self.pole]:
            ob.hide_render = True
        self.ringlight.data.energy = 0.4
        bl.set_cam(self.cam, (-30.0, -14.0, 13.0), (1.0, 3.0, 11.0), lens=30, fstop=10.0)

    def frame(self, t, i):
        g = 1.0 + 2.3 * ease(t / 3.6, 'io')
        L = self.laptop
        L.root.scale = (g, g, g)
        L.root.location = v(0, -0.3 + 2.1 * g, 6.2)
        end = t > 3.9
        self.screen(9.0 + t, i, eye=1.0 + 0.5 * ease(t / 3.6), end=end,
                    warn='时间到' if 3.4 < t <= 3.9 else None)
        L.light.data.energy = 0.45 * g * g
        s = 1.0 - 0.38 * ease(t / 3.8, 'io')
        pz = dict(SUIT, scale=s, loc=(0, -2.0, 2.9 + 0.45 * s), lean=10 + 20 * (1 - s), head_pitch=-6,
                  look=(0, 0.6), brow_worry=1.0, smile=-0.4, sweat=1.0,
                  arm_r_w=(0.9, -0.8, 2.9 + 3.3 * s), arm_l_w=(-0.9, -0.8, 2.9 + 3.3 * s))
        if end:
            pz.update(eyes=0.5, look=(0, -0.2), head_pitch=12, smile=-0.6)
        else:
            pz['eyes'] = 1.0 * (1 - blink(t, [1.4]))
        self.pose(i, **pz)
