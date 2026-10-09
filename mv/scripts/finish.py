#!/usr/bin/env python3
"""Grade the rendered frames shot by shot and encode the MV with the song.

    python3 scripts/finish.py --audio out/_qa/src/song.wav --out out/master.mp4

Every frame gets the film pass from post.py (bloom, halation, fringe, grain) in its
shot's grade, read from src/mv/timeline.ts, plus the 2.39:1 bars, and goes straight
into ffmpeg: no graded intermediates on disk.
"""
import argparse
import json
import os
import subprocess
import sys
from multiprocessing import Pool

import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from post import finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BARS = 138


def timeline():
    js = ("import('./src/mv/timeline.ts').then(m => console.log(JSON.stringify("
          "{fps: m.FPS, frames: m.DURATION, shots: m.SHOTS.map(s => [s.start, s.end, s.grade])})))")
    return json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT))


def grade_at(t, shots):
    for start, end, grade in shots:
        if start <= t < end:
            return grade
    return shots[-1][2]


def work(job):
    path, grade, seed = job
    bgr = cv2.imread(path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise SystemExit(f'missing frame {path}')
    out = finish(bgr[..., ::-1], grade, seed)
    out[:BARS] = 0
    out[-BARS:] = 0
    return out.tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames', default=os.path.join(ROOT, 'out/frames'))
    ap.add_argument('--audio', required=True)
    ap.add_argument('--out', default=os.path.join(ROOT, 'out/master.mp4'))
    ap.add_argument('--crf', type=int, default=14)
    ap.add_argument('--procs', type=int, default=4)
    a = ap.parse_args()

    tl = timeline()
    fps, n, shots = tl['fps'], tl['frames'], tl['shots']
    jobs = [(os.path.join(a.frames, f'f{f:05d}.png'), grade_at(f / fps, shots), f) for f in range(n)]
    ff = subprocess.Popen([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1920x1080', '-r', str(fps), '-i', '-',
        '-i', a.audio,
        '-map', '0:v', '-map', '1:a',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-tune', 'grain',
        '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-c:a', 'aac', '-b:a', '320k',
        '-shortest', '-movflags', '+faststart', a.out,
    ], stdin=subprocess.PIPE)
    with Pool(a.procs) as pool:
        for k, buf in enumerate(pool.imap(work, jobs, chunksize=2)):
            ff.stdin.write(buf)
            if k % 120 == 0:
                print(f'{k}/{n}', flush=True)
    ff.stdin.close()
    if ff.wait():
        raise SystemExit('ffmpeg failed')
    print('wrote', a.out)


if __name__ == '__main__':
    main()
