"""Two-pass re-encode of the master to a file size that fits in a git repository
(GitHub rejects files over 100 MiB and warns above 50 MiB):

    python3 src/post/deliver.py build/master.mp4 output/感谢您的投递.mp4 --mib 48 --audio build/soundtrack.wav
"""
import argparse
import os
import re
import subprocess
import tempfile

import imageio_ffmpeg


def duration(ff, path):
    err = subprocess.run([ff, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', err).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--mib', type=float, default=48, help='target file size')
    ap.add_argument('--audio', default=None, help='take the sound from this wav instead of the master')
    ap.add_argument('--audio-kbps', type=int, default=160)
    ap.add_argument('--preset', default='slower')
    a = ap.parse_args()

    ff = imageio_ffmpeg.get_ffmpeg_exe()
    dur = duration(ff, a.src)
    total_kbps = a.mib * 1048576 * 8 / 1000 / dur * 0.97          # ~3% for the container
    v_kbps = int(total_kbps - a.audio_kbps)
    print(f'{dur:.2f}s -> video {v_kbps} kb/s + audio {a.audio_kbps} kb/s')

    x264 = ['-c:v', 'libx264', '-preset', a.preset, '-tune', 'film', '-b:v', f'{v_kbps}k',
            '-x264-params', 'aq-mode=3', '-pix_fmt', 'yuv420p']
    with tempfile.TemporaryDirectory() as tmp:
        log = os.path.join(tmp, 'x264')
        subprocess.run([ff, '-y', '-loglevel', 'error', '-i', a.src, *x264, '-pass', '1', '-passlogfile', log,
                        '-an', '-f', 'null', os.devnull], check=True)
        inputs = ['-i', a.src] + (['-i', a.audio] if a.audio else [])
        amap = ['-map', '0:v', '-map', '1:a' if a.audio else '0:a']
        os.makedirs(os.path.dirname(os.path.abspath(a.dst)), exist_ok=True)
        subprocess.run([ff, '-y', '-loglevel', 'error', *inputs, *amap, *x264, '-pass', '2', '-passlogfile', log,
                        '-c:a', 'aac', '-b:a', f'{a.audio_kbps}k', '-movflags', '+faststart', '-shortest', a.dst],
                       check=True)
    print(f'wrote {a.dst}: {os.path.getsize(a.dst) / 1048576:.1f} MiB')


if __name__ == '__main__':
    main()
