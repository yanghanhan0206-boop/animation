import sys, os, time, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import bl, mats as M, tex
from lib.dorm import Dorm, PELVIS
from lib.puppet import Puppet
OUT = sys.argv[-1]
res = (640, 360)
sc = bl.reset_scene()
bl.setup_render(res=res, samples=4)
t0 = time.time()
d = Dorm()
p = Puppet('xm')
print('build %.1fs' % (time.time() - t0), flush=True)
p.pose(reset=True, loc=PELVIS, yaw=180, lean=12, arm_r=(-1.3, -3.4, 2.6), arm_l=(1.3, -3.4, 2.6),
       elbow_r=(-1, 0, -1), elbow_l=(1, 0, -1), leg_r=(-0.9, -1.8, -1.6), leg_l=(0.9, -1.8, -1.6),
       knee_r=(0, -1, 0.3), knee_l=(0, -1, 0.3), head_pitch=8, smile=0.4)
d.laptop.show(tex.scr_job(n=1), strength=3.0, glow=0.6)
d.phone.show(tex.ph_lock(), strength=2.0, glow=0.0)
cam = bl.camera('cam', loc=(-40, -46, 26), target=(-6, 4, 10), lens=30, fstop=11)
for hour in (8.0, 13.0, 18.5, 22.0):
    d.set_time(hour)
    t0 = time.time(); bl.render_to(os.path.join(OUT, f'dorm_{hour:04.1f}.png')); print(hour, '%.1fs' % (time.time() - t0), flush=True)
