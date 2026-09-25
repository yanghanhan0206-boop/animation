"""小满 - the clay puppet.

Built from plasticine primitives the way a real puppet is sculpted:
a round head with bead eyes and swing-down eyelids, rolled-clay brows and
mouth, a pressed-on hair cap with a stubborn tuft (呆毛), a mustard hoodie
torso, and wire-armature style limbs (tubes that bend smoothly at elbows
and knees, driven by a 2-bone IK).

Character local space: pelvis at origin, facing -Y, +Z up, character's
left hand on +X.  All inputs in centimetres.
"""
import math
import random
from mathutils import Vector, Euler, Quaternion, Matrix  # noqa

from . import bl
from .bl import CM, v
from . import mats as M

PALETTE = dict(
    skin='#e6b287', hair='#1c1512', hoodie='#e3a12a', hoodie_dark='#c9861f',
    pants='#34405a', shoe='#efede4', sole='#8b8a86', eye='#f7f4ee', pupil='#0c0b0c',
    lip='#5a231d', mouth='#3a0e0e', blush='#f09a8a', bag='#c09088', crack='#2a1a14',
    suit='#252d45', shirt='#f1f0ea', tie='#a3302c', string='#f1ede2',
)

HEAD_PIVOT = (0.0, 0.0, 4.45)      # in body space
HC = Vector((0.0, 0.0, 2.5))       # head centre in head-pivot space
HR = (2.65, 2.42, 2.48)            # head radii
EYE_X, EYE_Y, EYE_Z = 0.95, -2.02, 0.12
SHOULDER = (1.62, 0.0, 3.8)
HIP = (0.85, 0.0, 0.25)
UPPER, FORE = 2.1, 1.95
THIGH, SHIN = 1.75, 1.7


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def surf_y(x, z, grow=0.0):
    """Front surface y of the head ellipsoid (head-centre coords)."""
    rx, ry, rz = HR[0] + grow, HR[1] + grow, HR[2] + grow
    q = 1.0 - (x / rx) ** 2 - (z / rz) ** 2
    return -ry * math.sqrt(max(q, 0.0))


def ik2(S, W, l1, l2, pole):
    """2-bone IK in cm. Returns elbow position."""
    S, W, pole = Vector(S), Vector(W), Vector(pole)
    d = W - S
    dist = d.length
    maxd = (l1 + l2) * 0.999
    if dist > maxd:
        d = d.normalized() * maxd
        W = S + d
        dist = maxd
    dist = max(dist, 1e-4)
    a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    h = math.sqrt(max(l1 * l1 - a * a, 0.0))
    dn = d.normalized()
    p = pole - dn * pole.dot(dn)
    if p.length < 1e-6:
        p = Vector((0, 0, 1)) if abs(dn.z) < 0.9 else Vector((0, 1, 0))
        p = p - dn * p.dot(dn)
    p.normalize()
    E = S + dn * a + p * h
    return E, W


DEFAULT = dict(
    loc=(0, 0, 3.9), yaw=0.0, scale=1.0, squash=0.0,
    lean=0.0, side=0.0, twist=0.0, breath=0.0,
    head_pitch=0.0, head_yaw=0.0, head_roll=0.0,
    eyes=0.88, eye_l=None, eye_r=None, look=(0.0, 0.0),
    brow_raise=0.0, brow_worry=0.0, brow_angry=0.0,
    smile=0.0, mouth_open=0.0, mouth_wide=1.0, mouth_wobble=0.0, mouth_side=0.0,
    blush=1.0, bags=0.0, hair_mess=0.0, ahoge=0.0, crack=0.0, crack_heal=0.0,
    arm_r=(-2.2, -1.0, 1.7), arm_l=(2.2, -1.0, 1.7),
    elbow_r=(-1, 0.6, -0.5), elbow_l=(1, 0.6, -0.5),
    hand_r_roll=0.0, hand_l_roll=0.0,
    leg_r=(-0.9, -0.2, -3.4), leg_l=(0.9, -0.2, -3.4),
    knee_r=(0, -1, 0.2), knee_l=(0, -1, 0.2),
    foot_r_yaw=0.0, foot_l_yaw=0.0, foot_pitch=0.0,
    tear=-1.0, tear_side=1, sweat=0.0, desat=0.0, jitter=1.0, frame=0,
    arm_r_w=None, arm_l_w=None, leg_r_w=None, leg_l_w=None, eye_arch=0.0,
    root_pitch=0.0, root_roll=0.0,
)


