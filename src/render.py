#!/usr/bin/env python3
"""Render one shot frame-by-frame (like shooting a stop-motion scene).

    python3 src/render.py s03a --q preview --every 3
    python3 src/render.py s03a --q final

Frames go to $RENDER_DIR/<quality>/<shot>/0000.png (existing frames are kept,
so an interrupted shoot can resume)."""
import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from lib import bl  # noqa: E402
from lib import mats as M  # noqa: E402
import shots  # noqa: E402

RENDER_DIR = os.environ.get('RENDER_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'renders'))
QUAL = {
    'draft': dict(res=(480, 270), samples=2, fast=True),
    'preview': dict(res=(640, 360), samples=4, fast=False),
    'final': dict(res=(960, 540), samples=3, fast=False),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot')
    ap.add_argument('--q', default='preview')
    ap.add_argument('--every', type=int, default=1)
    ap.add_argument('--frames', default=None, help='a-b (inclusive)')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--threads', type=int, default=0)
    ap.add_argument('--part', default=None, help='k/n: render every n-th frame starting at k')
    a = ap.parse_args()
    cls = shots.get(a.shot)
    sc = bl.reset_scene()
    q = QUAL[a.q]
    bl.setup_render(res=q['res'], samples=getattr(cls, 'samples', {}).get(a.q, q['samples']), fast=q['fast'])
    if a.q == 'final':
        cy = sc.cycles
        cy.diffuse_bounces = 1
        cy.glossy_bounces = 1
        cy.max_bounces = 3
        cy.transparent_max_bounces = 6
        cy.use_adaptive_sampling = False
        cy.denoising_prefilter = 'FAST'
        cy.denoising_quality = 'HIGH'
    if a.threads:
        sc.render.threads_mode = 'FIXED'
        sc.render.threads = a.threads
    t0 = time.time()
    shot = cls()
    shot.quality = a.q
    shot.build()
    n = int(round(shot.dur * shot.fps))
    print(f'[{a.shot}] built in {time.time() - t0:.1f}s, {n} frames @ {shot.fps}fps', flush=True)
    out = os.path.join(RENDER_DIR, a.q, a.shot)
    os.makedirs(out, exist_ok=True)
    idx = list(range(n))
    if a.frames:
        lo, hi = map(int, a.frames.split('-'))
        idx = [i for i in idx if lo <= i <= hi]
    idx = idx[::a.every]
    if a.part:
        k, m = map(int, a.part.split('/'))
        idx = idx[k::m]
    for i in idx:
        path = os.path.join(out, f'{i:04d}.png')
        if os.path.exists(path) and not a.force:
            continue
        t = i / shot.fps
        ts = time.time()
        shot.frame(t, i)
        M.boil_all(i * 7 + getattr(shot, 'seed', 0), getattr(shot, 'boil', 1.0))
        sc.cycles.seed = i + getattr(shot, 'seed', 0) * 1000
        bl.render_to(path + '.tmp.png')
        os.replace(path + '.tmp.png', path)
        print(f'[{a.shot}] {i + 1}/{n} {time.time() - ts:.1f}s', flush=True)
    print(f'[{a.shot}] done in {time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
