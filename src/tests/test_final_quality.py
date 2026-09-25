"""Time + look at candidate final render settings on a few representative frames."""
import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import bl, mats as M
import shots
OUT = sys.argv[-1]
cases = [('s04', 150), ('s13b', 40), ('s09a', 60), ('s12', 150)]
settings = [('540_s3', (960, 540), 3), ('540_s5', (960, 540), 5), ('720_s3', (1280, 720), 3)]
for shot_name, fi in cases:
    for label, res, spp in settings:
        sc = bl.reset_scene()
        bl.setup_render(res=res, samples=spp)
        cls = shots.get(shot_name)
        sh = cls(); sh.quality = 'final'; sh.build()
        sh.frame(fi / sh.fps, fi)
        M.boil_all(fi)
        t0 = time.time()
        bl.render_to(os.path.join(OUT, f'fq_{shot_name}_{label}.png'))
        dt = time.time() - t0
        # second frame timing (persistent data warm)
        sh.frame((fi + 1) / sh.fps, fi + 1)
        t0 = time.time()
        bl.render_to(os.path.join(OUT, f'fq_{shot_name}_{label}_b.png'))
        print('TIME', shot_name, label, '%.1f %.1f' % (dt, time.time() - t0), flush=True)
