"""Shots on the dorm set."""
import math
import random

import bpy
from mathutils import Vector, Euler

from lib import bl, tex, imgs, props
from lib import mats as M
from lib.anim import jit, jit3, ease, Keys, Pose, blink, auto_blinks, smoothstep
from lib.bl import v, CM
from lib.dorm import PELVIS, DESK_Z
from .common import DormShot, SIT, typing, rest_hands, KB_Y, KB_Z, PAD, X0


# =============================================================================
# S01  cold open - the phone lights up at 02:13
# =============================================================================
class S01(DormShot):
    name = 's01'
    dur = 8.0
    hour = 2.2
    puppet = False
    seed = 1

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.2, lamp=0.0)
        d.laptop.show(tex.scr_off(), strength=0.0, glow=0.0)
        self.ph0 = Vector((-4.8, 1.6, DESK_Z))
        d.phone.root.location = v(self.ph0)
        d.phone.root.rotation_euler = (0, 0, math.radians(14))
        # a pen and the printed resume near the phone
        bl.cylinder('pen', r=0.13, h=4.2, loc=(-7.9, 3.4, DESK_Z + 0.13), rot=(0, 90, 32),
                    mat=M.plastic('penm', '#1f3f8f', rough=0.3), seg=10)
        d.hide_upper_from_camera(True)
        bl.set_cam(self.cam, (-4.9, 1.0, 16.5), (-4.9, 1.9, DESK_Z), lens=35, fstop=5.6)
        self.lock = tex.ph_lock('02:13', '11月3日 星期二',
                                notes=[('邮件', '【星河科技】感谢您的投递', '很遗憾，您的简历未能通过筛选……')])
        self.buzz = [0.35, 1.05, 3.9]
        self.state = None

    def frame(self, t, i):
        d = self.d
        # vibration: jitter + slow walk
        walk = sum(1 for b in self.buzz if t >= b + 0.3) * 0.09
        loc = self.ph0 + Vector((0.0, walk, 0))
        rot = 14.0
        for b in self.buzz:
            if b <= t < b + 0.34:
                loc = loc + Vector(jit3('ph', i, 0.07))
                loc.z = self.ph0.z
                rot += jit('phr', i, 1.4)
        d.phone.root.location = v(loc)
        d.phone.root.rotation_euler = (0, 0, math.radians(rot))
        # screen
        if t < 1.4:
            lit, st = 0.0, 'off'
        elif t < 1.5:
            lit, st = 0.55, 'lock'
        elif t < 6.7:
            lit, st = 1.0, 'lock'
        elif t < 7.2:
            lit, st = 0.45, 'lock'
        else:
            lit, st = 0.0, 'off'
        key = (st, lit)
        if key != self.state:
            if st == 'off':
                d.phone.show(tex.ph_black(), strength=0.0, glow=0.0)
            else:
                d.phone.show(self.lock, strength=1.4 * lit, glow=0.05 * lit)
            self.state = key


# =============================================================================
# S02  calendar: September, 金九
# =============================================================================
class S02(DormShot):
    name = 's02'
    dur = 4.0
    hour = 7.6
    puppet = False
    seed = 2

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.7)
        d.show_month(9)
        d.set_notes(14)
        for k in range(1, 14):
            d.notes[k].hide_render = True
        self.goal = d.notes[0]
        self.goal_loc = self.goal.location.copy()
        self.goal_rot = self.goal.rotation_euler.copy()
        self.cam_hide(d.laptop.root, d.lamp.root, d.mug.root)
        self.cork_light(0.32)
        self.cam_keys = Keys([(0.0, (-8.9, 0.2, 10.6)), (4.0, (-8.6, 1.4, 10.5))], ease='lin')

    def frame(self, t, i):
        bl.set_cam(self.cam, self.cam_keys(t), (-8.6, 11.45, 10.1), lens=42, fstop=8.0)
        g = self.goal
        if t < 1.6:
            g.hide_render = True
        else:
            g.hide_render = False
            u = min(1.0, (t - 1.6) / 0.34)
            k = 1 - ease(u, 'snap')
            g.location = self.goal_loc + Vector((0.4 * k * CM, -0.8 * k * CM, 0.5 * k * CM))
            g.rotation_euler = (self.goal_rot.x, self.goal_rot.y + math.radians(18 * k), self.goal_rot.z)


# =============================================================================
# S03a  morning: stretch, pat cheeks, start typing (wide)
# =============================================================================
HANDS_UP = dict(arm_r_w=(-10.6, -2.3, 15.6), arm_l_w=(-13.4, -2.3, 15.6), elbow_r=(-1, 0, 0.3), elbow_l=(1, 0, 0.3))
CHEEKS = dict(arm_r_w=(-9.9, -1.2, 9.3), arm_l_w=(-14.1, -1.2, 9.3), elbow_r=(-1, 0.3, -1), elbow_l=(1, 0.3, -1),
              hand_r_roll=-90, hand_l_roll=90)


class S03a(DormShot):
    name = 's03a'
    dur = 5.0
    hour = 8.2
    seed = 3

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.9)
        d.show_month(9)
        d.set_notes(3)
        d.laptop.show(tex.scr_resume(), strength=2.4, glow=0.35)
        self.front_objects_visible(False)
        bl.set_cam(self.cam, (-3, -41, 22.5), (-8.5, 4, 11), lens=28, fstop=11)
        rest = dict(arm_r_w=(-10.5, -0.2, 6.6), arm_l_w=(-13.5, -0.2, 6.6), elbow_r=(-1, 0.3, -0.6),
                    elbow_l=(1, 0.3, -0.6), lean=2, head_pitch=4)
        self.P = Pose([
            (0.0, dict(rest, smile=0.1, eyes=0.85)),
            (0.8, dict(rest, smile=0.1, eyes=0.85)),
            (1.6, dict(HANDS_UP, lean=-8, head_pitch=-16, eyes=0.05, mouth_open=0.7, smile=-0.2, brow_raise=0.5), 'out'),
            (2.2, dict(HANDS_UP, lean=-9, head_pitch=-18, eyes=0.05, mouth_open=0.75, smile=-0.2, brow_raise=0.5)),
            (2.75, dict(CHEEKS, lean=2, head_pitch=0, eyes=0.95, mouth_open=0.0, smile=0.2, brow_raise=0.2)),
            (3.4, dict(CHEEKS, lean=3, head_pitch=0, eyes=0.95, smile=0.7, brow_raise=0.4)),
            (4.0, dict(typing(0), lean=14, head_pitch=8, eyes=0.9, smile=0.5, brow_raise=0.0)),
        ], base=SIT)
        self.blinks = [0.45, 3.5, 4.6]

    def frame(self, t, i):
        pz = self.P(t)
        if 2.75 <= t < 3.4:        # two pats on the cheeks
            k = 0.5 + 0.5 * math.cos((t - 2.75) / 0.65 * 2 * math.pi * 2)
            pz['arm_r_w'] = (-9.9 + 0.5 * k, -1.2, 9.3)
            pz['arm_l_w'] = (-14.1 - 0.5 * k, -1.2, 9.3)
        if t >= 4.0:
            pz.update(typing(i))
        pz['eyes'] = pz['eyes'] * (1 - blink(t, self.blinks))
        self.pose(t, i, **pz)


# =============================================================================
# S03b  over the shoulder: click 投递 -> 投递成功
# =============================================================================
class S03b(DormShot):
    name = 's03b'
    dur = 4.0
    hour = 8.4
    seed = 4

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.8)
        d.show_month(9)
        d.set_notes(3)
        d.hide_upper_from_camera(True)
        bl.set_cam(self.cam, (-7.3, -8.2, 18.2), (-12.2, 3.9, 8.6), lens=46, fstop=8.0)
        self.cur = Keys([(0.0, (640, 380)), (0.4, (640, 380)), (1.9, (1030, 690), 'io'), (4.0, (1030, 690))])
        self.last = None

    def frame(self, t, i):
        d = self.d
        cx, cy = self.cur(t)
        pressed = 2.1 <= t < 2.3
        if t < 2.35:
            key = ('job', int(cx), int(cy), pressed)
            if key != self.last:
                d.laptop.show(tex.scr_job(n=0, cur=(cx, cy), pressed=pressed), strength=2.4, glow=0.35)
        else:
            k = min(1.0, (t - 2.35) / 0.25)
            key = ('ok', round(k, 2))
            if key != self.last:
                d.laptop.show(tex.scr_success(n=1, k=ease(k, 'back')), strength=2.4, glow=0.35)
        self.last = key
        # right hand on the trackpad following the cursor, left hand resting
        hx = PAD[0] + 0.9 + (cx - 640) / 1280 * 0.8
        hy = PAD[1] + 0.15 - (cy - 380) / 800 * 0.5
        hz = PAD[2] - (0.25 if pressed else 0.0)
        pz = dict(SIT, lean=13, head_pitch=9, look=(0.1, -0.35), smile=0.2 if t < 2.4 else 0.5,
                  brow_raise=0.0 if t < 2.4 else 0.6,
                  arm_r_w=(hx, hy, hz), arm_l_w=(-13.4, 1.1, 6.95), elbow_r=(-1, 0.3, -0.8), elbow_l=(1, 0.3, -0.8))
        pz['eyes'] = 0.88 * (1 - blink(t, [1.2]))
        self.pose(t, i, **pz)


