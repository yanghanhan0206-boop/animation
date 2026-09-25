"""The dorm set (1:13 miniature): one corner of a four-person room with an
上床下桌 (loft bed over a desk), a window onto the other dorm blocks and a
ginkgo tree, a cork board, and the desk clutter of autumn recruitment.

Coordinates in cm. Back wall inner face y=12, desk front edge y=0,
desk top z=6.2. The puppet sits at about (-12, -1.8) facing +Y.
"""
import math
import random

import bpy
from mathutils import Vector

from . import bl, imgs, props, tex
from . import mats as M
from .bl import CM, v

DESK_Z = 6.2
SEAT = (-12.0, -2.8)
PELVIS = (-12.0, -2.0, 3.35)


def _lerp(a, b, t):
    return a + (b - a) * t


def _lerpc(a, b, t):
    return tuple(_lerp(x, y, t) for x, y in zip(a, b))


# time-of-day presets (hour -> look)
TOD = {
    0.0: dict(sun=0.0, sun_col=(1, .8, .6), sky_top='#050a16', sky_bot='#101a33', sky_st=0.6,
              win=0.25, win_col=(0.45, 0.55, 0.9), amb='#0a0e18', amb_st=0.5, night=1.0, lamp=1.0),
    5.5: dict(sun=0.0, sun_col=(1, .8, .6), sky_top='#1b2a4a', sky_bot='#6d6f86', sky_st=0.8,
              win=0.6, win_col=(0.55, 0.62, 0.9), amb='#1a2030', amb_st=0.6, night=0.8, lamp=0.0),
    6.5: dict(sun=1.2, sun_col=(1.0, 0.72, 0.45), sky_top='#6f8fbf', sky_bot='#f2c08c', sky_st=1.0,
              win=1.2, win_col=(0.8, 0.8, 0.9), amb='#6f6a66', amb_st=0.7, night=0.3, lamp=0.0),
    8.0: dict(sun=6.0, sun_col=(1.0, 0.86, 0.66), sky_top='#7fa9dc', sky_bot='#e9dcc6', sky_st=1.2,
              win=2.0, win_col=(0.85, 0.9, 1.0), amb='#a39c93', amb_st=0.9, night=0.0, lamp=0.0),
    13.0: dict(sun=8.0, sun_col=(1.0, 0.95, 0.86), sky_top='#6aa0dc', sky_bot='#dfe8ee', sky_st=1.4,
               win=2.6, win_col=(0.9, 0.95, 1.0), amb='#b3aea6', amb_st=1.0, night=0.0, lamp=0.0),
    17.0: dict(sun=5.0, sun_col=(1.0, 0.75, 0.48), sky_top='#7d8fc2', sky_bot='#f5b77e', sky_st=1.2,
               win=1.6, win_col=(0.95, 0.8, 0.7), amb='#8f8076', amb_st=0.8, night=0.1, lamp=0.0),
    18.5: dict(sun=0.8, sun_col=(1.0, 0.5, 0.35), sky_top='#3a3f70', sky_bot='#e0855a', sky_st=1.0,
               win=0.8, win_col=(0.8, 0.6, 0.7), amb='#40384a', amb_st=0.6, night=0.6, lamp=1.0),
    20.0: dict(sun=0.0, sun_col=(1, .8, .6), sky_top='#0a1326', sky_bot='#1f2a4a', sky_st=0.7,
               win=0.35, win_col=(0.45, 0.55, 0.9), amb='#0e1220', amb_st=0.5, night=1.0, lamp=1.0),
    24.0: dict(sun=0.0, sun_col=(1, .8, .6), sky_top='#050a16', sky_bot='#101a33', sky_st=0.6,
               win=0.25, win_col=(0.45, 0.55, 0.9), amb='#0a0e18', amb_st=0.5, night=1.0, lamp=1.0),
}


