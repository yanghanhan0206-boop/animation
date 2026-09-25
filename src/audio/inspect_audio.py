"""Draw loudness envelope + spectrogram of a wav with shot boundaries (sanity check without ears)."""
import sys, os
import numpy as np
from scipy.io import wavfile
from scipy import signal
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import edl
sr, x = wavfile.read(sys.argv[1])
x = x.astype(np.float32) / 32768.0
m = x.mean(1)
W, H = 1900, 700
img = Image.new('RGB', (W, H), 'black')
d = ImageDraw.Draw(img)
dur = len(m) / sr
f, t, Sxx = signal.spectrogram(m, sr, nperseg=2048, noverlap=1024)
Sdb = 10 * np.log10(Sxx + 1e-12)
fmax = 8000
fi = f <= fmax
Sdb = Sdb[fi][::-1]
Sdb = np.clip((Sdb + 110) / 80, 0, 1)
spec = Image.fromarray((Sdb * 255).astype(np.uint8)).resize((W, 380))
img.paste(Image.merge('RGB', (spec, spec.point(lambda v: v * 0.6), spec.point(lambda v: 255 - v if v > 0 else 0))), (0, 0))
# rms envelope in dB
hop = int(0.05 * sr)
n = len(m) // hop
rms = np.sqrt(np.mean(m[:n * hop].reshape(n, hop) ** 2, 1) + 1e-12)
pk = np.max(np.abs(m[:n * hop].reshape(n, hop)), 1)
y0 = 400
for k in range(n):
    xx = int(k / n * W)
    r = 20 * np.log10(rms[k]); p = 20 * np.log10(pk[k] + 1e-9)
    d.line((xx, y0 + 280, xx, y0 + 280 - max(0, (r + 60) / 60 * 280)), fill=(80, 200, 120))
    d.point((xx, y0 + 280 - max(0, (p + 60) / 60 * 280)), fill=(255, 255, 0))
for db_ in (-12, -24, -36, -48):
    yy = y0 + 280 - (db_ + 60) / 60 * 280
    d.line((0, yy, W, yy), fill=(60, 60, 60))
    d.text((2, yy - 10), f'{db_}dB', fill=(150, 150, 150))
st = edl.starts()
for name, t0 in st.items():
    xx = int(t0 / dur * W)
    d.line((xx, 0, xx, H), fill=(255, 80, 80))
    d.text((xx + 2, 385 if list(st).index(name) % 2 else 392), name, fill=(255, 200, 200))
img.save(sys.argv[2])
print('saved')