# =============================================================================
# S03c  front close-up: joy, fist pump, ahoge springs up
# =============================================================================
class S03c(DormShot):
    name = 's03c'
    dur = 5.0
    hour = 8.5
    seed = 5
    front = True

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.45)
        d.show_month(9)
        d.set_notes(3)
        d.laptop.show(tex.scr_success(n=1), strength=2.4, glow=0.3)
        self.cam_hide(d.laptop.root)
        bl.set_cam(self.cam, (-12.4, 12.4, 13.4), (-12.0, 0.3, 10.1), lens=48, fstop=11.0)
        base = dict(typing(0), lean=12, head_pitch=7, look=(0, -0.3))
        pump_hi = dict(arm_r_w=(-9.4, -2.3, 12.9), elbow_r=(-1, 0.2, -1), arm_l_w=(-13.4, 0.9, 6.95))
        pump_lo = dict(arm_r_w=(-9.5, -2.0, 11.2), elbow_r=(-1, 0.2, -1), arm_l_w=(-13.4, 0.9, 6.95))
        self.P = Pose([
            (0.0, dict(base, smile=0.2, eyes=0.88, brow_raise=0.0, mouth_open=0.0)),
            (0.5, dict(base, smile=0.2, eyes=0.88, brow_raise=0.0)),
            (0.8, dict(base, smile=0.3, eyes=1.0, brow_raise=0.9, mouth_open=0.25, look=(0, -0.2), lean=8)),
            (1.3, dict(base, smile=1.0, eyes=0.0, eye_arch=1.0, mouth_open=0.35, brow_raise=0.6, lean=6,
                       head_pitch=0, blush=1.3)),
            (1.7, dict(pump_hi, smile=1.0, eyes=0.0, eye_arch=1.0, mouth_open=0.45, lean=2, head_pitch=-4,
                       ahoge=-0.15), 'back'),
            (2.0, dict(pump_lo, lean=4, ahoge=0.0)),
            (2.3, dict(pump_hi, lean=2, head_pitch=-5)),
            (2.6, dict(pump_lo, lean=4)),
            (3.3, dict(pump_lo, smile=0.8, eyes=0.0, eye_arch=1.0, mouth_open=0.1)),
            (3.8, dict(base, smile=0.6, eyes=0.9, eye_arch=0.0, mouth_open=0.0, head_pitch=6, lean=12,
                       brow_raise=0.1, blush=1.1)),
        ], base=SIT)

    def frame(self, t, i):
        pz = self.P(t)
        if t >= 4.0:
            pz.update(typing(i))
        if pz.get('eye_arch', 0) < 0.5:
            pz['eyes'] = pz['eyes'] * (1 - blink(t, [4.4]))
        self.pose(t, i, **pz)


# =============================================================================
# S04  montage: September passes in days and nights
# =============================================================================
class S04(DormShot):
    name = 's04'
    dur = 16.0
    hour = 9.0
    seed = 6

    def setup(self):
        d = self.d
        d.show_month(9)
        self.front_objects_visible(False)
        bl.set_cam(self.cam, (3.0, -31.5, 19.5), (-10.5, 4.0, 10.5), lens=32, fstop=11)
        self.last_scr = None

    def hour_at(self, t):
        return 9.0 + 24.0 * 6.5 * (t / self.dur) ** 1.3

    def frame(self, t, i):
        d = self.d
        u = t / self.dur
        hr = self.hour_at(t)
        p = d.set_time(hr, fill=0.9)
        night = p['night']
        n = int(round(2 + 236 * u ** 1.6))
        d.set_cups(1 + int(7.99 * u))
        d.set_notes(3 + int(11.99 * u))
        # laptop screens cycle
        seg = int(t / 0.62)
        f = (t % 0.62) / 0.62
        kind = seg % 5
        if kind == 0:
            scr = tex.scr_job(company=['星河科技', '远航集团', '蓝鲸互动', '北辰银行', '青橙智能'][seg % 5], n=n)
            key = ('job', seg, n)
        elif kind == 1:
            scr = tex.scr_form(round(f, 1), n=n, company=['远航集团', '万象传媒', '云启科技'][seg % 3])
            key = ('form', seg, round(f, 1), n)
        elif kind == 2:
            q = 60 + seg * 7
            scr = tex.scr_test(q % 300, choice=i % 4)
            key = ('test', seg, i % 4)
        elif kind == 3:
            scr = tex.scr_exam(1799 - int(f * 600), n=n)
            key = ('exam', seg, int(f * 10))
        else:
            scr = tex.scr_success(n=n)
            key = ('ok', seg, n)
        if key != self.last_scr:
            d.laptop.show(scr, strength=2.2, glow=0.3 + 1.0 * night)
            self.last_scr = key
        # the puppet wears down
        pz = dict(SIT, lean=12 + 10 * u, head_pitch=6 + 10 * u, ahoge=0.75 * u, hair_mess=0.6 * u,
                  bags=0.85 * u, eyes=0.9 - 0.32 * u, blush=1.0 - 0.6 * u, smile=0.3 - 0.9 * u,
                  brow_worry=0.7 * u, look=(0, -0.3))
        pz.update(typing(i, speed=1.0 + u))
        if 5.0 <= t < 5.9:          # rubs eyes
            pz.update(arm_r_w=(-11.2, -2.2, 10.6), elbow_r=(-1, 0.2, -1), eyes=0.0, head_pitch=4)
        if 9.6 <= t < 10.6:         # dozes off onto the desk, jolts awake
            k = ease((t - 9.6) / 0.6, 'in') if t < 10.2 else 0.0
            pz.update(lean=22 + 16 * k, head_pitch=16 + 20 * k, eyes=0.0 if t < 10.2 else 1.0,
                      brow_raise=0.0 if t < 10.2 else 1.0, **rest_hands())
        if 13.4 <= t < 14.1:        # slaps own cheeks to stay awake
            kk = 0.5 + 0.5 * math.cos((t - 13.4) / 0.7 * 2 * math.pi * 2)
            pz.update(CHEEKS, lean=6, head_pitch=0, eyes=0.95, brow_worry=0.8)
            pz['arm_r_w'] = (-9.9 + 0.5 * kk, -1.2, 9.3)
            pz['arm_l_w'] = (-14.1 - 0.5 * kk, -1.2, 9.3)
        pz['eyes'] = pz['eyes'] * (1 - blink(t, [1.3, 3.1, 7.2, 8.4, 11.8, 15.1]))
        self.pose(t, i, **pz)


# =============================================================================
# S05  calendar: September is torn off -> October full of red crosses
# =============================================================================
class CalendarTear(DormShot):
    name = None
    puppet = False
    tear_from = 9
    hour = 19.0
    t0 = 0.8

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.5)
        d.set_notes(14)
        d.show_month(self.tear_from)
        pg = d.cal_pages[self.tear_from]
        self.page = pg
        # hinge at the top edge
        top = pg.matrix_world.translation.copy()
        self.pivot = bl.empty('cal_hinge')
        self.pivot.parent = pg.parent
        self.pivot.location = pg.location + Vector((0, -0.01 * CM, 2.25 * CM))
        pg.parent = self.pivot
        pg.location = (0, 0, -2.25 * CM)
        pg.rotation_euler = (math.radians(90), 0, 0)
        self.rest = [vv.co.copy() for vv in pg.data.vertices]
        self.cam_hide(d.laptop.root, d.lamp.root, d.mug.root)
        self.cork_light(0.3)
        self.cam_keys = Keys([(0.0, (-8.4, 0.8, 10.6)), (self.dur, (-7.8, 2.6, 10.3))], ease='lin')

    def bend(self, c):
        me = self.page.data
        h = 4.5 * CM
        for vv, r in zip(me.vertices, self.rest):
            vfrac = (r.y + h / 2) / h           # 0 bottom .. 1 top
            vv.co = (r.x, r.y, r.z + c * CM * (1 - vfrac) ** 2)
        me.update()

    def frame(self, t, i):
        bl.set_cam(self.cam, self.cam_keys(t), (-8.0, 11.45, 10.1), lens=42, fstop=8.0)
        t0 = self.t0
        if t < t0:
            self.pivot.rotation_euler = (0, 0, 0)
            self.bend(0.0)
            self.page.hide_render = False
        elif t < t0 + 0.8:
            u = (t - t0) / 0.8
            self.bend(1.6 * ease(u, 'out'))
            self.pivot.rotation_euler = (math.radians(-70 * ease(u, 'in')), math.radians(8 * u), 0)
        elif t < t0 + 1.2:
            u = (t - t0 - 0.8) / 0.4
            self.bend(1.2)
            self.pivot.rotation_euler = (math.radians(-70 - 40 * u), math.radians(8 + 20 * u), 0)
            self.pivot.location = self.pivot.location  # stays hinged, flies with offset below
            self.page.location = (u * 6 * CM, -u * 4 * CM, -2.25 * CM + u * 9 * CM)
        else:
            self.page.hide_render = True


