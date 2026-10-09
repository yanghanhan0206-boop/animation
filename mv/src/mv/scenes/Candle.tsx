import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {clamp, easeInCubic, easeInOutSine, lerp, noise1, prog, rndRange} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, W} from '../../theme';

// 「probably turning to the Bible / 祈祷着等待答案」: one candle in the dark, the chapel's
// colours far behind it out of focus. Just before the verse it goes out.

const C = {x: 1240, top: 560, w: 92, bottom: 1000};
const JEWEL = ['60,90,200', '190,40,60', '240,170,70', '40,130,100', '120,60,170'];

export const Candle: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const outAt = dur - 0.55;
  const alive = 1 - prog(t, outAt, outAt + 0.14, easeInCubic);
  const glow = 1 - prog(t, outAt, outAt + 0.4, easeInOutSine);
  const ref = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#040303';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      // Stained glass far behind, out of focus.
      ctx.filter = 'blur(10px)';
      for (let i = 0; i < 18; i++) {
        const x = rndRange(`cg${i}`, 200, 1000) + Math.sin(t * 0.3 + i) * 6;
        const y = rndRange(`ch${i}`, 180, 520);
        const r = rndRange(`cr${i}`, 40, 90);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const rgb = JEWEL[i % JEWEL.length];
        g.addColorStop(0, `rgba(${rgb},${0.22 * (0.4 + 0.6 * glow)})`);
        g.addColorStop(0.85, `rgba(${rgb},${0.26 * (0.4 + 0.6 * glow)})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = 'none';
      // The room lit by the flame.
      const fl = 0.92 + 0.08 * noise1(t * 7) + 0.05 * noise1(t * 19);
      const room = ctx.createRadialGradient(C.x, C.top - 40, 0, C.x, C.top - 40, 900);
      room.addColorStop(0, `rgba(255,170,80,${0.32 * fl * glow})`);
      room.addColorStop(0.35, `rgba(200,110,40,${0.1 * fl * glow})`);
      room.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = room;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      // Candle body: ivory wax, lit from the top, with a couple of drips.
      const body = ctx.createLinearGradient(C.x - C.w / 2, 0, C.x + C.w / 2, 0);
      body.addColorStop(0, '#2A2016');
      body.addColorStop(0.35, '#B9A486');
      body.addColorStop(0.55, '#E8D9BE');
      body.addColorStop(1, '#3A2C1E');
      ctx.fillStyle = body;
      ctx.fillRect(C.x - C.w / 2, C.top, C.w, C.bottom - C.top);
      const shade = ctx.createLinearGradient(0, C.top, 0, C.bottom);
      shade.addColorStop(0, `rgba(255,210,140,${0.35 * glow})`);
      shade.addColorStop(0.4, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = shade;
      ctx.fillRect(C.x - C.w / 2, C.top, C.w, C.bottom - C.top);
      ctx.fillStyle = '#D8C6A6';
      for (const [dx, len] of [[-30, 70], [22, 120], [36, 44]]) {
        ctx.beginPath();
        ctx.moveTo(C.x + dx - 7, C.top);
        ctx.lineTo(C.x + dx - 6, C.top + len);
        ctx.arc(C.x + dx, C.top + len, 6, Math.PI, 0, true);
        ctx.lineTo(C.x + dx + 7, C.top);
        ctx.fill();
      }
      ctx.fillStyle = '#F0E2C6';
      ctx.beginPath();
      ctx.ellipse(C.x, C.top, C.w / 2, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wick.
      ctx.strokeStyle = '#1A120C';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(C.x, C.top);
      ctx.quadraticCurveTo(C.x + 2, C.top - 12, C.x - 1, C.top - 22);
      ctx.stroke();

      // Flame: soft halo, blue root, white core, amber tip, flickering.
      if (alive > 0.01) {
        const sway = noise1(t * 3.1) * 6 + noise1(t * 11) * 2;
        const hgt = (88 + noise1(t * 6.3) * 10) * alive;
        const fx = C.x;
        const fy = C.top - 24;
        ctx.globalCompositeOperation = 'lighter';
        const halo = ctx.createRadialGradient(fx, fy - hgt * 0.4, 0, fx, fy - hgt * 0.4, 260);
        halo.addColorStop(0, `rgba(255,190,100,${0.45 * alive})`);
        halo.addColorStop(1, 'rgba(255,190,100,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(fx - 260, fy - hgt * 0.4 - 260, 520, 520);
        const shape = (scale: number) => {
          ctx.beginPath();
          ctx.moveTo(fx, fy + 6);
          ctx.bezierCurveTo(fx - 22 * scale, fy - hgt * 0.25, fx - 10 * scale + sway * 0.5, fy - hgt * 0.75, fx + sway, fy - hgt * scale);
          ctx.bezierCurveTo(fx + 10 * scale + sway * 0.5, fy - hgt * 0.75, fx + 22 * scale, fy - hgt * 0.25, fx, fy + 6);
          ctx.closePath();
        };
        const outer = ctx.createLinearGradient(0, fy, 0, fy - hgt);
        outer.addColorStop(0, 'rgba(90,120,255,0.55)');
        outer.addColorStop(0.18, 'rgba(255,170,70,0.85)');
        outer.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = outer;
        shape(1);
        ctx.fill();
        const inner = ctx.createLinearGradient(0, fy, 0, fy - hgt * 0.7);
        inner.addColorStop(0, 'rgba(255,255,240,0.9)');
        inner.addColorStop(1, 'rgba(255,230,170,0)');
        ctx.fillStyle = inner;
        shape(0.62);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      // Smoke after it goes out: a thin curl rising from the wick.
      const sm = prog(t, outAt + 0.08, dur);
      if (sm > 0) {
        ctx.strokeStyle = `rgba(200,195,190,${0.45 * (1 - sm * 0.7)})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let k = 0; k <= 30; k++) {
          const q = k / 30;
          const y = C.top - 22 - q * 360 * clamp(sm * 1.6);
          const x = C.x + Math.sin(q * 7 + t * 4) * 16 * q + noise1(q * 4 + t) * 8 * q;
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    },
    [f, alive, glow],
  );
  return (
    <AbsoluteFill style={{transform: `scale(${lerp(1, 1.05, prog(t, 0, dur, easeInOutSine))})`, transformOrigin: `${C.x}px ${C.top}px`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed="candle" count={110} focus={0.55} drift={[-4, -12]} intensity={0.9 * glow} weight={(x, y) => clamp(1 - Math.hypot(x - C.x, y - C.top) / 700) + 0.05} />
    </AbsoluteFill>
  );
};
