"""Pose-to-pose keyframing for stop-motion.

Everything is evaluated at the animation frame grid (12 fps by default), so
motion is naturally stepped like hand-posed puppets. Small deterministic
'hand jitter' helpers add the imperfection between frames."""
import math
import random
import zlib


def shash(*a):
    """Stable hash (Python's str hash is salted per process)."""
    return zlib.crc32(repr(a).encode())


def clamp01(t):
    return 0.0 if t < 0 else 1.0 if t > 1 else t


def ease(t, kind='io'):
    t = clamp01(t)
    if kind == 'lin':
        return t
    if kind == 'in':
        return t * t
    if kind == 'out':
        return 1 - (1 - t) * (1 - t)
    if kind == 'io':
        return t * t * (3 - 2 * t)
    if kind == 'io3':
        return t * t * t * (t * (t * 6 - 15) + 10)
    if kind == 'hold':
        return 0.0 if t < 1 else 1.0
    if kind == 'snap':          # fast start, settles
        return 1 - (1 - t) ** 3
    if kind == 'back':          # slight overshoot
        s = 1.7
        t -= 1
        return t * t * ((s + 1) * t + s) + 1
    if kind == 'bounce':
        return 1 - abs(math.cos(t * math.pi * 2.5)) * (1 - t)
    return t


def mix(a, b, t):
    if a is None or b is None:
        return b if t >= 0.5 else a
    if isinstance(a, (tuple, list)):
        return tuple(mix(x, y, t) for x, y in zip(a, b))
    if isinstance(a, bool) or isinstance(a, str):
        return b if t >= 0.5 else a
    return a + (b - a) * t


class Keys:
    """Keys([(t, value[, ease_into_next]), ...])"""

    def __init__(self, keys, ease='io'):
        self.k = []
        for kk in sorted(keys, key=lambda x: x[0]):
            if len(kk) == 2:
                self.k.append((kk[0], kk[1], ease))
            else:
                self.k.append(kk)

    def __call__(self, t):
        k = self.k
        if t <= k[0][0]:
            return k[0][1]
        if t >= k[-1][0]:
            return k[-1][1]
        for (t0, v0, e), (t1, v1, _) in zip(k, k[1:]):
            if t0 <= t <= t1:
                u = (t - t0) / (t1 - t0) if t1 > t0 else 1.0
                return mix(v0, v1, ease(u, e))
        return k[-1][1]


class Pose:
    """Per-channel keyed dictionaries: Pose([(t, {..}, ease?), ...], base={..}).
    A channel interpolates between the keys that mention it; before its first key it
    uses the base value (or its first key)."""

    def __init__(self, keys, base=None, ease='io'):
        self.base = dict(base or {})
        chans = {}
        for kk in keys:
            t, d = kk[0], kk[1]
            e = kk[2] if len(kk) > 2 else ease
            for name, val in d.items():
                chans.setdefault(name, []).append((t, val, e))
        self.ch = {n: Keys(v) for n, v in chans.items()}

    def __call__(self, t, **over):
        out = dict(self.base)
        for n, kf in self.ch.items():
            out[n] = kf(t)
        out.update(over)
        return out


def blink(t, times, dur=0.2):
    """Eyelid closure 0..1 (1 = shut) for blinks starting at `times`."""
    for bt in times:
        if bt <= t < bt + dur:
            u = (t - bt) / dur
            return 1.0 - abs(2 * u - 1)
    return 0.0


def auto_blinks(start, end, every=2.6, seed=0):
    rng = random.Random(seed)
    out, t = [], start + rng.uniform(0.3, every)
    while t < end:
        out.append(t)
        t += every * rng.uniform(0.6, 1.4)
    return out


def jit(key, i, amp):
    r = random.Random(shash(key, i))
    return r.uniform(-amp, amp)


def jit3(key, i, amp):
    r = random.Random(shash(key, i))
    return (r.uniform(-amp, amp), r.uniform(-amp, amp), r.uniform(-amp, amp))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def lerp(a, b, t):
    return mix(a, b, t)


def smoothstep(a, b, x):
    return ease((x - a) / (b - a) if b != a else 1.0, 'io')


def pulse(t, t0, t1):
    """1 inside [t0,t1) else 0"""
    return 1.0 if t0 <= t < t1 else 0.0