class S05(CalendarTear):
    name = 's05'
    dur = 4.0
    seed = 7
    tear_from = 9
    hour = 18.8


# =============================================================================
# S06  the phone, flooded: 感谢您的投递 x N, it walks to the desk edge
# =============================================================================
class S06(DormShot):
    name = 's06'
    dur = 10.0
    hour = 20.6
    puppet = False
    seed = 8

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.25)
        d.laptop.show(tex.scr_inbox(), strength=1.5, glow=0.3)
        d.hide_upper_from_camera(True)
        self.ph0 = Vector((-4.4, 3.4, DESK_Z))
        bl.set_cam(self.cam, (-4.6, 0.9, 16.8), (-4.5, 1.5, DESK_Z), lens=33, fstop=5.6)
        b, t, gap = [], 0.5, 0.95
        while t < 9.2:
            b.append(t)
            t += gap
            gap = max(0.2, gap * 0.86)
        self.buzz = b
        self.last = None

    def frame(self, t, i):
        d = self.d
        k = sum(1 for bb in self.buzz if t >= bb)
        steps = sum(1 for bb in self.buzz if t >= bb + 0.25)
        loc = self.ph0 + Vector((0.03 * steps, -0.165 * steps, 0))
        rot = 8.0 + 1.3 * steps
        for bb in self.buzz:
            if bb <= t < bb + 0.25:
                j = jit3('p6', i, 0.08)
                loc = loc + Vector((j[0], j[1], 0))
                rot += jit('p6r', i, 1.6)
        d.phone.root.location = v(loc)
        d.phone.root.rotation_euler = (0, 0, math.radians(rot))
        if k != self.last:
            rows = tex.INBOX
            notes = []
            for j in range(k - 1, max(-1, k - 6), -1):
                co, body = rows[j % len(rows)]
                notes.append(('邮件', f'【{co}】感谢您的投递', body + '……'))
            mm = 41 + k // 3
            img = tex.ph_lock(f'19:{mm:02d}', '10月16日 星期五', notes=notes, n_more=max(0, k - 5))
            d.phone.show(img if k else tex.ph_black(), strength=1.3 if k else 0.0, glow=0.05 if k else 0.0)
            self.last = k


# =============================================================================
# S07  buried under rejection letters
# =============================================================================
class S07(DormShot):
    name = 's07'
    dur = 12.0
    hour = 21.4
    seed = 9
    front = True

    CX, CY, RX, RY = -11.0, -1.6, 10.5, 11.5

    def dome(self, x, y, H):
        q = 1 - ((x - self.CX) / self.RX) ** 2 - ((y - self.CY) / self.RY) ** 2
        if q <= 0 or H <= 0:
            return 0.0
        lump = 0.35 * math.sin(x * 1.3 + 0.5) * math.cos(y * 1.1) + 0.25 * math.sin(x * 2.9 + y * 2.3)
        return H * q ** 0.72 + lump * min(1.0, H / 5.0) * q

    def H(self, t):
        return 13.4 * ease((t - 3.8) / 7.4, 'io') if t > 3.8 else 0.0

    def support(self, x, y):
        if -23 <= x <= -1 and 0 <= y <= 12:
            return DESK_Z
        return 0.0

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.3)
        d.hide_upper_from_camera(True)
        d.show_month(10)
        d.set_notes(14)
        d.set_cups(8)
        d.laptop.show(tex.scr_inbox(), strength=1.8, glow=0.7)
        bl.set_cam(self.cam, (-12.4, 17.5, 16.2), (-12.0, -1.6, 9.4), lens=38, fstop=10.0)
        bl.area_light('s07key', (-6, 12, 26), (-12, -2, 9), energy=1.3, size=12, color=(1.0, 0.86, 0.68))
        bl.area_light('s07rim', (-24, -16, 20), (-12, -2, 10), energy=3.0, size=10, color=(0.55, 0.65, 1.0))
        self.base_pose = dict(SIT, lean=6, head_pitch=2, bags=0.8, hair_mess=0.5, ahoge=0.0, smile=-0.35,
                              brow_worry=0.5, eyes=0.8, blush=0.4, look=(0, 0.1),
                              arm_r_w=(-10.3, -0.3, 6.75), arm_l_w=(-13.7, -0.3, 6.75),
                              elbow_r=(-1, 0.3, -0.6), elbow_l=(1, 0.3, -0.6))
        self.pose(0, 0, **self.base_pose)
        bpy.context.view_layer.update()
        hp = self.p.head_pivot.matrix_world
        head_top = hp @ Vector((0, 0, 4.98 * CM))
        sh_r = self.p.body.matrix_world @ Vector((-1.5 * CM, 0, 4.2 * CM))
        sh_l = self.p.body.matrix_world @ Vector((1.5 * CM, 0, 4.2 * CM))
        ht = head_top / CM
        # --- envelope pool
        self.env = props.Envelopes(n=330, size=(2.5, 1.55))
        rng = random.Random(9)
        self.items = []
        # phase 1: hand-placed landings
        land = [((-17.0, 2.2, DESK_Z), 0.35), ((-6.8, 3.0, DESK_Z), 0.8), ((-15.3, 6.2, DESK_Z), 1.15),
                ((ht.x + 0.1, ht.y, ht.z + 0.02), 1.5), ((-12.6, 2.5, 6.52), 1.8), ((-5.2, 1.2, DESK_Z), 2.05),
                ((-19.0, 7.0, DESK_Z), 2.3), ((ht.x - 0.2, ht.y + 0.2, ht.z + 0.06), 2.55),
                ((sh_r.x / CM, sh_r.y / CM, sh_r.z / CM), 2.8), ((-9.0, 7.5, DESK_Z), 3.0),
                ((-11.2, 1.9, 6.56), 3.2), ((sh_l.x / CM, sh_l.y / CM, sh_l.z / CM), 3.35),
                ((ht.x + 0.3, ht.y - 0.3, ht.z + 0.1), 3.5), ((-16.0, 0.8, DESK_Z + 0.02), 3.6),
                ((-7.5, 6.0, DESK_Z), 3.72), ((-20.0, 3.5, DESK_Z + 0.05), 3.85)]
        self.head_hits = [tt for p, tt in land if abs(p[0] - ht.x) < 0.5 and abs(p[2] - ht.z) < 0.5]
        for (pos, tt) in land:
            self.items.append(dict(kind='land', t=tt, pos=Vector(pos), yaw=rng.uniform(0, 360),
                                   tilt=(rng.uniform(-6, 6), rng.uniform(-6, 6)),
                                   start=Vector((pos[0] + rng.uniform(-2, 2), pos[1] + rng.uniform(-2, 2), 26.0)),
                                   spin=(rng.uniform(-90, 90), rng.uniform(-90, 90), rng.uniform(-180, 180))))
        # phase 2: rain of envelopes feeding the mound
        t, k = 3.9, 0
        while t < 11.1 and len(self.items) < 170:
            a = rng.uniform(0, 2 * math.pi)
            r = rng.random() ** 0.8 * 0.9
            x = self.CX + math.cos(a) * r * self.RX
            y = self.CY + math.sin(a) * r * self.RY
            self.items.append(dict(kind='fall', t=t, xy=(x, y), yaw=rng.uniform(0, 360),
                                   start=Vector((x + rng.uniform(-2, 2), y + rng.uniform(-2, 2), 27.0)),
                                   spin=(rng.uniform(-120, 120), rng.uniform(-120, 120), rng.uniform(-180, 180))))
            t += rng.uniform(0.03, 0.09)
        # static surface envelopes (the body of the heap)
        while len(self.items) < len(self.env.objs):
            a = rng.uniform(0, 2 * math.pi)
            r = rng.random() ** 0.65 * 0.95
            x = self.CX + math.cos(a) * r * self.RX
            y = self.CY + math.sin(a) * r * self.RY
            self.items.append(dict(kind='surf', xy=(x, y), yaw=rng.uniform(0, 360)))
        # --- the heap core: a displaced grid wearing an envelope collage
        img = imgs.to_bpy(tex.envelope_collage(), 'collage')
        mat = M.paper('heap_m', image=img, translucent=0.0, rough=0.85, fibers=1.5)
        nx = ny = 56
        verts, faces, uvs = [], [], []
        self.grid = []
        for j in range(ny + 1):
            for ii in range(nx + 1):
                x = self.CX - self.RX + 2 * self.RX * ii / nx
                y = self.CY - self.RY + 2 * self.RY * j / ny
                verts.append((x, y, -1.0))
                uvs.append((ii / nx, j / ny))
                self.grid.append((x, y))
        for j in range(ny):
            for ii in range(nx):
                a0 = j * (nx + 1) + ii
                faces.append((a0, a0 + 1, a0 + nx + 2, a0 + nx + 1))
        self.heap = bl.grid_mesh('heap', verts, faces, uvs=uvs, mat=mat, smooth=True)
        self.heap_H = None

    def env_pose(self, ob, loc, rot_deg):
        ob.location = v(loc)
        ob.rotation_euler = tuple(math.radians(a) for a in rot_deg)
        ob.hide_render = False

    def surface_rot(self, x, y, H, yaw):
        e = 0.3
        dzx = (self.dome(x + e, y, H) - self.dome(x - e, y, H)) / (2 * e)
        dzy = (self.dome(x, y + e, H) - self.dome(x, y - e, H)) / (2 * e)
        return (math.degrees(math.atan(dzy)) * -1, math.degrees(math.atan(dzx)), yaw)

    def frame(self, t, i):
        H = self.H(t)
        # heap mesh
        if H != self.heap_H:
            me = self.heap.data
            for vt, (x, y) in zip(me.vertices, self.grid):
                z = self.dome(x, y, H)
                vt.co.z = (z - 0.25 if z > 0.05 else -1.0) * CM
            me.update()
            self.heap_H = H
        for ob, it in zip(self.env.objs, self.items):
            if it['kind'] in ('land', 'fall'):
                t0 = it['t']
                if t < t0 - 0.36:
                    ob.hide_render = True
                    continue
                if it['kind'] == 'land':
                    rest = it['pos'] + Vector((0, 0, 0.03))
                    rest_rot = (it['tilt'][0], it['tilt'][1], it['yaw'])
                else:
                    x, y = it['xy']
                    zl = max(self.dome(x, y, self.H(max(t, t0))), self.support(x, y)) + 0.06
                    rest = Vector((x, y, zl))
                    rest_rot = self.surface_rot(x, y, self.H(max(t, t0)), it['yaw'])
                if t < t0:
                    u = (t - (t0 - 0.36)) / 0.36
                    k = ease(u, 'in')
                    pos = it['start'].lerp(rest, k)
                    rot = tuple(r0 * (1 - k) + r1 for r0, r1 in zip(it['spin'], rest_rot))
                    self.env_pose(ob, pos, rot)
                else:
                    self.env_pose(ob, rest, rest_rot)
            else:
                x, y = it['xy']
                z = self.dome(x, y, H)
                if z < self.support(x, y) + 0.6:
                    ob.hide_render = True
                    continue
                self.env_pose(ob, (x, y, z + 0.04), self.surface_rot(x, y, H, it['yaw']))
        # the laptop glow gets buried
        self.d.laptop.light.data.energy = 0.7 * max(0.0, 1 - H / 10.0)
        # puppet: still, blinking, flinching at hits; eyes follow the heap
        pz = dict(self.base_pose)
        flinch = any(h <= t < h + 0.17 for h in self.head_hits)
        e = 0.8 * (1 - blink(t, [0.9, 3.0, 5.6, 7.9]))
        if flinch:
            e = 0.1
            pz['brow_worry'] = 0.9
        if t > 6.5:
            pz.update(look=(0.0, -0.5), brow_worry=0.8, smile=-0.6)
        if t > 8.4:
            pz.update(look=(0.25, 0.4), brow_worry=1.0, brow_raise=0.4)
        pz['eyes'] = e
        pz['ahoge'] = 0.0 if t < 11.2 else min(0.7, (t - 11.2) * 1.6) + jit('ah', i, 0.05)
        self.pose(t, i, **pz)


