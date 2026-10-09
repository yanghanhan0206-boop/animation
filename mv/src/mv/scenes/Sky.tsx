import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOutSine, lerp, noise1, prog, rnd, rndRange} from '../../lib/anim';
import {sprite, useCanvas} from '../../lib/canvas';
import {H, W} from '../../theme';

// 「天空突然间晴转阴」: a time-lapse sky. Bright with soft cumulus at first, then a wall of
// dark cloud races in from the right and the light goes grey.

const puff = (dark: boolean) =>
  sprite(`puff-${dark}`, 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 60, 0, 64, 64, 64);
    if (dark) {
      g.addColorStop(0, 'rgba(70,76,88,0.95)');
      g.addColorStop(0.6, 'rgba(52,58,70,0.75)');
      g.addColorStop(1, 'rgba(40,44,54,0)');
    } else {
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.55, 'rgba(236,242,250,0.7)');
      g.addColorStop(1, 'rgba(220,230,245,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

interface Cloud {
  x: number;
  y: number;
  s: number;
  blobs: [number, number, number][];
}

const clouds = (seed: string, n: number, yMin: number, yMax: number, sMin: number, sMax: number): Cloud[] =>
  Array.from({length: n}, (_, i) => ({
    x: rnd(`${seed}x${i}`) * (W + 1400) - 300,
    y: rndRange(`${seed}y${i}`, yMin, yMax),
    s: rndRange(`${seed}s${i}`, sMin, sMax),
    blobs: Array.from({length: 11}, (_, k) => [rndRange(`${seed}bx${i}${k}`, -1.4, 1.4), -Math.abs(rndRange(`${seed}by${i}${k}`, -0.6, 0.5)), rndRange(`${seed}br${i}${k}`, 0.5, 1.1)]),
  }));

const WHITE = clouds('cu', 12, 220, 640, 70, 140);
const DARK = clouds('st', 16, 150, 760, 130, 260);

const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(lerp(v, b[i], k)));

export const Sky: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const c = prog(t, 0.45, dur - 0.35, easeInOutSine);
  const ref = useCanvas(
    (ctx) => {
      const top = mix([46, 112, 196], [34, 38, 46], c);
      const hor = mix([196, 222, 242], [96, 102, 112], c);
      const g = ctx.createLinearGradient(0, 0, 0, 900);
      g.addColorStop(0, `rgb(${top})`);
      g.addColorStop(1, `rgb(${hor})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Sun behind it all, swallowed as the cloud closes.
      ctx.globalCompositeOperation = 'lighter';
      const sun = ctx.createRadialGradient(1500, 260, 0, 1500, 260, 520);
      sun.addColorStop(0, `rgba(255,244,214,${0.85 * (1 - c)})`);
      sun.addColorStop(0.2, `rgba(255,226,170,${0.35 * (1 - c)})`);
      sun.addColorStop(1, 'rgba(255,226,170,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      // Fair-weather cumulus drifting left, fading as the storm takes the sky.
      const wImg = puff(false);
      for (const cl of WHITE) {
        const x = ((cl.x - t * 260 * (cl.s / 100)) % (W + 1400) + W + 1400) % (W + 1400) - 300;
        ctx.globalAlpha = 0.85 * (1 - c * 0.85);
        for (const [bx, by, br] of cl.blobs) {
          const r = cl.s * br;
          ctx.drawImage(wImg, x + bx * cl.s - r, cl.y + by * cl.s - r, r * 2, r * 2);
        }
      }
      // The storm front: dark cloud rolling in from the right, faster than anything else.
      const dImg = puff(true);
      for (const [i, cl] of DARK.entries()) {
        const enter = W + 400 - (W + 1500) * clamp(c * 1.25 - rnd(`de${i}`) * 0.25);
        const x = enter + cl.x * 0.25 - t * 60;
        ctx.globalAlpha = clamp(c * 1.6);
        for (const [bx, by, br] of cl.blobs) {
          const r = cl.s * br * 1.25;
          ctx.drawImage(dImg, x + bx * cl.s - r, cl.y + by * cl.s * 0.7 - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;
      // City at the bottom, its windows coming on as the light drops.
      ctx.fillStyle = `rgb(${mix([40, 52, 70], [14, 16, 20], c)})`;
      for (let i = 0; i < 60; i++) {
        const bx = i * 34 - 20;
        const bh = 40 + rnd(`ck${i}`) * 110;
        ctx.fillRect(bx, 942 - bh, 30, bh);
      }
      for (let i = 0; i < 70; i++) {
        if (rnd(`cw${i}`) > c) continue;
        ctx.fillStyle = `rgba(255,200,130,${0.7 * c})`;
        ctx.fillRect(rnd(`cwx${i}`) * W, 942 - rnd(`cwy${i}`) * 100, 4, 5);
      }
      // First rain at the very end.
      const rain = prog(t, dur - 0.9, dur);
      ctx.strokeStyle = `rgba(210,215,225,${0.25 * rain})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 160 * rain; i++) {
        const x = rnd(`rx${i}`) * W;
        const y = ((rnd(`ry${i}`) * H + t * 1500) % H);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y - 30);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(0,0,0,${0.05 + 0.06 * noise1(t * 3)})`;
      ctx.fillRect(0, 0, W, H);
    },
    [f, c],
  );
  return (
    <AbsoluteFill style={{transform: `scale(${lerp(1.03, 1.0, prog(t, 0, dur))})`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
    </AbsoluteFill>
  );
};
