import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInCubic, easeInOutSine, easeOutCubic, lerp, noise1, prog, rnd, rndRange} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, SANS_CN, W} from '../../theme';

// 「Awful, awful 痛扼咽喉 / 夜宵用眼泪下酒」: a late-night street stall. A heavy glass of whisky
// over one ball of ice on a wet table, the stall's red neon out of focus behind; a tear falls
// into the glass.

/** A heavy rocks glass seen a little from above (ellipses open up the lower they sit). */
const G = {x: 1230, top: 566, bottom: 846, rx: 160, taper: 0.94, wall: 10, base: 50};
const FLOOR_IN = G.bottom - G.base;
const LIQUID = 744;
const ICE = {x: 1200, y: 714, r: 84};
const TEAR_X = 1140;
const TABLE = 700;
const rxAt = (y: number) => G.rx * lerp(1, G.taper, (y - G.top) / (G.bottom - G.top));
const ryAt = (y: number) => lerp(26, 33, (y - G.top) / (G.bottom - G.top));
const outerPath = () => {
  const p = new Path2D();
  p.ellipse(G.x, G.top, G.rx, ryAt(G.top), 0, Math.PI, 0, false);
  p.lineTo(G.x + rxAt(G.bottom), G.bottom);
  p.ellipse(G.x, G.bottom, rxAt(G.bottom), ryAt(G.bottom), 0, 0, Math.PI, false);
  p.closePath();
  return p;
};
const innerPath = () => {
  const p = new Path2D();
  p.moveTo(G.x - G.rx + G.wall, G.top);
  p.lineTo(G.x + G.rx - G.wall, G.top);
  p.lineTo(G.x + rxAt(FLOOR_IN) - G.wall, FLOOR_IN);
  p.ellipse(G.x, FLOOR_IN, rxAt(FLOOR_IN) - G.wall, ryAt(FLOOR_IN), 0, 0, Math.PI, false);
  p.closePath();
  return p;
};
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
      const {x, top, bottom, rx, wall} = G;
      // Wet table top: dark, holding smeared reflections of the sign and the bulbs.
      const tg = ctx.createLinearGradient(0, TABLE - 20, 0, H);
      tg.addColorStop(0, 'rgba(9,9,14,0)');
      tg.addColorStop(0.06, 'rgba(9,9,14,0.97)');
      tg.addColorStop(1, '#030305');
      ctx.fillStyle = tg;
      ctx.fillRect(0, TABLE - 20, W, H - TABLE + 20);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(22px)';
      for (let k = 0; k < 3; k++) {
        const sx = 430 + k * 90 + Math.sin(t * 1.3 + k) * 6;
        const sg = ctx.createLinearGradient(0, TABLE, 0, TABLE + 170);
        sg.addColorStop(0, `rgba(255,60,96,${0.13 * flick})`);
        sg.addColorStop(1, 'rgba(255,60,96,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(sx, TABLE, 90, 170);
      }
      ctx.filter = 'blur(12px)';
      for (let i = 0; i < 9; i++) {
        const sg = ctx.createLinearGradient(0, TABLE, 0, TABLE + 90);
        sg.addColorStop(0, 'rgba(255,196,130,0.1)');
        sg.addColorStop(1, 'rgba(255,196,130,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(104 + i * 230, TABLE, 32, 90);
      }
      ctx.filter = 'none';
      // Grill smoke drifting across.
      for (let i = 0; i < 6; i++) {
        const sx = ((rnd(`smx${i}`) * W + t * (40 + i * 12)) % (W + 600)) - 300;
        const sy = 560 - i * 40 + noise1(t * 0.5 + i) * 30;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 260);
        sg.addColorStop(0, 'rgba(255,190,150,0.05)');
        sg.addColorStop(1, 'rgba(255,190,150,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 260, sy - 260, 520, 520);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Shadow under the glass, and the amber light the whisky throws onto the table.
      ctx.filter = 'blur(14px)';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.ellipse(x + 26, bottom + 8, rx * 1.2, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(230,140,50,0.26)';
      ctx.beginPath();
      ctx.ellipse(x + 175, bottom + 16, 150, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,110,40,0.12)';
      ctx.fillRect(x - rx * 0.8, bottom + 20, rx * 1.6, 80);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';

      // Whisky: deep amber, glowing where the light passes through it.
      const inner = innerPath();
      ctx.save();
      ctx.clip(inner);
      const surf = rxAt(LIQUID) - wall;
      ctx.beginPath();
      ctx.ellipse(x, LIQUID, surf, ryAt(LIQUID), 0, Math.PI, 0, true);
      ctx.lineTo(x + surf + 2, H);
      ctx.lineTo(x - surf - 2, H);
      ctx.closePath();
      const wg = ctx.createLinearGradient(0, LIQUID, 0, FLOOR_IN + 20);
      wg.addColorStop(0, 'rgba(150,70,14,0.97)');
      wg.addColorStop(1, 'rgba(58,22,5,0.98)');
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      const core = ctx.createRadialGradient(x + 50, LIQUID + 30, 0, x + 50, LIQUID + 30, 150);
      core.addColorStop(0, 'rgba(255,170,80,0.34)');
      core.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = core;
      ctx.fillRect(x - rx, LIQUID - 30, rx * 2, 160);
      ctx.globalCompositeOperation = 'source-over';
      // The ice ball below the surface: lighter amber, a bright refracted crescent.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, LIQUID, W, H);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(ICE.x, ICE.y, ICE.r, 0, Math.PI * 2);
      const ig = ctx.createRadialGradient(ICE.x - 20, ICE.y - 10, 10, ICE.x, ICE.y, ICE.r);
      ig.addColorStop(0, 'rgba(255,210,140,0.55)');
      ig.addColorStop(0.8, 'rgba(230,150,60,0.35)');
      ig.addColorStop(1, 'rgba(255,226,170,0.7)');
      ctx.fillStyle = ig;
      ctx.fill();
      ctx.restore();
      ctx.restore();

      // Surface: a lens of lighter amber with the neon and the bulbs caught in it.
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, LIQUID, surf, ryAt(LIQUID), 0, 0, Math.PI * 2);
      ctx.clip();
      const sgr = ctx.createLinearGradient(x - surf, 0, x + surf, 0);
      sgr.addColorStop(0, 'rgba(120,54,10,0.96)');
      sgr.addColorStop(0.55, 'rgba(184,98,28,0.96)');
      sgr.addColorStop(1, 'rgba(100,42,8,0.96)');
      ctx.fillStyle = sgr;
      ctx.fillRect(x - surf, LIQUID - 40, surf * 2, 80);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(3px)';
      ctx.fillStyle = `rgba(255,70,110,${0.5 * flick})`;
      ctx.fillRect(x - surf * 0.78, LIQUID - 8, 46, 9);
      ctx.fillStyle = 'rgba(255,220,170,0.55)';
      ctx.fillRect(x + surf * 0.32, LIQUID - 12, 26, 7);
      ctx.filter = 'none';
      for (const d of DROPS) {
        const hit = d + FALL;
        for (let k = 0; k < 3; k++) {
          const p = prog(t, hit + k * 0.12, hit + 1.0 + k * 0.12, easeOutCubic);
          if (p <= 0 || p >= 1) continue;
          ctx.strokeStyle = `rgba(255,240,215,${0.75 * (1 - p)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(TEAR_X, LIQUID, surf * 1.3 * p, ryAt(LIQUID) * 1.3 * p, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,200,130,0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, LIQUID, surf, ryAt(LIQUID), 0, 0.08, Math.PI - 0.08);
      ctx.stroke();

      // The ice ball above the surface: clear, dark-edged, a hard highlight, the sign
      // turned upside down inside it.
      const mr = Math.sqrt(Math.max(0, ICE.r * ICE.r - (LIQUID - ICE.y) ** 2));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, LIQUID + 1);
      ctx.ellipse(ICE.x, LIQUID, mr, mr * 0.16, 0, 0, Math.PI);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(ICE.x, ICE.y, ICE.r, 0, Math.PI * 2);
      ctx.clip();
      const cg = ctx.createRadialGradient(ICE.x - 18, ICE.y - 22, 0, ICE.x, ICE.y, ICE.r);
      cg.addColorStop(0, 'rgba(214,226,242,0.26)');
      cg.addColorStop(0.6, 'rgba(190,206,228,0.3)');
      cg.addColorStop(0.88, 'rgba(120,130,150,0.42)');
      cg.addColorStop(1, 'rgba(236,242,252,0.7)');
      ctx.fillStyle = cg;
      ctx.fillRect(ICE.x - ICE.r, ICE.y - ICE.r, ICE.r * 2, ICE.r * 2);
      const am = ctx.createLinearGradient(0, ICE.y - ICE.r, 0, LIQUID + 12);
      am.addColorStop(0.45, 'rgba(230,140,50,0)');
      am.addColorStop(1, 'rgba(230,140,50,0.5)');
      ctx.fillStyle = am;
      ctx.fillRect(ICE.x - ICE.r, ICE.y - ICE.r, ICE.r * 2, ICE.r * 2);
      ctx.strokeStyle = 'rgba(245,250,255,0.14)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const a = rndRange(`ia${k}`, 0, Math.PI * 2);
        const r0 = rndRange(`ir${k}`, 8, 40);
        ctx.beginPath();
        ctx.moveTo(ICE.x + Math.cos(a) * r0, ICE.y + Math.sin(a) * r0);
        ctx.quadraticCurveTo(ICE.x + Math.cos(a + 0.5) * (r0 + 20), ICE.y + Math.sin(a + 0.5) * (r0 + 20), ICE.x + Math.cos(a + 0.2) * (r0 + 38), ICE.y + Math.sin(a + 0.2) * (r0 + 38));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(6px)';
      ctx.fillStyle = `rgba(255,60,100,${0.35 * flick})`;
      ctx.beginPath();
      ctx.ellipse(ICE.x + 22, ICE.y + 4, 30, 12, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,190,110,0.3)';
      ctx.beginPath();
      ctx.ellipse(ICE.x - 4, ICE.y + 12, 46, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(245,250,255,0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ICE.x, ICE.y, ICE.r - 3, Math.PI * 1.08, Math.PI * 1.42);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(ICE.x - 34, ICE.y - 48, 9, 5, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // Meniscus where ice meets whisky.
      ctx.strokeStyle = 'rgba(255,214,150,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ICE.x, LIQUID, mr, mr * 0.16, 0, 0, Math.PI);
      ctx.stroke();

      // The glass: thick walls, heavy base, rims and edge light.
      const outer = outerPath();
      ctx.save();
      ctx.clip(outer);
      ctx.fillStyle = 'rgba(205,215,240,0.05)';
      ctx.fillRect(x - rx - 4, top - 40, rx * 2 + 8, bottom - top + 80);
      // Heavy base: a block of glass full of refracted amber.
      const bg = ctx.createLinearGradient(0, FLOOR_IN, 0, bottom + 30);
      bg.addColorStop(0, 'rgba(200,120,50,0.16)');
      bg.addColorStop(0.5, 'rgba(160,170,190,0.06)');
      bg.addColorStop(1, 'rgba(235,240,255,0.16)');
      ctx.fillStyle = bg;
      ctx.fillRect(x - rx, FLOOR_IN, rx * 2, bottom - FLOOR_IN + 40);
      ctx.globalCompositeOperation = 'lighter';
      // Broad soft highlight down the left, the neon down the right.
      const hl = ctx.createLinearGradient(0, top, 0, bottom);
      hl.addColorStop(0, 'rgba(255,255,255,0.0)');
      hl.addColorStop(0.25, 'rgba(255,255,255,0.32)');
      hl.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.fillStyle = hl;
      ctx.fillRect(x - rx * 0.8, top + 16, 16, bottom - top - 26);
      ctx.fillRect(x - rx * 0.62, top + 30, 5, bottom - top - 60);
      ctx.fillStyle = `rgba(255,70,110,${0.3 * flick})`;
      ctx.fillRect(x + rx * 0.8, top + 22, 10, bottom - top - 40);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(232,238,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, top, rx, ryAt(top), 0, Math.PI, 0, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(232,238,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(x, top + 3, rx - wall, ryAt(top) - 3, 0, Math.PI, 0, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240,244,255,0.9)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(x, top, rx, ryAt(top), 0, 0, Math.PI, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240,244,255,0.4)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, top + 3, rx - wall, ryAt(top) - 3, 0, 0, Math.PI, false);
      ctx.stroke();
      // Side walls: the outer edge bright, the inner edge faint.
      const side = (sgn: number) => {
        ctx.strokeStyle = sgn < 0 ? 'rgba(235,240,255,0.8)' : `rgba(255,150,170,${0.55 * flick + 0.15})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x + sgn * rx, top);
        ctx.lineTo(x + sgn * rxAt(bottom), bottom);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(235,240,255,0.22)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + sgn * (rx - wall), top + 4);
        ctx.lineTo(x + sgn * (rxAt(FLOOR_IN) - wall), FLOOR_IN);
        ctx.stroke();
      };
      side(-1);
      side(1);
      // Inner floor and outer foot of the heavy base.
      ctx.strokeStyle = 'rgba(255,220,170,0.35)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(x, FLOOR_IN, rxAt(FLOOR_IN) - wall, ryAt(FLOOR_IN), 0, 0, Math.PI, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240,244,255,0.62)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(x, bottom, rxAt(bottom), ryAt(bottom), 0, 0, Math.PI, false);
      ctx.stroke();
      // Tears: a bright drop falls, streaking, then a crown of droplets where it lands.
      for (const d of DROPS) {
        const p = prog(t, d, d + FALL, easeInCubic);
        if (p > 0 && p < 1) {
          const y = lerp(150, LIQUID - 6, p);
          const streak = ctx.createLinearGradient(TEAR_X, y - 120 * p, TEAR_X, y);
          streak.addColorStop(0, 'rgba(255,250,240,0)');
          streak.addColorStop(1, 'rgba(255,250,240,0.55)');
          ctx.strokeStyle = streak;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(TEAR_X, y - 120 * p);
          ctx.lineTo(TEAR_X, y);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,252,245,0.95)';
          ctx.beginPath();
          ctx.moveTo(TEAR_X, y - 16);
          ctx.quadraticCurveTo(TEAR_X + 8, y - 2, TEAR_X, y + 6);
          ctx.quadraticCurveTo(TEAR_X - 8, y - 2, TEAR_X, y - 16);
          ctx.fill();
        }
        const s2 = prog(t, d + FALL, d + FALL + 0.45, easeOutCubic);
        if (s2 > 0 && s2 < 1) {
          for (let k = 0; k < 9; k++) {
            const a = Math.PI + (k / 8) * Math.PI;
            const r = 36 * s2;
            const hgt = Math.sin(Math.PI * s2) * 34 * (0.6 + 0.4 * rnd(`cr${d}${k}`));
            ctx.fillStyle = `rgba(255,236,200,${0.85 * (1 - s2)})`;
            ctx.beginPath();
            ctx.arc(TEAR_X + Math.cos(a) * r, LIQUID - hgt + Math.sin(a) * 5, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
    [f, flick],
  );
  const zoom = lerp(1, 1.06, prog(t, 0, dur, easeInOutSine));
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${G.x}px ${LIQUID}px`}}>
      <canvas ref={street} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'blur(9px)'}} />
      <canvas ref={table} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${G.x}px ${LIQUID}px, rgba(0,0,0,0) 30%, rgba(0,0,0,${clamp(0.25 + 0.1 * Math.sin(t))}) 100%)`}} />
    </AbsoluteFill>
  );
};
