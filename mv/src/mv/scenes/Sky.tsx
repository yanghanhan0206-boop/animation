import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOutSine, lerp, prog, rnd, rndRange, smoothstep} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, W} from '../../theme';

// 「天空突然间晴转阴」: a time-lapse over the city. Fair-weather cloud drifts in a high, clear
// afternoon sky; then a front of grey cloud rolls up from the horizon, swallows the sun and
// closes the sky, and the windows come on in the middle of the day.

// --- Gradient noise ---------------------------------------------------------------------
const PERM = (() => {
  const p = Array.from({length: 256}, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd(`perm${i}`) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return Uint8Array.from([...p, ...p]);
})();
const GX = Float32Array.from([1, -1, 1, -1, 1, -1, 0, 0]);
const GY = Float32Array.from([1, 1, -1, -1, 0, 0, 1, -1]);
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const perlin = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const X = xi & 255;
  const Y = yi & 255;
  const aa = PERM[PERM[X] + Y] & 7;
  const ab = PERM[PERM[X] + Y + 1] & 7;
  const ba = PERM[PERM[X + 1] + Y] & 7;
  const bb = PERM[PERM[X + 1] + Y + 1] & 7;
  const u = fade(xf);
  const v = fade(yf);
  const x1 = GX[aa] * xf + GY[aa] * yf + u * (GX[ba] * (xf - 1) + GY[ba] * yf - (GX[aa] * xf + GY[aa] * yf));
  const x2 = GX[ab] * xf + GY[ab] * (yf - 1) + u * (GX[bb] * (xf - 1) + GY[bb] * (yf - 1) - (GX[ab] * xf + GY[ab] * (yf - 1)));
  return x1 + v * (x2 - x1);
};

/** Five octaves, mapped to roughly [0, 1]. */
const fbm = (x: number, y: number) => {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let o = 0; o < 5; o++) {
    s += a * perlin(x * f + o * 17.1, y * f - o * 9.7);
    f *= 2.03;
    a *= 0.5;
  }
  return 0.5 + s * 0.75;
};

// --- City -------------------------------------------------------------------------------
const BASE = 950;
interface Block {
  x: number;
  w: number;
  top: number;
  far: boolean;
  spire?: number;
  step?: number;
  /** Rooftop clutter: an antenna (px tall) and/or a plant box (px wide). */
  mast?: number;
  box?: number;
}

const CITY: Block[] = (() => {
  const out: Block[] = [];
  // Far row: hazy, lower contrast.
  for (let x = -40; x < W + 40; ) {
    const w = rndRange(`fw${x}`, 40, 120);
    out.push({x, w, top: BASE - rndRange(`fh${x}`, 160, x > 1000 ? 330 : 250), far: true});
    x += w + rndRange(`fg${x}`, -10, 6);
  }
  // Near row: lower on the left where the lyrics sit, a cluster of towers on the right.
  for (let x = -30; x < W + 40; ) {
    const w = rndRange(`nw${x}`, 50, 150);
    const tall = x > 1150 && x < 1800;
    const h = tall ? rndRange(`nh${x}`, 200, 380) : rndRange(`nh${x}`, 110, 200);
    out.push({
      x,
      w,
      top: BASE - h,
      far: false,
      step: rnd(`ns${x}`) < 0.35 ? rndRange(`nst${x}`, 20, 60) : undefined,
      mast: rnd(`nm${x}`) < 0.3 ? rndRange(`nmh${x}`, 18, 54) : undefined,
      box: rnd(`nb${x}`) < 0.45 ? rndRange(`nbw${x}`, 14, 34) : undefined,
    });
    // Either buildings touch or there is a real gap: no hairline slivers of sky.
    x += w + (rnd(`ng${x}`) < 0.6 ? 0 : rndRange(`ngw${x}`, 16, 44));
  }
  // Two landmark towers.
  out.push({x: 1360, w: 70, top: 470, far: false, spire: 120});
  out.push({x: 1590, w: 96, top: 540, far: false, step: 60, spire: 50});
  return out;
})();

interface Win {
  x: number;
  y: number;
  on: number;
}

