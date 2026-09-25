"""Finishing: assemble the shot frames on the edit, grade them, add the
stop-motion 'handmade' artefacts (exposure flicker, gate weave, film grain),
the title, subtitles, captions and end cards, then encode with the sound.

    python3 src/post/compose.py --q final --out 感谢您的投递.mp4 --audio soundtrack.wav
"""
import argparse
import glob
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import edl  # noqa: E402
import dialogue  # noqa: E402
from lib import tex  # noqa: E402

ANIM_FPS = 12
OUT_FPS = edl.FPS

# per-shot grade: (exposure, contrast, saturation, (r,g,b) balance, vignette, lift)
WARM = (1.00, 1.05, 1.08, (1.04, 1.0, 0.93), 0.30, 0.012)
MORNING = (1.02, 1.04, 1.06, (1.05, 1.01, 0.92), 0.28, 0.015)
OCT = (0.98, 1.06, 0.92, (0.99, 1.0, 1.03), 0.34, 0.01)
NIGHT = (1.00, 1.08, 0.86, (0.94, 0.98, 1.08), 0.42, 0.012)
GRADE = {
    's01': (1.05, 1.1, 0.85, (0.92, 0.97, 1.1), 0.5, 0.01),
    's02': MORNING, 's03a': MORNING, 's03b': MORNING, 's03c': MORNING,
    's04': WARM, 's05': OCT, 's06': OCT, 's07': OCT,
    's08a': (1.0, 1.12, 0.9, (0.92, 0.98, 1.1), 0.45, 0.0),
    's08b': (0.92, 1.12, 0.9, (0.92, 0.98, 1.1), 0.45, 0.0),
    's08c': (1.0, 1.12, 0.9, (0.92, 0.98, 1.1), 0.45, 0.0),
    's09a': (0.96, 1.05, 0.9, (0.95, 1.01, 1.04), 0.35, 0.01),
    's09b': (0.95, 1.05, 0.85, (0.95, 1.01, 1.05), 0.4, 0.01),
    's10': NIGHT, 's11a': NIGHT, 's11b': NIGHT, 's11c': NIGHT, 's11d': NIGHT,
    's12': (1.0, 1.14, 0.8, (0.95, 0.97, 1.06), 0.5, 0.0),
    's13a': NIGHT, 's13b': NIGHT, 's13c': NIGHT,
    's14a': (1.02, 1.04, 1.02, (1.06, 1.01, 0.9), 0.3, 0.02),
    's14b': (1.0, 1.04, 1.02, (1.06, 1.01, 0.9), 0.3, 0.02),
    's14c': (1.0, 1.04, 1.04, (1.05, 1.01, 0.92), 0.3, 0.015),
    's14d': (1.0, 1.04, 1.04, (1.05, 1.01, 0.92), 0.3, 0.015),
}


class Source:
    def __init__(self, root, shot):
        self.files = sorted(glob.glob(os.path.join(root, shot, '[0-9][0-9][0-9][0-9].png')))
        self.idx = [int(os.path.basename(f)[:4]) for f in self.files]
        self.cache_i, self.cache = None, None

    def get(self, i):
        if not self.files:
            return None, None
        k = 0
        for j, fi in enumerate(self.idx):
            if fi <= i:
                k = j
            else:
                break
        if k != self.cache_i:
            self.cache = np.asarray(Image.open(self.files[k]).convert('RGB'), dtype=np.float32) / 255.0
            self.cache_i = k
        return self.cache, self.idx[k]


def grade(img, g, flick):
    exp_, con, sat, bal, vig, lift = g
    x = img * exp_ * flick
    x = x * np.array(bal, np.float32)
    lum = x @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    x = lum[..., None] + (x - lum[..., None]) * sat
    x = (x - 0.5) * con + 0.5
    x = x + lift * (1 - x)
    return np.clip(x, 0, 1)


_VIG = {}


def vignette(h, w, strength):
    key = (h, w, round(strength, 3))
    if key not in _VIG:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / math.sqrt(2)
        _VIG[key] = (1 - strength * np.clip(r - 0.35, 0, 1) ** 1.6 * 1.9)[..., None].astype(np.float32)
    return _VIG[key]


