"""Contact sheet of rendered frames: python3 src/tools_sheet.py DIR OUT [cols] [every]"""
import sys, os, glob
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
every = int(sys.argv[4]) if len(sys.argv) > 4 else 1
fs = sorted(glob.glob(os.path.join(d, '[0-9]*.png')))[::every]
fs = [f for f in fs if not f.endswith('.tmp.png')]
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = ims[0].size
s = min(1.0, 1920 / (w * cols))
tw, th = int(w * s), int(h * s)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (tw * cols, th * rows), 'black')
dr = ImageDraw.Draw(sheet)
for k, (f, im) in enumerate(zip(fs, ims)):
    x, y = (k % cols) * tw, (k // cols) * th
    sheet.paste(im.resize((tw, th)), (x, y))
    dr.text((x + 4, y + 2), os.path.basename(f)[:4], fill=(255, 255, 0))
sheet.save(out)
print(out, len(ims))
