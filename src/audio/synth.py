"""Sound synthesis from scratch with numpy: an additive 'felt piano', pads,
drones, and every sound effect in the film (phone buzz, typing, paper,
rain, heartbeat, splash, voices-as-instruments...). No samples are used."""
import numpy as np
from scipy import signal

SR = 48000


def tt(dur):
    return np.arange(int(round(dur * SR))) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)


NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def nm(s):
    """'C#4' -> midi number"""
    s = s.strip()
    base = NOTE[s[0].upper()]
    i = 1
    while i < len(s) and s[i] in '#b':
        base += 1 if s[i] == '#' else -1
        i += 1
    return base + 12 * (int(s[i:]) + 1)


# --------------------------------------------------------------------------
# filters
# --------------------------------------------------------------------------
def lowpass(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    b, a = signal.butter(order, fc / (SR / 2), 'low')
    return signal.lfilter(b, a, x, axis=0)


def highpass(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x, axis=0)


def bandpass(x, lo, hi, order=2):
    hi = min(hi, SR * 0.45)
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x, axis=0)


def noise(n, rng=None, color='white'):
    rng = rng or np.random.default_rng(0)
    w = rng.standard_normal(n)
    if color == 'pink':
        b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
        a = [1, -2.494956002, 2.017265875, -0.522189400]
        w = signal.lfilter(b, a, w) * 3.5
    elif color == 'brown':
        w = np.cumsum(w)
        w = highpass(w, 20) / 60.0
    return w


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def fade(x, fin=0.005, fout=0.02):
    n = len(x)
    a, b = int(fin * SR), int(fout * SR)
    if a > 0:
        x[:a] *= np.linspace(0, 1, a)
    if b > 0:
        x[-b:] *= np.linspace(1, 0, b)
    return x


# --------------------------------------------------------------------------
# instruments
# --------------------------------------------------------------------------
def piano(freq, dur, vel=0.7, soft=0.6, seed=0, tail=2.5):
    """Additive felt piano: inharmonic partials, two detuned strings, two-stage
    decay, hammer thump, damper release after `dur`."""
    rng = np.random.default_rng(seed)
    tau0 = 3.4 * (261.6 / freq) ** 0.65
    total = dur + min(tail, tau0 * 0.8)
    t = tt(total)
    out = np.zeros_like(t)
    B = 0.00012 * (freq / 261.6) ** 1.1
    nparts = int(max(3, min(16, 7000 / freq)))
    bright = 0.35 + 0.65 * vel * (1 - 0.6 * soft)
    for k in range(1, nparts + 1):
        fk = k * freq * np.sqrt(1 + B * k * k)
        if fk > SR * 0.45:
            break
        amp = (1.0 / k ** 1.15) * np.exp(-(k - 1) * (0.9 - 0.7 * bright))
        tau = tau0 / (1 + 0.45 * (k - 1))
        env = 0.55 * np.exp(-t / (tau * 0.18)) + 0.45 * np.exp(-t / tau)
        det = fk * (2 ** (rng.uniform(0.2, 0.8) / 1200) - 1)
        ph = rng.uniform(0, 2 * np.pi)
        out += amp * env * (np.sin(2 * np.pi * fk * t + ph) + 0.8 * np.sin(2 * np.pi * (fk + det) * t + ph + 0.3))
    att = int(0.004 * SR)
    out[:att] *= np.linspace(0, 1, att)
    rel = t > dur
    out[rel] *= np.exp(-(t[rel] - dur) / 0.16)
    h = int(0.018 * SR)
    ham = bandpass(noise(h, rng), 900, 3500) * np.exp(-np.arange(h) / (0.004 * SR)) * 0.25 * vel
    out[:h] += ham
    out *= vel * 0.22
    if soft > 0:
        out = lowpass(out, 5200 - 3600 * soft)
    return fade(out, 0.0, 0.05)


def saw_additive(freq, t, n=10):
    out = np.zeros_like(t)
    for k in range(1, n + 1):
        if k * freq > SR * 0.4:
            break
        out += np.sin(2 * np.pi * k * freq * t) / k
    return out


