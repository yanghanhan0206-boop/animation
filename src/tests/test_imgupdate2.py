import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
import numpy as np
from PIL import Image
from lib import bl, imgs, mats as M
OUT = sys.argv[-1]
sc = bl.reset_scene()
bl.setup_render(res=(160, 90), samples=1, fast=True)
bl.world((1, 1, 1), 1.0)
pil = lambda col: Image.new('RGBA', (64, 64), col)
img = imgs.to_bpy(pil((255, 0, 0, 255)), 'testimg')
mat = M.paper('tp', image=img, translucent=0)
node = [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE'][0]
bl.plane('p', 10, 10, mat=mat)
bl.camera('cam', loc=(0, 0, 20), target=(0, 0, 0), lens=50, fstop=None)
res = []
for k, col in enumerate([(255, 0, 0, 255), (0, 255, 0, 255), (0, 0, 255, 255)]):
    imgs.swap(node, pil(col), 'testimg')
    p = os.path.join(OUT, f'imgtest{k}.png')
    bl.render_to(p)
    a = np.asarray(Image.open(p).convert('RGB')).reshape(-1, 3).mean(0)
    res.append(tuple(int(x) for x in a))
print('RESULT', res, len(bpy.data.images))
