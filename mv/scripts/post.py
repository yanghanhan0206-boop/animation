#!/usr/bin/env python3
"""Film finishing for rendered frames: bloom, halation, chromatic fringe, grade, vignette, grain.

    python3 scripts/post.py in.png out.jpg --grade night [--seed 12]

Remotion renders clean frames; everything that makes them feel shot on film happens here,
in linear light, so the same pass can later run over the whole frame sequence.
"""
import argparse

import cv2
import numpy as np

GRADES = {
    # lift (shadows), gain (highlights) per channel, saturation, contrast
    'gold':    dict(lift=(0.010, 0.008, 0.006), gain=(1.02, 0.99, 0.93), sat=1.00, con=1.06),
    'night':   dict(lift=(0.000, 0.012, 0.030), gain=(1.04, 0.98, 0.90), sat=1.08, con=1.08),
    'dawn':    dict(lift=(0.004, 0.012, 0.026), gain=(1.03, 1.00, 0.94), sat=0.96, con=1.05),
    'autumn':  dict(lift=(0.018, 0.006, 0.004), gain=(1.03, 0.97, 0.90), sat=1.06, con=1.10),
    'lantern': dict(lift=(0.016, 0.004, 0.010), gain=(1.04, 0.97, 0.90), sat=1.08, con=1.08),
    'neutral': dict(lift=(0.0, 0.0, 0.0), gain=(1.0, 1.0, 1.0), sat=1.0, con=1.0),
}


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0, None)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def finish(rgb8, grade='gold', seed=0, bloom=1.0, halation=1.0, grain=1.0, fringe=1.0, vignette=1.0):
    h, w = rgb8.shape[:2]
    lin = srgb_to_linear(rgb8.astype(np.float32) / 255.0)
    lum = lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)

    # Bloom: soft-thresholded highlights spread at several radii (light, not blur).
    knee = np.clip((lum - 0.18) / 0.5, 0, 1) ** 2
    bright = lin * knee[..., None]
    small = cv2.resize(bright, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    glow = np.zeros_like(small)
    for sigma, weight in ((3, 0.55), (10, 0.45), (28, 0.38), (70, 0.30)):
        glow += cv2.GaussianBlur(small, (0, 0), sigma) * weight
    lin = lin + cv2.resize(glow, (w, h), interpolation=cv2.INTER_LINEAR) * 0.55 * bloom

    # Halation: film's warm red fringe around the hottest highlights.
    hot = lin * (np.clip((lum - 0.45) / 0.5, 0, 1) ** 1.5)[..., None]
    hal = cv2.GaussianBlur(cv2.resize(hot, (w // 4, h // 4), interpolation=cv2.INTER_AREA), (0, 0), 6)
    hal = cv2.resize(hal, (w, h), interpolation=cv2.INTER_LINEAR).mean(axis=2, keepdims=True)
    lin = lin + hal * np.array([0.55, 0.16, 0.05], np.float32) * halation

    # Chromatic fringe: red and blue scaled a hair apart around the centre.
    if fringe > 0:
        s = 0.0016 * fringe
        out = lin.copy()
        for ch, k in ((0, 1 + s), (2, 1 - s)):
            m = np.float32([[k, 0, (1 - k) * w / 2], [0, k, (1 - k) * h / 2]])
            out[..., ch] = cv2.warpAffine(lin[..., ch], m, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        lin = out

    # Grade in display space: lift / gain per channel, contrast around mid-grey, saturation.
    g = GRADES[grade]
    img = linear_to_srgb(lin)
    img = np.array(g['lift'], np.float32) + img * (np.array(g['gain'], np.float32) - np.array(g['lift'], np.float32))
    img = (img - 0.5) * g['con'] + 0.5
    grey = img @ np.array([0.299, 0.587, 0.114], np.float32)
    img = grey[..., None] + (img - grey[..., None]) * g['sat']

    # Vignette.
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    img = img * (1 - 0.32 * vignette * np.clip((r - 0.55) / 0.85, 0, 1) ** 1.6)[..., None]

    # Grain: strongest in the mid-tones, a little in the blacks, slightly coloured.
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, 1, (h // 2 + 1, w // 2 + 1, 3)).astype(np.float32)
    noise = cv2.resize(noise, (w, h), interpolation=cv2.INTER_LINEAR)
    noise = noise * 0.75 + noise.mean(axis=2, keepdims=True) * 0.25
    lumd = img @ np.array([0.299, 0.587, 0.114], np.float32)
    amp = (0.012 + 0.034 * np.clip(1 - np.abs(lumd - 0.42) / 0.42, 0, 1)) * grain
    img = img + noise * amp[..., None]

    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--grade', default='gold', choices=sorted(GRADES))
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--bloom', type=float, default=1.0)
    ap.add_argument('--halation', type=float, default=1.0)
    ap.add_argument('--grain', type=float, default=1.0)
    ap.add_argument('--fringe', type=float, default=1.0)
    ap.add_argument('--vignette', type=float, default=1.0)
    ap.add_argument('--bars', type=int, default=0, help='letterbox bar height in px (0 = none)')
    a = ap.parse_args()
    bgr = cv2.imread(a.src, cv2.IMREAD_COLOR)
    out = finish(bgr[..., ::-1], a.grade, a.seed, a.bloom, a.halation, a.grain, a.fringe, a.vignette)
    if a.bars:
        out[: a.bars] = 0
        out[-a.bars:] = 0
    params = [cv2.IMWRITE_JPEG_QUALITY, 94] if a.dst.lower().endswith(('.jpg', '.jpeg')) else []
    cv2.imwrite(a.dst, out[..., ::-1], params)


if __name__ == '__main__':
    main()
