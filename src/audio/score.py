"""The sound track, cue by cue, laid out on the film's edit (edl.py).

Music: one theme ('小满的主题'), in C major for hope and A minor for the rest,
played on the synthesized felt piano. Everything else is sound design.

    python3 src/audio/score.py OUT.wav
"""
import math
import os
import sys
import zlib

import numpy as np
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from audio import synth as S  # noqa: E402
from audio.synth import SR, nm, midi  # noqa: E402
import edl  # noqa: E402
import dialogue  # noqa: E402
from lib.anim import jit  # noqa: E402

AT = edl.at
DUR = edl.total()


def db(x):
    return 10 ** (x / 20.0)


def norm(x, peak_db=0.0):
    m = np.max(np.abs(x)) if len(x) else 0
    return x / m * db(peak_db) if m > 0 else x


# -----------------------------------------------------------------------------
# themes
# -----------------------------------------------------------------------------
MAJOR = [('G4', 1), ('C5', 1), ('E5', 2),
         ('D5', 1.5), ('C5', 0.5), ('D5', 1), ('G4', 1),
         ('A4', 1), ('C5', 1), ('F5', 1), ('E5', 1),
         ('D5', 4),
         ('G4', 1), ('C5', 1), ('E5', 2),
         ('D5', 1.5), ('C5', 0.5), ('B4', 1), ('A4', 1),
         ('G4', 1), ('A4', 1), ('C5', 1), ('D5', 1),
         ('C5', 4)]
MAJOR_CH = [('C', 4), ('G', 2), ('Em', 2), ('F', 2), ('Am', 2), ('G', 4),
            ('C', 4), ('Em', 2), ('Am', 2), ('F', 2), ('G', 2), ('C', 4)]
MINOR = [('E4', 1), ('A4', 1), ('C5', 2),
         ('B4', 1.5), ('A4', 0.5), ('B4', 1), ('E4', 1),
         ('F4', 1), ('A4', 1), ('D5', 1), ('C5', 1),
         ('B4', 4),
         ('E4', 1), ('A4', 1), ('C5', 2),
         ('B4', 1.5), ('A4', 0.5), ('G4', 1), ('F4', 1),
         ('E4', 1), ('F4', 1), ('A4', 1), ('B4', 1),
         ('A4', 4)]
MINOR_CH = [('Am', 4), ('E', 2), ('Em', 2), ('Dm', 2), ('F', 2), ('E', 4),
            ('Am', 4), ('Em', 2), ('Dm', 2), ('Dm', 2), ('E', 2), ('Am', 4)]

CHORDS = {'C': ['C3', 'G3', 'C4', 'E4'], 'G': ['G2', 'D3', 'G3', 'B3'], 'Em': ['E2', 'B2', 'E3', 'G3'],
          'F': ['F2', 'C3', 'F3', 'A3'], 'Am': ['A2', 'E3', 'A3', 'C4'], 'E': ['E2', 'B2', 'E3', 'G#3'],
          'Dm': ['D3', 'A3', 'D4', 'F4'], 'Cm': ['C3', 'G3', 'C4', 'Eb4'], 'Ab': ['Ab2', 'Eb3', 'Ab3', 'C4'],
          'Fm': ['F2', 'C3', 'F3', 'Ab3']}

_cache = {}


def pn(name, dur, vel, soft, seed=0):
    key = (name, round(dur, 2), round(vel, 2), round(soft, 2))
    if key not in _cache:
        _cache[key] = S.piano(midi(nm(name)), dur, vel=vel, soft=soft, seed=zlib.crc32(repr(key).encode()) % 1000)
    return _cache[key]


def melody(bus, t0, bpm, notes, vel=0.55, soft=0.55, pan=0.1, gain=1.0, upto=None, start_note=0,
           count=None, legato=1.05, stretch=None):
    beat = 60.0 / bpm
    t = t0
    sel = notes[start_note:start_note + count if count else None]
    for k, (n, b) in enumerate(sel):
        d = b * beat * (stretch[k] if stretch else 1.0)
        if upto is not None and t >= upto:
            break
        if n:
            v = vel * (0.92 + 0.16 * ((k * 37) % 7) / 7.0)
            bus.add(pn(n, d * legato, v, soft), t, gain, pan)
        t += d
    return t


