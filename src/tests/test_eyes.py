import sys, os, time, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import bl, mats as M
from lib.puppet import Puppet
OUT = sys.argv[-1]
sc = bl.reset_scene()
bl.setup_render(res=(480, 270), samples=4)
bl.world((0.3, 0.3, 0.3), 1.0)
bl.area_light('key', (-25, -30, 35), (0, 0, 8), energy=6.0, size=25)
p = Puppet('xm')
cam = bl.camera('cam', loc=(0, -20, 11.1), target=(0, 0, 11.1), lens=100, fstop=None)
for e in (0.0, 0.3, 0.6, 0.9):
    p.pose(reset=True, loc=(0,0,3.9), eyes=e)
    bpy.context.view_layer.update()
    lid = p.eyes['r']['lid']
    print('eyes', e, 'lid rot', tuple(round(math.degrees(a),1) for a in p.eyes['r']['lp'].rotation_euler), 'lid world z-axis', tuple(round(x,2) for x in lid.matrix_world.col[1][:3]))
    bl.render_to(os.path.join(OUT, f'eye_{e}.png'))