# =============================================================================
# S10  calendar: October torn off -> November; the goal note has a "?" now
# =============================================================================
class S10(CalendarTear):
    name = 's10'
    dur = 3.0
    seed = 10
    tear_from = 10
    hour = 22.5
    t0 = 0.3

    def setup(self):
        super().setup()
        self.d.notes[0].hide_render = True
        self.d.goal_q.hide_render = False


# =============================================================================
# S11  mom calls
# =============================================================================
PHONE_NEAR = (-7.3, 0.7, DESK_Z)
TALK = [0.1, 0.45, 0.25, 0.5, 0.15, 0.4, 0.05, 0.35, 0.2, 0.45, 0.1, 0.3]


def talk(i, amt=1.0):
    return TALK[i % len(TALK)] * amt


class S11a(DormShot):
    """CU: incoming call 妈妈 on the desk, ringing."""
    name = 's11a'
    dur = 3.0
    hour = 22.3
    seed = 11

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.25)
        d.hide_upper_from_camera(True)
        d.show_month(11)
        d.laptop.show(tex.scr_inbox(), strength=1.6, glow=0.5)
        d.phone.root.location = v(PHONE_NEAR)
        d.phone.root.rotation_euler = (0, 0, math.radians(-8))
        bl.set_cam(self.cam, (-7.2, -1.2, 15.0), (-7.3, 0.9, DESK_Z), lens=35, fstop=5.6)

    def frame(self, t, i):
        d = self.d
        d.phone.show(tex.ph_call('妈妈', t=t * 1.2), strength=1.4, glow=0.06)
        ring = (t % 1.2) < 0.8
        j = jit3('r11', i, 0.06) if ring else (0, 0, 0)
        d.phone.root.location = v(PHONE_NEAR[0] + j[0], PHONE_NEAR[1] + j[1], PHONE_NEAR[2])
        d.phone.root.rotation_euler = (0, 0, math.radians(-8 + (jit('r11r', i, 1.2) if ring else 0)))
        # the puppet's hand enters at the end
        reach = ease((t - 2.1) / 0.8, 'io')
        pz = dict(SIT, lean=10, head_pitch=14, look=(0.4, -0.6), brow_worry=0.7, smile=-0.2, bags=0.9,
                  hair_mess=0.6, ahoge=0.6, blush=0.3,
                  arm_r_w=(-9.6 + 2.1 * reach, -0.6 + 1.2 * reach, 7.2 - 0.3 * reach),
                  arm_l_w=(-13.6, -0.3, 6.8), elbow_r=(-1, 0.2, -1), elbow_l=(1, 0.3, -0.6))
        self.pose(t, i, **pz)


class S11b(DormShot):
    """Front CU: lit from below by the ringing phone. Hesitation."""
    name = 's11b'
    dur = 3.5
    hour = 22.3
    seed = 12
    front = True

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.05, lamp=0.25)
        d.hide_upper_from_camera(True)
        d.show_month(11)
        d.laptop.show(tex.scr_inbox(), strength=1.6, glow=0.2)
        d.phone.root.location = v(PHONE_NEAR)
        self.cam_hide(d.laptop.root)
        bl.set_cam(self.cam, (-12.8, 13.6, 12.6), (-11.9, 0.3, 10.0), lens=46, fstop=11.0)
        base = dict(SIT, lean=9, head_pitch=12, bags=0.9, hair_mess=0.6, ahoge=0.6, blush=0.3,
                    arm_r_w=(-10.2, -0.4, 6.9), arm_l_w=(-13.7, -0.4, 6.8),
                    elbow_r=(-1, 0.3, -0.6), elbow_l=(1, 0.3, -0.6))
        self.P = Pose([
            (0.0, dict(base, look=(0.45, -0.7), brow_worry=0.6, smile=-0.2, eyes=0.85, breath=0.0)),
            (0.9, dict(base, look=(0.45, -0.7), brow_worry=0.9, smile=-0.3, eyes=0.8, breath=1.0)),
            (1.5, dict(base, look=(0.0, -0.2), brow_worry=0.9, smile=-0.4, eyes=0.7, breath=0.2, head_pitch=6)),
            (2.2, dict(base, look=(0.5, -0.7), brow_worry=0.7, smile=0.0, eyes=0.85, breath=0.8, head_pitch=12)),
            (2.8, dict(base, look=(0.5, -0.7), brow_worry=0.5, smile=0.15, eyes=0.9,
                       arm_r_w=(-8.4, 0.3, 6.9), head_pitch=13)),
        ], base=SIT)

    def frame(self, t, i):
        d = self.d
        d.phone.show(tex.ph_call('妈妈', t=t * 1.2), strength=1.4, glow=0.35)
        pz = self.P(t)
        pz['eyes'] *= (1 - blink(t, [1.25, 2.5]))
        self.pose(t, i, **pz)


