import sys, os, time, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import bl, mats as M
from lib.puppet import Puppet
OUT = sys.argv[-1]
sc = bl.reset_scene()
bl.setup_render(res=(960, 540), samples=8)
bl.world((0.05, 0.055, 0.065), 1.0)
floor = bl.plane('floor', 200, 200, mat=M.painted('floor', '#b9a58c'))
back = bl.plane('back', 200, 80, loc=(0, 30, 40), rot=(90, 0, 0), mat=M.painted('back', '#9fb8a4'))
bl.area_light('key', (-25, -30, 35), (0, 0, 8), energy=6.0, size=25, color=(1, 0.93, 0.85))
bl.area_light('fill', (30, -25, 15), (0, 0, 8), energy=1.6, size=40, color=(0.8, 0.88, 1))
bl.area_light('rim', (10, 25, 30), (0, 0, 10), energy=3.0, size=15, color=(1, 0.95, 0.9))
p = Puppet('xm')
cam = bl.camera('cam', loc=(10, -42, 12), target=(0, 0, 8), lens=60, fstop=8)
p.pose(loc=(0,0,3.9), smile=0.3)
cy = sc.cycles
def t(label, fn=None):
    if fn: fn()
    t0 = time.time(); bl.render_to(os.path.join(OUT, f'prof2_{label}.png')); print(label, '%.1f' % (time.time()-t0), flush=True)
t('s8_warm')
t('s8')
def lowb():
    cy.diffuse_bounces=1; cy.glossy_bounces=1; cy.max_bounces=3; cy.transmission_bounces=2
t('s8_lowbounce', lowb)
t('s8_lowb_fastdn', lambda: setattr(cy, 'denoising_prefilter', 'FAST'))
cy.denoising_prefilter='ACCURATE'
def fastgi():
    cy.use_fast_gi = True
    sc.world.light_settings.ao_factor = 1.0
    sc.world.light_settings.distance = 0.2
    cy.ao_bounces_render = 1
t('s8_fastgi', fastgi)
cy.use_fast_gi = False
t('s8_nolighttree', lambda: setattr(cy, 'use_light_tree', False))
bpy.context.scene.render.threads_mode = 'FIXED'
bpy.context.scene.render.threads = 8
t('s8_8threads')
