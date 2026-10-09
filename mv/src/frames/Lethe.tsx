import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, noise1, rnd, rndRange} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {drawLight, lightSprite} from '../lib/glow';
import {type Cam, project} from '../lib/persp';
import {H, SERIF_EN, W} from '../theme';
import {GoldText} from '../type/GoldText';

// 「祝的愿丢进忘川被遗弃」: the River of Forgetting at night. Hundreds of paper river
// lanterns drift away toward a crimson horizon; red spider lilies, the flower of the
// far shore, lean in from the foreground.

const CAM: Cam = {horizon: 430, f: 1050, h: 1.3, cx: 900};

interface Lantern {
  x: number;
  z: number;
  phase: number;
  hue: number;
}

const LANTERNS: Lantern[] = Array.from({length: 190}, (_, i) => {
  const z = lerp(5, 260, Math.pow(rnd(`nz${i}`), 1.6));
  return {x: rndRange(`nx${i}`, -0.75, 0.75) * (6 + z * 0.9), z, phase: rnd(`np${i}`) * 10, hue: rnd(`nh${i}`)};
});

// One spider lily: curled petals and long stamens radiating from a point, on a tall stem.
const Lily: React.FC<{x: number; y: number; s: number; rot: number; stemTo: [number, number]}> = ({x, y, s, rot, stemTo}) => {
  const petals = Array.from({length: 6}, (_, k) => k * 60 + rot);
  return (
    <g>
      <path d={`M${stemTo[0]} ${stemTo[1]} C${stemTo[0] + 10} ${(stemTo[1] + y) / 2} ${x - 20} ${y + 120 * s} ${x} ${y}`} stroke="#3B0B0A" strokeWidth={5 * s} fill="none" />
      {petals.map((a, k) => (
        <g key={`p${k}`} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
          <path d="M0 0 C 18 -6 38 -10 54 -2 C 62 2 60 12 50 10 C 44 8 46 0 52 0" fill="none" stroke="#D41E1E" strokeWidth={7} strokeLinecap="round" />
        </g>
      ))}
      {petals.map((a, k) => (
        <g key={`s${k}`} transform={`translate(${x} ${y}) rotate(${a + 28}) scale(${s})`}>
          <path d="M0 0 C 40 -30 80 -50 120 -46" fill="none" stroke="#E8402C" strokeWidth={2.2} />
          <circle cx={120} cy={-46} r={3.4} fill="#FFB060" />
        </g>
      ))}
    </g>
  );
};