class PhoneAtEar(DormShot):
    """Holding the phone to the right ear (phone placed from the head, hand reaches it)."""
    name = None

    def place_phone(self, t, i, pz, held=1.0):
        d = self.d
        self.pose(t, i, **pz)
        bpy.context.view_layer.update()
        hp = self.p.head_pivot.matrix_world
        ear = hp @ Vector((-2.95 * CM, -0.2 * CM, 2.2 * CM))
        down = hp.to_3x3() @ Vector((0, 0, -1))
        fwd = hp.to_3x3() @ Vector((0, -1, 0))
        rest = Vector(PHONE_NEAR) * CM + Vector((0, 0, 0))
        loc = rest.lerp(ear, held)
        # orientation: phone long axis along the jaw line, screen facing the cheek
        m_ear = hp.to_3x3() @ Matrix_rot()
        q_rest = Euler((0, 0, math.radians(-8))).to_quaternion()
        q = q_rest.slerp(m_ear.to_quaternion(), held)
        d.phone.root.location = loc
        d.phone.root.rotation_euler = q.to_euler()
        # hand holds the back of the phone
        back = loc + (hp.to_3x3() @ Vector((-0.55 * CM, 0.1 * CM, -0.4 * CM))) * held
        pz = dict(pz, arm_r_w=tuple(back / CM), elbow_r=(-1, 0.6, -1))
        self.pose(t, i, **pz)


def Matrix_rot():
    from mathutils import Matrix as Mx
    # phone local: X width, Y length, Z screen normal. At the ear: length along head -Y..+Z diagonal,
    # screen normal towards +X of the head (the cheek)
    return (Mx.Rotation(math.radians(90), 3, 'Y') @ Mx.Rotation(math.radians(-65), 3, 'X'))


class S11c(PhoneAtEar):
    """Side medium shot on the phone: 'fine, still waiting'."""
    name = 's11c'
    dur = 10.0
    hour = 22.4
    seed = 13

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.2, lamp=0.8)
        d.show_month(11)
        d.laptop.show(tex.scr_inbox(), strength=1.6, glow=0.5)
        self.front_objects_visible(False)
        bl.set_cam(self.cam, (3.5, -9.5, 12.8), (-11.3, -1.6, 10.0), lens=42, fstop=8.0)
        base = dict(SIT, lean=4, bags=0.9, hair_mess=0.6, ahoge=0.6, blush=0.3, head_roll=-10, head_yaw=-8,
                    arm_l_w=(-13.6, -0.3, 6.8), elbow_l=(1, 0.3, -0.6))
        self.P = Pose([
            (0.0, dict(base, smile=0.1, brow_worry=0.4, eyes=0.85, look=(0.2, 0))),
            (1.5, dict(base, smile=0.35, brow_worry=0.3, eyes=0.85, head_pitch=4)),
            (2.3, dict(base, smile=0.0, brow_worry=0.9, eyes=0.75, look=(0.0, -0.6), head_pitch=10)),
            (3.9, dict(base, smile=-0.2, brow_worry=1.0, eyes=0.7, look=(0.2, -0.7), head_pitch=12)),
            (5.6, dict(base, smile=-0.25, brow_worry=1.0, eyes=0.7, look=(0.2, -0.7), head_pitch=12)),
            (6.1, dict(base, smile=0.45, brow_worry=0.9, eyes=0.8, look=(0.2, -0.2), head_pitch=6)),
            (7.8, dict(base, smile=0.4, brow_worry=0.9, eyes=0.8, look=(0.3, -0.3), head_pitch=6)),
            (8.6, dict(base, smile=0.2, brow_worry=1.0, eyes=0.7, look=(0.1, -0.6), head_pitch=10)),
            (10.0, dict(base, smile=0.3, brow_worry=1.0, eyes=0.75, look=(0.1, -0.5), head_pitch=8)),
        ], base=SIT)

    def frame(self, t, i):
        d = self.d
        d.phone.show(tex.ph_call('妈妈', connected_secs=21 + t), strength=0.5, glow=0.0)
        pz = self.P(t)
        if 1.6 <= t < 2.1:          # "嗯" with a nod
            pz['head_pitch'] = pz.get('head_pitch', 0) + 6 * math.sin((t - 1.6) / 0.5 * math.pi)
            pz['mouth_open'] = 0.15
        if 6.0 <= t < 7.6:          # 挺好的，在等消息
            pz['mouth_open'] = talk(i, 0.8)
        if 9.0 <= t < 9.8:          # small nods at "回家考公"
            pz['head_pitch'] = pz.get('head_pitch', 0) + 4 * math.sin((t - 9.0) / 0.4 * math.pi)
        pz['eyes'] *= (1 - blink(t, [1.1, 3.3, 8.4]))
        self.place_phone(t, i, pz, held=1.0)


class S11d(PhoneAtEar):
    """Front CU: 'don't worry' - puts the phone down, the smile collapses."""
    name = 's11d'
    dur = 5.5
    hour = 22.4
    seed = 14
    front = True

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.06, lamp=0.3)
        d.hide_upper_from_camera(True)
        d.show_month(11)
        d.laptop.show(tex.scr_inbox(), strength=1.6, glow=0.35)
        self.cam_hide(d.laptop.root)
        bl.set_cam(self.cam, (-12.6, 13.6, 12.6), (-11.9, 0.3, 10.0), lens=46, fstop=11.0)
        base = dict(SIT, lean=6, bags=0.9, hair_mess=0.6, ahoge=0.6, blush=0.3,
                    arm_l_w=(-13.6, -0.3, 6.8), elbow_l=(1, 0.3, -0.6))
        self.P = Pose([
            (0.0, dict(base, smile=0.45, brow_worry=0.8, eyes=0.85, look=(0.1, -0.1), head_roll=-8)),
            (1.6, dict(base, smile=0.45, brow_worry=0.8, eyes=0.85, look=(0.1, -0.1), head_roll=-8)),
            (2.4, dict(base, smile=0.4, brow_worry=0.8, eyes=0.85, look=(0.3, -0.5), head_roll=0, head_pitch=6)),
            (3.3, dict(base, smile=0.3, brow_worry=0.9, eyes=0.85, look=(0.0, -0.4), head_pitch=8)),
            (4.6, dict(base, smile=-0.7, brow_worry=1.0, eyes=0.55, look=(0.0, -0.6), head_pitch=12,
                       mouth_wobble=1.0), 'in'),
            (5.5, dict(base, smile=-0.75, brow_worry=1.0, eyes=0.5, look=(0.0, -0.65), head_pitch=13,
                       mouth_wobble=1.0, tear=0.0)),
        ], base=SIT)

    def frame(self, t, i):
        d = self.d
        pz = self.P(t)
        if t < 1.3:
            pz['mouth_open'] = talk(i, 0.7) if 0.1 < t < 1.2 else 0.0
        held = 1.0 - ease((t - 1.6) / 0.8, 'io')
        if held < 0.02:
            pz['tear'] = 0.0 if t > 4.8 else -1.0
            pz['arm_r_w'] = (-9.4, -0.1, 6.95)
            pz['elbow_r'] = (-1, 0.3, -0.6)
            d.phone.root.location = v(PHONE_NEAR)
            d.phone.root.rotation_euler = (0, 0, math.radians(-8))
            d.phone.show(tex.ph_black(), strength=0.0, glow=0.0)
            pz['eyes'] *= (1 - blink(t, [3.0]))
            self.pose(t, i, **pz)
        else:
            d.phone.show(tex.ph_call('妈妈', connected_secs=48 + t), strength=0.5, glow=0.0)
            self.place_phone(t, i, pz, held=held)