def arpeggio(bus, t0, bpm, chords, vel=0.3, soft=0.7, pattern=(0, 1, 2, 3, 2, 1, 2, 1), pan=-0.15,
             gain=1.0, upto=None):
    beat = 60.0 / bpm
    t = t0
    for ch, beats in chords:
        tones = CHORDS[ch]
        steps = int(beats * 2)
        for s in range(steps):
            if upto is not None and t >= upto:
                return t
            n = tones[pattern[s % len(pattern)]]
            bus.add(pn(n, beat * 0.9, vel * (1.0 if s % 4 == 0 else 0.8), soft), t, gain, pan)
            t += beat / 2
    return t


def chord(bus, names, t, dur, vel=0.4, soft=0.7, gain=1.0, spread=0.02):
    for k, n in enumerate(names):
        bus.add(pn(n, dur, vel, soft), t + k * spread, gain, -0.3 + 0.6 * k / max(1, len(names) - 1))


def compress(x, thr_db=-26.0, ratio=2.2, att=0.015, rel=0.35, target_rms_db=-19.0):
    """Gentle master compression (block RMS detector, smoothed gain), then make-up gain
    towards a target RMS so quiet scenes stay audible on small speakers."""
    blk = int(0.01 * SR)
    n = len(x) // blk
    pw = np.mean(x[:n * blk].reshape(n, blk, 2) ** 2, axis=(1, 2))
    lev = 10 * np.log10(pw + 1e-12)
    over = np.maximum(0.0, lev - thr_db)
    gr = -over * (1 - 1 / ratio)                  # dB of gain reduction wanted
    g = np.zeros(n)
    a_att = np.exp(-0.01 / att)
    a_rel = np.exp(-0.01 / rel)
    cur = 0.0
    for k in range(n):
        tgt = gr[k]
        coef = a_att if tgt < cur else a_rel
        cur = coef * cur + (1 - coef) * tgt
        g[k] = cur
    gain = np.repeat(db(g), blk)
    gain = np.concatenate([gain, np.full(len(x) - len(gain), gain[-1] if len(gain) else 1.0)])
    y = x * gain[:, None]
    rms = np.sqrt(np.mean(y ** 2))
    y *= db(target_rms_db) / max(rms, 1e-9)
    return y