def pad(freqs, dur, att=1.5, rel=2.0, vol=0.1, cutoff=1800, detune=6, seed=0):
    rng = np.random.default_rng(seed)
    t = tt(dur + rel)
    out = np.zeros_like(t)
    for f in freqs:
        for d in (-detune, 0, detune):
            ff = f * 2 ** (d / 1200)
            lfo = 1 + 0.002 * np.sin(2 * np.pi * rng.uniform(0.1, 0.3) * t + rng.uniform(0, 6))
            out += saw_additive(ff, t * lfo, 8)
    out /= max(1, len(freqs) * 3)
    env = np.ones_like(t)
    a = int(att * SR)
    env[:a] = np.linspace(0, 1, a) ** 2
    r0 = int(dur * SR)
    env[r0:] = np.linspace(1, 0, len(t) - r0) ** 2
    out = lowpass(out * env, cutoff, 2) * vol
    return out


def drone(freq, dur, vol=0.1, beat=0.3):
    t = tt(dur)
    x = (np.sin(2 * np.pi * freq * t) + 0.6 * np.sin(2 * np.pi * (freq + beat) * t)
         + 0.3 * np.sin(2 * np.pi * 2 * freq * t) + 0.15 * np.sin(2 * np.pi * 3.01 * freq * t))
    return fade(x * vol / 2.0, 1.0, 1.0)


def bell(freq, dur=1.6, vol=0.2):
    """Soft notification chime."""
    t = tt(dur)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.5) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.18)
         + 0.2 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t / 0.08))
    return fade(x * vol, 0.002, 0.05)


def ding(vol=0.25, base=1318.5):
    a = bell(base, 1.2, vol)
    b = bell(base * 1.5, 1.4, vol * 0.9)
    out = np.zeros(int(1.8 * SR))
    out[:len(a)] += a
    o = int(0.12 * SR)
    out[o:o + len(b)] += b
    return out


def marimba(freq, vol=0.3):
    t = tt(0.9)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.35) + 0.25 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.05))
    return fade(x * vol, 0.001, 0.05)