# =============================================================================
# S12  the spiral: everyone else's good news, the words, the room pressing down
# =============================================================================
MOMENT_CARDS = [('王同学', 'offer get！感恩一路帮助我的人', '#e8a33d'), ('室友阿杰', '上岸了！！！三年没白熬', '#4c9be8'),
                ('学委', '三方已签，江湖再见～', '#d65b5b'), ('陈一鸣', '拿到SP了，秋招圆满结束', '#58b37e'),
                ('表姐', '入职第一天，工牌好看吗', '#9b6bd6'), ('张可', '谢谢自己没有放弃', '#e07a9a')]
WORDS = ['学历', '双非', '实习经历', '经验不足', '不匹配', 'HC已满', '已读不回', '人才库', '考公？', '考研？',
         '延毕？', '灵活就业', '内卷', '毕业即失业', '别人都签了', '你还在等什么', '专业不对口', '再等等',
         '背景一般', '抗压能力', '流程终止', '很遗憾']


class S12(DormShot):
    name = 's12'
    dur = 18.0
    hour = 23.6
    seed = 15
    front = True

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.12, lamp=1.0)
        d.show_month(11)
        d.set_notes(14)
        d.set_cups(8)
        d.laptop.show(tex.scr_inbox(), strength=1.6, glow=0.4)
        self.cam_hide(d.laptop.root, d.mug.root, d.lamp.root, *[c.root for c in d.cups])
        # a cold, constant key (the window) so the flicker never plunges the frame into black
        bl.area_light('s12key', (-4, 14, 20), (-12, -2, 10), energy=0.9, size=10, color=(0.6, 0.7, 1.0))
        rng = random.Random(15)
        self.cards = []
        items = [('m', c) for c in MOMENT_CARDS] + [('w', w) for w in WORDS]
        order = [0, 1, 6, 2, 7, 3, 8, 9, 4, 10, 11, 5, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]
        for k, idx in enumerate(order[:len(items)]):
            kind, it = items[idx]
            if kind == 'm':
                pil = tex.moment_card(it[0], it[1], it[2], seed=k)
                w, h = 3.0, 3.0 * pil.height / pil.width
            else:
                pil = tex.strip(it, seed=k)
                h = 0.85
                w = h * pil.width / pil.height
            ob = props.paper_sheet(f'card{k}', pil, w, h, translucent=0.1, nx=4, ny=1, rough=0.9)
            ob.hide_render = True
            self.cards.append(dict(ob=ob, t0=2.0 + k * 0.38 + rng.uniform(-0.1, 0.1),
                                   r=rng.uniform(4.2, 7.2), z=rng.uniform(-2.5, 4.5), ph=rng.uniform(0, 6.28),
                                   tilt=rng.uniform(-25, 25), bob=rng.uniform(0.3, 1.0), dir=rng.choice([1, 1, -1])))
        self.upper0 = d.upper.location.copy()
        self.off = Keys([(0.0, (6.5, 13.0, 3.2)), (18.0, (0.5, 9.6, 0.9))], ease='io')
        self.lens = Keys([(0.0, 30.0), (18.0, 44.0)], ease='io')
        base = dict(SIT, bags=1.0, hair_mess=0.8, ahoge=0.7, blush=0.15)
        self.P = Pose([
            (0.0, dict(base, lean=10, head_pitch=16, look=(0, -0.6), smile=-0.3, brow_worry=0.7, eyes=0.8,
                       arm_r_w=(-11.0, -0.4, 7.9), arm_l_w=(-13.0, -0.4, 7.9), elbow_r=(-1, 0.3, -1),
                       elbow_l=(1, 0.3, -1))),
            (4.6, dict(lean=8, head_pitch=14, look=(0, -0.6), smile=-0.4, brow_worry=0.8)),
            (5.6, dict(lean=2, head_pitch=-2, look=(0.3, 0.3), smile=-0.5, brow_worry=0.9, brow_raise=0.4,
                       eyes=1.0, arm_r_w=(-10.4, -1.0, 6.8), arm_l_w=(-13.6, -1.0, 6.8))),
            (9.0, dict(squash=0.0, sweat=0.0, crack=0.0)),
            (13.5, dict(squash=0.26, sweat=1.0, crack=1.0, mouth_wobble=1.0, eyes=1.0, brow_raise=0.8)),
            (14.2, dict(arm_r_w=(-9.8, -1.2, 10.0), arm_l_w=(-14.2, -1.2, 10.0), elbow_r=(-1, -0.2, -1),
                        elbow_l=(1, -0.2, -1), hand_r_roll=-90, hand_l_roll=90, eyes=0.0, brow_angry=0.5,
                        brow_worry=1.0, head_pitch=6, smile=-0.8, mouth_open=0.3, squash=0.3)),
            (17.0, dict(squash=0.33, head_pitch=8)),
        ], base=base)

    def frame(self, t, i):
        d = self.d
        speed = 0.6 + 2.6 * ease(t / 16.5, 'in')
        frozen = t >= 17.0
        tt = min(t, 17.0)
        flick = 1.0
        if t > 6.0:
            r = jit('lamp', i, 1.0)
            if r > 1.0 - 0.25 * min(1.0, (t - 6) / 8):
                flick = 0.15
        if frozen:
            flick = 0.0
        d.lamp.set(flick > 0.1, flick)
        drop = 3.0 * ease((t - 3.0) / 9.0, 'io')
        d.upper.location = self.upper0 + Vector((0, 0, -drop * CM))
        pz = self.P(tt)
        if 5.6 <= tt < 13.5:
            pz['look'] = (math.sin(i * 1.7) * 0.6, 0.2 + 0.2 * math.sin(i * 0.9))
        if tt < 14.0:
            pz['eyes'] = pz.get('eyes', 0.9) * (1 - blink(tt, [1.0, 3.6, 7.4, 10.2, 12.6]))
        pz['jitter'] = 1.0 + 2.5 * ease(t / 16.0, 'in')
        self.pose(tt, i, **pz)
        bpy.context.view_layer.update()
        hc = self.p.head_pivot.matrix_world @ Vector((0, 0, 2.5 * CM))
        H = hc / CM
        for c in self.cards:
            ob = c['ob']
            if tt < c['t0']:
                ob.hide_render = True
                continue
            ob.hide_render = False
            age = tt - c['t0']
            ang = c['ph'] + c['dir'] * (age * speed * 0.9)
            r = c['r'] * (1.0 - 0.2 * ease(t / 17.0, 'in'))
            ob.location = v(H.x + math.cos(ang) * r, H.y - 0.5 + math.sin(ang) * r * 0.6,
                            H.z + c['z'] + c['bob'] * math.sin(age * 2.1))
            ob.rotation_euler = (math.radians(90 + c['tilt']), math.radians(jit('ct', i, 4)),
                                 ang + math.pi / 2 * c['dir'])
        o = self.off(t)
        bl.set_cam(self.cam, (H.x + o[0], H.y + o[1], H.z + o[2]), (H.x, H.y + 1.6, H.z - 0.3),
                   lens=self.lens(t), fstop=9.0)
        d.laptop.light.data.energy = 0.0 if frozen else 0.4


# =============================================================================
# S13  3 a.m., rain. On the floor by the ladder.
# =============================================================================
FLOOR = dict(loc=(3.2, -3.3, -0.55), yaw=8, lean=18, head_pitch=34,
             leg_r_w=(4.35, -6.0, 0.62), leg_l_w=(2.45, -6.2, 0.62), knee_r=(0, -0.3, 1), knee_l=(0, -0.3, 1),
             arm_r_w=(3.9, -6.3, 3.3), arm_l_w=(2.5, -6.3, 3.3), elbow_r=(-1, -0.5, 0.2), elbow_l=(1, -0.5, 0.2),
             hand_r_roll=-90, hand_l_roll=90, bags=1.0, hair_mess=0.8, ahoge=0.85, blush=0.1, crack=1.0,
             eyes=0.0, brow_worry=0.9, smile=-0.5, foot_pitch=-5)
FLOOR_PHONE = (6.3, -6.6, 0.0)