# -----------------------------------------------------------------------------
def build():
    music = S.Bus(DUR)        # piano & pads (reverb)
    far = S.Bus(DUR)          # distant / underwater music (heavy reverb + filtering)
    sfx = S.Bus(DUR)
    amb = S.Bus(DUR)
    vox = S.Bus(DUR)
    clean = S.Bus(DUR)        # un-muffled accents

    # ---------------- room tone for the whole film (removed on black/freeze later)
    amb.add(norm(S.room_tone(DUR), -44), 0.0)

    # ================= S01 cold open
    for b in (0.35, 1.05, 3.9):
        sfx.add(norm(S.phone_buzz(0.34, seed=int(b * 10)), -14), AT('s01', b), pan=0.2)
    sfx.add(norm(S.ding(), -26), AT('s01', 1.42), pan=0.2)
    chord(music, ['A2', 'E3'], AT('s01', 2.3), 5.2, vel=0.42, soft=0.8)
    melody(music, AT('s01', 2.6), 64, [('E4', 1), ('A4', 1), ('C5', 3.2)], vel=0.42, soft=0.7)
    music.add(pn('B4', 2.2, 0.32, 0.8), AT('s01', 6.5), 1.0, 0.1)

    # ================= September (S02-S03): the theme in C major
    for tb in (0.5, 2.6, 5.3, 9.4):
        amb.add(norm(S.bird(seed=int(tb * 7)), -34), AT('s02', tb), pan=0.6)
    for k in range(18):                          # a quiet clock
        amb.add(norm(S.tick(hi=k % 2 == 0), -40), AT('s02', 0.25 + k))
    t0 = AT('s02', 0.45)
    bpm = 72
    melody(music, t0, bpm, MAJOR, vel=0.5, soft=0.5, count=17, upto=AT('s04', 0.1))
    arpeggio(music, t0, bpm, MAJOR_CH, vel=0.26, soft=0.65, upto=AT('s04', 0.1))
    # stretch / yawn, cheek pats, typing, click, chime, "yay"
    vox.add(norm(S.breath(1.1, inhale=True, seed=1), -30), AT('s03a', 0.8))
    vox.add(norm(S.breath(0.9, inhale=False, seed=2), -32), AT('s03a', 2.2))
    for k, tp in enumerate((2.91, 3.24)):          # two pats on the cheeks (hands closest to the face)
        sfx.add(norm(S.lowpass(S.noise(int(0.05 * SR), np.random.default_rng(k)), 700) *
                     np.exp(-np.arange(int(0.05 * SR)) / (0.008 * SR)), -24), AT('s03a', tp))

    def typing(t0_, t1_, rate=7.0, db_=-30, seed=0):
        rng = np.random.default_rng(seed)
        t = t0_
        while t < t1_:
            sfx.add(norm(S.keyclick(seed=int(rng.integers(1e6))), db_ + rng.uniform(-3, 2)), t,
                    pan=rng.uniform(-0.2, 0.2))
            t += rng.exponential(1.0 / rate) * 0.6 + 0.4 / rate
    typing(AT('s03a', 4.0), AT('s03a', 5.0), seed=1)
    sfx.add(norm(S.trackpad_click(), -22), AT('s03b', 2.1))
    for k, n in enumerate(['C6', 'E6', 'G6']):
        clean.add(norm(S.bell(midi(nm(n)), 1.2), -24), AT('s03b', 2.36 + 0.07 * k), pan=0.1)
    vox.add(norm(S.voice(1, 0.35, f0=330, kind='xm', seed=4), -24), AT('s03c', 1.35))
    for k, n in enumerate(['G5', 'C6', 'E6', 'G6']):
        clean.add(norm(S.bell(midi(nm(n)), 0.9), -30), AT('s03c', 1.7 + 0.06 * k), pan=0.2)
    typing(AT('s03c', 4.0), AT('s03c', 5.0), seed=2)

    # ================= S04 montage: accelerating ostinato
    prog = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm', 'E', 'Am', 'Am']
    t = AT('s04', 0.0)
    tend = AT('s05', 0.0) - 0.05
    k = 0
    rng = np.random.default_rng(4)
    while t < tend:
        u = (t - AT('s04')) / 16.0
        bpm_ = 72 + 50 * u ** 1.3
        beat = 60.0 / bpm_
        bar = k // 8
        ch = prog[min(bar, len(prog) - 1)]
        tones = CHORDS[ch]
        pat = [3, 2, 1, 2, 3, 2, 1, 2]
        n = tones[pat[k % 8]]
        up = nm(n) + 12
        vel = 0.34 + 0.12 * (k % 2 == 0) + 0.1 * u
        music.add(S.piano(midi(up), beat * 0.45, vel=vel, soft=0.55, seed=k % 13), t, 0.9, 0.2)
        if k % 4 == 0:
            music.add(pn(tones[0], beat * 1.8, 0.38, 0.65), t, 1.0, -0.2)
        amb.add(norm(S.tick(hi=k % 2 == 0), -38 + 6 * u), t)
        t += beat / 2
        k += 1
    typing(AT('s04', 0.0), AT('s04', 9.6), rate=9, db_=-31, seed=3)
    typing(AT('s04', 10.6), AT('s04', 13.4), rate=12, db_=-30, seed=4)
    typing(AT('s04', 14.1), AT('s04', 16.0), rate=15, db_=-29, seed=5)
    vox.add(norm(S.breath(0.35, inhale=True, seed=7), -24), AT('s04', 10.15))
    for k, tp in enumerate((13.575, 13.925)):      # two slaps to stay awake
        sfx.add(norm(S.lowpass(S.noise(int(0.05 * SR), np.random.default_rng(10 + k)), 900) *
                     np.exp(-np.arange(int(0.05 * SR)) / (0.006 * SR)), -20), AT('s04', tp))

    # ================= S05 September torn
    chord(music, ['A2', 'E3', 'A3', 'C4'], AT('s05', 0.0), 4.0, vel=0.3, soft=0.8)
    music.add(norm(S.pad([midi(nm(n)) for n in ('A2', 'E3', 'C4')], 3.5, att=0.5, rel=1.5), -34), AT('s05', 0.0))
    sfx.add(norm(S.rip(0.8, seed=2), -16), AT('s05', 0.85), pan=-0.1)
    for k in range(4):
        amb.add(norm(S.tick(hi=k % 2 == 0), -40), AT('s05', 0.4 + k))

    # ================= S06 the flood of notifications
    b, tb, gap = [], 0.5, 0.95
    while tb < 9.2:
        b.append(tb)
        tb += gap
        gap = max(0.2, gap * 0.86)
    for k, tb in enumerate(b):
        sfx.add(norm(S.phone_buzz(0.25, seed=k), -15), AT('s06', tb), pan=0.05)
        sfx.add(norm(S.ding(base=1318.5 * 2 ** (rng.uniform(-0.3, 0.3) / 12)), -25 + min(6, k * 0.4)),
                AT('s06', tb + 0.06), pan=rng.uniform(-0.4, 0.4))
    amb.add(norm(S.drone(55.0, 10.0, beat=0.25), -30), AT('s06', 0.0))

    # ================= S07 buried
    lands = [0.35, 0.8, 1.15, 1.5, 1.8, 2.05, 2.3, 2.55, 2.8, 3.0, 3.2, 3.35, 3.5, 3.6, 3.72, 3.85]
    for k, tl in enumerate(lands):
        sfx.add(norm(S.paper(0.3, seed=k), -30), AT('s07', tl - 0.32), pan=rng.uniform(-0.5, 0.5))
        sfx.add(norm(S.paper_land(seed=k), -22), AT('s07', tl), pan=rng.uniform(-0.3, 0.3))
    t = AT('s07', 3.9)
    while t < AT('s07', 11.2):
        u = (t - AT('s07', 3.9)) / 7.3
        sfx.add(norm(S.paper_land(seed=int(t * 100)), -30 + 4 * u), t, pan=rng.uniform(-0.6, 0.6))
        t += rng.uniform(0.04, 0.12) * (1.2 - 0.6 * u)
    sfx.add(norm(S.bandpass(S.noise(int(7.5 * SR), rng, 'pink'), 500, 3500) *
                 np.linspace(0.2, 1.0, int(7.5 * SR)), -33), AT('s07', 3.9))
    t0 = AT('s07', 0.5)
    melody(far, t0, 60, MINOR, vel=0.45, soft=0.6, count=11, upto=AT('s07', 11.6))
    arpeggio(far, t0, 60, MINOR_CH[:5], vel=0.22, soft=0.75, upto=AT('s07', 11.6))
    clean.add(pn('E6', 1.2, 0.28, 0.4), AT('s07', 11.25), 1.0, 0.1)

    # ================= S08 AI interview
    sw = S.tt(0.35)
    boot = np.sin(2 * np.pi * np.cumsum(200 + 1000 * sw / 0.35) / SR) * np.exp(-sw / 0.2)
    sfx.add(norm(boot, -24), AT('s08a', 0.05))
    for k in range(2):
        sfx.add(norm(S.beep(1600 + 400 * k, 0.06), -28), AT('s08a', 0.45 + 0.1 * k))
    amb.add(norm(S.drone(55.0, 13.0, beat=0.4), -24), AT('s08a', 0.0))
    scale = ['E6', 'G6', 'A6', 'B6', 'D7', 'E7']
    t = AT('s08a', 0.6)
    while t < AT('s08c', 3.9):
        amb.add(norm(S.beep(midi(nm(scale[int(rng.integers(len(scale)))])), 0.05), -44), t, pan=rng.uniform(-0.6, 0.6))
        t += 0.125
    # the AI speaks (robot syllables)
    t = AT('s08a', 0.5)
    for k in range(18):
        f = 520 * 2 ** (rng.choice([0, 2, 3, 5, 7]) / 12)
        d = 0.09 + 0.04 * rng.random()
        x = np.sin(2 * np.pi * f * S.tt(d)) * np.sin(np.pi * S.tt(d) / d)
        sfx.add(norm(S.lowpass(np.sign(x) * 0.5 + x, 3000), -30), t, pan=0.15)
        t += d + 0.03
    for s_ in range(10):
        amb.add(norm(S.tick(hi=True), -34), AT('s08a', 2.8) + s_ * 1.0)
    for s_ in range(3):
        sfx.add(norm(S.beep(1200, 0.12), -24), AT('s08c', 0.9) + s_ * 1.0)
    # Xiaoman answering, nervous
    vox.add(norm(S.voice(24, 4.2, f0=300, kind='xm', seed=9), -25), AT('s08b', 0.1), pan=-0.05)
    # heartbeat 80 -> 124 bpm
    t = AT('s08b', 0.0)
    while t < AT('s08c', 3.4):
        u = (t - AT('s08b', 0.0)) / 8.4
        sfx.add(norm(S.heartbeat(), -22 + 6 * u), t)
        t += 60.0 / (80 + 44 * u)
    rum = S.lowpass(S.noise(int(3.5 * SR), rng, 'brown'), 150) * np.linspace(0.1, 1, int(3.5 * SR))
    sfx.add(norm(rum, -20), AT('s08c', 0.0))
    sfx.add(norm(S.whoosh(3.4, up=True, seed=3), -26), AT('s08c', 0.0))
    sfx.add(norm(S.buzzer(0.5), -18), AT('s08c', 3.4))
    for k, f in enumerate((880, 660, 440)):
        sfx.add(norm(S.beep(f, 0.16), -28), AT('s08c', 3.95 + 0.18 * k))

    # ================= S09 the talent pool
    lap = S.lowpass(S.noise(int(17 * SR), rng, 'pink'), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * S.tt(17)))
    amb.add(norm(lap, -34), AT('s09a', 0.0))
    for k in range(7):
        amb.add(norm(S.plip(), -40), AT('s09a', rng.uniform(0.2, 7.5)), pan=rng.uniform(-0.7, 0.7))
    t0 = AT('s09a', 0.4)
    melody(far, t0, 54, MINOR, vel=0.42, soft=0.65, count=12, upto=AT('s10', 0.0))
    arpeggio(far, t0, 54, MINOR_CH[:6], vel=0.2, soft=0.8, upto=AT('s10', 0.0))
    sfx.add(norm(S.whoosh(1.0, up=False, seed=5), -22), AT('s09a', 3.3))
    sfx.add(norm(S.splash(), -12), AT('s09a', 4.3))
    for k in range(6):
        sfx.add(norm(S.plip(), -28), AT('s09a', 4.5 + 0.12 * k + rng.uniform(0, 0.08)), pan=rng.uniform(-0.6, 0.6))
    amb.add(norm(S.underwater(12.2), -26), AT('s09a', 4.8))
    for tb in (1.3, 2.8, 5.1, 6.0, 6.4, 7.2, 7.8, 8.3):
        sfx.add(norm(S.bubble(seed=int(tb * 10)), -30), AT('s09b', tb), pan=rng.uniform(-0.3, 0.3))

    # ================= S10 November
    sfx.add(norm(S.rip(0.7, seed=5), -17), AT('s10', 0.35))
    for k in range(3):
        amb.add(norm(S.tick(hi=k % 2 == 0), -40), AT('s10', 0.2 + k))

    # ================= S11 mom calls
    ring = ['E5', 'G5', 'C6', 'G5', 'E5', 'G5']
    t = AT('s11a', 0.0)
    while t < AT('s11c', -0.2):
        for k, n in enumerate(ring):
            sfx.add(norm(S.marimba(midi(nm(n))), -22), t + 0.13 * k, pan=0.15)
        sfx.add(norm(S.phone_buzz(0.78, seed=3), -24), t, pan=0.15)
        t += 1.2
    vox.add(norm(S.breath(0.8, inhale=True, seed=11), -24), AT('s11b', 0.5))
    vox.add(norm(S.breath(0.9, inhale=False, seed=12), -28), AT('s11b', 1.4))
    for who, shot, a, b_, text in dialogue.LINES:
        n = len([c for c in text if c not in '，。？！…、 '])
        if who == '妈妈':
            vox.add(norm(S.voice(n, b_ - a, f0=235, kind='mom', seed=int(a * 10) + len(text)), -19), AT(shot, a), pan=-0.1)
        else:
            vox.add(norm(S.voice(n, b_ - a, f0=265, kind='xm', seed=int(a * 10) + 3), -22), AT(shot, a), pan=0.05)
    for k in range(2):
        sfx.add(norm(S.beep(480, 0.14), -30), AT('s11d', 1.75 + 0.3 * k))
    music.add(pn('A2', 3.0, 0.3, 0.8), AT('s11d', 3.2), 1.0, -0.1)
    chord(music, ['A2', 'E3', 'B3', 'C4'], AT('s11d', 3.9), 3.0, vel=0.26, soft=0.85)

    # ================= S12 the spiral
    t0s = AT('s12', 0.0)
    for k in range(9):
        sfx.add(norm(S.trackpad_click(), -34), t0s + 0.5 * k + 0.2)
    rr = __import__('random').Random(15)
    for k in range(28):
        tc = 2.0 + k * 0.38 + rr.uniform(-0.1, 0.1)
        for lo_, hi_ in ((4.5, 9.5), (5.5, 15.5), (0, 6.28), (-25, 25), (0.3, 1.2)):
            rr.uniform(lo_, hi_)
        rr.choice([1, 1, -1])
        sfx.add(norm(S.whoosh(0.5, up=bool(k % 2), seed=k), -28 + min(8, k * 0.3)), t0s + tc, pan=rr.uniform(-0.8, 0.8))
    wind = S.bandpass(S.noise(int(15 * SR), rng, 'pink'), 300, 3000)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(0.2 + 1.8 * np.linspace(0, 1, len(wind)) ** 2) / SR)
    sfx.add(norm(wind * lfo * np.linspace(0.05, 1, len(wind)) ** 1.5, -22), t0s + 2.0)
    t = t0s + 2.0
    while t < t0s + 17.0:
        u = (t - t0s - 2.0) / 15.0
        sfx.add(norm(S.heartbeat(), -24 + 10 * u), t)
        t += 60.0 / (72 + 80 * u ** 1.2)
    sh = S.shepard(14.0, rise=True, base=110.0)
    sfx.add(norm(sh * np.linspace(0.05, 1, len(sh)) ** 2, -18), t0s + 3.0)
    t = t0s + 0.5
    while t < t0s + 17.0:
        u = (t - t0s) / 17.0
        amb.add(norm(S.tick(hi=True), -36 + 8 * u), t)
        t += 1.0 / (1 + 5 * u ** 1.5)
    for tb in (6.2, 8.1, 9.9, 11.4, 12.6, 13.9, 15.0, 15.8, 16.4):
        sfx.add(norm(S.ding(base=1318.5 * 2 ** (rr.uniform(-5, 3) / 12)), -26), t0s + tb, pan=rr.uniform(-0.7, 0.7))
    for i in range(int(17.0 * 12)):
        tt_ = i / 12.0
        if tt_ > 6.0:
            r = jit('lamp', i, 1.0)
            if r > 1.0 - 0.25 * min(1.0, (tt_ - 6) / 8):
                z = S.bandpass(S.noise(int(0.06 * SR), rng), 2000, 8000) * np.exp(-np.arange(int(0.06 * SR)) / (0.01 * SR))
                sfx.add(norm(z, -30), t0s + tt_, pan=-0.5)
    t = t0s + 8.0
    while t < t0s + 16.8:
        vox.add(norm(S.breath(0.28, inhale=True, seed=int(t * 10)), -28), t)
        vox.add(norm(S.breath(0.25, inhale=False, seed=int(t * 10) + 1), -30), t + 0.3)
        t += 0.62
    chord(music, ['A1', 'A#1', 'B1', 'C2'], t0s + 14.2, 3.0, vel=0.9, soft=0.4, gain=1.0, spread=0.0)
    FREEZE = t0s + 17.0

    # ================= S13 3 a.m.
    rain_ = S.rain(20.0, seed=4)
    ramp = np.ones(len(rain_))
    ramp[:int(0.4 * SR)] = np.linspace(0, 1, int(0.4 * SR))
    fo0 = int(18.0 * SR)
    ramp[fo0:] = np.linspace(1, 0, len(rain_) - fo0)
    amb.add(norm(S.lowpass(rain_, 5000) * ramp, -27), AT('s13a', 0.0))
    for k in range(18):
        amb.add(norm(S.tick(hi=k % 2 == 0), -42), AT('s13a', 0.6 + k))
    sparse = [('E4', 1.5), ('A4', 1.4), ('C5', 2.8), ('B4', 1.2), ('A4', 1.2), ('B4', 2.6), ('E4', 2.4)]
    t = AT('s13a', 1.4)
    for n, d in sparse:
        music.add(pn(n, d * 0.9, 0.33, 0.8), t, 1.0, 0.1)
        t += d
    clean.add(pn('E6', 1.6, 0.18, 0.6), AT('s13b', 1.5), 1.0, 0.15)
    for k in range(7):
        sfx.add(norm(S.pen_scratch(0.32, seed=k), -30), AT('s13c', 1.0 + 0.45 * k))
    sfx.add(norm(S.plip(), -26), AT('s13c', 5.3))

    # ================= S14 dawn
    for tb, pn_ in ((0.8, 0.5), (2.5, 0.6), (6.0, 0.7)):
        amb.add(norm(S.bird(seed=int(tb * 3)), -32), AT('s14a', tb), pan=pn_)
    t0 = AT('s14b', 0.1)
    melody(music, t0, 66, MAJOR, vel=0.4, soft=0.62, count=12, upto=AT('end', 0.0))
    arpeggio(music, t0, 66, MAJOR_CH[:6], vel=0.2, soft=0.75, upto=AT('end', 0.0))
    music.add(norm(S.pad([midi(nm(n)) for n in ('C3', 'G3', 'E4')], 14.0, att=3.0, rel=3.0), -32), AT('s14b', 0.0))
    rub = S.lowpass(S.noise(int(2.5 * SR), rng), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.6 * S.tt(2.5)))
    sfx.add(norm(rub, -30), AT('s14b', 0.9))
    bw = S.tt(0.18)
    boing = np.sin(2 * np.pi * np.cumsum(300 + 500 * bw / 0.18) / SR) * np.exp(-bw / 0.1)
    sfx.add(norm(boing, -30), AT('s14b', 4.35))
    sfx.add(norm(S.trackpad_click(), -22), AT('s14c', 1.9))
    for k, n in enumerate(['C6', 'E6', 'G6']):
        clean.add(norm(S.bell(midi(nm(n)), 1.2), -26), AT('s14c', 2.16 + 0.07 * k), pan=0.1)
    sfx.add(norm(S.whoosh(2.0, up=False, seed=8), -34), AT('s14d', 0.0), pan=0.5)
    sfx.add(norm(S.phone_buzz(0.4, seed=21), -15), AT('s14d', 3.4), pan=0.25)

    # ================= End: the theme resolves
    t0 = AT('end', 0.7)
    tail = [('G4', 1), ('A4', 1), ('C5', 1), ('D5', 1), ('C5', 5)]
    melody(music, t0, 66, tail, vel=0.42, soft=0.6)
    arpeggio(music, t0, 66, [('F', 2), ('G', 2), ('C', 4)], vel=0.22, soft=0.75)
    chord(music, ['C3', 'G3', 'E4', 'D5'], t0 + 60 / 66 * 8, 4.5, vel=0.25, soft=0.8)

    # ---------------------------------------------------------------- processing
    ir = S.impulse_response(2.4)
    ir_far = S.impulse_response(3.6, dur=4.5, seed=11, bright=3000)
    music.x = S.reverb(music.x, ir, wet=0.28)
    clean.x = S.reverb(clean.x, ir, wet=0.35)
    far.x = S.reverb(S.lowpass(far.x, 2400), ir_far, wet=0.55)
    vox.x = S.reverb(vox.x, S.impulse_response(0.5, dur=0.8, seed=5), wet=0.12)

    # S07: the music gets buried (lowpass sweep, block-wise)
    def sweep(bus, t0_, t1_, f0, f1):
        a, b_ = int(t0_ * SR), int(t1_ * SR)
        blk = 2048
        seg = bus.x[a:b_].copy()
        out = np.zeros_like(seg)
        from scipy import signal as sg
        zi = None
        for s0 in range(0, len(seg), blk):
            u = s0 / max(1, len(seg))
            fc = f0 * (f1 / f0) ** u
            bb, aa = sg.butter(2, fc / (SR / 2), 'low')
            if zi is None:
                zi = np.zeros((2, 2))
            for c in (0, 1):
                out[s0:s0 + blk, c], zi[:, c] = sg.lfilter(bb, aa, seg[s0:s0 + blk, c], zi=zi[:, c])
        bus.x[a:b_] = out
    # the buried melody
    sweep(far, AT('s07', 6.5), AT('s07', 11.8), 5000, 260)
    far.env(AT('s07', 11.6), AT('s08a', 0.2), 1.0, 0.0)
    far.mute(AT('s08a', 0.2), AT('s09a', 0.0))
    # the pool: underwater after the splash, deeper when sinking
    for bus in (far, amb):
        seg0, seg1 = AT('s09a', 4.6), AT('s10', 0.0)
        a, b_ = int(seg0 * SR), int(seg1 * SR)
        from scipy import signal as sg
        bb, aa = sg.butter(2, 700 / (SR / 2), 'low')
        bus.x[a:b_] = sg.lfilter(bb, aa, bus.x[a:b_], axis=0) * 1.6
    far.mute(AT('s10', 0.0), AT('s13a', 0.0))

    # the spiral's hard stop: silence at the freeze, through the black
    for bus in (music, far, sfx, amb, vox, clean):
        bus.env(FREEZE - 0.02, FREEZE, 1.0, 0.0)
        bus.mute(FREEZE, AT('s13a', 0.0))
    # the doze in the montage: music drops out for a moment
    music.env(AT('s04', 9.6), AT('s04', 9.9), 1.0, 0.15)
    music.env(AT('s04', 9.9), AT('s04', 10.2), 0.15, 0.15)
    music.env(AT('s04', 10.2), AT('s04', 10.25), 0.15, 1.0)

    mix = (music.x * db(-4) + far.x * db(-3) + clean.x * db(-2) + sfx.x * db(-2) + amb.x * db(0) + vox.x * db(0))
    mix = mix[:int(DUR * SR)]
    mix = compress(mix)
    # soft limiter above -4 dBFS, then make sure the true peak stays under -1 dBFS
    thr = db(-4.0)
    a = np.abs(mix)
    over = a > thr
    mix[over] = np.sign(mix[over]) * (thr + (1 - thr) * np.tanh((a[over] - thr) / (1 - thr)))
    peak = np.max(np.abs(mix))
    if peak > db(-1.0):
        mix *= db(-1.0) / peak
    print('peak dBFS: %.1f' % (20 * np.log10(np.max(np.abs(mix)) + 1e-9)))
    rms = np.sqrt(np.mean(mix ** 2))
    print('mix rms dBFS: %.1f' % (20 * np.log10(rms + 1e-9)))
    fade_n = int(1.5 * SR)
    mix[-fade_n:] *= np.linspace(1, 0, fade_n)[:, None]
    return mix


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
    mix = build()
    wavfile.write(out, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
    print('wrote', out, mix.shape[0] / SR, 's')