def grain(h, w, k, amount=0.028):
    rng = np.random.default_rng(k * 7 + 3)
    g = rng.standard_normal((h // 2 + 1, w // 2 + 1)).astype(np.float32)
    g = np.asarray(Image.fromarray(g).resize((w, h), Image.BILINEAR))
    return g * amount


def text_layer(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def draw_text_shadowed(layer, xy, s, f, fill, anchor='mm', shadow=6, spacing=10):
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    d.multiline_text(xy, s, font=f, fill=(0, 0, 0, 200), anchor=anchor, align='center', spacing=spacing)
    sh = sh.filter(ImageFilter.GaussianBlur(shadow))
    layer.alpha_composite(sh)
    d = ImageDraw.Draw(layer)
    d.multiline_text(xy, s, font=f, fill=fill, anchor=anchor, align='center', spacing=spacing)


def alpha_of(t, t0, t1, fin=0.25, fout=0.3):
    if t < t0 or t > t1:
        return 0.0
    return max(0.0, min(1.0, (t - t0) / fin, (t1 - t) / fout))


def overlays(frame_rgba, shot, tl, W, H):
    """Title, subtitles, captions for film time within `shot` at local time tl."""
    sc = H / 720.0
    # title
    ts, t0, t1, title = dialogue.TITLE
    if shot == ts and t0 <= tl <= t1 + 0.3:
        lay = text_layer(W, H)
        f = tex.font('handb', 78 * sc)
        n = len(title)
        x0 = W * 0.30
        for k, ch in enumerate(title):
            a = alpha_of(tl, t0 + 0.14 * k, t1, fin=0.35, fout=0.5)
            if a <= 0:
                continue
            L = text_layer(W, H)
            draw_text_shadowed(L, (x0 + (k - (n - 1) / 2) * 82 * sc, H * 0.46), ch, f,
                               (250, 246, 238, 255), shadow=int(8 * sc))
            L.putalpha(L.getchannel('A').point(lambda v: int(v * a)))
            lay.alpha_composite(L)
        a2 = alpha_of(tl, t0 + 1.4, t1, fin=0.6, fout=0.5)
        if a2 > 0:
            L = text_layer(W, H)
            draw_text_shadowed(L, (x0, H * 0.58), '一部关于秋招的黏土定格动画', tex.font('hand', 26 * sc),
                               (225, 220, 210, 255), shadow=int(5 * sc))
            L.putalpha(L.getchannel('A').point(lambda v: int(v * a2)))
            lay.alpha_composite(L)
        frame_rgba.alpha_composite(lay)
    # dialogue subtitles
    for who, s_, a, b, text in dialogue.LINES:
        if s_ == shot and a - 0.05 <= tl <= b + 0.45:
            al = alpha_of(tl, a - 0.05, b + 0.45, fin=0.12, fout=0.15)
            L = text_layer(W, H)
            f = tex.font('sans', 32 * sc)
            fw = tex.font('sans', 24 * sc)
            label = who + '  '
            lw = fw.getlength(label)
            tw = f.getlength(text)
            x = W / 2 - (lw + tw) / 2
            y = H * 0.9
            draw_text_shadowed(L, (x, y), label, fw, (200, 200, 205, 255), anchor='lm', shadow=int(4 * sc))
            draw_text_shadowed(L, (x + lw, y), text, f, (255, 255, 255, 255), anchor='lm', shadow=int(4 * sc))
            L.putalpha(L.getchannel('A').point(lambda v: int(v * al)))
            frame_rgba.alpha_composite(L)
    # captions (the 'talent pool' letter, typed)
    for s_, a, b, text, style in dialogue.CAPTIONS:
        if s_ == shot and a <= tl <= b + 0.5:
            n = int(min(len(text), (tl - a) / 0.07))
            al = alpha_of(tl, a, b + 0.5, fin=0.1, fout=0.5)
            L = text_layer(W, H)
            draw_text_shadowed(L, (W / 2, H * 0.14), text[:n], tex.font('serif', 30 * sc), (255, 255, 255, 255),
                               shadow=int(6 * sc), spacing=int(14 * sc))
            L.putalpha(L.getchannel('A').point(lambda v: int(v * al)))
            frame_rgba.alpha_composite(L)
    return frame_rgba


def end_card(tl, W, H):
    img = Image.new('RGBA', (W, H), (8, 8, 9, 255))
    sc = H / 720.0
    for a, b, text, style in dialogue.END_CARDS:
        al = alpha_of(tl, a, b, fin=1.0, fout=0.8)
        if al <= 0:
            continue
        L = text_layer(W, H)
        if style == 'big':
            draw_text_shadowed(L, (W / 2, H * 0.47), text, tex.font('handb', 64 * sc), (246, 240, 228, 255), shadow=2)
        elif style == 'small':
            draw_text_shadowed(L, (W / 2, H * 0.5), text, tex.font('hand', 34 * sc), (220, 214, 204, 255), shadow=2)
        else:
            draw_text_shadowed(L, (W / 2, H * 0.5), text, tex.font('sans', 22 * sc), (150, 150, 150, 255), shadow=2,
                               spacing=int(14 * sc))
        L.putalpha(L.getchannel('A').point(lambda v: int(v * al)))
        img.alpha_composite(L)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--q', default='final')
    ap.add_argument('--root', default=os.environ.get('RENDER_DIR', 'renders'))
    ap.add_argument('--out', default='out.mp4')
    ap.add_argument('--audio', default=None)
    ap.add_argument('--size', default='1280x720')
    ap.add_argument('--crf', default='17')
    ap.add_argument('--only', default=None, help='comma list of shots to include (preview)')
    ap.add_argument('--preset', default='slow')
    ap.add_argument('--threads', default='0')
    a = ap.parse_args()
    W, H = map(int, a.size.split('x'))
    root = os.path.join(a.root, a.q)
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(OUT_FPS),
           '-i', '-']
    if a.audio:
        cmd += ['-i', a.audio, '-c:a', 'aac', '-b:a', '192k']
    cmd += ['-c:v', 'libx264', '-preset', a.preset, '-crf', a.crf, '-pix_fmt', 'yuv420p', '-tune', 'film',
            '-threads', a.threads, '-movflags', '+faststart']
    if a.audio:
        cmd += ['-shortest']
    cmd += [a.out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    only = set(a.only.split(',')) if a.only else None
    t_film = 0.0
    k_out = 0
    for shot, dur in edl.EDL:
        if only and shot not in only and shot not in ('end', 'black'):
            t_film += dur
            continue
        nout = int(round(dur * OUT_FPS))
        src = Source(root, shot) if shot not in ('end', 'black') else None
        for j in range(nout):
            tl = j / OUT_FPS
            if shot == 'black':
                frame = np.zeros((H, W, 3), np.uint8)
            elif shot == 'end':
                frame = np.asarray(end_card(tl, W, H).convert('RGB'))
                frame = np.clip(frame.astype(np.float32) / 255 + grain(H, W, int(tl * ANIM_FPS), 0.015)[..., None], 0, 1)
                frame = (frame * 255).astype(np.uint8)
            else:
                ai = int(tl * ANIM_FPS + 1e-6)
                img, used = src.get(ai)
                if img is None:
                    img = np.zeros((H, W, 3), np.float32)
                    used = ai
                if img.shape[0] != H or img.shape[1] != W:
                    img = np.asarray(Image.fromarray((img * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS),
                                     np.float32) / 255
                r = np.random.default_rng(1000 * (list(dict(edl.EDL)).index(shot) + 1) + used)
                flick = 1.0 + r.normal(0, 0.009)
                dx, dy = r.normal(0, 0.35), r.normal(0, 0.35)
                g = GRADE.get(shot, WARM)
                x = grade(img, g, flick)
                x = x * vignette(H, W, g[4])
                if abs(dx) > 0.05 or abs(dy) > 0.05:
                    x = np.asarray(Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).transform(
                        (W, H), Image.AFFINE, (1, 0, dx, 0, 1, dy), resample=Image.BILINEAR), np.float32) / 255
                lum = x.mean(2, keepdims=True)
                # grain changes once per exposure (12 fps), like each frame of a shoot on twos;
                # held frames stay identical, which also keeps the bitrate sane
                gk = 100000 * (list(dict(edl.EDL)).index(shot) + 1) + ai
                x = x + grain(H, W, gk, 0.024)[..., None] * (0.6 + 0.8 * lum * (1 - lum) * 4)
                x = np.clip(x, 0, 1)
                # fade from black at the very start, and into the 3 a.m. scene
                if shot == 's01':
                    x *= min(1.0, tl / 0.9)
                if shot == 's13a':
                    x *= min(1.0, tl / 0.8)
                fr = Image.fromarray((x * 255).astype(np.uint8)).convert('RGBA')
                fr = overlays(fr, shot, tl, W, H)
                frame = np.asarray(fr.convert('RGB'))
            proc.stdin.write(np.ascontiguousarray(frame).tobytes())
            k_out += 1
        t_film += dur
        print(f'{shot} done ({k_out} frames)', flush=True)
    proc.stdin.close()
    proc.wait()
    print('wrote', a.out)


if __name__ == '__main__':
    main()
