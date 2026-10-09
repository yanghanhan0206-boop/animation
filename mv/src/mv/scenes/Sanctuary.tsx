import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {clamp, easeInCubic, easeInOutSine, lerp, noise1, prog, rnd} from '../../lib/anim';
import {sprite, useCanvas} from '../../lib/canvas';
import {H, W} from '../../theme';

// 「How can I survive? / probably turning to the Bible」: a dark chapel. A gothic rose window
// burns with jewel colours; sunlight comes through it in parallel coloured beams and lays a
// second, fallen rose on the floor.

type RGB = [number, number, number];
const BLUE: RGB = [34, 76, 210];
const DEEP: RGB = [20, 40, 140];
const RUBY: RGB = [188, 26, 50];
const AMBER: RGB = [244, 176, 60];
const EMERALD: RGB = [24, 128, 88];
const VIOLET: RGB = [110, 48, 164];
const PALE: RGB = [240, 226, 178];

/** Sprite size, centre and glass radius (sprite px). */
const S = 1200;
const C = S / 2;
const R = 500;
const STONE = '#0D0A0F';
const LEAD = 'rgba(9,7,11,0.94)';

const rgb = ([r, g, b]: RGB, k = 1) => `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;

/** Point at distance s (in R) along the axis at angle a, offset u across it. */
const at = (a: number, s: number, u: number): [number, number] => [
  C + (s * Math.cos(a) - u * Math.sin(a)) * R,
  C + (s * Math.sin(a) + u * Math.cos(a)) * R,
];

/** A lancet: straight sides widening outward, closed by a pointed arch. */
const lancet = (a: number, s0: number, s1: number, s2: number, half: number) => {
  const p = new Path2D();
  const h0 = s0 * Math.tan(half);
  const h1 = s1 * Math.tan(half);
  const k1 = s1 + (s2 - s1) * 0.55;
  const k2 = s2 - (s2 - s1) * 0.22;
  p.moveTo(...at(a, s0, -h0));
  p.lineTo(...at(a, s1, -h1));
  p.bezierCurveTo(...at(a, k1, -h1), ...at(a, k2, -h1 * 0.32), ...at(a, s2, 0));
  p.bezierCurveTo(...at(a, k2, h1 * 0.32), ...at(a, k1, h1), ...at(a, s1, h1));
  p.lineTo(...at(a, s0, h0));
  p.closePath();
  return p;
};

const circle = (x: number, y: number, r: number) => {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  return p;
};

/** Piece colour: the field colour at a random brightness, now and then an accent or a pale chip. */
const piece = (base: RGB, accent: RGB, seed: string) => {
  const r = rnd(seed);
  if (r < 0.035) return rgb(PALE, 0.9 + rnd(`${seed}p`) * 0.15);
  if (r < 0.12) return rgb(accent, 0.75 + rnd(`${seed}a`) * 0.4);
  return rgb(base, 0.62 + rnd(`${seed}b`) * 0.55);
};

/** Glass mosaic on a jittered grid that follows the lancet's axis, leaded. */
const mosaicLancet = (ctx: CanvasRenderingContext2D, path: Path2D, a: number, s0: number, s2: number, half: number, base: RGB, accent: RGB, seed: string) => {
  ctx.save();
  ctx.clip(path);
  const ds = 0.044;
  const du = 0.037;
  const hMax = s2 * Math.tan(half) + 0.02;
  const ns = Math.ceil((s2 - s0) / ds) + 2;
  const nu = Math.ceil((2 * hMax) / du) + 1;
  const V = (i: number, j: number): [number, number] => {
    const edge = i === 0 || j === 0 || i === ns || j === nu;
    const js = edge ? 0 : (rnd(`${seed}vs${i}_${j}`) - 0.5) * ds * 0.6;
    const ju = edge ? 0 : (rnd(`${seed}vu${i}_${j}`) - 0.5) * du * 0.6;
    return at(a, s0 - 0.02 + i * ds + js, -hMax + j * du + ju);
  };
  ctx.strokeStyle = LEAD;
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  for (let i = 0; i < ns; i++) {
    for (let j = 0; j < nu; j++) {
      const q = new Path2D();
      q.moveTo(...V(i, j));
      q.lineTo(...V(i + 1, j));
      q.lineTo(...V(i + 1, j + 1));
      q.lineTo(...V(i, j + 1));
      q.closePath();
      ctx.fillStyle = piece(base, accent, `${seed}c${i}_${j}`);
      ctx.fill(q);
      ctx.stroke(q);
    }
  }
  ctx.restore();
};

/** A roundel of glass cut in rings and sectors (colours from the centre outward). */
const mosaicRoundel = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rings: RGB[], sectors: number, seed: string) => {
  ctx.save();
  ctx.clip(circle(x, y, r));
  const n = rings.length;
  ctx.strokeStyle = LEAD;
  ctx.lineWidth = 2.4;
  for (let k = n - 1; k >= 0; k--) {
    const r1 = (r * (k + 1)) / n + 2;
    const r0 = (r * k) / n;
    const m = k === 0 ? 1 : sectors;
    for (let j = 0; j < m; j++) {
      const a0 = (j / m) * Math.PI * 2 + k * 0.4;
      const a1 = ((j + 1) / m) * Math.PI * 2 + k * 0.4;
      const p = new Path2D();
      if (m === 1) p.arc(x, y, r1, 0, Math.PI * 2);
      else {
        p.arc(x, y, r1, a0, a1);
        p.arc(x, y, r0, a1, a0, true);
        p.closePath();
      }
      ctx.fillStyle = rgb(rings[k], 0.66 + rnd(`${seed}${k}_${j}`) * 0.5);
      ctx.fill(p);
      ctx.stroke(p);
    }
  }
  ctx.restore();
};

/** Four-lobed gothic quatrefoil laid over a roundel. */
const quatrefoil = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, fill: RGB, seed: string) => {
  ctx.strokeStyle = LEAD;
  ctx.lineWidth = 2.4;
  for (let k = 0; k < 4; k++) {
    const b = a + (k * Math.PI) / 2;
    const p = circle(x + Math.cos(b) * r * 0.42, y + Math.sin(b) * r * 0.42, r * 0.4);
    ctx.fillStyle = rgb(fill, 0.75 + rnd(`${seed}q${k}`) * 0.35);
    ctx.fill(p);
    ctx.stroke(p);
  }
  const c = circle(x, y, r * 0.2);
  ctx.fillStyle = rgb(AMBER, 1.05);
  ctx.fill(c);
  ctx.stroke(c);
};

/** The window: stone tracery, then glass in every opening, then the carved mouldings. */
const rose = () =>
  sprite('rose-window', S, S, (ctx) => {
    ctx.fillStyle = STONE;
    ctx.beginPath();
    ctx.arc(C, C, R * 1.0, 0, Math.PI * 2);
    ctx.fill();
    const openings: Path2D[] = [];

    // Oculus: an amber heart inside eight petals.
    const oc = circle(C, C, R * 0.17);
    openings.push(oc);
    ctx.save();
    ctx.clip(oc);
    ctx.fillStyle = rgb(DEEP, 1.1);
    ctx.fill(oc);
    ctx.strokeStyle = LEAD;
    ctx.lineWidth = 2.6;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      const p = new Path2D();
      p.ellipse(...at(a, 0.105, 0), R * 0.07, R * 0.035, a, 0, Math.PI * 2);
      ctx.fillStyle = rgb(k % 2 ? RUBY : BLUE, 0.9 + rnd(`oc${k}`) * 0.3);
      ctx.fill(p);
      ctx.stroke(p);
    }
    ctx.restore();
    mosaicRoundel(ctx, C, C, R * 0.06, [AMBER, AMBER], 6, 'oc-core');

    // Twelve lancets radiating from the oculus, each with a medallion, a quatrefoil above.
    for (let k = 0; k < 12; k++) {
      const a = -Math.PI / 2 + (k / 12) * Math.PI * 2;
      const half = 0.19;
      const L = lancet(a, 0.215, 0.43, 0.515, half);
      openings.push(L);
      mosaicLancet(ctx, L, a, 0.215, 0.515, half, k % 2 ? BLUE : DEEP, RUBY, `in${k}`);
      const [mx, my] = at(a, 0.34, 0);
      const med = circle(mx, my, R * 0.042);
      mosaicRoundel(ctx, mx, my, R * 0.042, [AMBER, k % 2 ? RUBY : EMERALD], 5, `med${k}`);
      ctx.strokeStyle = LEAD;
      ctx.lineWidth = 2.6;
      ctx.stroke(med);
      const [qx, qy] = at(a, 0.563, 0);
      const Q = circle(qx, qy, R * 0.043);
      openings.push(Q);
      mosaicRoundel(ctx, qx, qy, R * 0.043, [RUBY, RUBY], 4, `qr${k}`);
      quatrefoil(ctx, qx, qy, R * 0.043, a, k % 2 ? BLUE : VIOLET, `qf${k}`);
      // A small trefoil roundel between the lancet heads.
      const [tx, ty] = at(a + Math.PI / 12, 0.545, 0);
      const T = circle(tx, ty, R * 0.028);
      openings.push(T);
      mosaicRoundel(ctx, tx, ty, R * 0.028, [k % 2 ? EMERALD : AMBER], 3, `tr${k}`);
    }

    // Twenty-four outer lancets, alternating ruby and blue fields.
    for (let j = 0; j < 24; j++) {
      const a = -Math.PI / 2 + (j / 24) * Math.PI * 2;
      const half = 0.1;
      const L = lancet(a, 0.64, 0.855, 0.93, half);
      openings.push(L);
      mosaicLancet(ctx, L, a, 0.64, 0.93, half, j % 2 ? RUBY : BLUE, j % 2 ? BLUE : AMBER, `out${j}`);
      const [mx, my] = at(a, 0.765, 0);
      mosaicRoundel(ctx, mx, my, R * 0.03, [j % 2 ? AMBER : RUBY, j % 2 ? BLUE : AMBER], 4, `om${j}`);
      ctx.strokeStyle = LEAD;
      ctx.lineWidth = 2.4;
      ctx.stroke(circle(mx, my, R * 0.03));
    }

    // Pearl border.
    for (let j = 0; j < 48; j++) {
      const a = -Math.PI / 2 + ((j + 0.5) / 48) * Math.PI * 2;
      const [px, py] = at(a, 0.968, 0);
      const P = circle(px, py, R * 0.019);
      openings.push(P);
      ctx.fillStyle = rgb(j % 2 ? PALE : AMBER, 0.85 + rnd(`pl${j}`) * 0.2);
      ctx.fill(P);
    }

    // The sun sits behind the upper left of the window: panes there burn brighter, the far
    // side is in the glass's own shade.
    const all = new Path2D();
    for (const p of openings) all.addPath(p);
    ctx.save();
    ctx.clip(all);
    ctx.globalCompositeOperation = 'multiply';
    const dim = ctx.createLinearGradient(C - R * 0.7, C - R * 0.7, C + R * 0.8, C + R * 0.8);
    dim.addColorStop(0, '#FFFFFF');
    dim.addColorStop(1, '#8A8A9A');
    ctx.fillStyle = dim;
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = 'lighter';
    const hot = ctx.createRadialGradient(C - R * 0.32, C - R * 0.38, 0, C - R * 0.32, C - R * 0.38, R * 0.75);
    hot.addColorStop(0, 'rgba(255,240,210,0.38)');
    hot.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = hot;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();

    // Stone edges: thicken the tracery, then a faint chamfer catching the glass light.
    ctx.lineJoin = 'round';
    for (const p of openings) {
      ctx.strokeStyle = STONE;
      ctx.lineWidth = 7;
      ctx.stroke(p);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of openings) {
      ctx.strokeStyle = 'rgba(255,214,170,0.07)';
      ctx.lineWidth = 12;
      ctx.stroke(p);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Carved mouldings around the window.
    for (let k = 0; k < 7; k++) {
      ctx.strokeStyle = k % 2 ? '#17121A' : '#0A080C';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(C, C, R * (1.0 + k * 0.018) + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,210,160,0.08)';
    ctx.lineWidth = 3;
    for (const k of [1, 3, 5]) {
      ctx.beginPath();
      ctx.arc(C, C, R * (1.0 + k * 0.018) - 1, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  });

/** The window's light, pre-blurred: used for the halo on the stone and the rose on the floor. */
const roseGlow = () =>
  sprite('rose-glow', 400, 400, (ctx) => {
    ctx.filter = 'blur(9px)';
    ctx.drawImage(rose(), 0, 0, 400, 400);
  });
const roseHaze = () =>
  sprite('rose-haze', 200, 200, (ctx) => {
    ctx.filter = 'blur(16px)';
    ctx.drawImage(rose(), 30, 30, 140, 140);
  });

interface Beam {
  /** Origin on the window in units of its radius. */
  x: number;
  y: number;
  rgb: string;
  w: number;
}

/** Beams start on bright pieces of glass and take that piece's colour. */
const BEAMS: Beam[] = [];
const beams = () => {
  if (BEAMS.length) return BEAMS;
  const ctx = rose().getContext('2d');
  if (!ctx) return BEAMS;
  const data = ctx.getImageData(0, 0, S, S).data;
  for (let i = 0, tries = 0; BEAMS.length < 64 && tries < 4000; tries++, i++) {
    const a = rnd(`ba${i}`) * Math.PI * 2;
    const s = Math.sqrt(rnd(`bs${i}`)) * 0.95;
    const px = Math.round(C + Math.cos(a) * s * R);
    const py = Math.round(C + Math.sin(a) * s * R);
    const o = (py * S + px) * 4;
    const [r, g, b] = [data[o], data[o + 1], data[o + 2]];
    if (r + g + b < 160) continue;
    const k = 255 / Math.max(r, g, b);
    BEAMS.push({x: Math.cos(a) * s, y: Math.sin(a) * s, rgb: `${(r * k) | 0},${(g * k) | 0},${(b * k) | 0}`, w: 0.5 + rnd(`bw${i}`)});
  }
  return BEAMS;
};

export const Sanctuary: React.FC<{t: number; dur: number; v?: string}> = ({t, dur, v = 'wide'}) => {
  const f = useCurrentFrame();
  const close = v === 'close';
  const win = close ? {x: 1190, y: 392, r: 330} : {x: 1230, y: 300, r: 190};
  const DIR = close ? 1.83 : 1.87;
  const FLOOR = close ? 930 : 905;
  // The light swells toward the end of the wide shot, into the drop.
  const swell = close ? 1 : 1 + 1.4 * prog(t, dur - 1.4, dur, easeInCubic);
  const tilt = close ? lerp(-20, 10, prog(t, 0, dur, easeInOutSine)) : lerp(40, -10, prog(t, 0, dur, easeInOutSine));
  const roll = close ? lerp(-1.6, 1.2, prog(t, 0, dur, easeInOutSine)) : 0;
  const ref = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#040307';
      ctx.fillRect(0, 0, W, H);
      const breathe = 0.88 + 0.12 * noise1(t * 0.7);
      const k = win.r / R;
      const cosD = Math.cos(DIR);
      const sinD = Math.sin(DIR);
      ctx.globalCompositeOperation = 'lighter';
      // Light scattered off the stone around the window.
      ctx.globalAlpha = clamp(0.5 * breathe * swell);
      const hz = S * k * 2.6;
      ctx.drawImage(roseHaze(), win.x - hz / 2, win.y - hz / 2, hz, hz);
      // Beams: sunlight is parallel, so every beam leaves its pane in the same direction and
      // lands on the floor further forward the higher up the window it started.
      ctx.globalAlpha = 1;
      ctx.filter = `blur(${close ? 7 : 5}px)`;
      for (const [i, b] of beams().entries()) {
        const ox = win.x + b.x * win.r;
        const oy = win.y + b.y * win.r;
        const land = FLOOR + -b.y * win.r * 0.22;
        const len = (land - oy) / sinD;
        const ex = ox + cosD * len;
        const ey = oy + sinD * len;
        const wdt = (close ? 22 : 13) * b.w;
        const nx = -sinD;
        const ny = cosD;
        const flick = 0.6 + 0.4 * noise1(t * 0.9 + i * 1.7);
        const a = 0.2 * flick * breathe * swell;
        const g = ctx.createLinearGradient(ox, oy, ex, ey);
        g.addColorStop(0, `rgba(${b.rgb},${a})`);
        g.addColorStop(0.7, `rgba(${b.rgb},${a * 0.4})`);
        g.addColorStop(1, `rgba(${b.rgb},${a * 0.15})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox + nx * 3, oy + ny * 3);
        ctx.lineTo(ox - nx * 3, oy - ny * 3);
        ctx.lineTo(ex - nx * wdt, ey - ny * wdt);
        ctx.lineTo(ex + nx * wdt, ey + ny * wdt);
        ctx.closePath();
        ctx.fill();
      }
      ctx.filter = 'none';
      // The fallen rose: the window laid flat on the floor, upside down and stretched.
      const pool = {x: win.x + cosD * ((FLOOR - win.y) / sinD), y: FLOOR};
      ctx.save();
      ctx.translate(pool.x, pool.y);
      ctx.transform(1, 0, cosD * 0.5, 1, 0, 0);
      ctx.scale(1.25, -0.24);
      ctx.globalAlpha = clamp(0.55 * breathe * swell);
      const ps = S * k;
      ctx.drawImage(roseGlow(), -ps / 2, -ps / 2, ps, ps);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // The window itself, then its own glow over the tracery.
      const ws = S * k;
      ctx.drawImage(rose(), win.x - ws / 2, win.y - ws / 2, ws, ws);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp(0.42 * breathe * swell, 0, 1);
      ctx.drawImage(roseGlow(), win.x - ws / 2, win.y - ws / 2, ws, ws);
      ctx.globalAlpha = 1;
      const core = ctx.createRadialGradient(win.x, win.y, 0, win.x, win.y, win.r * 1.5);
      core.addColorStop(0, `rgba(255,236,200,${0.1 * swell * swell})`);
      core.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = core;
      ctx.fillRect(win.x - win.r * 2, win.y - win.r * 2, win.r * 4, win.r * 4);
      ctx.globalCompositeOperation = 'source-over';

      // Clustered gothic piers framing the nave, in silhouette.
      for (const [x, w] of close ? [[90, 150], [1790, 170]] : [[150, 120], [520, 70], [1720, 150]]) {
        for (const [dx, cw] of [[-0.38, 0.3], [0, 0.42], [0.38, 0.3]]) {
          const cx = x + dx * w;
          const pw = cw * w;
          const pg = ctx.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0);
          pg.addColorStop(0, '#020103');
          pg.addColorStop(0.7, '#0D0A12');
          pg.addColorStop(1, '#020103');
          ctx.fillStyle = pg;
          ctx.fillRect(cx - pw / 2, 0, pw, H);
        }
      }
    },
    [f, swell],
  );
  const beamWeight = (x: number, y: number) => {
    // Dust glows inside the band of beams below the window.
    const along = (x - win.x) * Math.cos(DIR) + (y - win.y) * Math.sin(DIR);
    const across = Math.abs(-(x - win.x) * Math.sin(DIR) + (y - win.y) * Math.cos(DIR));
    return along > 0 && y < FLOOR + 40 ? clamp(1 - across / (win.r * 1.05)) + 0.05 : 0.05;
  };
  return (
    <AbsoluteFill style={{transform: `translateY(${tilt}px) rotate(${roll}deg) scale(${close ? 1.06 : 1.02})`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed={`chapel-${v}`} count={180} focus={0.5} drift={[-6, 9]} intensity={1.1 * Math.min(1.6, swell)} weight={beamWeight} />
    </AbsoluteFill>
  );
};
