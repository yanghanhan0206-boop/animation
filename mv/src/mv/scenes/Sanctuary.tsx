import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {clamp, easeInCubic, easeInOutSine, lerp, noise1, prog, rnd} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, W} from '../../theme';

// 「How can I survive? / probably turning to the Bible」: a dark chapel. A rose window
// burns with jewel colours and throws long coloured beams through the dust onto the floor.

const JEWELS = ['30,58,160', '160,26,48', '232,163,61', '24,110,80', '96,44,140', '40,96,190', '200,60,40'];

interface Pane {
  r0: number;
  r1: number;
  a0: number;
  a1: number;
  rgb: string;
}

const PANES: Pane[] = (() => {
  const out: Pane[] = [{r0: 0, r1: 0.17, a0: 0, a1: Math.PI * 2, rgb: '240,180,70'}];
  const ring = (n: number, r0: number, r1: number, offset: number, pick: (k: number) => string) => {
    for (let k = 0; k < n; k++) {
      const a0 = offset + (k / n) * Math.PI * 2;
      out.push({r0, r1, a0, a1: a0 + (Math.PI * 2) / n, rgb: pick(k)});
    }
  };
  ring(8, 0.17, 0.48, 0.2, (k) => (k % 2 ? JEWELS[1] : JEWELS[0]));
  ring(16, 0.48, 0.8, 0.1, (k) => JEWELS[[5, 3, 4, 2][k % 4]]);
  ring(24, 0.8, 1, 0.05, (k) => (k % 3 === 0 ? JEWELS[2] : k % 3 === 1 ? JEWELS[1] : JEWELS[0]));
  return out;
})();

export const Sanctuary: React.FC<{t: number; dur: number; v?: string}> = ({t, dur, v = 'wide'}) => {
  const f = useCurrentFrame();
  const close = v === 'close';
  const win = close ? {x: 900, y: 360, r: 330} : {x: 1230, y: 300, r: 190};
  // The light swells toward the end of the wide shot, into the drop.
  const swell = close ? 1 : 1 + 1.4 * prog(t, dur - 1.4, dur, easeInCubic);
  const tilt = close ? lerp(-20, 10, prog(t, 0, dur, easeInOutSine)) : lerp(40, -10, prog(t, 0, dur, easeInOutSine));
  const ref = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#040307';
      ctx.fillRect(0, 0, W, H);
      const breathe = 0.85 + 0.15 * noise1(t * 0.7);
      // Beams: long thin wedges from points on the window down toward the floor.
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(7px)';
      for (let i = 0; i < 46; i++) {
        const pane = PANES[Math.floor(rnd(`bp${i}`) * PANES.length)];
        const a = lerp(pane.a0, pane.a1, rnd(`ba${i}`));
        const rr = lerp(pane.r0, pane.r1, rnd(`br${i}`)) * win.r;
        const ox = win.x + Math.cos(a) * rr;
        const oy = win.y + Math.sin(a) * rr;
        const dir = (close ? 1.95 : 2.05) + (rnd(`bd${i}`) - 0.5) * 0.25 + Math.sin(t * 0.2 + i) * 0.01;
        const len = (close ? 1500 : 1300) * (0.7 + 0.3 * rnd(`bl${i}`));
        const ex = ox + Math.cos(dir) * len;
        const ey = oy + Math.sin(dir) * len;
        const wdt = (close ? 26 : 16) * (0.5 + rnd(`bw${i}`));
        const nx = -Math.sin(dir);
        const ny = Math.cos(dir);
        const flick = 0.6 + 0.4 * noise1(t * 0.9 + i * 1.7);
        const g = ctx.createLinearGradient(ox, oy, ex, ey);
        g.addColorStop(0, `rgba(${pane.rgb},${0.22 * flick * breathe * swell})`);
        g.addColorStop(0.6, `rgba(${pane.rgb},${0.07 * flick * breathe * swell})`);
        g.addColorStop(1, `rgba(${pane.rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox + nx * 3, oy + ny * 3);
        ctx.lineTo(ox - nx * 3, oy - ny * 3);
        ctx.lineTo(ex - nx * wdt, ey - ny * wdt);
        ctx.lineTo(ex + nx * wdt, ey + ny * wdt);
        ctx.closePath();
        ctx.fill();
      }
      ctx.filter = 'blur(28px)';
      // The window's colours thrown onto the floor.
      for (const p of PANES) {
        if (p.r1 < 0.4 && p.r0 > 0) continue;
        const a = (p.a0 + p.a1) / 2;
        const rr = ((p.r0 + p.r1) / 2) * (close ? 380 : 300);
        const fx = (close ? 520 : 760) + Math.cos(a) * rr;
        const fy = (close ? 900 : 870) + Math.sin(a) * rr * 0.22;
        ctx.fillStyle = `rgba(${p.rgb},${0.1 * swell})`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 70, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = 'none';
      // The rose window itself: glowing panes inside dark lead cames.
      for (const p of PANES) {
        const grad = ctx.createRadialGradient(win.x, win.y, p.r0 * win.r, win.x, win.y, p.r1 * win.r);
        grad.addColorStop(0, `rgba(${p.rgb},${0.95 * breathe})`);
        grad.addColorStop(1, `rgba(${p.rgb},${0.65 * breathe})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(win.x, win.y, p.r1 * win.r, p.a0, p.a1);
        ctx.arc(win.x, win.y, p.r0 * win.r, p.a1, p.a0, true);
        ctx.closePath();
        ctx.fill();
      }
      const core = ctx.createRadialGradient(win.x, win.y, 0, win.x, win.y, win.r * 1.6);
      core.addColorStop(0, `rgba(255,236,200,${0.22 * swell})`);
      core.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = core;
      ctx.fillRect(win.x - win.r * 2, win.y - win.r * 2, win.r * 4, win.r * 4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#07050A';
      ctx.lineWidth = close ? 7 : 4.5;
      for (const p of PANES) {
        ctx.beginPath();
        ctx.arc(win.x, win.y, p.r1 * win.r, p.a0, p.a1);
        ctx.arc(win.x, win.y, p.r0 * win.r, p.a1, p.a0, true);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.lineWidth = close ? 18 : 12;
      ctx.beginPath();
      ctx.arc(win.x, win.y, win.r + 6, 0, Math.PI * 2);
      ctx.stroke();
      // Gothic pillars framing the nave.
      for (const [x, w] of close ? [[90, 150], [1760, 180]] : [[150, 120], [520, 70], [1700, 150]]) {
        const pg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        pg.addColorStop(0, '#020103');
        pg.addColorStop(0.7, '#0B0910');
        pg.addColorStop(1, '#020103');
        ctx.fillStyle = pg;
        ctx.fillRect(x - w / 2, 0, w, H);
      }
    },
    [f, swell],
  );
  const beamWeight = (x: number, y: number) => {
    // Dust glows inside the band of beams below the window.
    const along = (x - win.x) * Math.cos(2.0) + (y - win.y) * Math.sin(2.0);
    const across = Math.abs(-(x - win.x) * Math.sin(2.0) + (y - win.y) * Math.cos(2.0));
    return along > 0 ? clamp(1 - across / (win.r * 1.2 + along * 0.25)) + 0.05 : 0.05;
  };
  return (
    <AbsoluteFill style={{transform: `translateY(${tilt}px) scale(${close ? 1.04 : 1.02})`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed={`chapel-${v}`} count={180} focus={0.5} drift={[-6, 9]} intensity={1.1 * Math.min(1.6, swell)} weight={beamWeight} />
    </AbsoluteFill>
  );
};