const WINDOWS: Win[] = (() => {
  const out: Win[] = [];
  for (const [i, b] of CITY.entries()) {
    if (b.far) continue;
    for (let y = b.top + 18; y < BASE - 10; y += 15) {
      for (let x = b.x + 8; x < b.x + b.w - 8; x += 11) {
        const lyricZone = x < 900 && y > 740;
        const p = rnd(`w${i}_${x}_${y}`);
        if (p < (lyricZone ? 0.86 : 0.55)) continue;
        out.push({x, y, on: rnd(`wo${i}_${x}_${y}`)});
      }
    }
  }
  return out;
})();

const BW = 480;
const BH = 270;
const SCALE = W / BW;
let buf: {c: HTMLCanvasElement; img: ImageData} | null = null;
const buffer = () => {
  if (buf) return buf;
  const c = document.createElement('canvas');
  c.width = BW;
  c.height = BH;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context');
  buf = {c, img: ctx.createImageData(BW, BH)};
  return buf;
};

const HORIZON = 800;
const SUN = {x: 1460, y: 300};

/** Paints the sky (gradient, sun, clouds in perspective) into the low-res buffer. */
const paintSky = (t: number, c: number) => {
  const {c: canvas, img} = buffer();
  const d = img.data;
  // The front: everything further than `front` (in cloud-plane depth) is overcast.
  const front = lerp(15, -1.5, c);
  const sunUp = 1 - smoothstep(0.25, 0.75, c);
  const wy = t * 0.55;
  const wx = t * 0.12;
  for (let py = 0; py < BH; py++) {
    const sy = py * SCALE;
    const dh = Math.max(14, HORIZON - sy);
    const depth = 900 / dh;
    const haze = smoothstep(14, 120, HORIZON - sy);
    const vy = sy / HORIZON;
    for (let px = 0; px < BW; px++) {
      const sx = px * SCALE;
      const u = (sx - W / 2) / dh;
      const X = u * 0.95 + wx;
      const Y = depth * 0.62 + wy;
      const o = smoothstep(front - 1.6, front + 1.6, depth);
      const th = lerp(0.6, 0.3, o);
      const n = fbm(X, Y);
      const a = smoothstep(th, th + 0.17, n) * haze;
      // Lit from the sun's side: compare with the density a step toward the sun.
      const toSx = SUN.x - sx;
      const toSy = SUN.y - sy;
      const inv = 1 / Math.max(1, Math.hypot(toSx, toSy));
      // A 22 px step toward the sun, carried into cloud-plane coordinates.
      const n2 = fbm(X + (22 * toSx * inv * 0.95) / dh, Y + (22 * toSy * inv * 0.62 * 900) / (dh * dh));
      const lit = clamp(0.55 + (n - n2) * 5.5);
      const thick = smoothstep(th + 0.1, th + 0.4, n);
      // Sky behind.
      const k = c * 0.7 + o * 0.3;
      let sr = lerp(lerp(50, 146, vy), lerp(44, 92, vy), k);
      let sg = lerp(lerp(84, 164, vy), lerp(48, 96, vy), k);
      let sb = lerp(lerp(136, 184, vy), lerp(56, 104, vy), k);
      const ds = Math.hypot(sx - SUN.x, sy - SUN.y);
      const glow = (Math.exp(-(ds * ds) / 4200) * 1.05 + Math.exp(-(ds * ds) / 200000) * 0.24) * sunUp;
      sr += 255 * glow;
      sg += 236 * glow;
      sb += 196 * glow;
      // Cloud.
      const shade = 1 - 0.45 * thick * o;
      const sil = Math.exp(-(ds * ds) / 120000) * sunUp * 0.7;
      const cr = (lerp(lerp(126, 46, o), lerp(255, 120, o), lit) * shade + 255 * sil * (1 - thick)) * lerp(1, 0.72, c);
      const cg = (lerp(lerp(140, 48, o), lerp(246, 124, o), lit) * shade + 226 * sil * (1 - thick)) * lerp(1, 0.72, c);
      const cb = (lerp(lerp(166, 56, o), lerp(232, 134, o), lit) * shade + 180 * sil * (1 - thick)) * lerp(1, 0.74, c);
      const i = (py * BW + px) * 4;
      d[i] = sr + (cr - sr) * a;
      d[i + 1] = sg + (cg - sg) * a;
      d[i + 2] = sb + (cb - sb) * a;
      d[i + 3] = 255;
    }
  }
  canvas.getContext('2d')?.putImageData(img, 0, 0);
  return canvas;
};