# --------------------------------------------------------------------------
# voices as instruments (mom = muted trumpet over the phone, Xiaoman = breathy reed)
# --------------------------------------------------------------------------
def voice(text_len, dur, f0=240.0, kind='mom', seed=0):
    """Speech-like phrase with one 'syllable' per character; plunger-muted brass."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    syl = max(1, text_len)
    # pitch contour: gentle declination + per-syllable inflections
    edges = np.linspace(0, n, syl + 1).astype(int)
    f = np.zeros(n)
    amp = np.zeros(n)
    wah = np.zeros(n)
    for k in range(syl):
        a, b = edges[k], edges[k + 1]
        m = b - a
        ff = f0 * (1.0 - 0.12 * k / syl) * 2 ** (rng.uniform(-2.5, 3.5) / 12)
        glide = np.linspace(1.0, 2 ** (rng.uniform(-2, 1.5) / 12), m)
        f[a:b] = ff * glide
        env = np.sin(np.linspace(0, np.pi, m)) ** 0.6
        gap = int(m * rng.uniform(0.05, 0.25))
        if gap:
            env[-gap:] *= np.linspace(1, 0.05, gap)
        amp[a:b] = env * rng.uniform(0.7, 1.0)
        wah[a:b] = np.sin(np.linspace(0, np.pi, m))
    f = lowpass(f, 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == 'mom':
        x = np.zeros(n)
        for k in range(1, 14):
            x += np.sin(k * ph) / k ** 0.9
        cutoff = 500 + 1600 * wah
        # time-varying lowpass (the plunger) approximated in blocks
        y = np.zeros(n)
        blk = 1024
        zi = None
        for s0 in range(0, n, blk):
            fc = float(np.mean(cutoff[s0:s0 + blk]))
            b, a = signal.butter(2, fc / (SR / 2), 'low')
            if zi is None:
                zi = signal.lfilter_zi(b, a) * 0
            y[s0:s0 + blk], zi = signal.lfilter(b, a, x[s0:s0 + blk], zi=zi)
        y = bandpass(y, 320, 3200, 2)          # telephone band
        y = np.tanh(y * 2.2) * 0.5
    else:
        x = np.zeros(n)
        for k in range(1, 12, 2):              # odd harmonics: reed-like
            x += np.sin(k * ph) / k ** 1.3
        x += 0.25 * lowpass(noise(n, rng), 3000) * wah   # breath
        y = lowpass(x, 1400 + 600 * float(np.mean(wah)))
    y *= amp
    return fade(y * 0.3, 0.01, 0.05)


# --------------------------------------------------------------------------
# sound effects
# --------------------------------------------------------------------------
def phone_buzz(dur=0.34, vol=0.35, seed=0):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    f = 172 + 3 * np.sin(2 * np.pi * 9 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.6 + np.sin(ph)
    x = lowpass(x, 900)
    rattle = bandpass(noise(len(t), rng), 1500, 5000) * (0.5 + 0.5 * np.sign(np.sin(ph * 0.5)))
    x = x + 0.25 * rattle
    return fade(x * vol, 0.01, 0.03)


def keyclick(vol=0.12, seed=0):
    rng = np.random.default_rng(seed)
    n = int(0.03 * SR)
    click = bandpass(noise(n, rng), 1800, 7000) * np.exp(-np.arange(n) / (0.0025 * SR))
    th = np.sin(2 * np.pi * rng.uniform(260, 420) * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.006 * SR))
    return (click * 0.7 + th * 0.5) * vol * rng.uniform(0.6, 1.0)


def trackpad_click(vol=0.15):
    n = int(0.02 * SR)
    x = bandpass(noise(n), 2000, 6000) * np.exp(-np.arange(n) / (0.0015 * SR))
    return x * vol


def tick(vol=0.08, hi=True):
    n = int(0.03 * SR)
    f = 3200 if hi else 2500
    x = np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.002 * SR))
    x += bandpass(noise(n), 3000, 8000) * np.exp(-np.arange(n) / (0.001 * SR)) * 0.5
    return x * vol


def paper(dur=0.25, vol=0.2, seed=0, lo=1200, hi=7000):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = bandpass(noise(n, rng), lo, hi)
    crack = (rng.random(n) < 0.004).astype(float) * rng.uniform(-1, 1, n)
    x += bandpass(crack, 2000, 9000) * 3
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * env * vol


def paper_land(vol=0.25, seed=0):
    rng = np.random.default_rng(seed)
    a = paper(0.12, vol * 0.6, seed, 800, 6000)
    n = int(0.08 * SR)
    thud = lowpass(noise(n, rng), 400) * np.exp(-np.arange(n) / (0.01 * SR)) * vol * 2
    out = np.zeros(len(a) + n)
    out[:len(a)] += a
    out[len(a) - n // 2:len(a) - n // 2 + n] += thud
    return out


def rip(dur=0.6, vol=0.35, seed=1):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = bandpass(noise(n, rng), 600, 8000)
    am = np.clip(lowpass(rng.standard_normal(n), 60) * 8, 0, 1)
    env = np.linspace(0.6, 1, n) * np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    return x * am * env * vol


def whoosh(dur=0.6, vol=0.2, up=True, seed=0):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = noise(n, rng)
    out = np.zeros(n)
    blk = 512
    for s0 in range(0, n, blk):
        u = s0 / n
        fc = (300 + 3000 * u) if up else (3300 - 3000 * u)
        b, a = signal.butter(2, [max(80, fc * 0.6) / (SR / 2), min(fc * 1.6, SR * 0.45) / (SR / 2)], 'band')
        out[s0:s0 + blk] = signal.lfilter(b, a, x[s0:s0 + blk])
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    return out * env * vol


def heartbeat(vol=0.5):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    beat = np.zeros(n)
    for off, a in ((0.0, 1.0), (0.18, 0.7)):
        tt_ = t - off
        m = tt_ >= 0
        beat[m] += a * np.sin(2 * np.pi * 52 * tt_[m]) * np.exp(-tt_[m] / 0.05) * (1 - np.exp(-tt_[m] / 0.003))
    beat += lowpass(noise(n), 180) * np.exp(-t / 0.06) * 0.3
    return beat * vol


def breath(dur=1.2, vol=0.08, inhale=True, seed=0):
    n = int(dur * SR)
    x = bandpass(noise(n, np.random.default_rng(seed)), 500, 3000)
    env = np.sin(np.linspace(0, np.pi, n)) ** (1.5 if inhale else 0.8)
    return x * env * vol


def rain(dur, vol=0.12, seed=0):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    bed = bandpass(noise(n, rng, 'pink'), 400, 9000) * 0.6
    drops = np.zeros(n)
    idx = rng.integers(0, n, int(dur * 90))
    drops[idx] = rng.uniform(-1, 1, len(idx))
    drops = bandpass(drops, 2000, 9000) * 4
    return (bed + drops) * vol


def underwater(dur, vol=0.18, seed=0):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = lowpass(noise(n, rng, 'brown'), 350, 2) * 3
    t = np.arange(n) / SR
    x += 0.3 * np.sin(2 * np.pi * 48 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.1 * t))
    return fade(x * vol, 0.5, 0.5)


def bubble(vol=0.15, seed=0):
    rng = np.random.default_rng(seed)
    d = rng.uniform(0.04, 0.09)
    t = tt(d)
    f0 = rng.uniform(500, 1100)
    f = f0 * (1 + 2.5 * t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * 0.5))
    return x * vol


def splash(vol=0.5, seed=0):
    rng = np.random.default_rng(seed)
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    body = lowpass(noise(n, rng), 1800) * np.exp(-t / 0.15)
    f = 180 * np.exp(-t / 0.05) + 60
    bloop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    spray = bandpass(noise(n, rng), 2500, 9000) * np.exp(-t / 0.35) * 0.3
    return (body * 0.8 + bloop * 0.6 + spray) * vol


def bird(vol=0.08, seed=0):
    rng = np.random.default_rng(seed)
    out = []
    for k in range(rng.integers(2, 4)):
        d = rng.uniform(0.07, 0.14)
        t = tt(d)
        f = rng.uniform(3200, 4200) + 1400 * np.sin(np.pi * t / d) * rng.choice([-1, 1])
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2
        out.append(x)
        out.append(np.zeros(int(rng.uniform(0.04, 0.09) * SR)))
    return np.concatenate(out) * vol


def beep(freq=1800, dur=0.09, vol=0.12):
    t = tt(dur)
    return fade(np.sin(2 * np.pi * freq * t) * vol, 0.003, 0.01)


def buzzer(dur=0.8, vol=0.2):
    t = tt(dur)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) + np.sign(np.sin(2 * np.pi * 116 * t))
    return fade(lowpass(x, 1500) * vol * 0.4, 0.01, 0.1)


def pen_scratch(dur=0.4, vol=0.08, seed=0):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = bandpass(noise(n, rng), 2500, 9000)
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rng.uniform(7, 12) * np.arange(n) / SR))
    return x * lowpass(am, 40) * vol


def plip(vol=0.2):
    t = tt(0.25)
    f = 900 * np.exp(-t / 0.03) + 500
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) * vol


def room_tone(dur, vol=0.02, seed=3):
    n = int(dur * SR)
    return lowpass(noise(n, np.random.default_rng(seed), 'brown'), 900) * vol * 6


def shepard(dur, vol=0.15, rise=True, voices=6, base=110.0, seed=0):
    """Endlessly rising cluster (Shepard-Risset glissando) for the spiral."""
    t = tt(dur)
    out = np.zeros_like(t)
    rate = 1.0 / 7.0
    for k in range(voices):
        pos = (k / voices + (rate * t if rise else -rate * t)) % 1.0
        f = base * 2 ** (pos * voices / 1.5)
        amp = np.sin(np.pi * pos) ** 2
        ph = 2 * np.pi * np.cumsum(f) / SR
        out += amp * (np.sin(ph) + 0.3 * np.sin(2 * ph))
    return fade(out * vol / voices * 2, 0.5, 0.05)


# --------------------------------------------------------------------------
# space
# --------------------------------------------------------------------------
def impulse_response(rt60=2.3, dur=3.2, seed=7, bright=6000):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / rt60)
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * decay[:, None]
    ir = lowpass(ir, bright, 1)
    for d, g in ((0.011, 0.5), (0.019, 0.4), (0.027, 0.35), (0.041, 0.3), (0.053, 0.25)):
        k = int(d * SR)
        ir[k, 0] += g * rng.uniform(0.7, 1.3)
        ir[k + int(0.003 * SR), 1] += g * rng.uniform(0.7, 1.3)
    ir /= np.sqrt(np.sum(ir ** 2) / 2)
    return ir


def reverb(x, ir, wet=0.3):
    """x: (n,2)"""
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1)
    return x * (1 - wet) + y * wet


class Bus:
    """Stereo mix buffer."""

    def __init__(self, dur):
        self.x = np.zeros((int((dur + 4) * SR), 2))

    def add(self, s, t0, gain=1.0, pan=0.0):
        if s is None or len(s) == 0 or t0 < -10:
            return
        i0 = int(round(t0 * SR))
        if s.ndim == 1:
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            s = np.stack([s * l, s * r], 1) * np.sqrt(2)
        if i0 < 0:
            s = s[-i0:]
            i0 = 0
        n = min(len(s), len(self.x) - i0)
        if n > 0:
            self.x[i0:i0 + n] += s[:n] * gain

    def env(self, t0, t1, g0, g1):
        """Multiply a region by a linear gain ramp."""
        a, b = int(t0 * SR), int(t1 * SR)
        b = min(b, len(self.x))
        if b > a:
            self.x[a:b] *= np.linspace(g0, g1, b - a)[:, None]

    def mute(self, t0, t1):
        a, b = int(t0 * SR), int(t1 * SR)
        self.x[a:b] = 0
