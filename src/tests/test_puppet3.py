import sys, os, time, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import bl, mats as M
from lib.puppet import Puppet
OUT = sys.argv[-1]
sc = bl.reset_scene()
bl.setup_render(res=(960, 540), samples=6)
bl.world((0.05, 0.055, 0.065), 1.0)
floor = bl.plane('floor', 200, 200, mat=M.painted('floor', '#b9a58c'))
back = bl.plane('back', 200, 80, loc=(0, 30, 40), rot=(90, 0, 0), mat=M.painted('back', '#9fb8a4'))
bl.area_light('key', (-25, -30, 35), (0, 0, 8), energy=6.0, size=25, color=(1, 0.93, 0.85))
bl.area_light('fill', (30, -25, 15), (0, 0, 8), energy=1.6, size=40, color=(0.8, 0.88, 1))
bl.area_light('rim', (10, 25, 30), (0, 0, 10), energy=3.0, size=15, color=(1, 0.95, 0.9))
p = Puppet('xm')
cam = bl.camera('cam', loc=(5, -26, 11.0), target=(0.3, 0, 9.0), lens=70, fstop=5.6)
poses = {
 'a_neutral': dict(smile=0.5, eyes=0.9),
 'b_sad': dict(smile=-0.8, eyes=0.5, brow_worry=1.0, bags=1.0, hair_mess=0.8, ahoge=0.9,
           head_pitch=10, crack=1.0, tear=0.5, blush=0.2, arm_r=(-1.8,-1.2,1.2), arm_l=(1.8,-1.2,1.2)),
 'c_scared': dict(smile=-0.3, mouth_open=0.8, eyes=1.0, brow_worry=0.8, brow_raise=0.8, look=(0.4,0.1), sweat=0.6, head_yaw=20),
 'd_closed': dict(smile=0.2, eyes=0.0, brow_worry=0.3, head_roll=8, ahoge=0.5),
}
for name, ps in poses.items():
    p.pose(reset=True, loc=(0,0,3.9), **ps)
    t0=time.time(); bl.render_to(os.path.join(OUT, f'r3_{name}.png')); print(name, '%.1f'%(time.time()-t0), flush=True)