export const Sky: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const c = prog(t, 0.35, dur - 0.3, easeInOutSine);
  const ref = useCanvas(
    (ctx) => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(paintSky(t, c), 0, 0, W, H);
      // City: a hazy far row, haze, then the near row in silhouette.
      const farFill = ctx.createLinearGradient(0, 600, 0, BASE);
      farFill.addColorStop(0, `rgb(${lerp(64, 34, c) | 0},${lerp(78, 38, c) | 0},${lerp(98, 46, c) | 0})`);
      farFill.addColorStop(1, `rgb(${lerp(26, 14, c) | 0},${lerp(30, 16, c) | 0},${lerp(40, 20, c) | 0})`);
      const nearFill = `rgb(${lerp(16, 8, c) | 0},${lerp(20, 9, c) | 0},${lerp(29, 12, c) | 0})`;
      const draw = (far: boolean) => {
        for (const b of CITY) {
          if (b.far !== far) continue;
          ctx.fillStyle = far ? farFill : nearFill;
          ctx.fillRect(b.x, b.top, b.w, BASE - b.top + 200);
          if (b.step) ctx.fillRect(b.x + b.w * 0.2, b.top - b.step, b.w * 0.6, b.step + 1);
          if (b.box) ctx.fillRect(b.x + b.w * 0.62, b.top - 12, b.box, 13);
          if (b.mast) ctx.fillRect(b.x + b.w * 0.3, b.top - b.mast, 2, b.mast);
          if (b.spire) {
            const top = b.top - (b.step ?? 0);
            ctx.beginPath();
            ctx.moveTo(b.x + b.w * 0.42, top);
            ctx.lineTo(b.x + b.w / 2, top - b.spire);
            ctx.lineTo(b.x + b.w * 0.58, top);
            ctx.fill();
          }
        }
      };
      draw(true);
      const hz = ctx.createLinearGradient(0, 560, 0, 900);
      hz.addColorStop(0, 'rgba(150,160,175,0)');
      hz.addColorStop(0.7, `rgba(${lerp(150, 70, c) | 0},${lerp(160, 74, c) | 0},${lerp(175, 82, c) | 0},0.14)`);
      hz.addColorStop(1, 'rgba(150,160,175,0)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, 560, W, 340);
      draw(false);
      // Windows come on as the light goes.
      ctx.fillStyle = 'rgba(255,204,140,0.85)';
      for (const w of WINDOWS) {
        if (w.on > c * 0.9) continue;
        ctx.globalAlpha = clamp((c * 0.9 - w.on) * 8) * 0.85;
        ctx.fillRect(w.x, w.y, 4, 6);
      }
      ctx.globalAlpha = 1;
      // Aircraft warning lights on the two towers.
      const blink = Math.sin(t * Math.PI * 2 * 0.9) > 0.2 ? 1 : 0.15;
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y] of [[1395, 348], [1638, 428]]) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, `rgba(255,70,60,${0.9 * blink})`);
        g.addColorStop(1, 'rgba(255,70,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 14, y - 14, 28, 28);
      }
      ctx.globalCompositeOperation = 'source-over';
      // First rain at the very end.
      const rain = prog(t, dur - 0.9, dur);
      if (rain > 0) {
        ctx.strokeStyle = `rgba(200,206,218,${0.22 * rain})`;
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 180 * rain; i++) {
          const x = rnd(`rx${i}`) * W;
          const y = (rnd(`ry${i}`) * H + t * 1500) % H;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 5, y - 30);
          ctx.stroke();
        }
      }
    },
    [f, c],
  );
  return (
    <AbsoluteFill style={{transform: `scale(${lerp(1.0, 1.04, prog(t, 0, dur))})`, transformOrigin: '50% 80%'}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
    </AbsoluteFill>
  );
};
