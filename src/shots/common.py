"""Shared helpers for the dorm shots: scene setup, standard poses, typing."""
import math

import bpy

from lib import bl, tex, imgs
from lib import mats as M
from lib.anim import jit, jit3, ease, Keys, Pose, blink, auto_blinks  # noqa: F401
from lib.dorm import Dorm, PELVIS, DESK_Z
from lib.puppet import Puppet

# standard seated pose at the desk (puppet faces +Y, towards the desk)
SIT = dict(loc=PELVIS, yaw=180, lean=4,
           leg_r=(-0.95, -1.9, -1.55), leg_l=(0.95, -1.9, -1.55),
           knee_r=(0, -1, 0.5), knee_l=(0, -1, 0.5), foot_pitch=-12,
           arm_r=(-1.9, -1.6, 1.4), arm_l=(1.9, -1.6, 1.4),
           elbow_r=(-1, 0.4, -0.5), elbow_l=(1, 0.4, -0.5), eyes=0.88)

# world-space helper points (cm)
KB_Y, KB_Z = 1.25, 6.98       # wrist targets for typing (front rows of the keyboard)
PAD = (-12.0, 0.35, 6.9)      # wrist over the trackpad
X0 = -12.0


def typing(i, speed=1.0, spread=1.05, lift=0.2, y=KB_Y, z=KB_Z, x0=X0, key='type'):
    """Alternating hand taps on the keyboard (one pose per frame, stop-motion)."""
    ph = int(i * speed) % 4
    rz = lift if ph in (0, 1) else 0.0
    lz = lift if ph in (2, 3) else 0.0
    rx = x0 + spread + jit(key + 'rx', i, 0.25)
    lx = x0 - spread + jit(key + 'lx', i, 0.25)
    return dict(arm_r_w=(rx, y + jit(key + 'ry', i, 0.15), z + rz),
                arm_l_w=(lx, y + jit(key + 'ly', i, 0.15), z + lz),
                elbow_r=(-1, 0.3, -0.8), elbow_l=(1, 0.3, -0.8), hand_r_roll=0, hand_l_roll=0)


def rest_hands(y=KB_Y - 0.2, z=KB_Z, x0=X0, spread=1.3):
    return dict(arm_r_w=(x0 + spread, y, z), arm_l_w=(x0 - spread, y, z),
                elbow_r=(-1, 0.3, -0.8), elbow_l=(1, 0.3, -0.8))


class DormShot:
    """Base for shots on the dorm set."""
    name = None
    dur = 4.0
    fps = 12
    seed = 0
    hour = 8.0
    puppet = True
    front = False          # wild back wall for reverse angles

    def build(self):
        self.d = Dorm()
        self.p = Puppet('xm') if self.puppet else None
        if self.p:
            self.p.pose(reset=True, **SIT)
        self.cam = bl.camera('cam', loc=(0, -40, 20), target=(-8, 4, 10), lens=30, fstop=11)
        self.d.set_time(self.hour)
        if self.front:
            self.d.hide_for_front_camera(True)
        self.setup()

    def setup(self):
        pass

    def pose(self, t, i, **kw):
        if self.p:
            kw.setdefault('frame', i)
            self.p.pose(reset=True, **kw)

    def hide_puppet(self):
        if self.p:
            self.p.hide(True)

    def cam_hide(self, *roots):
        for r in roots:
            for ob in [r] + list(r.children_recursive):
                ob.visible_camera = False

    def cork_light(self, energy=0.3):
        """Soft bounce card lighting the cork board for calendar close-ups."""
        return bl.area_light('corkfill', (-6, 2, 13), (-8, 11.5, 10), energy=energy, size=8,
                             color=(1.0, 0.95, 0.88))

    def front_objects_visible(self, vis):
        for ob in self.d.front.children_recursive:
            ob.visible_camera = vis
