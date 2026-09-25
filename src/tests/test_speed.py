import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import bl, mats as M
import shots
OUT = sys.argv[-1]
shot_name, fi = sys.argv[-3], int(sys.argv[-2])
sc = bl.reset_scene()
bl.setup_render(res=(960, 540), samples=3)
cy = sc.cycles
sh = shots.get(shot_name)(); sh.quality = 'final'; sh.build()
def go(label):
    sh.frame(fi / sh.fps, fi); M.boil_all(fi)
    bl.render_to(os.path.join(OUT, f'sp_{shot_name}_{label}_warm.png'))
    t0 = time.time()
    bl.render_to(os.path.join(OUT, f'sp_{shot_name}_{label}.png'))
    print('SPEED', shot_name, label, '%.2f' % (time.time() - t0), flush=True)
go('base')
cy.use_adaptive_sampling = False; go('noadapt')
cy.diffuse_bounces = 1; cy.glossy_bounces = 1; cy.max_bounces = 3; cy.transparent_max_bounces = 6; go('bounce1')
cy.denoising_prefilter = 'FAST'; go('fastdn')
cy.use_fast_gi = True; sc.world.light_settings.distance = 0.3; cy.ao_bounces_render = 1; go('fastgi')
cy.use_fast_gi = False; cy.denoising_prefilter = 'ACCURATE'
cy.samples = 2; go('s2_bounce1')
