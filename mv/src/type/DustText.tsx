import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, easeOutCubic, lerp, noise1, prog, rnd, rndRange} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {H, SERIF_CN, W} from '../theme';

// Gold lettering drawn on canvas so it can do the one thing DOM text cannot: break apart
// into dust. Each glyph comes into focus from a blur; on exit a front sweeps along the
// line and every pixel behind it lifts off as a drifting gold mote.

interface Glyphs {
  /** Sampled ink points in line-local px (x along the line, y across), with glyph index. */
  points: {x: number; y: number; g: number}[];
  len: number;
}

const glyphCache = new Map<string, Glyphs>();

const sampleGlyphs = (text: string, size: number, weight: number, font: string, adv: number, vertical: boolean): Glyphs => {
  const key = `${text}|${size}|${weight}|${font}|${adv}|${vertical}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const chars = [...text];
  const len = (chars.length - 1) * adv + size;
  const pad = size;
  const cw = Math.ceil(vertical ? size + pad * 2 : len + pad * 2);
  const ch = Math.ceil(vertical ? len + pad * 2 : size + pad * 2);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d', {willReadFrequently: true});
  const points: Glyphs['points'] = [];
  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chars.forEach((g, i) => {
      const along = i * adv + size / 2;
      ctx.fillText(g, vertical ? pad + size / 2 : pad + along, vertical ? pad + along : pad + size / 2);
    });
    const data = ctx.getImageData(0, 0, cw, ch).data;
    const step = Math.max(2, Math.round(size / 34));
    for (let y = 0; y < ch; y += step) {
      for (let x = 0; x < cw; x += step) {
        if (data[(y * cw + x) * 4 + 3] > 110) {
          const a = vertical ? y - pad : x - pad;
          const across = vertical ? x - pad - size / 2 : y - pad - size / 2;
          points.push({x: a, y: across, g: Math.min(chars.length - 1, Math.max(0, Math.floor(a / adv)))});
        }
      }
    }
  }
  const out = {points, len};
  glyphCache.set(key, out);
  return out;
};

export interface DustTextProps {
  text: string;
  /** Centre of the line. */
  x: number;
  y: number;
  size: number;
  weight?: number;
  /** Extra space between glyphs, in em. */
  spacing?: number;
  vertical?: boolean;
  font?: string;
  /** Seconds since the line starts appearing. */
  t: number;
  stagger?: number;
  reveal?: number;
  blur?: number;
  /** Seconds (since start) when the line starts breaking into dust; Infinity keeps it. */
  dissolve?: number;
  dissolveDur?: number;
  /** Highlight sweep position 0..1 (outside: none). */
  sweep?: number;
  glow?: number;
  opacity?: number;
  /** Mean drift of the dust in px/s (screen space); default drifts right and up. */
  wind?: [number, number];
  seed?: string;
}

export const DustText: React.FC<DustTextProps> = ({
  text,
  x,
  y,
  size,
  weight = 500,
  spacing = 0.12,
  vertical = false,
  font = SERIF_CN,
  t,
  stagger = 0.1,
  reveal = 0.9,
  blur = 12,
  dissolve = Infinity,
  dissolveDur = 1.6,
  sweep = -1,
  glow = 0.6,
  opacity = 1,
  wind,
  seed = 'dt',
}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      const chars = [...text];
      const adv = size * (1 + spacing);
      const G = sampleGlyphs(text, size, weight, font, adv, vertical);
      const len = G.len;
      // Line-local → screen: "a" runs along the line, "b" across it.
      const sx = (a: number, b: number) => (vertical ? x + b : x - len / 2 + a);
      const sy = (a: number, b: number) => (vertical ? y - len / 2 + a : y + b);
      const front = dissolve === Infinity ? -1 : ((t - dissolve) / dissolveDur) * (len + size) - size * 0.5;
      ctx.globalAlpha = opacity;

      // Glyphs still intact: everything past the dissolve front.
      ctx.save();
      if (front > -size) {
        ctx.beginPath();
        if (vertical) ctx.rect(0, sy(front, 0), W, H);
        else ctx.rect(sx(front, 0), 0, W, H);
        ctx.clip();
      }
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      chars.forEach((g, i) => {
        const p = prog(t, i * stagger, i * stagger + reveal, easeOutCubic);
        if (p <= 0.003) return;
        const a = i * adv + size / 2;
        const gx = sx(a, 0) + (vertical ? 0 : (1 - p) * 16);
        const gy = sy(a, 0) + (vertical ? (1 - p) * 16 : 0);
        const fill = ctx.createLinearGradient(gx, gy - size * 0.55, gx, gy + size * 0.55);
        fill.addColorStop(0, '#FFF1CC');
        fill.addColorStop(0.28, '#E6C584');
        fill.addColorStop(0.55, '#BE9550');
        fill.addColorStop(0.8, '#87632D');
        fill.addColorStop(1, '#C49C5A');
        ctx.globalAlpha = opacity * p;
        ctx.filter = p < 0.995 ? `blur(${lerp(blur, 0, p)}px)` : 'none';
        if (glow > 0) {
          ctx.shadowColor = `rgba(214,176,108,${0.45 * glow})`;
          ctx.shadowBlur = size * 0.35 * glow;
        }
        ctx.fillStyle = fill;
        ctx.fillText(g, gx, gy);
        ctx.shadowBlur = 0;
        if (sweep >= 0 && sweep <= 1) {
          const pos = lerp(-size * 2, len + size * 2, sweep);
          const da = a - pos;
          const k = Math.exp(-(da * da) / (2 * Math.pow(size * 0.9, 2)));
          if (k > 0.02) {
            ctx.globalAlpha = opacity * p * k * 0.85;
            ctx.fillStyle = '#FFF8E6';
            ctx.fillText(g, gx, gy);
          }
        }
      });
      ctx.restore();
      ctx.filter = 'none';

      // Dust: every ink point behind the front lifts off and drifts away.
      if (front > -size) {
        ctx.globalCompositeOperation = 'lighter';
        const span = len + size;
        G.points.forEach((pt, i) => {
          if (i % 2) return;
          const born = dissolve + ((pt.x + size * 0.5) / span) * dissolveDur + rnd(`${seed}b${i}`) * 0.18;
          const age = t - born;
          const life = rndRange(`${seed}l${i}`, 1.3, 2.6);
          if (age < 0 || age > life) return;
          let px: number;
          let py: number;
          if (wind) {
            const k = rndRange(`${seed}wk${i}`, 0.45, 1.6);
            const vx = wind[0] * k + rndRange(`${seed}vx${i}`, -40, 40);
            const vy = wind[1] * k + rndRange(`${seed}vy${i}`, -45, 45);
            px = sx(pt.x, pt.y) + vx * age + noise1(age * 1.4 + i * 0.37) * 18 * age;
            py = sy(pt.x, pt.y) + vy * age + noise1(age * 1.2 + i * 0.71) * 14 * age;
          } else {
            const vx = rndRange(`${seed}vx${i}`, 18, 95);
            const vy = rndRange(`${seed}vy${i}`, -62, -8);
            const da = vertical ? vy * 0.4 * age : vx * age;
            const db = vertical ? -vx * 0.5 * age : vy * age;
            px = sx(pt.x + da, pt.y + db) + noise1(age * 1.4 + i * 0.37) * 10;
            py = sy(pt.x + da, pt.y + db) + noise1(age * 1.2 + i * 0.71) * 8;
          }
          const heat = 1 - clamp(age / 0.45);
          const fade = Math.pow(1 - age / life, 1.5);
          const r = rndRange(`${seed}r${i}`, 0.8, 1.9) * (1 + heat * 0.7);
          ctx.globalAlpha = opacity * fade * 0.9;
          ctx.fillStyle = heat > 0.35 ? '#FFF2D2' : '#E2C07E';
          ctx.fillRect(px - r, py - r, r * 2, r * 2);
        });
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    [f, text, x, y, size, t, dissolve, sweep, opacity, wind?.[0], wind?.[1]],
  );
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};
