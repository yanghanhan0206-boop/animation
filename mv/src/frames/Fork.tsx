import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, noise1, rnd, rndRange} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {drawLight, lightSprite} from '../lib/glow';
import {type Cam, project} from '../lib/persp';
import {H, SERIF_EN, W} from '../theme';
import {GoldText, fromLeft} from '../type/GoldText';

// 「能否放得下 站在未来的分叉口」: a wet road at night that splits in two. One branch runs
// toward a warm city glow, the other into blue dark with a red beacon at its end.
// A lone figure stands just before the split.

const CAM: Cam = {horizon: 424, f: 1100, h: 2.5, cx: 960};
const SPLIT = 24;
const ANGLE = 0.3;
const AMBER: [number, number, number] = [255, 172, 82];
const WHITE: [number, number, number] = [255, 232, 196];
const RED: [number, number, number] = [255, 58, 46];

interface Lamp {
  x: number;
  z: number;
  rgb: [number, number, number];
  power: number;
  phase: number;
}

const LAMPS: Lamp[] = (() => {
  const out: Lamp[] = [];
  for (let z = 3; z < SPLIT; z += 2.5) {
    for (const x of [-4.4, 4.4]) out.push({x, z, rgb: AMBER, power: 1, phase: rnd(`fl${z}${x}`)});
  }
  for (let z = 15.5; z < SPLIT; z += 3) out.push({x: 0, z, rgb: WHITE, power: 0.3, phase: 0});
  for (const side of [-1, 1]) {
    for (let d = 0; d < 520; d += d < 120 ? 5 : 9) {
      const z = SPLIT + d * Math.cos(ANGLE);
      const cx = side * d * Math.sin(ANGLE);
      const nx = Math.cos(ANGLE) * 3.6;
      out.push({x: cx - nx, z, rgb: AMBER, power: 1, phase: rnd(`fb${side}${d}`)});
      out.push({x: cx + nx, z, rgb: AMBER, power: 1, phase: rnd(`fc${side}${d}`)});
    }
  }
  return out;
})();

// Seen from behind: head a little bowed, shoulders down, hands in the pockets of a long coat.
const FIGURE =
  'M51 8 C62 8 69 16 68 28 C67 39 60 46 51 46 C41 46 34 39 34 28 C34 16 41 8 51 8 Z ' +
  'M44 46 L58 46 L60 56 C72 58 82 64 85 76 L88 108 C90 128 86 150 80 168 L84 196 C80 206 70 206 64 198 ' +
  'L63 228 L62 296 C62 300 56 302 52 300 L51 236 L49 236 L46 300 C42 302 37 300 37 296 L37 228 ' +
  'L36 198 C30 206 20 206 16 196 L20 168 C14 150 10 128 12 108 L15 76 C18 64 28 58 40 56 Z';

