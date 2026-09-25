"""Export graded stills of key moments: python3 src/post/stills.py --q final --out output/stills"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from post.compose import Source, grade, vignette, GRADE, WARM  # noqa: E402

PICKS = [('s03c', 20, '01_九月_投递成功'), ('s04', 150, '02_海投'), ('s07', 118, '03_被淹没'),
         ('s08c', 50, '04_AI面试'), ('s09b', 70, '05_人才库'), ('s12', 140, '06_漩涡'),
         ('s13b', 44, '07_凌晨三点'), ('s14b', 56, '08_天亮')]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--q', default='final')
    ap.add_argument('--root', default=os.environ.get('RENDER_DIR', 'renders'))
    ap.add_argument('--out', default='output/stills')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for shot, fi, name in PICKS:
        src = Source(os.path.join(a.root, a.q), shot)
        img, used = src.get(fi)
        if img is None:
            print('missing', shot)
            continue
        H, W = 720, 1280
        if img.shape[:2] != (H, W):
            img = np.asarray(Image.fromarray((img * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS),
                             np.float32) / 255
        g = GRADE.get(shot, WARM)
        x = grade(img, g, 1.0) * vignette(H, W, g[4])
        Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).save(os.path.join(a.out, name + '.jpg'),
                                                                        quality=90)
        print('still', name, 'from', shot, used)


if __name__ == '__main__':
    main()
