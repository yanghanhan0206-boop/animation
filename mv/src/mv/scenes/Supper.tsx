import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInCubic, easeInOutSine, easeOutCubic, lerp, noise1, prog, rnd, rndRange} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, SANS_CN, W} from '../../theme';

// 「Awful, awful 痛扼咽喉 / 夜宵用眼泪下酒」: a late-night street stall. A glass of liquor on
// a wet table, the stall's red neon sign out of focus behind; a tear falls into the glass.

const GLASS = {x: 1210, top: 470, bottom: 830, w: 210};
const LIQUID = 610;
const DROPS = [3.45, 4.55];
const FALL = 0.42;

const disc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a * 0.8})`);
  g.addColorStop(0.85, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

export const Supper: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const flick = noise1(t * 9) > 0.86 ? 0.55 : 1;
  // Out-of-focus street: neon sign, bulbs, passing lights. Drawn sharp, blurred by CSS.
  const street = useCanvas(
    (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#05060C');
      g.addColorStop(1, '#080A12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const lights: [number, number, number, string, number][] = [];
      for (let i = 0; i < 26; i++) {
        const warm = rnd(`sl${i}`);
        const rgb = warm < 0.45 ? '255,170,90' : warm < 0.75 ? '255,60,90' : warm < 0.9 ? '90,150,255' : '255,220,170';
        lights.push([rndRange(`sx${i}`, -50, W + 50) + Math.sin(t * 0.4 + i) * 8, rndRange(`sy${i}`, 150, 560), rndRange(`sr${i}`, 30, 95), rgb, rndRange(`sa${i}`, 0.12, 0.3)]);
      }
      for (const [x, y, r, rgb, a] of lights) disc(ctx, x, y, r, rgb, a);
      // The sign: 「夜宵」 in red neon tubes.
      ctx.font = `700 170px ${SANS_CN}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,40,80,0.9)';
      ctx.shadowBlur = 50;
      ctx.lineWidth = 10;
      ctx.strokeStyle = `rgba(255,70,100,${0.85 * flick})`;
      ctx.strokeText('夜宵', 560, 330);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(255,210,220,${0.8 * flick})`;
      ctx.strokeText('夜宵', 560, 330);
      // Bulb string along the top.
      for (let i = 0; i < 9; i++) disc(ctx, 120 + i * 230, 170 + Math.sin(i * 1.3) * 18, 26, '255,200,130', 0.55);
      ctx.globalCompositeOperation = 'source-over';
    },
    [f, flick],
  );
  // The table and the glass, in focus.
  const table = useCanvas(
    (ctx) => {
      // Wet table top: dark, holding smeared reflections of the sign and the bulbs.
      const tg = ctx.createLinearGradient(0, 640, 0, H);
      tg.addColorStop(0, 'rgba(10,10,16,0.0)');
      tg.addColorStop(0.08, 'rgba(10,10,16,0.96)');
      tg.addColorStop(1, '#040406');
      ctx.fillStyle = tg;
      ctx.fillRect(0, 640, W, H - 640);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(14px)';
      ctx.fillStyle = `rgba(255,50,90,${0.22 * flick})`;
      ctx.fillRect(380, 700, 360, 150);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = 'rgba(255,190,120,0.12)';
        ctx.fillRect(110 + i * 230, 690, 22, 160);
      }
      ctx.filter = 'none';
      // Grill smoke drifting across.
      for (let i = 0; i < 6; i++) {
        const x = ((rnd(`smx${i}`) * W + t * (40 + i * 12)) % (W + 600)) - 300;
        const y = 560 - i * 40 + noise1(t * 0.5 + i) * 30;
        const sg = ctx.createRadialGradient(x, y, 0, x, y, 260);
        sg.addColorStop(0, 'rgba(255,190,150,0.05)');
        sg.addColorStop(1, 'rgba(255,190,150,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(x - 260, y - 260, 520, 520);
      }
      ctx.globalCompositeOperation = 'source-over';

      // The glass: back rim, liquor, walls, base, front rim.
      const {x, top, bottom, w} = GLASS;
      const rx = w / 2;
      const ry = 22;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - rx, top);
      ctx.lineTo(x - rx * 0.92, bottom);
      ctx.ellipse(x, bottom, rx * 0.92, ry * 0.9, 0, Math.PI, 0, true);
      ctx.lineTo(x + rx, top);
      ctx.closePath();
      ctx.clip();
      const liq = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
      liq.addColorStop(0, 'rgba(150,70,18,0.92)');
      liq.addColorStop(0.45, 'rgba(232,150,60,0.95)');
      liq.addColorStop(0.62, 'rgba(255,196,110,0.95)');
      liq.addColorStop(1, 'rgba(120,52,14,0.92)');
      ctx.fillStyle = liq;
      ctx.fillRect(x - rx, LIQUID, w, bottom - LIQUID + ry);
      // Glow inside the liquor and the neon caught in it.
      ctx.globalCompositeOperation = 'lighter';
      const core = ctx.createRadialGradient(x + 20, LIQUID + 90, 0, x + 20, LIQUID + 90, 160);
      core.addColorStop(0, 'rgba(255,214,140,0.45)');
      core.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = core;
      ctx.fillRect(x - rx, LIQUID, w, bottom - LIQUID);
      ctx.fillStyle = `rgba(255,60,100,${0.22 * flick})`;
      ctx.fillRect(x - rx + 14, top, 16, bottom - top);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      // Liquid surface, with ripples where tears land.
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, LIQUID, rx * 0.985, ry * 0.95, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,214,150,0.55)';
      ctx.fill();
      ctx.clip();
      for (const d of DROPS) {
        const hit = d + FALL;
        for (let k = 0; k < 3; k++) {
          const p = prog(t, hit + k * 0.12, hit + 1.0 + k * 0.12, easeOutCubic);
          if (p <= 0 || p >= 1) continue;
          ctx.strokeStyle = `rgba(255,245,225,${0.8 * (1 - p)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x + 8, LIQUID, rx * 0.9 * p, ry * 0.9 * p, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
      // Glass walls and rims: thin bright edges, a soft highlight down the left side.
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(235,240,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(x, top, rx, ry, 0, Math.PI, 0, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(235,240,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(x, top, rx, ry, 0, 0, Math.PI, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(235,240,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(x - rx, top);
      ctx.lineTo(x - rx * 0.92, bottom);
      ctx.moveTo(x + rx, top);
      ctx.lineTo(x + rx * 0.92, bottom);
      ctx.stroke();
      const hl = ctx.createLinearGradient(0, top, 0, bottom);
      hl.addColorStop(0, 'rgba(255,255,255,0.0)');
      hl.addColorStop(0.3, 'rgba(255,255,255,0.35)');
      hl.addColorStop(1, 'rgba(255,255,255,0.05)');
      ctx.fillStyle = hl;
      ctx.fillRect(x - rx * 0.78, top + 10, 10, bottom - top - 30);
      // Heavy base.
      ctx.fillStyle = 'rgba(220,230,255,0.10)';
      ctx.beginPath();
      ctx.ellipse(x, bottom - 10, rx * 0.92, ry * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(235,240,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, bottom, rx * 0.92, ry * 0.9, 0, 0, Math.PI, false);
      ctx.stroke();
      // Its reflection on the wet table.
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(6px)';
      ctx.fillStyle = 'rgba(232,150,60,0.18)';
      ctx.fillRect(x - rx * 0.8, bottom + 18, rx * 1.6, 70);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';

      // Tears: a bright drop falls, streaking, then a crown of droplets where it lands.
      for (const d of DROPS) {
        const p = prog(t, d, d + FALL, easeInCubic);
        if (p > 0 && p < 1) {
          const y = lerp(150, LIQUID - 6, p);
          const dx = x + 8;
          const streak = ctx.createLinearGradient(dx, y - 120 * p, dx, y);
          streak.addColorStop(0, 'rgba(255,250,240,0)');
          streak.addColorStop(1, 'rgba(255,250,240,0.55)');
          ctx.strokeStyle = streak;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(dx, y - 120 * p);
          ctx.lineTo(dx, y);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,252,245,0.95)';
          ctx.beginPath();
          ctx.moveTo(dx, y - 16);
          ctx.quadraticCurveTo(dx + 8, y - 2, dx, y + 6);
          ctx.quadraticCurveTo(dx - 8, y - 2, dx, y - 16);
          ctx.fill();
        }
        const s = prog(t, d + FALL, d + FALL + 0.45, easeOutCubic);
        if (s > 0 && s < 1) {
          for (let k = 0; k < 9; k++) {
            const a = Math.PI + (k / 8) * Math.PI;
            const r = 50 * s;
            const hgt = Math.sin(Math.PI * s) * 38 * (0.6 + 0.4 * rnd(`cr${d}${k}`));
            ctx.fillStyle = `rgba(255,236,200,${0.85 * (1 - s)})`;
            ctx.beginPath();
            ctx.arc(x + 8 + Math.cos(a) * r, LIQUID - hgt + Math.sin(a) * 6, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
    [f, flick],
  );
  const zoom = lerp(1, 1.06, prog(t, 0, dur, easeInOutSine));
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${GLASS.x}px ${LIQUID}px`}}>
      <canvas ref={street} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'blur(9px)'}} />
      <canvas ref={table} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${GLASS.x}px ${LIQUID}px, rgba(0,0,0,0) 30%, rgba(0,0,0,${clamp(0.25 + 0.1 * Math.sin(t))}) 100%)`}} />
    </AbsoluteFill>
  );
};