export const Fork: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      const sky = ctx.createLinearGradient(0, 0, 0, CAM.horizon);
      sky.addColorStop(0, '#03050B');
      sky.addColorStop(0.55, '#070C1A');
      sky.addColorStop(0.9, '#121A30');
      sky.addColorStop(1, '#1C2236');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, CAM.horizon + 1);

      // City glow on the left horizon and a cold glow on the right.
      ctx.globalCompositeOperation = 'lighter';
      for (const [gx, gy, rx, ry, col] of [
        [600, CAM.horizon, 820, 230, 'rgba(255,138,58,0.30)'],
        [600, CAM.horizon, 260, 70, 'rgba(255,190,120,0.30)'],
        [1330, CAM.horizon, 680, 170, 'rgba(70,110,210,0.14)'],
      ] as const) {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(1, ry / rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
        ctx.restore();
      }
      // Low cloud bands lit from below.
      for (let i = 0; i < 46; i++) {
        const cx = rndRange(`cx${i}`, -200, W + 200) + t * rndRange(`cv${i}`, 4, 12);
        const cy = rndRange(`cy${i}`, 120, CAM.horizon - 40);
        const rx = rndRange(`cr${i}`, 160, 420);
        const warm = clamp(1 - Math.abs(cx - 600) / 900);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.18);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        const a = 0.05 * (0.4 + (cy / CAM.horizon) * 0.8);
        g.addColorStop(0, `rgba(${Math.round(lerp(90, 210, warm))},${Math.round(lerp(110, 120, warm))},${Math.round(lerp(160, 80, warm))},${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      // The city the warm branch leads to: a low skyline with a few lit windows.
      for (let i = 0; i < 40; i++) {
        const bx = 380 + i * 11 + rndRange(`bx${i}`, -4, 4);
        const bh = rndRange(`bh${i}`, 6, 34) * (1 - Math.abs(i - 20) / 26);
        ctx.fillStyle = '#0A0806';
        ctx.fillRect(bx, CAM.horizon - bh, 12, bh + 1);
        if (rnd(`bw${i}`) < 0.5) {
          ctx.fillStyle = `rgba(255,190,120,${0.5 + 0.4 * rnd(`bv${i}`)})`;
          ctx.fillRect(bx + 4, CAM.horizon - bh * rndRange(`by${i}`, 0.3, 0.8), 2, 2);
        }
      }
      // Airport on the dark branch: rows of blue taxiway lights near the horizon.
      ctx.globalCompositeOperation = 'lighter';
      const blueImg = lightSprite([90, 140, 255], 0.7);
      for (let row = 0; row < 5; row++) {
        for (let k = 0; k < 26; k++) {
          const z = 160 + row * 40;
          const x = 30 + k * 7 + row * 6;
          const p = project(CAM, x, 0.2, z);
          drawLight(ctx, blueImg, p.x, p.y, clamp(p.s * 1.4, 2.2, 6) * 2.6, 0.9 * (0.8 + 0.2 * noise1(t * 2 + k + row * 9)));
        }
      }
      // An airliner climbing away to the right, its contrail catching the city glow.
      const planeP = 0.62 + t * 0.012;
      const px = lerp(260, 1640, planeP);
      const py = lerp(330, 150, planeP) - Math.sin(planeP * Math.PI) * 30;
      ctx.lineCap = 'round';
      for (let k = 0; k < 60; k++) {
        const q0 = planeP - (k + 1) * 0.008;
        const q1 = planeP - k * 0.008;
        if (q0 < 0) break;
        const x0 = lerp(260, 1640, q0);
        const y0 = lerp(330, 150, q0) - Math.sin(q0 * Math.PI) * 30;
        const x1 = lerp(260, 1640, q1);
        const y1 = lerp(330, 150, q1) - Math.sin(q1 * Math.PI) * 30;
        const warm = clamp(1 - Math.abs(x0 - 600) / 1100);
        ctx.strokeStyle = `rgba(${Math.round(lerp(150, 255, warm))},${Math.round(lerp(160, 190, warm))},${Math.round(lerp(200, 150, warm))},${0.16 * (1 - k / 60)})`;
        ctx.lineWidth = 1.6 + k * 0.05;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      drawLight(ctx, lightSprite([255, 240, 220], 1), px, py, 7, 0.9);
      drawLight(ctx, lightSprite(RED, 0.8), px - 4, py + 2, 9, 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * 5), 8));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // A few stars.
      for (let i = 0; i < 90; i++) {
        const sx = rnd(`sx${i}`) * W;
        const sy = rnd(`sy${i}`) * (CAM.horizon - 160);
        ctx.fillStyle = `rgba(220,226,255,${0.15 + 0.35 * rnd(`sa${i}`) * (0.7 + 0.3 * Math.sin(t * 2 + i))})`;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }

      // Ground: wet asphalt, slightly lifted near the horizon.
      const ground = ctx.createLinearGradient(0, CAM.horizon, 0, H);
      ground.addColorStop(0, '#11131C');
      ground.addColorStop(0.08, '#08090E');
      ground.addColorStop(1, '#030304');
      ctx.fillStyle = ground;
      ctx.fillRect(0, CAM.horizon, W, H - CAM.horizon);
      // Faint road surface sheen along both branches and the trunk.
      ctx.globalCompositeOperation = 'lighter';
      const sheen = (pts: [number, number][], col: string) => {
        ctx.beginPath();
        pts.forEach(([x, z], i) => {
          const p = project(CAM, x, 0, z);
          if (i) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
      };
      sheen([[-4.4, 2.2], [4.4, 2.2], [4.4, SPLIT], [-4.4, SPLIT]], 'rgba(255,170,90,0.035)');
      for (const side of [-1, 1]) {
        const far = 520;
        const ex = side * far * Math.sin(ANGLE);
        const ez = SPLIT + far * Math.cos(ANGLE);
        const nx = Math.cos(ANGLE) * 3.6;
        sheen([[-nx, SPLIT], [nx, SPLIT], [ex + nx, ez], [ex - nx, ez]], side < 0 ? 'rgba(255,170,90,0.03)' : 'rgba(110,140,220,0.025)');
      }

      // Lamps, far to near, with their reflections smeared down the wet road.
      const sorted = [...LAMPS].sort((a, b) => b.z - a.z);
      for (const L of sorted) {
        const p = project(CAM, L.x, 0.35, L.z);
        if (p.x < -50 || p.x > W + 50) continue;
        const fog = clamp(1 - L.z / 620);
        const flick = 0.92 + 0.08 * noise1(t * 3 + L.phase * 50);
        const blue = L.x > 0 && L.z > SPLIT + 20;
        const rgb: [number, number, number] = blue && L.rgb === AMBER ? [255, 190, 120] : L.rgb;
        const img = lightSprite(rgb);
        const r = clamp(p.s * 0.42, 1.4, 20);
        drawLight(ctx, img, p.x, p.y, r * 2.6, L.power * (0.35 + 0.65 * fog) * flick);
        // Reflection: a soft vertical smear below the lamp.
        const g = project(CAM, L.x, 0, L.z);
        const len = clamp(p.s * 2.2, 4, 140);
        ctx.globalAlpha = 0.22 * L.power * fog;
        ctx.drawImage(img, g.x - r * 1.2, g.y, r * 2.4, len);
      }
      // Beacon at the end of the dark branch, and a warm cluster at the end of the bright one.
      const beacon = project(CAM, 520 * Math.sin(ANGLE), 6, SPLIT + 520 * Math.cos(ANGLE));
      const blink = Math.pow(0.5 + 0.5 * Math.sin(t * 3.2), 6);
      drawLight(ctx, lightSprite(RED, 0.8), beacon.x, beacon.y, 26, 0.35 + 0.65 * blink);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Mist hugging the horizon.
      const mist = ctx.createLinearGradient(0, CAM.horizon - 40, 0, CAM.horizon + 60);
      mist.addColorStop(0, 'rgba(60,62,80,0)');
      mist.addColorStop(0.5, 'rgba(70,70,86,0.18)');
      mist.addColorStop(1, 'rgba(60,62,80,0)');
      ctx.fillStyle = mist;
      ctx.fillRect(0, CAM.horizon - 40, W, 100);
    },
    [f],
  );

  // The figure stands on the trunk just short of the split, lit from ahead.
  const fz = 10.5;
  const feet = project(CAM, 0.2, 0, fz);
  const figH = 1.78 * feet.s;
  const sc = figH / 300;
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="fork-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFB45C" stopOpacity="0.9" />
            <stop offset="0.18" stopColor="#FFB45C" stopOpacity="0" />
            <stop offset="0.82" stopColor="#8FA6E0" stopOpacity="0" />
            <stop offset="1" stopColor="#8FA6E0" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <g transform={`translate(${feet.x - 50 * sc} ${feet.y - 300 * sc}) scale(${sc})`}>
          <path d={FIGURE} fill="#020203" />
          <path d={FIGURE} fill="none" stroke="url(#fork-rim)" strokeWidth={2.2 / sc} />
        </g>
        <ellipse cx={feet.x} cy={feet.y + 2} rx={figH * 0.22} ry={figH * 0.03} fill="#000" opacity={0.6} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 210,
          top: 742,
          fontFamily: SERIF_EN,
          fontStyle: 'italic',
          fontSize: 30,
          letterSpacing: '0.18em',
          color: 'rgba(233,214,180,0.72)',
        }}
      >
        love song, tough song
      </div>
      <GoldText text="能否放得下" x={fromLeft('能否放得下', 210, 64, 0.18)} y={806} size={64} weight={300} spacing={0.18} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.4} flat="#EFE6D6" />
      <GoldText text="站在未来的分叉口" x={fromLeft('站在未来的分叉口', 210, 64, 0.18)} y={884} size={64} weight={500} spacing={0.18} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.8} />
    </AbsoluteFill>
  );
};