class Rain:
    """Drops sliding down the window glass + streaks falling outside."""

    def __init__(self, dorm, n_drops=26, n_streaks=34, seed=3):
        W0, W1, Z0, Z1 = dorm.win_box
        rng = random.Random(seed)
        mat = M.liquid('raindrop', color='#cfe2f2', alpha=0.55)
        smat = M.emissive('streak', '#9fb4d6', 0.9)
        self.drops, self.streaks = [], []
        for k in range(n_drops):
            ob = bl.sphere(f'drop{k}', radii=(0.12, 0.05, 0.16), mat=mat, subdiv=0, seg=10, rings=6)
            self.drops.append(dict(ob=ob, x=rng.uniform(W0 + 0.8, W1 - 0.8), z0=rng.uniform(Z0 + 1, Z1 - 1),
                                   sp=rng.uniform(0.6, 2.2), ph=rng.uniform(0, 30)))
        for k in range(n_streaks):
            ob = bl.box(f'streak{k}', (0.04, 0.04, rng.uniform(1.2, 2.4)), (0, 0, 0), mat=smat)
            ob.visible_shadow = False
            self.streaks.append(dict(ob=ob, x=rng.uniform(W0 - 4, W1 + 4), y=rng.uniform(16, 40),
                                     sp=rng.uniform(40, 70), ph=rng.uniform(0, 10)))
        self.box = (W0, W1, Z0, Z1)

    def update(self, t, i, on=1.0):
        W0, W1, Z0, Z1 = self.box
        for d in self.drops:
            ob = d['ob']
            ob.hide_render = on <= 0
            z = Z1 - 0.8 - ((d['ph'] + t * d['sp']) % (Z1 - Z0 - 1.6))
            ob.location = v(d['x'] + 0.05 * math.sin(z * 3 + d['ph']), 11.55, z)
        for s in self.streaks:
            ob = s['ob']
            ob.hide_render = on <= 0
            z = 34 - ((s['ph'] + t * s['sp']) % 40)
            ob.location = v(s['x'], s['y'], z)


class S13a(DormShot):
    """Wide, low: sitting on the floor against the ladder, the phone glowing 03:12, rain."""
    name = 's13a'
    dur = 6.5
    hour = 3.2
    seed = 16

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.12, lamp=0.0)
        d.show_month(11)
        d.set_cups(8)
        d.laptop.show(tex.scr_off(), strength=0.0, glow=0.0)
        self.front_objects_visible(False)
        self.chair_out()
        d.phone.root.location = v(FLOOR_PHONE)
        d.phone.root.rotation_euler = (0, 0, math.radians(30))
        d.phone.show(tex.ph_lock('03:12', '11月4日 星期三', notes=[], dark=0.4), strength=1.1, glow=0.08)
        self.rain = Rain(d)
        self.cam_path = Keys([(0.0, (-9.0, -26.0, 6.2)), (6.5, (-6.0, -21.5, 5.6))], ease='lin')

    def chair_out(self):
        self.d.chair.root.location = v(-15.0, -5.5, 0)
        self.d.chair.root.rotation_euler = (0, 0, math.radians(160))

    def frame(self, t, i):
        self.rain.update(t, i)
        bl.set_cam(self.cam, self.cam_path(t), (2.2, -3.5, 6.5), lens=32, fstop=8.0)
        pz = dict(FLOOR)
        lift = ease((t - 3.2) / 1.2, 'io')
        pz.update(head_pitch=34 - 22 * lift, eyes=0.45 * lift, look=(0.55 * lift, -0.5 * lift), lean=18 - 6 * lift)
        pz['breath'] = 0.5 + 0.5 * math.sin(t * 2.2)
        self.pose(t, i, **pz)


class S13b(S13a):
    """Front CU lit by the phone: a tear rolls down."""
    name = 's13b'
    dur = 5.0
    seed = 17

    def setup(self):
        super().setup()
        self.cam_path = None

    def frame(self, t, i):
        self.rain.update(t, i)
        pz = dict(FLOOR, head_pitch=12, eyes=0.45, look=(0.55, -0.5), lean=12)
        pz['tear'] = -1.0 if t < 0.8 else ease((t - 0.8) / 3.4, 'io')
        pz['tear_side'] = -1
        pz['mouth_wobble'] = 0.6
        pz['eyes'] = 0.45 * (1 - blink(t, [4.4], 0.3))
        pz['breath'] = 0.5 + 0.5 * math.sin(t * 2.2)
        self.pose(t, i, **pz)
        bpy.context.view_layer.update()
        hp = self.p.head_pivot.matrix_world
        face = hp @ Vector((0, -2.0 * CM, 2.45 * CM))
        camp = hp @ Vector((0.6 * CM, -13.5 * CM, 2.9 * CM))
        f = face / CM
        c = camp / CM
        bl.set_cam(self.cam, (c.x, c.y, c.z), (f.x, f.y, f.z), lens=50, fstop=11.0)


class S13c(S13a):
    """Insert, top-down: the notebook - 是我不够好吗？ (only the writing hand is in shot)"""
    name = 's13c'
    dur = 6.5
    seed = 18
    TEXT = '是我不够好吗？'

    def setup(self):
        super().setup()
        self.nb_pos = Vector((3.2, -7.9, 0.1))
        self.nb_img = imgs.to_bpy(tex.notebook(self.TEXT, 0.0), 'nb_tex')
        self.nb = bl.plane('notebook', 5.2, 6.6, loc=tuple(self.nb_pos), rot=(0, 0, 184),
                           mat=M.paper('nb_m', image=self.nb_img, translucent=0.0, rough=0.8), nx=6, ny=6,
                           bend=lambda u, t: 0.25 * (u - 0.5) ** 2)
        bl.box('nb_cover', (5.5, 6.9, 0.1), (3.2, -7.9, 0.02), rot=(0, 0, 184), mat=M.plastic('nbc', '#3f5f7f', rough=0.6))
        self.pen = bl.cylinder('pen13', r=0.1, h=3.0, mat=M.plastic('pen13m', '#1f1f1f', rough=0.3), seg=10)
        self.wet = bl.sphere('wetspot', radii=(0.35, 0.35, 0.02), mat=M.liquid('wet', alpha=0.5), subdiv=0)
        self.wet.hide_render = True
        self.last = -1
        self.chars_t = [1.0 + k * 0.45 for k in range(len(self.TEXT))]
        keep = {self.p.arms['r'].name} | {o.name for o in self.p.hands['r']['root'].children_recursive}
        for ob in self.p.all_objects():
            if ob.type != 'EMPTY' and ob.name not in keep:
                ob.visible_camera = False
        self.d.phone.show(tex.ph_lock('03:14', '11月4日 星期三', notes=[], dark=0.4), strength=1.1, glow=0.12)

    def frame(self, t, i):
        self.rain.update(t, i)
        n = sum(1 for c in self.chars_t if t >= c)
        if n != self.last:
            nm_ = self.nb.data.materials[0]
            node = nm_.node_tree.nodes[nm_['tex_node']]
            imgs.swap(node, tex.notebook(self.TEXT, n / len(self.TEXT)), 'nb_tex')
            self.last = n
        # the page is rotated 180 deg: text runs towards -X, first line near the far (-Y) edge
        prog = min(1.0, max(0.0, (t - 1.0) / (0.45 * len(self.TEXT))))
        wig = jit3('w13', i, 0.1) if 1.0 < t < self.chars_t[-1] + 0.3 else (0, 0, 0)
        px = self.nb_pos.x + 1.9 - 3.4 * prog
        py = self.nb_pos.y - 2.0
        lift = 0.35 if (t < 1.0 or t > self.chars_t[-1] + 0.5) else 0.0
        tip = Vector((px + wig[0] * 0.3, py + wig[1] * 0.3, 0.16 + lift))
        hand = (tip.x - 0.3, tip.y + 1.3, 1.25 + lift + wig[2] * 0.3)
        pz = dict(FLOOR, lean=26, head_pitch=24, eyes=0.5, look=(0, -0.5), arm_r_w=hand,
                  elbow_r=(-1, 0.3, 0.3), hand_r_roll=-30)
        self.pose(t, i, **pz)
        bpy.context.view_layer.update()
        hm = self.p.hands['r']['root'].matrix_world
        base = hm.translation / CM
        dvec = (tip - base).normalized()
        self.pen.location = v(tip)
        q = (-dvec).to_track_quat('Z', 'Y')
        self.pen.rotation_euler = q.to_euler()
        if t > 5.3:
            self.wet.hide_render = False
            self.wet.location = v(self.nb_pos.x - 0.6, self.nb_pos.y - 0.6, 0.13)
            s = min(1.0, (t - 5.3) / 0.4)
            self.wet.scale = (s, s, 1)
        bl.set_cam(self.cam, (self.nb_pos.x, self.nb_pos.y + 4.2, 11.0), (self.nb_pos.x, self.nb_pos.y - 0.4, 0.1),
                   lens=42, fstop=8.0)