def tod_params(hour):
    hour = hour % 24.0
    ks = sorted(TOD)
    for a, b in zip(ks, ks[1:]):
        if a <= hour <= b:
            t = (hour - a) / (b - a)
            A, B = TOD[a], TOD[b]
            out = {}
            for k in A:
                x, y = A[k], B[k]
                if isinstance(x, str):
                    out[k] = _lerpc(M.srgb(x), M.srgb(y), t)
                elif isinstance(x, tuple):
                    out[k] = _lerpc(x, y, t)
                else:
                    out[k] = _lerp(x, y, t)
            return out
    return None


class Dorm:
    def __init__(self, coll=None, detail=True):
        self.coll = coll
        c = coll
        self.o = {}
        o = self.o
        rng = random.Random(7)

        # ---------------- materials
        wall = M.painted('wall', '#ece5d4', color2='#9fbfa3', split_z=10.0, rough=0.8)
        wall_l = M.painted('wall_l', '#e6dfcd', color2='#98b89c', split_z=10.0, rough=0.8)
        frame = M.painted('bedframe', '#dcdcd6', rough=0.45, brush=0.3)
        board = M.wood('board', light='#d5b184', dark='#b58d5f', scale=1.3)
        desk_m = M.wood('desk', light='#dcbc92', dark='#b9926a', scale=1.1, varnish=0.35)
        self.m = dict(wall=wall, frame=frame, board=board, desk=desk_m)

        # ---------------- room shell
        o['floor'] = bl.plane('floor', 90, 70, loc=(0, -22, 0), mat=M.tiles('tiles'), coll=c)
        W0, W1, WZ0, WZ1 = 6.0, 22.0, 9.5, 27.0            # window opening
        H = 38.0
        self.back = bl.empty('backwall_root', coll=c)
        bw = []
        bw.append(bl.box('bw_left', (W0 + 30, 1.2, H), ((-30 + W0) / 2, 12.6, H / 2), mat=wall,
                         parent=self.back, coll=c))
        bw.append(bl.box('bw_right', (40 - W1, 1.2, H), ((W1 + 40) / 2, 12.6, H / 2), mat=wall,
                         parent=self.back, coll=c))
        bw.append(bl.box('bw_below', (W1 - W0, 1.2, WZ0), ((W0 + W1) / 2, 12.6, WZ0 / 2), mat=wall,
                         parent=self.back, coll=c))
        bw.append(bl.box('bw_above', (W1 - W0, 1.2, H - WZ1), ((W0 + W1) / 2, 12.6, (WZ1 + H) / 2), mat=wall,
                         parent=self.back, coll=c))
        o['backwall'] = bw
        self.left = bl.empty('leftwall_root', coll=c)
        o['leftwall'] = bl.box('lw', (1.2, 70, H), (-24.6, -22, H / 2), mat=wall_l, parent=self.left, coll=c)
        # skirting
        o['skirt'] = bl.box('skirt', (70, 0.4, 0.8), (5, 11.8, 0.4), mat=M.painted('skirt', '#7f8f80'),
                            parent=self.back, coll=c)
        o['ceiling'] = bl.box('ceiling', (90, 70, 1.0), (0, -22, H + 0.5), mat=M.painted('ceil', '#efece4'), coll=c)

        # ---------------- window
        wf = M.painted('winframe', '#f2f1ec', rough=0.4, brush=0.2)
        self.window = bl.empty('window_root', parent=self.back, coll=c)
        wx, wz = (W0 + W1) / 2, (WZ0 + WZ1) / 2
        ww, wh = W1 - W0, WZ1 - WZ0
        for nm, sz, lc in [('wf_t', (ww, 1.6, 0.7), (wx, 12.2, WZ1 - 0.35)),
                           ('wf_b', (ww, 1.6, 0.7), (wx, 12.2, WZ0 + 0.35)),
                           ('wf_l', (0.7, 1.6, wh), (W0 + 0.35, 12.2, wz)),
                           ('wf_r', (0.7, 1.6, wh), (W1 - 0.35, 12.2, wz)),
                           ('wf_m', (0.5, 1.2, wh), (wx, 12.4, wz)),
                           ('wf_h', (ww, 1.0, 0.45), (wx, 12.5, WZ0 + wh * 0.72))]:
            bl.box(nm, sz, lc, mat=wf, parent=self.window, bevel=0.08, coll=c)
        o['sill'] = bl.box('sill', (ww + 2.0, 2.2, 0.5), (wx, 11.2, WZ0 - 0.1), mat=wf, parent=self.window,
                           bevel=0.1, coll=c)
        self.win_box = (W0, W1, WZ0, WZ1)
        # curtains
        cm = M.fabric('curtain', '#7f9cb8', color2='#6d8aa6', check=None)
        self.curtains = []
        for i, (x0, sgn) in enumerate([(W0 - 2.5, 1), (W1 + 2.5, -1)]):
            cu = bl.plane(f'curtain{i}', 5.5, 24, loc=(x0, 11.0, (WZ0 + WZ1) / 2 + 1.0), rot=(90, 0, 0), mat=cm,
                          coll=c, nx=24, ny=4, bend=lambda u, t: 0.55 * math.sin(u * math.pi * 6) * (0.6 + 0.4 * t))
            cu.parent = self.back
            self.curtains.append(cu)
        bl.cylinder('rod', r=0.18, h=ww + 10, loc=(W0 - 5, 11.0, WZ1 + 2.6), rot=(0, 90, 0),
                    mat=M.metal('rodm', '#a9a9a9'), parent=self.back, coll=c)

        # ---------------- outside
        self.sky_m = M.sky('sky')
        o['sky'] = bl.plane('skyplane', 260, 120, loc=(10, 95, 30), rot=(90, 0, 0), mat=self.sky_m, coll=c)
        o['sky'].visible_shadow = False
        day = imgs.to_bpy(tex.buildings(False, seed=3), 'bld_day')
        night = imgs.to_bpy(tex.buildings(True, seed=3), 'bld_night')
        self.bld_m = M.daynight_image('bld', day, night)
        o['bld'] = bl.plane('buildings', 110, 42, loc=(14, 70, 18), rot=(90, 0, 0), mat=self.bld_m, coll=c)
        o['bld'].visible_shadow = False
        # ginkgo tree
        self.tree = bl.empty('tree', loc=(30, 50, -4), coll=c)
        bark = M.clay('bark', '#5d4636', rough=0.8, prints=0.4)
        leaf = M.clay('ginkgo', '#e9b83c', rough=0.6, prints=0.3)
        leaf2 = M.clay('ginkgo2', '#d9a02e', rough=0.6, prints=0.3)
        bl.tube('trunk', [(0, 0, 0), (0.5, 0, 12), (-0.5, 0.5, 24), (0.4, 0, 34)], 1.3, bark, parent=self.tree,
                coll=c, radii=[1.3, 1.0, 0.8, 0.6])
        bl.tube('branch1', [(0, 0, 20), (-5, 1, 26), (-9, 0, 29)], 0.5, bark, parent=self.tree, coll=c,
                radii=[1, 0.7, 0.4])
        for i in range(14):
            a = i * 2.4
            r = rng.uniform(3, 10)
            p = (math.cos(a) * r - 4, math.sin(a) * 2, rng.uniform(22, 40))
            sp = bl.sphere(f'leafclump{i}', r=rng.uniform(2.5, 4.2), loc=p, mat=leaf if i % 3 else leaf2,
                           parent=self.tree, subdiv=1, coll=c,
                           deform=lambda x, y, z, s=i: (x * (1 + 0.18 * math.sin(7 * y + s)),
                                                        y * (1 + 0.15 * math.sin(5 * z + s)),
                                                        z * (1 + 0.12 * math.sin(6 * x + s))))
        # ---------------- loft bed unit (上床下桌)
        self.unit = bl.empty('unit', coll=c)
        U0, U1 = -23.0, -1.0
        ux = (U0 + U1) / 2
        o['desktop'] = bl.box('desktop', (U1 - U0, 12.0, 0.5), (ux, 6.0, DESK_Z - 0.25), mat=desk_m,
                              parent=self.unit, bevel=0.1, coll=c)
        o['desk_edge'] = bl.box('desk_edge', (U1 - U0, 0.2, 0.5), (ux, -0.05, DESK_Z - 0.25),
                                mat=M.plastic('edge', '#e7e2d8', rough=0.5), parent=self.unit, coll=c)
        for nm, x in (('side_l', U0 + 0.3), ('side_r', U1 - 0.3)):
            bl.box(nm, (0.6, 12.6, 18.4), (x, 6.0, 9.2), mat=frame, parent=self.unit, bevel=0.1, coll=c)
        self.upper = bl.empty('upper', parent=self.unit, coll=c)     # bed deck (moves in S12)
        bl.box('bed_deck', (U1 - U0 + 0.6, 13.4, 0.8), (ux, 5.7, 17.9), mat=frame, parent=self.upper, bevel=0.1, coll=c)
        bl.box('mattress', (U1 - U0 - 0.4, 12.4, 1.2), (ux, 5.7, 18.9), mat=M.fabric('mattress', '#e9e4da'),
               parent=self.upper, bevel=0.35, coll=c)
        blanket = M.fabric('blanket', '#e8a0a0', color2='#f2c6c0', check=1.2)
        bl.sphere('blanket', radii=(9.5, 6.6, 1.6), loc=(ux + 1.5, 5.2, 20.0), mat=blanket, parent=self.upper,
                  subdiv=2, coll=c, deform=lambda x, y, z: (x, y, z * (1 + 0.25 * math.sin(5 * x) * math.cos(3 * y))))
        bl.box('blanket_hang', (9.0, 0.5, 3.4), (ux + 3, -0.9, 18.2), rot=(4, 0, 0), mat=blanket,
               parent=self.upper, bevel=0.25, subdiv=1, coll=c)
        bl.sphere('pillow', radii=(2.4, 4.0, 1.0), loc=(U0 + 3.2, 6.0, 20.1), mat=M.fabric('pillow', '#f3efe6'),
                  parent=self.upper, subdiv=2, coll=c)
        # guard rail
        rail = M.painted('rail', '#d4d4ce', rough=0.4)
        bl.cylinder('rail', r=0.25, h=15.0, loc=(U0, -0.5, 22.4), rot=(0, 90, 0), mat=rail, parent=self.upper, coll=c)
        for x in (U0 + 0.3, U0 + 7.5, U0 + 14.8):
            bl.cylinder(f'railpost{x:.0f}', r=0.22, h=4.2, loc=(x, -0.5, 18.3), mat=rail, parent=self.upper, coll=c)
        # shelf with books
        bl.box('shelf', (U1 - U0 - 1.2, 3.6, 0.35), (ux, 10.2, 13.5), mat=board, parent=self.upper, coll=c)
        titles = [('管理学原理', '#3f6b4f'), ('市场营销学', '#2e5a88'), ('行测五千题', '#b33a3a'),
                  ('申论', '#8a5a2b'), ('面试宝典', '#d08a2f'), ('考研英语', '#4a4a7a'), ('统计学', '#6b7c3a')]
        x = U0 + 1.4
        for i, (tt, col) in enumerate(titles):
            th = rng.uniform(0.55, 0.9)
            ht = rng.uniform(3.2, 4.2)
            props.book(f'shelfbook{i}', size=(3.0, th, ht), loc=(x + th / 2, 10.2, 13.68),
                       rot=(0, 0, 0), color=col, title=tt, coll=c, parent=self.upper)
            # book() lays size along x,y,z = thickness, depth, height; spine faces -X: rotate so spine faces -Y
            ob = bpy.data.objects[f'shelfbook{i}']
            ob.rotation_euler = (0, 0, math.radians(90))
            ob.location = v(x + th / 2, 10.2, 13.68)
            x += th + 0.08
        # cactus on the shelf
        pot = M.clay('pot', '#c9714b', prints=0.5)
        cac = M.clay('cactus', '#5f9a5a', prints=0.6)
        bl.cylinder('pot', r=0.9, r2=1.1, h=1.2, loc=(U1 - 3.0, 10.2, 13.68), mat=pot, parent=self.upper, coll=c)
        bl.sphere('cactus', radii=(0.8, 0.8, 1.4), loc=(U1 - 3.0, 10.2, 15.4), mat=cac, parent=self.upper, coll=c)
        bl.sphere('cactus_arm', radii=(0.35, 0.35, 0.7), loc=(U1 - 2.1, 10.2, 15.6), rot=(0, 25, 0), mat=cac,
                  parent=self.upper, coll=c)
        # under-desk drawer cabinet
        bl.box('drawers', (5.0, 10.0, 5.4), (U0 + 3.4, 6.5, 2.7), mat=frame, parent=self.unit, bevel=0.15, coll=c)
        for k in range(3):
            bl.box(f'drawer_h{k}', (1.4, 0.3, 0.25), (U0 + 3.4, 1.4, 1.0 + k * 1.8), mat=M.metal('handle', '#9a9a9a'),
                   parent=self.unit, coll=c)
        # ladder
        self.ladder = bl.empty('ladder', loc=(1.0, 0.2, 0), coll=c)
        for x in (-1.5, 1.5):
            bl.cylinder(f'lad_rail{x}', r=0.28, h=23.0, loc=(x, 0, 0), mat=rail, parent=self.ladder, coll=c)
        for k in range(5):
            bl.cylinder(f'lad_rung{k}', r=0.22, h=3.0, loc=(-1.5, 0, 3.5 + k * 4.0), rot=(0, 90, 0), mat=rail,
                        parent=self.ladder, coll=c)

        # ---------------- cork board + wall papers
        o['cork'] = bl.box('cork', (17.0, 0.4, 5.6), (-12.5, 11.75, 9.95), mat=M.cork('corkm'), parent=self.unit, coll=c)
        bl.box('cork_frame', (17.6, 0.3, 6.2), (-12.5, 11.9, 9.95), mat=board, parent=self.unit, coll=c)
        # calendar pages (stack; top page can be torn)
        self.cal_pages = {}
        for m, marks in ((11, 'q'), (10, 'x'), (9, 'start')):
            pg = props.paper_sheet(f'cal{m}', tex.calendar(m, marks), 3.6, 4.5,
                                   loc=(-7.2, 11.45 - (11 - m) * 0.02, 10.0), rot=(90, 0, 0), coll=c, parent=self.unit,
                                   curl=0.0, translucent=0.08)
            self.cal_pages[m] = pg
        pin = M.clay('pin', '#d23a3a', gloss=0.5, prints=0)
        bl.sphere('calpin', r=0.22, loc=(-7.2, 11.2, 12.1), mat=pin, parent=self.unit, coll=c)
        o['photo'] = props.paper_sheet('photo', tex.photo(), 2.0, 2.4, loc=(-18.2, 11.5, 10.6), rot=(90, 4, 0),
                                       coll=c, parent=self.unit)
        o['countdown'] = props.paper_sheet('countdown', tex.countdown_sheet(), 2.2, 2.9, loc=(-3.6, 11.5, 10.3),
                                           rot=(90, -3, 0), coll=c, parent=self.unit)
        # sticky notes: first few always there; more appear during the montage
        notes = [
            (['目标', 'offer ×1'], 'y', (-10.9, 11.5, 11.5), 3),
            (['DDL', '10.15'], 'p', (-13.2, 11.5, 11.7), -5),
            (['早睡！'], 'g', (-15.3, 11.5, 11.4), 6),
            (['星河', '网申'], 'b', (-11.0, 11.5, 8.6), -4),
            (['笔试', '周六'], 'o', (-13.1, 11.5, 8.5), 5),
            (['群面', '14:00'], 'y', (-15.4, 11.5, 8.8), -2),
            (['别放弃'], 'p', (-19.6, 11.5, 8.2), 8),
            (['远航 ✗'], 'b', (-17.2, 11.5, 12.0), -7),
            (['蓝鲸 ✗'], 'g', (-4.2, 11.5, 12.3), 4),
            (['行测', '刷题'], 'o', (-19.9, 11.5, 12.2), -6),
            (['北辰', '二面?'], 'y', (-5.6, 11.5, 8.3), 7),
            (['青橙 ✗'], 'p', (-8.9, 11.5, 8.0), -3),
            (['万象', '笔试 ✗'], 'b', (3.0, 11.5, 13.5), 5),
            (['HR面', '加油'], 'g', (-24.0, 4.0, 11.0), -4),
        ]
        self.notes = []
        for i, (lines, col, p, r) in enumerate(notes):
            nt = props.sticky_note(f'note{i}', lines, col, loc=p, rot=(90, r, 0), coll=c, parent=self.unit,
                                   seed=i, size=1.7)
            if p[0] < -23:
                nt.parent = self.left
                nt.location = v(-23.9, p[1], p[2])
                nt.rotation_euler = (math.radians(90), math.radians(r), math.radians(90))
            self.notes.append(nt)
        self.goal_q = props.paper_sheet('goal_q', tex.sticky(['目标', 'offer ×1 ?'], 'y', seed=0), 1.7, 1.7,
                                        loc=(-10.9, 11.48, 11.5), rot=(90, 3, 0), coll=c, parent=self.unit, curl=0.18)
        self.goal_q.hide_render = True

        # ---------------- far side of the room (reverse shots)
        self.front = bl.empty('front_root', coll=c)
        bl.box('frontwall', (70, 1.2, H), (0, -47.0, H / 2), mat=wall, parent=self.front, coll=c)
        wood_w = M.wood('wardrobe', light='#d9c3a0', dark='#c2a67e', scale=0.8)
        for k, x in enumerate((-19.0, -10.5)):
            bl.box(f'wardrobe{k}', (8.2, 7.0, 26.0), (x, -42.8, 13.0), mat=wood_w, parent=self.front, bevel=0.15, coll=c)
            bl.box(f'wardrobe_h{k}', (0.3, 0.5, 2.4), (x + 3.2, -39.2, 14.0), mat=M.metal('whandle', '#b5b5b5'),
                   parent=self.front, coll=c)
        doorm = M.wood('door', light='#9b6b45', dark='#7d5334', scale=0.7, axis='Z')
        bl.box('door', (9.5, 0.6, 20.5), (0.5, -46.3, 10.25), mat=doorm, parent=self.front, bevel=0.1, coll=c)
        bl.sphere('doorknob', r=0.45, loc=(4.2, -45.8, 10.0), mat=M.metal('knob', '#d0c080', 0.25), parent=self.front,
                  coll=c)
        bl.box('towel', (3.2, 0.3, 5.0), (8.5, -46.2, 15.0), mat=M.fabric('towel', '#9fc4d8'), parent=self.front,
               bevel=0.3, subdiv=1, coll=c)
        props.paper_sheet('doorposter', tex.countdown_sheet(), 3.0, 3.9, loc=(0.5, -45.95, 15.5), rot=(90, 0, 180),
                          coll=c, parent=self.front)
        self.ceiling_lamp = bl.box('tube_lamp', (18, 1.4, 0.6), (-6, -20, H - 0.3), mat=M.emissive('tube', '#f4f6ff', 0.0),
                                   coll=c)

        # ---------------- furniture & desk props
        self.chair = props.Chair('chair', loc=(SEAT[0], SEAT[1], 0), yaw=180, seat=2.9, coll=c)
        self.laptop = props.Laptop('laptop', loc=(-12.0, 1.8, DESK_Z), coll=c)
        self.lamp = props.DeskLamp('lamp', loc=(-20.6, 9.2, DESK_Z), yaw=-35, coll=c)
        self.phone = props.Phone('phone', loc=(-4.6, 2.0, DESK_Z), rot=(0, 0, 12), coll=c)
        self.mug = props.Mug('mug', loc=(-3.4, 8.6, DESK_Z), coll=c)
        props.book('deskbook0', size=(4.2, 5.8, 0.7), loc=(-19.6, 3.3, DESK_Z), rot=(0, 0, 8), color='#b33a3a',
                   title='行测五千题', coll=c)
        props.book('deskbook1', size=(3.8, 5.2, 0.6), loc=(-19.4, 3.1, DESK_Z + 0.7), rot=(0, 0, -5),
                   color='#2e5a88', title='市场营销学', coll=c)
        props.book('deskbook2', size=(3.4, 4.8, 0.9), loc=(-19.7, 3.4, DESK_Z + 1.3), rot=(0, 0, 14),
                   color='#d08a2f', title='面试宝典', coll=c)
        # noodle cup tower (grows during the montage)
        self.cups = []
        for i in range(9):
            cp = props.NoodleCup(f'cup{i}', loc=(-6.2 + rng.uniform(-0.12, 0.12), 7.2 + rng.uniform(-0.12, 0.12),
                                                  DESK_Z + i * 0.62), rot=(0, 0, rng.uniform(0, 360)),
                                 coll=c, eaten=(i == 0), fork=(i == 0))
            self.cups.append(cp)
        self.set_cups(1)
        # printed resume on the desk
        o['resume'] = props.paper_sheet('resume_print', tex.scr_resume().crop((330, 70, 950, 800)), 3.0, 3.5,
                                        loc=(-16.0, 1.9, DESK_Z + 0.02), rot=(0, 0, -12), coll=c, curl=0.05)

        # ---------------- lights
        self.sun = bl.area_light('sunbeam', (30, 42, 47), (4, -6, 0), energy=0.0, size=14, color=(1, .9, .7),
                                 spread=40, coll=c)
        self.winlight = bl.area_light('winlight', ((W0 + W1) / 2, 13.5, (WZ0 + WZ1) / 2),
                                      ((W0 + W1) / 2, -10, 8), energy=0.0, size=ww, size_y=wh, coll=c)
        self.fill = bl.area_light('fill', (-10, -60, 40), (-10, 0, 8), energy=0.0, size=40, color=(1, 1, 1), coll=c)
        self.world_bg = bl.world((0.1, 0.1, 0.1), 0.5)
        self.hour = 8.0
        self.set_time(8.0)

    # ------------------------------------------------------------------
    def set_time(self, hour, fill=1.0, lamp=None):
        p = tod_params(hour)
        self.hour = hour
        self.sun.data.energy = p['sun'] * 55.0
        self.sun.data.color = p['sun_col']
        M.set_rgb(self.sky_m, 'top', p['sky_top'])
        M.set_rgb(self.sky_m, 'bot', p['sky_bot'])
        M.set_value(self.sky_m, 'strength', p['sky_st'])
        M.set_rgb(self.sky_m, 'cloud', _lerpc((1, 1, 1), p['sky_top'], p['night'] * 0.8))
        self.winlight.data.energy = p['win'] * 3.0
        self.winlight.data.color = p['win_col']
        self.world_bg.inputs[0].default_value = (*p['amb'], 1)
        self.world_bg.inputs[1].default_value = p['amb_st']
        M.set_value(self.bld_m, 'night', p['night'])
        self.fill.data.energy = fill * (6.0 + 18.0 * (1 - p['night']))
        self.fill.data.color = _lerpc((1.0, 0.97, 0.93), (0.55, 0.62, 0.85), p['night'])
        lp = p['lamp'] if lamp is None else lamp
        self.lamp.set(lp > 0.5, lp)
        return p

    def set_cups(self, n):
        for i, cp in enumerate(self.cups):
            hide = i >= n
            for ob in [cp.root] + list(cp.root.children_recursive):
                ob.hide_render = hide

    def set_notes(self, n):
        for i, nt in enumerate(self.notes):
            nt.hide_render = i >= n

    def show_month(self, month):
        for m, pg in self.cal_pages.items():
            pg.hide_render = m < month

    def hide_upper_from_camera(self, hide=True):
        """The loft bed hangs over the desk; top-down cameras look 'through' it."""
        for ob in self.upper.children_recursive:
            ob.visible_camera = not hide

    def hide_for_front_camera(self, hide=True):
        """Wild walls: hide back wall, cork board and everything pinned on it, window and
        curtains, so a camera can sit 'inside' the wall looking at the puppet's face."""
        obs = list(self.o['backwall']) + list(self.notes) + list(self.cal_pages.values())
        obs += [self.goal_q, self.o['photo'], self.o['countdown']] + list(self.curtains)
        obs += list(self.window.children_recursive)
        for nm in ('cork', 'cork_frame', 'skirt', 'calpin', 'rod'):
            ob = bpy.data.objects.get(nm)
            if ob:
                obs.append(ob)
        for ob in obs:
            ob.visible_camera = not hide