export const Lethe: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      const sky = ctx.createLinearGradient(0, 0, 0, CAM.horizon);
      sky.addColorStop(0, '#030203');
      sky.addColorStop(0.6, '#0E0406');
      sky.addColorStop(0.92, '#2E0A0C');
      sky.addColorStop(1, '#46120F');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, CAM.horizon + 1);
      // A low blood moon behind thin haze.
      ctx.globalCompositeOperation = 'lighter';
      const moon = {x: 640, y: 250, r: 54};
      const halo = ctx.createRadialGradient(moon.x, moon.y, moon.r * 0.8, moon.x, moon.y, moon.r * 6);
      halo.addColorStop(0, 'rgba(220,90,60,0.22)');
      halo.addColorStop(1, 'rgba(220,90,60,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, CAM.horizon);
      const disc = ctx.createRadialGradient(moon.x - 10, moon.y - 12, 0, moon.x, moon.y, moon.r);
      disc.addColorStop(0, 'rgba(255,196,160,0.85)');
      disc.addColorStop(0.8, 'rgba(230,110,80,0.75)');
      disc.addColorStop(1, 'rgba(200,70,50,0)');
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // Far shore: low hills, black against the glow.
      ctx.fillStyle = '#060304';
      ctx.beginPath();
      ctx.moveTo(0, CAM.horizon);
      for (let x = 0; x <= W; x += 20) {
        ctx.lineTo(x, CAM.horizon - 14 - 26 * Math.max(0, noise1(x / 260 + 3)) - 10 * noise1(x / 70));
      }
      ctx.lineTo(W, CAM.horizon);
      ctx.closePath();
      ctx.fill();
      const water = ctx.createLinearGradient(0, CAM.horizon, 0, H);
      water.addColorStop(0, '#1C0809');
      water.addColorStop(0.12, '#0A0507');
      water.addColorStop(1, '#030305');
      ctx.fillStyle = water;
      ctx.fillRect(0, CAM.horizon, W, H - CAM.horizon);
      // Sky glow lying on the water in thin ripples.
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 140; i++) {
        const z = lerp(4, 300, Math.pow(rnd(`rz${i}`), 1.5));
        const p = project(CAM, rndRange(`rx${i}`, -1, 1) * z * 0.9, 0, z);
        const w = clamp(p.s * rndRange(`rw${i}`, 1.5, 5), 6, 320);
        ctx.fillStyle = `rgba(150,40,30,${0.05 + 0.08 * clamp(1 - z / 300)})`;
        ctx.fillRect(p.x - w / 2 + noise1(t + i) * 10, p.y, w, Math.max(1, p.s * 0.03));
      }
      // Lanterns, far to near: reflection column, halo on the water, then the lantern.
      const body = lightSprite([255, 150, 70], 0.95);
      const red = lightSprite([230, 60, 40], 0.6);
      const sorted = [...LANTERNS].sort((a, b) => b.z - a.z);
      for (const L of sorted) {
        const z = L.z + t * 0.6;
        const bob = Math.sin(t * 1.3 + L.phase) * 0.03;
        const p = project(CAM, L.x, 0.12 + bob, z);
        if (p.x < -60 || p.x > W + 60) continue;
        const fog = clamp(1 - z / 330);
        const flick = 0.85 + 0.15 * noise1(t * 4 + L.phase * 9);
        const r = clamp(p.s * 0.14, 1.2, 46);
        // Reflection: broken, rippling column of light on the water.
        const g = project(CAM, L.x, 0, z);
        const len = clamp(p.s * 1.4, 10, 340);
        for (let k = 0; k < 10; k++) {
          const yy = g.y + (k / 10) * len;
          const wob = noise1(t * 2 + k * 0.7 + L.phase) * r * 0.8;
          const ww = r * (1.2 + k * 0.08);
          ctx.globalAlpha = 0.34 * fog * (1 - k / 11) * flick;
          ctx.drawImage(body, g.x - ww + wob, yy, ww * 2, len / 10 + 1);
        }
        drawLight(ctx, red, g.x, g.y, r * 6, 0.22 * fog);
        drawLight(ctx, body, p.x, p.y, r * 3.2, (0.45 + 0.55 * fog) * flick);
        if (r > 6) {
          // Close lanterns show their paper body: a warm box with a darker rim.
          ctx.globalAlpha = 0.85 * flick;
          const bw = r * 1.5;
          const bh = r * 1.2;
          const grad = ctx.createLinearGradient(p.x, p.y - bh, p.x, p.y + bh * 0.4);
          grad.addColorStop(0, 'rgba(255,214,150,0.95)');
          grad.addColorStop(1, 'rgba(214,70,40,0.85)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(p.x - bw / 2, p.y - bh);
          ctx.lineTo(p.x + bw / 2, p.y - bh);
          ctx.lineTo(p.x + bw * 0.62, p.y + bh * 0.25);
          ctx.lineTo(p.x - bw * 0.62, p.y + bh * 0.25);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // Mist drifting over the water.
      for (let i = 0; i < 7; i++) {
        const y = CAM.horizon - 30 + i * 26;
        const x = ((rnd(`mx${i}`) * W + t * (10 + i * 4)) % (W + 1200)) - 600;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 700);
        g.addColorStop(0, 'rgba(120,50,50,0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.12);
        ctx.translate(-x, -y);
        ctx.fillStyle = g;
        ctx.fillRect(x - 700, y - 700, 1400, 1400);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      // Darken the right edge so the vertical lines read over the lanterns.
      const side = ctx.createLinearGradient(1300, 0, W, 0);
      side.addColorStop(0, 'rgba(2,1,2,0)');
      side.addColorStop(0.5, 'rgba(2,1,2,0.7)');
      side.addColorStop(1, 'rgba(2,1,2,0.85)');
      ctx.fillStyle = side;
      ctx.fillRect(1300, 0, W - 1300, H);
    },
    [f],
  );
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="lily-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="lily-soft">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <g filter="url(#lily-soft)" opacity={0.9}>
          <Lily x={150} y={690} s={1.35} rot={-10 + Math.sin(t * 0.6) * 3} stemTo={[110, 1080]} />
        </g>
        <g filter="url(#lily-glow)">
          <Lily x={330} y={790} s={1.0} rot={15 + Math.sin(t * 0.7 + 1) * 3} stemTo={[300, 1080]} />
          <Lily x={470} y={860} s={0.8} rot={40 + Math.sin(t * 0.8 + 2) * 3} stemTo={[460, 1080]} />
        </g>
      </svg>
      <GoldText text="祝的愿丢进忘川" x={1660} y={520} size={62} weight={500} spacing={0.32} vertical t={t} stagger={0.08} reveal={1} blur={12} glow={0.9} />
      <GoldText text="被遗弃" x={1560} y={600} size={50} weight={300} spacing={0.32} vertical t={t - 0.6} stagger={0.1} reveal={1} blur={12} glow={0.3} flat="#F0DCD6" />
      <div
        style={{
          position: 'absolute',
          left: 1760 - 300,
          top: 540 - 18,
          width: 600,
          textAlign: 'center',
          transform: 'rotate(90deg)',
          fontFamily: SERIF_EN,
          fontStyle: 'italic',
          fontSize: 26,
          letterSpacing: '0.3em',
          color: 'rgba(240,200,190,0.55)',
        }}
      >
        into the river of forgetting
      </div>
    </AbsoluteFill>
  );
};
