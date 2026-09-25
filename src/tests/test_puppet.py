import sys, os, time, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import bl, mats as M
from lib.puppet import Puppet
OUT = sys.argv[-1]
sc = bl.reset_scene()
bl.setup_render(res=(960, 540), samples=16)
bl.world((0.05, 0.055, 0.065), 1.0)
floor = bl.plane('floor', 200, 200, mat=M.painted('floor', '#b9a58c'))
back = bl.plane('back', 200, 80, loc=(0, 30, 40), rot=(90, 0, 0), mat=M.painted('back', '#9fb8a4'))
bl.area_light('key', (-25, -30, 35), (0, 0, 8), energy=6.0, size=25, color=(1, 0.93, 0.85))
bl.area_light('fill', (30, -25, 15), (0, 0, 8), energy=1.6, size=40, color=(0.8, 0.88, 1))
bl.area_light('rim', (10, 25, 30), (0, 0, 10), energy=3.0, size=15, color=(1, 0.95, 0.9))
p = Puppet('xm')
cam = bl.camera('cam', loc=(10, -42, 12), target=(0, 0, 8), lens=60, fstop=8)
poses = {
 'neutral': dict(loc=(0,0,3.9), smile=0.3, eyes=0.9),
 'happy': dict(loc=(0,0,3.9), smile=1.0, mouth_open=0.4, brow_raise=0.6, arm_r=(-1.5,-1.2,6.5), elbow_r=(-1,0,-1), ahoge=0.0, head_roll=-6),
 'sad': dict(loc=(0,0,3.9), smile=-0.8, eyes=0.55, brow_worry=1.0, bags=1.0, hair_mess=0.8, ahoge=0.9, head_pitch=14, crack=1.0, tear=0.5, lean=8, blush=0.2),
}
for name, ps in poses.items():
    p.pose(**ps)
    t = time.time()
    bl.render_to(os.path.join(OUT, f'puppet_{name}.png'))
    print(name, '%.1fs' % (time.time() - t), flush=True)
# closeup of face
p.pose(**poses['neutral'])
bl.set_cam(cam, (4, -26, 12.3), (0, 0, 10.2), lens=85, fstop=5.6)
bl.render_to(os.path.join(OUT, 'puppet_face.png'))
