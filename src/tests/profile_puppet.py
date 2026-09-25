import sys, os, time, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
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
p.pose(loc=(0,0,3.9), smile=0.3)
def t(label, fn=None):
    if fn: fn()
    t0 = time.time(); bl.render_to(os.path.join(OUT, f'prof_{label}.png')); print(label, '%.1f' % (time.time()-t0), flush=True)
t('base')
t('base_again')
t('pose_change', lambda: p.pose(smile=0.5, frame=1))
t('s1', lambda: setattr(sc.cycles, 'samples', 1))
sc.cycles.samples = 16
t('nodof', lambda: setattr(cam.data.dof, 'use_dof', False))
cam.data.dof.use_dof = True
# simple materials
simple = M.plastic('simple', '#cc8844')
def simplify():
    for ob in bpy.data.objects:
        if ob.type in ('MESH','CURVE') and ob.data.materials:
            for i in range(len(ob.data.materials)):
                ob.data.materials[i] = simple
t('simplemats', simplify)
def nosubd():
    for ob in bpy.data.objects:
        for m in ob.modifiers:
            if m.type == 'SUBSURF': m.render_levels = 0
t('nosubd', nosubd)