# =============================================================================
# S14  dawn: mending the crack, one more application
# =============================================================================
class S14a(S13a):
    """Wide, low: dawn light fills the window; lifts the head."""
    name = 's14a'
    dur = 4.0
    hour = 6.3
    seed = 19

    def setup(self):
        super().setup()
        d = self.d
        d.set_time(self.hour, fill=0.45, lamp=0.0)
        d.phone.show(tex.ph_black(), strength=0.0, glow=0.0)
        self.cam_path = Keys([(0.0, (-6.0, -21.5, 5.6)), (4.0, (-5.0, -20.0, 5.8))], ease='lin')

    def frame(self, t, i):
        self.rain.update(t, i, on=0.0)
        self.d.set_time(6.3 + 0.35 * t / self.dur, fill=0.45, lamp=0.0)
        bl.set_cam(self.cam, self.cam_path(t), (2.2, -3.5, 6.5), lens=32, fstop=8.0)
        lift = ease((t - 0.8) / 1.6, 'io')
        pz = dict(FLOOR)
        pz.update(head_pitch=34 - 40 * lift, head_yaw=-38 * lift, eyes=0.7 * lift, look=(-0.4 * lift, 0.5 * lift),
                  lean=18 - 16 * lift, smile=-0.5 + 0.3 * lift)
        self.pose(t, i, **pz)


class S14b(S13a):
    """Front CU: smoothing the crack with both hands, pinching the tuft back up."""
    name = 's14b'
    dur = 5.5
    hour = 6.8
    seed = 20

    def setup(self):
        super().setup()
        d = self.d
        d.set_time(self.hour, fill=0.55, lamp=0.0)
        d.phone.show(tex.ph_black(), strength=0.0, glow=0.0)
        self.P = Pose([
            (0.0, dict(FLOOR, lean=2, head_pitch=-4, head_yaw=-10, eyes=0.75, look=(0, 0.2), smile=-0.3,
                       crack=1.0, crack_heal=0.0)),
            (0.9, dict(arm_l_w=(5.9, -4.6, 7.4), elbow_l=(1, 0, -1), hand_l_roll=90, eyes=0.1)),
            (3.4, dict(crack_heal=1.0, eyes=0.1)),
            (3.9, dict(arm_l_w=(4.6, -3.0, 2.8), arm_r_w=(3.4, -3.4, 10.9), elbow_r=(-1, 0, -1), eyes=0.8,
                       ahoge=0.85, look=(0, 0.6))),
            (4.4, dict(ahoge=-0.1, arm_r_w=(3.4, -3.3, 11.8), smile=0.1, brow_worry=0.5), 'snap'),
            (5.5, dict(ahoge=0.0, arm_r_w=(3.9, -6.3, 3.3), smile=0.25, brow_worry=0.35, eyes=0.85,
                       look=(0, 0.1), head_pitch=0)),
        ], base=dict(FLOOR))

    def frame(self, t, i):
        pz = self.P(t)
        if 0.9 <= t < 3.4:          # small rubbing circles over the crack
            a = (t - 0.9) * 2 * math.pi * 1.6
            x, y, z = pz['arm_l_w']
            pz['arm_l_w'] = (x + 0.35 * math.cos(a), y, z + 0.3 * math.sin(a))
        if pz['crack_heal'] >= 0.99:
            pz['crack'] = 0.0
        self.pose(t, i, **pz)
        bpy.context.view_layer.update()
        hp = self.p.head_pivot.matrix_world
        face = hp @ Vector((0.4 * CM, -1.6 * CM, 2.6 * CM))
        camp = hp @ Vector((-2.0 * CM, -16.0 * CM, 3.4 * CM))
        f, c = face / CM, camp / CM
        bl.set_cam(self.cam, (c.x, c.y, c.z), (f.x, f.y, f.z), lens=42, fstop=11.0)


class S14c(DormShot):
    """OTS at the laptop: the 301st application."""
    name = 's14c'
    dur = 4.0
    hour = 7.0
    seed = 21

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.7)
        d.show_month(11)
        d.set_notes(14)
        d.set_cups(8)
        d.hide_upper_from_camera(True)
        bl.set_cam(self.cam, (-7.3, -8.2, 18.2), (-12.2, 3.9, 8.6), lens=46, fstop=8.0)
        self.cur = Keys([(0.0, (700, 420)), (0.3, (700, 420)), (1.6, (1030, 690), 'io'), (4.0, (1030, 690))])
        self.last = None

    def frame(self, t, i):
        d = self.d
        cx, cy = self.cur(t)
        pressed = 1.9 <= t < 2.1
        if t < 2.15:
            key = ('job', int(cx), int(cy), pressed)
            if key != self.last:
                d.laptop.show(tex.scr_job(company='明日出行', title='品牌策划（校招）', n=300, cur=(cx, cy),
                                          pressed=pressed), strength=2.4, glow=0.4)
        else:
            k = min(1.0, (t - 2.15) / 0.25)
            key = ('ok', round(k, 2))
            if key != self.last:
                d.laptop.show(tex.scr_success(company='明日出行', n=301, k=ease(k, 'back')), strength=2.4, glow=0.4)
        self.last = key
        hx = PAD[0] + 0.9 + (cx - 640) / 1280 * 0.8
        hy = PAD[1] + 0.15 - (cy - 380) / 800 * 0.5
        hz = PAD[2] - (0.25 if pressed else 0.0)
        pz = dict(SIT, lean=12, head_pitch=8, look=(0.1, -0.35), bags=0.7, hair_mess=0.3, ahoge=0.0,
                  arm_r_w=(hx, hy, hz), arm_l_w=(-13.4, 1.1, 6.95), elbow_r=(-1, 0.3, -0.8), elbow_l=(1, 0.3, -0.8))
        pz['eyes'] = 0.85 * (1 - blink(t, [0.8, 3.2]))
        self.pose(t, i, **pz)


class S14d(DormShot):
    """Wide from behind, morning: a ginkgo leaf drifts past the window; the phone buzzes; she turns."""
    name = 's14d'
    dur = 5.0
    hour = 7.2
    seed = 22

    def setup(self):
        d = self.d
        d.set_time(self.hour, fill=0.9)
        d.show_month(11)
        d.set_notes(14)
        d.set_cups(8)
        d.laptop.show(tex.scr_success(company='明日出行', n=301), strength=2.4, glow=0.35)
        d.phone.root.location = v(PHONE_NEAR)
        d.phone.root.rotation_euler = (0, 0, math.radians(-8))
        self.front_objects_visible(False)
        bl.set_cam(self.cam, (-1.0, -33.0, 19.5), (-8.0, 4.0, 11.2), lens=31, fstop=11)
        leafm = M.clay('leafm', '#efc03f', prints=0.2)
        self.leaf = bl.sphere('leaf', radii=(0.9, 0.9, 0.08), mat=leafm, subdiv=1,
                              deform=lambda x, y, z: (x, y * (1 if y > -0.2 else 0.3), z))
        self.leaf_path = Keys([(0.0, (22.0, 16.0, 30.0)), (1.2, (18.0, 15.0, 24.0)), (2.4, (14.5, 15.5, 19.0)),
                               (3.6, (10.0, 15.0, 14.5)), (5.0, (7.0, 15.5, 8.0))], ease='lin')
        self.buzz = 3.4

    def frame(self, t, i):
        d = self.d
        p = self.leaf_path(t)
        self.leaf.location = v(p[0] + 0.8 * math.sin(t * 5), p[1], p[2])
        self.leaf.rotation_euler = (math.sin(t * 4) * 0.9, math.cos(t * 3) * 0.7, t * 2)
        ring = self.buzz <= t < self.buzz + 0.4
        if ring:
            j = jit3('b14', i, 0.05)
            d.phone.root.location = v(PHONE_NEAR[0] + j[0], PHONE_NEAR[1] + j[1], PHONE_NEAR[2])
            d.phone.show(tex.ph_lock('07:26', '11月4日 星期三', notes=[('邮件', '【明日出行】感谢您的投递', '')]),
                         strength=1.3, glow=0.05)
        elif t < self.buzz:
            d.phone.root.location = v(PHONE_NEAR)
            d.phone.show(tex.ph_black(), strength=0.0, glow=0.0)
        turn = ease((t - self.buzz - 0.3) / 0.6, 'io')
        pz = dict(SIT, lean=10, head_pitch=6, bags=0.7, hair_mess=0.3, ahoge=0.0, smile=0.1,
                  head_yaw=-30 * turn, head_pitch_=0, look=(0.6 * turn, -0.3))
        pz.pop('head_pitch_')
        pz.update(rest_hands())
        if t < 2.0:
            pz.update(typing(i, speed=0.7))
        self.pose(t, i, **pz)