class Puppet:
    def __init__(self, name='xm', outfit='hoodie', coll=None, pal=None, detail=True,
                 mat_suffix=''):
        self.name = name
        self.coll = coll
        self.pal = dict(PALETTE)
        if pal:
            self.pal.update(pal)
        self.detail = detail
        self.outfit = outfit
        self._mk_materials(mat_suffix)
        self._build()
        self.params = dict(DEFAULT)
        self.pose()
        self.set_outfit(outfit)

    # ------------------------------------------------------------------
    def _mk_materials(self, sfx):
        p = self.pal
        n = self.name + sfx
        self.m = dict(
            skin=M.clay(n + '_skin', p['skin'], rough=0.5, sss=0.0, prints=1.0),
            hair=M.clay(n + '_hair', p['hair'], rough=0.55, spec=0.28, prints=0.6, sheen=0.0),
            lash=M.clay(n + '_lash', '#241815', rough=0.6, prints=0.0),
            hoodie=M.clay(n + '_hoodie', p['hoodie'], rough=0.62, prints=0.8),
            hoodie2=M.clay(n + '_hoodie2', p['hoodie_dark'], rough=0.62, prints=0.8),
            pants=M.clay(n + '_pants', p['pants'], rough=0.6, prints=0.8),
            shoe=M.clay(n + '_shoe', p['shoe'], rough=0.5, prints=0.6),
            sole=M.clay(n + '_sole', p['sole'], rough=0.6, prints=0.3),
            eye=M.bead(n + '_eye', p['eye'], rough=0.2),
            pupil=M.bead(n + '_pupil', p['pupil'], rough=0.08),
            lip=M.clay(n + '_lip', p['lip'], rough=0.45, prints=0.2),
            mouth=M.clay(n + '_mouth', p['mouth'], rough=0.5, prints=0.0),
            blush=M.clay(n + '_blush', p['blush'], rough=0.55, prints=0.3),
            bag=M.clay(n + '_bag', p['bag'], rough=0.55, prints=0.3),
            crack=M.clay(n + '_crack', p['crack'], rough=0.7, prints=0.0),
            suit=M.clay(n + '_suit', p['suit'], rough=0.55, prints=0.7),
            shirt=M.clay(n + '_shirt', p['shirt'], rough=0.5, prints=0.5),
            tie=M.clay(n + '_tie', p['tie'], rough=0.45, prints=0.5),
            string=M.clay(n + '_string', p['string'], rough=0.6, prints=0.2),
            tear=M.liquid(n + '_tear'),
        )
        self.desat_mats = [self.m[k] for k in ('skin', 'hair', 'hoodie', 'hoodie2', 'pants',
                                               'shoe', 'lip', 'blush', 'suit', 'tie', 'string')]

    # ------------------------------------------------------------------
    def _build(self):
        c = self.coll
        n = self.name
        m = self.m
        det = self.detail
        sub = 2 if det else 1

        self.root = bl.empty(n + '_root', coll=c)
        self.body = bl.empty(n + '_body', parent=self.root, coll=c)

        # --- torso: pear-shaped, flattened bottom
        def torso_def(x, y, z):
            k = 1.0 + 0.13 * (-z)
            if z < -0.55:
                z = -0.55 + (z + 0.55) * 0.55
            return x * k, y * k * 0.98, z
        self.torso = bl.sphere(n + '_torso', radii=(1.9, 1.38, 2.45), loc=(0, 0, 2.25),
                               mat=m['hoodie'], parent=self.body, seg=32, rings=16,
                               subdiv=sub, deform=torso_def, coll=c)
        # hood roll behind neck
        hood_pts = bl.catmull([(-1.25, -0.2, 4.1), (-1.05, 0.75, 4.55), (0, 1.3, 4.75),
                               (1.05, 0.75, 4.55), (1.25, -0.2, 4.1)], 4)
        self.hood = bl.tube(n + '_hood', hood_pts, 0.52, m['hoodie2'], parent=self.body,
                            coll=c, bevel_res=4)
        # drawstrings
        self.strings = []
        for sx in (-1, 1):
            s = bl.tube(n + f'_str{sx}', [(0.38 * sx, -1.05, 4.2), (0.42 * sx, -1.32, 3.7),
                                          (0.46 * sx, -1.42, 3.05)], 0.075, m['string'],
                        parent=self.body, coll=c, bevel_res=2)
            self.strings.append(s)
        # kangaroo pocket
        self.pocket = bl.sphere(n + '_pocket', radii=(1.15, 0.28, 0.62), loc=(0, -1.33, 1.05),
                                mat=m['hoodie2'], parent=self.body, subdiv=1, coll=c)
        # suit bits (hidden unless outfit == suit)
        self.collar = bl.sphere(n + '_collar', radii=(0.75, 0.3, 0.75), loc=(0, -1.12, 3.85),
                                rot=(15, 0, 0), mat=m['shirt'], parent=self.body, subdiv=1,
                                coll=c, deform=lambda x, y, z: (x * (0.35 + 0.65 * max(0, (z + 1) / 2)), y, z))
        self.tie = bl.sphere(n + '_tie', radii=(0.26, 0.14, 1.05), loc=(0, -1.42, 3.05),
                             rot=(8, 0, 0), mat=m['tie'], parent=self.body, subdiv=1, coll=c,
                             deform=lambda x, y, z: (x * (1.0 - 0.45 * z), y, z))
        self.lapels = []
        for sx in (-1, 1):
            lp = bl.sphere(n + f'_lapel{sx}', radii=(0.35, 0.12, 1.1), loc=(0.62 * sx, -1.3, 3.55),
                           rot=(12, 0, -25 * sx), mat=m['suit'], parent=self.body, subdiv=1, coll=c)
            self.lapels.append(lp)

        self.neck = bl.cylinder(n + '_neck', r=0.62, h=0.9, loc=(0, 0, 4.1), mat=m['skin'],
                                parent=self.body, seg=16, coll=c)

        # --- head
        self.head_pivot = bl.empty(n + '_headpivot', loc=HEAD_PIVOT, parent=self.body, coll=c)
        hp = self.head_pivot

        def head_def(x, y, z):
            k = 1.0 - 0.035 * z          # slightly narrower crown
            kc = 1.0 + 0.05 * max(0.0, -z) * (1 - abs(z))  # full cheeks
            return x * k * kc, y * k, z
        self.head = bl.sphere(n + '_head', radii=HR, loc=tuple(HC), mat=m['skin'], parent=hp,
                              seg=40, rings=24, subdiv=sub, deform=head_def, coll=c)

        # hair cap: sphere pushed inside the head below a scalloped hairline
        def hair_def(x, y, z):
            X, Z = x * HR[0], z * HR[2]
            cut = 0.18 - 1.75 * y                       # high on the forehead, low at the nape
            wf = smooth((-y - 0.25) / 0.45)              # fringe only at the front
            wave = (0.5 + 0.5 * math.cos(2 * math.pi * (X + 0.1) / 0.82)) ** 1.6
            cut -= wf * (0.42 * wave + 0.05)
            t = smooth((Z - cut + 0.06) / 0.22)
            k = lerp(0.95, 1.07, t) + 0.035 * max(0.0, z) * t
            # sculpted strand ridges radiating from the crown (clay-tool grooves)
            phi = math.atan2(x, y + 0.35)
            k += 0.022 * t * (0.5 + 0.5 * math.sin(phi * 15.0 + 2.0 * z))
            return x * k, y * k, z * k
        self.hair = bl.sphere(n + '_hair', radii=HR, loc=tuple(HC), mat=m['hair'], parent=hp,
                              seg=128 if det else 64, rings=64 if det else 32,
                              subdiv=1 if det else 0, deform=hair_def, coll=c)
        self.bangs = []
        rng = random.Random(3)
        # ahoge (呆毛): a two-strand lock curling forward from the crown
        self.ahoge = [bl.tube(n + f'_ahoge{k}', self._ahoge_pts(0.0, sx), 0.17, m['hair'], parent=hp,
                              coll=c, radii=[1, 0.9, 0.75, 0.55, 0.35], bevel_res=3)
                      for k, sx in enumerate((-1, 1))]
        # messy strands (appear with stress)
        self.strands = []
        for i in range(7):
            a = rng.uniform(-2.4, 2.4)
            e = rng.uniform(0.35, 1.2)
            d = Vector((math.sin(a) * math.cos(e), math.cos(a) * math.cos(e) * 0.9 + 0.1,
                        math.sin(e))).normalized()
            base = Vector((d.x * HR[0] * 1.02, d.y * HR[1] * 1.02, d.z * HR[2] * 1.02)) + HC
            s = bl.tube(n + f'_strand{i}', [tuple(base), tuple(base + d * 0.3)], 0.075, m['hair'],
                        parent=hp, coll=c, radii=[1, 0.4], bevel_res=2)
            s['dir'] = tuple(d)
            s['base'] = tuple(base)
            s['len'] = rng.uniform(0.35, 0.62)
            s['curl'] = rng.choice([-1, 1]) * rng.uniform(0.6, 1.1)
            self.strands.append(s)

        # ears
        self.ears = []
        for sx in (-1, 1):
            e = bl.sphere(n + f'_ear{sx}', radii=(0.3, 0.5, 0.68),
                          loc=(2.55 * sx, 0.15, HC.z - 0.15), rot=(0, 0, -12 * sx),
                          mat=m['skin'], parent=hp, subdiv=1, coll=c)
            self.ears.append(e)
        # nose
        self.nose = bl.sphere(n + '_nose', radii=(0.34, 0.26, 0.27),
                              loc=(0, surf_y(0, -0.38) - 0.02, HC.z - 0.38), mat=m['skin'],
                              parent=hp, subdiv=1, coll=c)
        # blush
        self.blush = []
        for sx in (-1, 1):
            x, z = 1.62 * sx, -0.72
            b = bl.sphere(n + f'_blush{sx}', radii=(0.46, 0.12, 0.3),
                          loc=(x, surf_y(x, z) + 0.06, HC.z + z), rot=(0, 0, -32 * sx),
                          mat=m['blush'], parent=hp, subdiv=1, coll=c)
            self.blush.append(b)

        # eyes: sclera, pupil pivot, eyelid pivot, eye bag
        self.eyes = {}
        for side, sx in (('r', -1), ('l', 1)):
            ec = bl.empty(n + f'_eye_{side}', loc=(EYE_X * sx, EYE_Y, HC.z + EYE_Z),
                          rot=(0, 0, -9 * sx), parent=hp, coll=c)
            # unit-sphere eye space scaled into the ellipsoid, so pupils and lids
            # rotate on the sphere and always hug the eyeball
            es = bl.empty(n + f'_eyespace_{side}', parent=ec, coll=c)
            es.scale = (0.5, 0.34, 0.64)
            scl = bl.sphere(n + f'_sclera_{side}', r=1.0, mat=m['eye'], parent=es, subdiv=1, coll=c)
            pp = bl.empty(n + f'_pupilpiv_{side}', parent=es, coll=c)
            pup = bl.sphere(n + f'_pupil_{side}', radii=(0.5, 0.2, 0.47), loc=(0, -0.86, 0.03),
                            mat=m['pupil'], parent=pp, subdiv=1, coll=c)
            lp = bl.empty(n + f'_lidpiv_{side}', parent=es, coll=c)

            def lid_def(x, y, z):
                if y > 0:
                    y = 0.0
                return x, y, z
            lid = bl.sphere(n + f'_lid_{side}', r=1.12, mat=m['skin'], parent=lp, seg=24, rings=16,
                            subdiv=1, coll=c, deform=lid_def)
            lash = bl.tube(n + f'_lash_{side}',
                           [(1.1 * math.cos(a), -0.02, 1.1 * math.sin(a))
                            for a in [math.pi + math.pi * k / 16 for k in range(17)]],
                           0.16, m['lash'], parent=lp, coll=c, bevel_res=2,
                           radii=[0.3, 0.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0.3])
            bag = bl.sphere(n + f'_bag_{side}', radii=(0.46, 0.12, 0.17), loc=(0, -0.12, -0.72),
                            mat=m['bag'], parent=ec, subdiv=1, coll=c)
            # closed-eye line drawn on the lid (replacement-eyelid style)
            shut = bl.tube(n + f'_shut_{side}',
                           [(1.0 * math.sin(a), -1.14 * math.cos(a) * 0.98 - 0.0, -0.2 - 0.25 * math.cos(a))
                            for a in [-1.1 + 2.2 * k / 10 for k in range(11)]],
                           0.14, m['lash'], parent=es, coll=c, bevel_res=2,
                           radii=[0.3, 0.7, 1, 1, 1, 1, 1, 1, 1, 0.7, 0.3])
            arch = bl.tube(n + f'_arch_{side}',
                           [(1.0 * math.sin(a), -1.14 * math.cos(a) * 0.98, -0.45 + 0.3 * math.cos(a))
                            for a in [-1.1 + 2.2 * k / 10 for k in range(11)]],
                           0.15, m['lash'], parent=es, coll=c, bevel_res=2,
                           radii=[0.3, 0.7, 1, 1, 1, 1, 1, 1, 1, 0.7, 0.3])
            self.eyes[side] = dict(center=ec, sclera=scl, pp=pp, pupil=pup, lp=lp, lid=lid, bag=bag,
                                   lash=lash, shut=shut, arch=arch)

        # brows
        self.brows = {}
        for side in ('r', 'l'):
            b = bl.tube(n + f'_brow_{side}', [(0, 0, 0)] * 5, 0.14, m['hair'], parent=hp,
                        coll=c, radii=[0.6, 0.95, 1.0, 0.9, 0.55], bevel_res=3)
            self.brows[side] = b
        # mouth (cyclic lip loop + cavity)
        self.mouth = bl.tube(n + '_mouth', [(0, 0, 0)] * 4, 0.062, m['lip'], parent=hp, coll=c,
                             bevel_res=2)
        self.mouth.data.splines[0].use_cyclic_u = True
        self.cavity = bl.sphere(n + '_cavity', radii=(1, 1, 1), mat=m['mouth'], parent=hp,
                                subdiv=1, coll=c)
        # crack
        self.crack = bl.tube(n + '_crack', [(0, 0, 0), (0, 0, 0.01)], 0.1, m['crack'],
                             parent=hp, coll=c, bevel_res=1)
        self.crack_path = self._crack_path()
        self.crack_branch = bl.tube(n + '_crackb', [(0, 0, 0), (0, 0, 0.01)], 0.045, m['crack'],
                                    parent=hp, coll=c, bevel_res=1)
        # tear & sweat
        self.tear = bl.sphere(n + '_tear', radii=(0.17, 0.12, 0.24), mat=m['tear'], parent=hp,
                              subdiv=1, coll=c)
        self.tear_trail = bl.tube(n + '_trail', [(0, 0, 0), (0, 0, 0.01)], 0.07, m['tear'],
                                  parent=hp, coll=c, bevel_res=2)
        self.sweat = []
        for i in range(3):
            s = bl.sphere(n + f'_sweat{i}', radii=(0.14, 0.1, 0.2), mat=m['tear'], parent=hp,
                          subdiv=1, coll=c)
            self.sweat.append(s)

        # --- arms and hands
        self.arms, self.hands = {}, {}
        for side, sx in (('r', -1), ('l', 1)):
            a = bl.tube(n + f'_arm_{side}', [(0, 0, 0)] * 3, 0.5, m['hoodie'], parent=self.body,
                        coll=c, bevel_res=4)
            self.arms[side] = a
            hnd = bl.empty(n + f'_hand_{side}', parent=self.body, coll=c)
            palm = bl.sphere(n + f'_palm_{side}', radii=(0.5, 0.36, 0.6), loc=(0, 0, -0.45),
                             mat=m['skin'], parent=hnd, subdiv=1, coll=c)
            thumb = bl.sphere(n + f'_thumb_{side}', radii=(0.17, 0.17, 0.32),
                              loc=(0.0, -0.33, -0.2), rot=(-35, 0, 0), mat=m['skin'], parent=hnd,
                              subdiv=1, coll=c)
            cuff = bl.sphere(n + f'_cuff_{side}', radii=(0.56, 0.56, 0.2), loc=(0, 0, 0.12),
                             mat=m['hoodie2'], parent=hnd, subdiv=1, coll=c)
            self.hands[side] = dict(root=hnd, palm=palm, thumb=thumb, cuff=cuff)

        # --- legs and shoes
        self.legs, self.shoes = {}, {}
        for side, sx in (('r', -1), ('l', 1)):
            lg = bl.tube(n + f'_leg_{side}', [(0, 0, 0)] * 3, 0.62, m['pants'], parent=self.root,
                         coll=c, bevel_res=4)
            self.legs[side] = lg
            sh = bl.empty(n + f'_shoe_{side}', parent=self.root, coll=c)
            upper = bl.sphere(n + f'_shoeU_{side}', radii=(0.62, 1.02, 0.46), loc=(0, -0.3, -0.12),
                              mat=m['shoe'], parent=sh, subdiv=1, coll=c)
            sole = bl.sphere(n + f'_sole_{side}', radii=(0.66, 1.08, 0.16), loc=(0, -0.32, -0.46),
                             mat=m['sole'], parent=sh, subdiv=1, coll=c)
            self.shoes[side] = dict(root=sh, upper=upper, sole=sole)

    # ------------------------------------------------------------------
    def _ahoge_pts(self, droop, sx=1):
        o = 0.2 * sx
        up = [(o, 0.2, 2.4), (o * 0.85, 0.05, 2.95), (o * 0.55, -0.2, 3.38), (0.06, -0.62, 3.55),
              (0.08, -1.0, 3.38)]
        down = [(o, 0.2, 2.4), (o * 0.8 + 0.15, -0.35, 2.78), (o * 0.5 + 0.35, -0.85, 2.66),
                (0.5, -1.2, 2.32), (0.58, -1.42, 1.98)]
        pts = [tuple(lerp(a, b, droop) for a, b in zip(p, q)) for p, q in zip(up, down)]
        return bl.catmull([(x, y, z + HC.z) for x, y, z in pts], 3)

    def _crack_path(self):
        # jagged line across the left forehead/temple, in head-centre coords (x,z)
        xz = [(1.18, 1.42), (1.42, 1.12), (1.36, 0.95), (1.68, 0.84), (1.86, 0.98), (2.02, 0.62),
              (2.16, 0.7), (2.3, 0.32), (2.42, 0.22), (2.52, -0.18)]
        pts = []
        for x, z in xz:
            y = surf_y(x, z, grow=0.02)
            pts.append(Vector((x, y, z)) + HC)
        return pts

    # ------------------------------------------------------------------
    def set_outfit(self, outfit):
        self.outfit = outfit
        suit = outfit == 'suit'
        m = self.m
        self.torso.data.materials[0] = m['suit'] if suit else m['hoodie']
        for a in self.arms.values():
            a.data.materials[0] = m['suit'] if suit else m['hoodie']
        for h in self.hands.values():
            h['cuff'].data.materials[0] = m['shirt'] if suit else m['hoodie2']
        for ob in [self.hood, self.pocket] + self.strings:
            ob.hide_render = suit
        for ob in [self.collar, self.tie] + self.lapels:
            ob.hide_render = not suit

    def all_objects(self):
        return [self.root] + list(self.root.children_recursive)

    def hide(self, hidden=True):
        for ob in self.all_objects():
            if ob.type != 'EMPTY':
                ob.hide_render = hidden
        if not hidden:
            self.set_outfit(self.outfit)

    # ------------------------------------------------------------------
    def pose(self, reset=False, **kw):
        if reset:
            self.params = dict(DEFAULT)
        p = self.params
        p.update(kw)
        rng = random.Random(int(p['frame']) * 31 + sum(map(ord, self.name)))
        jit = p['jitter']

        def J(a=0.02):
            return rng.uniform(-a, a) * jit

        # root
        loc = Vector(p['loc'])
        self.root.location = loc * CM
        self.root.rotation_euler = (math.radians(p['root_pitch']), math.radians(p['root_roll']),
                                    math.radians(p['yaw']))
        s = p['scale']
        sq = p['squash']
        self.root.scale = (s * (1 + 0.55 * sq), s * (1 + 0.55 * sq), s * (1 - sq))
        # body
        self.body.rotation_euler = (math.radians(p['lean']), math.radians(p['side']),
                                    math.radians(p['twist']))
        br = 1.0 + 0.025 * p['breath']
        self.torso.scale = (br, br, 1.0 + 0.012 * p['breath'])
        # head
        self.head_pivot.rotation_euler = (math.radians(p['head_pitch'] + J(0.3)),
                                          math.radians(p['head_roll'] + J(0.3)),
                                          math.radians(p['head_yaw'] + J(0.3)))

        # eyes
        lx, lz = p['look']
        for side in ('r', 'l'):
            e = self.eyes[side]
            e['pp'].rotation_euler = (math.radians(lz * 28), 0, math.radians(lx * 30))
            op = p['eye_' + side] if p['eye_' + side] is not None else p['eyes']
            ang = -lerp(4.0, 178.0, max(0.0, min(1.0, op)))
            e['lp'].rotation_euler = (math.radians(ang), 0, 0)
            closed = op < 0.12
            happy = p['eye_arch'] > 0.5
            e['shut'].hide_render = not closed or happy
            e['arch'].hide_render = not closed or not happy
            e['lash'].hide_render = closed
            e['pupil'].hide_render = closed
            bg = p['bags']
            e['bag'].scale = (max(bg, 0.001), max(bg, 0.001), max(bg, 0.001))
            e['bag'].hide_render = bg < 0.02

        # brows
        for side, sx in (('r', -1), ('l', 1)):
            cx = EYE_X * sx
            z0 = EYE_Z + 0.9 + 0.26 * p['brow_raise']
            pts = []
            for k in range(5):
                t = k / 4                      # 0 = inner, 1 = outer
                x = cx + sx * lerp(-0.5, 0.5, t)
                arch = 0.12 * math.sin(t * math.pi)
                worry = p['brow_worry'] * lerp(0.36, -0.1, t)
                angry = p['brow_angry'] * lerp(-0.36, 0.12, t)
                z = z0 + arch + worry + angry + J(0.015)
                y = surf_y(x, z, grow=0.06)
                pts.append((x, y, z + HC.z))
            bl.set_tube(self.brows[side], pts, [0.6, 0.95, 1.0, 0.9, 0.55])

        # mouth
        w = 0.5 * p['mouth_wide']
        sm = p['smile']
        op = p['mouth_open']
        mz = -1.12
        up, lo = [], []
        N = 9
        for k in range(N):
            t = k / (N - 1)
            xn = lerp(-1, 1, t)
            x = xn * w + p['mouth_side'] * 0.2
            base = sm * 0.3 * (xn * xn - 0.35) + p['mouth_wobble'] * 0.07 * math.sin(xn * 7.0 + p['frame'] * 1.7)
            h = op * 0.38 * math.sqrt(max(0.0, 1 - xn * xn)) * (1.0 + 0.3 * max(0, -sm))
            zu = mz + base + h * 0.35 + J(0.012)
            zl = mz + base - h + J(0.012)
            up.append((x, surf_y(x, zu, 0.02), zu + HC.z))
            lo.append((x, surf_y(x, zl, 0.02), zl + HC.z))
        loop = up + lo[::-1][1:-1]
        bl.set_tube(self.mouth, loop)
        self.mouth.data.splines[0].use_cyclic_u = True
        if op > 0.03:
            self.cavity.hide_render = False
            cz = mz + sm * 0.3 * (-0.35) - op * 0.38 * 0.32
            self.cavity.location = v(p['mouth_side'] * 0.2, surf_y(0, cz, 0.0) + 0.14, cz + HC.z)
            self.cavity.scale = (w * 0.95, 0.18, max(op * 0.36, 0.02))
        else:
            self.cavity.hide_render = True

        # blush
        for b in self.blush:
            bb = max(p['blush'], 0.001)
            b.scale = (bb, 1.0, bb)
            b.hide_render = p['blush'] < 0.02

        # ahoge
        for k, sx in enumerate((-1, 1)):
            bl.set_tube(self.ahoge[k], self._ahoge_pts(max(-0.2, min(1.0, p['ahoge'])), sx),
                        [1.3, 1.15, 1.0, 0.92, 0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.42, 0.36, 0.3])
        # messy strands
        mess = p['hair_mess']
        for i, s in enumerate(self.strands):
            show = mess > (i / len(self.strands)) * 0.9
            s.hide_render = not show
            if show:
                d = Vector(s['dir'])
                b = Vector(s['base'])
                L = s['len'] * min(1.0, mess * 1.5)
                side = d.cross(Vector((0, 0, 1)))
                if side.length < 1e-3:
                    side = Vector((1, 0, 0))
                side.normalize()
                mid = b + d * L * 0.5 + side * s['curl'] * 0.25 * L
                tip = b + d * L + side * s['curl'] * 0.5 * L + Vector((0, 0, -0.1 * L))
                bl.set_tube(s, [tuple(b - d * 0.1), tuple(mid), tuple(tip)], [1.0, 0.7, 0.3])

        # crack
        cr = max(0.0, min(1.0, p['crack']))
        heal = max(0.0, min(1.0, p['crack_heal']))
        if cr > 0.01 and heal < 0.98:
            path = self.crack_path
            n = len(path)
            L = cr * (n - 1)
            k = int(L)
            f = L - k
            pts = [tuple(q) for q in path[:k + 1]]
            if k + 1 < n:
                pts.append(tuple(path[k].lerp(path[k + 1], f)))
            if len(pts) < 2:
                pts = [pts[0], pts[0]]
            rad = [lerp(1.0, 0.15, heal) * (0.6 + 0.4 * math.sin(math.pi * i / max(1, len(pts) - 1)))
                   for i in range(len(pts))]
            bl.set_tube(self.crack, pts, rad)
            self.crack.hide_render = False
            # branch from the 4th point
            if cr > 0.45:
                bb = path[4]
                t2 = min(1.0, (cr - 0.45) / 0.4)
                bx, bz = lerp(1.86, 1.7, t2), lerp(0.98, 0.66, t2)
                q1 = Vector((bx, surf_y(bx, bz, 0.02), bz)) + HC
                bx2, bz2 = lerp(1.86, 1.8, t2), lerp(0.98, 0.42, t2)
                q2 = Vector((bx2, surf_y(bx2, bz2, 0.02), bz2)) + HC
                bl.set_tube(self.crack_branch, [tuple(bb), tuple(q1), tuple(q2)],
                            [lerp(0.8, 0.1, heal), lerp(0.6, 0.1, heal), 0.2])
                self.crack_branch.hide_render = False
            else:
                self.crack_branch.hide_render = True
        else:
            self.crack.hide_render = True
            self.crack_branch.hide_render = True

        # tear: slides from lower lid down the cheek
        tr = p['tear']
        if tr >= 0:
            sx = p['tear_side']
            x0, z0 = EYE_X * sx * 1.02, EYE_Z - 0.62
            x1, z1 = EYE_X * sx * 1.25, -1.9
            t = max(0.0, min(1.0, tr))
            x, z = lerp(x0, x1, t), lerp(z0, z1, t)
            self.tear.location = v(x, surf_y(x, z, 0.08), z + HC.z)
            grow = min(1.0, tr * 4 + 0.3)
            self.tear.scale = (grow, grow, grow * (1 + 0.4 * t))
            self.tear.hide_render = False
            if t > 0.05:
                trail = []
                for k in range(6):
                    tt = t * k / 5
                    xx, zz = lerp(x0, x1, tt), lerp(z0, z1, tt)
                    trail.append((xx, surf_y(xx, zz, 0.02), zz + HC.z))
                bl.set_tube(self.tear_trail, trail, [0.5, 0.7, 0.8, 0.8, 0.8, 0.9])
                self.tear_trail.hide_render = False
            else:
                self.tear_trail.hide_render = True
        else:
            self.tear.hide_render = True
            self.tear_trail.hide_render = True

        # sweat
        sw = p['sweat']
        spots = [(-1.7, 1.25), (1.55, 1.55), (-2.1, 0.45)]
        for i, s in enumerate(self.sweat):
            if sw > i * 0.3 + 0.05:
                ph = (sw - i * 0.3) * 1.6
                x, z = spots[i][0], spots[i][1] - 0.6 * (ph % 1.0)
                s.location = v(x, surf_y(x, z, 0.1), z + HC.z)
                s.hide_render = False
            else:
                s.hide_render = True

        # world(cm) -> root / body space matrices (computed directly, no depsgraph update needed)
        sc_, sq_ = p['scale'], p['squash']
        root_m = (Matrix.Translation(loc) @
                  Euler((math.radians(p['root_pitch']), math.radians(p['root_roll']),
                         math.radians(p['yaw']))).to_matrix().to_4x4() @
                  Matrix.Diagonal((sc_ * (1 + 0.55 * sq_), sc_ * (1 + 0.55 * sq_), sc_ * (1 - sq_), 1.0)))
        body_m = root_m @ Euler((math.radians(p['lean']), math.radians(p['side']),
                                 math.radians(p['twist']))).to_matrix().to_4x4()
        root_inv, body_inv = root_m.inverted(), body_m.inverted()

        # arms (body space)
        for side, sx in (('r', -1), ('l', 1)):
            S = Vector((SHOULDER[0] * sx, SHOULDER[1], SHOULDER[2]))
            if p['arm_%s_w' % side] is not None:
                W = body_inv @ Vector(p['arm_%s_w' % side])
            else:
                W = Vector(p['arm_' + side])
            W = W + Vector((J(0.03), J(0.03), J(0.03)))
            E, W = ik2(S, W, UPPER, FORE, p['elbow_' + side])
            pts = bl.catmull([tuple(S + Vector((-0.25 * sx, 0, 0.1))), tuple(S), tuple(E), tuple(W)], 4)
            radii = []
            for i in range(len(pts)):
                tt = i / (len(pts) - 1)
                radii.append(lerp(1.0, 0.86, tt))
            bl.set_tube(self.arms[side], pts, radii)
            hd = self.hands[side]['root']
            d = (W - E).normalized()
            q = d.to_track_quat('-Z', 'Y')
            roll = p['hand_%s_roll' % side] + (90 * sx)
            q = q @ Quaternion((0, 0, 1), math.radians(roll))
            hd.location = W * CM
            hd.rotation_euler = q.to_euler()

        # legs (root space)
        for side, sx in (('r', -1), ('l', 1)):
            H = Vector((HIP[0] * sx, HIP[1], HIP[2]))
            if p['leg_%s_w' % side] is not None:
                A = root_inv @ Vector(p['leg_%s_w' % side])
            else:
                A = Vector(p['leg_' + side])
            K, A = ik2(H, A, THIGH, SHIN, p['knee_' + side])
            pts = bl.catmull([tuple(H + Vector((0, 0, 0.5))), tuple(H), tuple(K), tuple(A)], 4)
            bl.set_tube(self.legs[side], pts, [1.0] * len(pts))
            sh = self.shoes[side]['root']
            sh.location = A * CM
            sh.rotation_euler = (math.radians(p['foot_pitch']), 0,
                                 math.radians(p['foot_%s_yaw' % side]))

        M.set_desat(self.desat_mats, p['desat'])


def bake(pup, name):
    """Freeze a posed puppet into one mesh (for crowds of identical figures).
    Returns a mesh datablock centred on the puppet's pelvis."""
    import bmesh
    import bpy
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    mats = []
    origin = pup.root.matrix_world.translation.copy()
    for ob in pup.all_objects():
        if ob.type not in ('MESH', 'CURVE') or ob.hide_render:
            continue
        ev = ob.evaluated_get(deps)
        me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=False, depsgraph=deps)
        me.transform(Matrix.Translation(-origin) @ ob.matrix_world)
        off = len(mats)
        for m in me.materials:
            mats.append(m)
        for poly in me.polygons:
            poly.material_index += off
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    out = bpy.data.meshes.new(name)
    bm.to_mesh(out)
    bm.free()
    for m in mats:
        out.materials.append(m)
    return out
