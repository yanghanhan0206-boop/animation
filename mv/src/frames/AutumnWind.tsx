import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lerp, noise1, rnd, rndRange} from '../lib/anim';
import {sprite, useCanvas} from '../lib/canvas';
import {H, SERIF_EN, W} from '../theme';
import {DustText} from '../type/DustText';
import {GoldText, fromLeft, lineLength} from '../type/GoldText';

// 「秋风再起 太大了听不见我在说声爱你」: a gale of maple leaves backlit by a low sun; the
// last two words of the line are torn off and carried away with them.

// Maple: a tall top lobe, two broad side lobes, two small lower lobes, rounded sinuses.
const LEAF = new Path2D(
  'M50 3 L54 14 L59 12 Q57 22 58 30 Q63 28 68 27 L72 20 L76 27 L95 26 L84 38 L90 44 Q80 46 72 50 Q68 52 66 56 ' +
    'L80 64 L84 74 L70 72 L64 78 Q58 72 56 68 L51 72 L49 72 L44 68 Q42 72 36 78 L30 72 L16 74 L20 64 L34 56 ' +
    'Q32 52 28 50 Q20 46 10 44 L16 38 L5 26 L24 27 L28 20 L32 27 Q37 28 42 30 Q43 22 41 12 L46 14 Z',
);
const STEM = new Path2D('M50 72 Q51 86 54 99');
const PALETTE = ['#C8321C', '#E0502A', '#EE7A2E', '#F2A13A', '#9E1F14', '#F4C06A'];
const BLURS = [0, 3, 6, 10, 15];
const SPR = 224;
const PAD = 64;
const LEAF_PX = SPR - PAD * 2;

/** A leaf pre-rendered once per colour, blur level and backlight state. */
const leafSprite = (color: string, blurIdx: number, lit: boolean) =>
  sprite(`leaf-${color}-${blurIdx}-${lit}`, SPR, SPR, (ctx) => {
    const k = LEAF_PX / 100;
    ctx.filter = BLURS[blurIdx] ? `blur(${BLURS[blurIdx]}px)` : 'none';
    ctx.translate(PAD, PAD);
    ctx.scale(k, k);
    ctx.fillStyle = lit ? '#FFB27A' : color;
    ctx.fill(LEAF);
    if (!lit) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#3A0A05';
      ctx.lineWidth = 3;
      ctx.stroke(STEM);
    }
  });

interface Leaf {
  x0: number;
  y0: number;
  z: number;
  speed: number;
  spin: number;
  tumble: number;
  phase: number;
  color: string;
}

const LEAVES: Leaf[] = Array.from({length: 175}, (_, i) => ({
  x0: rnd(`lx${i}`) * (W + 600) - 300,
  y0: rnd(`ly${i}`) * (H + 300) - 150,
  z: Math.pow(rnd(`lz${i}`), 0.72),
  speed: rndRange(`ls${i}`, 0.7, 1.3),
  spin: rndRange(`lr${i}`, -2.5, 2.5),
  tumble: rndRange(`lt${i}`, 1.2, 3.2),
  phase: rnd(`lp${i}`) * 10,
  color: PALETTE[Math.floor(rnd(`lc${i}`) * PALETTE.length)],
}));

export const AutumnWind: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#050303';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      // Low sun just off the right edge, and a red haze in the air.
      for (const [x, y, r, col] of [
        [2050, 520, 1300, 'rgba(255,128,48,0.30)'],
        [1900, 560, 520, 'rgba(255,190,110,0.28)'],
        [900, 700, 1100, 'rgba(150,30,16,0.10)'],
      ] as const) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      // Wind: long faint strokes curving across the frame.
      ctx.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const y = rnd(`wy${i}`) * H;
        const x = ((rnd(`wx${i}`) * (W + 1400) + t * 900) % (W + 1400)) - 700;
        ctx.strokeStyle = `rgba(255,200,150,${0.03 + 0.04 * rnd(`wa${i}`)})`;
        ctx.lineWidth = 1 + rnd(`ww${i}`) * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 200, y - 30, x + 400, y + 30, x + 640, y - 10);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Leaves, far to near. Each one tumbles (scaleX = cos) and leaves a short motion smear.
      const sorted = [...LEAVES].sort((a, b) => b.z - a.z);
      for (const L of sorted) {
        const near = 1 - L.z;
        const size = lerp(14, 150, near * near);
        const vx = lerp(260, 1250, near) * L.speed;
        const vy = lerp(30, 140, near) * L.speed;
        const span = W + 700;
        const x = ((((L.x0 + vx * t) % span) + span) % span) - 350;
        const y = L.y0 + vy * t * 0.35 + noise1(t * 0.8 + L.phase) * 60 * near;
        const yy = ((y % (H + 300)) + H + 300) % (H + 300) - 150;
        const rot = L.phase + t * L.spin;
        const tum = Math.cos(t * L.tumble + L.phase);
        // Depth of field: sharp around the middle distance, soft near and far.
        const blur = Math.abs(L.z - 0.42) * (near > 0.6 ? 34 : 9);
        const bi = BLURS.reduce((best, b, i) => (Math.abs(b - blur) < Math.abs(BLURS[best] - blur) ? i : best), 0);
        const lit = Math.max(0, 1 - Math.abs(x - 1900) / 1500);
        const img = leafSprite(L.color, bi, false);
        const glow = leafSprite(L.color, bi, true);
        const scale = size / LEAF_PX;
        for (let k = 3; k >= 0; k--) {
          ctx.save();
          ctx.translate(x - (vx / 24) * k * 0.6, yy - (vy / 24) * k * 0.6);
          ctx.rotate(rot);
          ctx.scale(scale * Math.max(0.12, Math.abs(tum)), scale);
          ctx.globalAlpha = (k === 0 ? 1 : 0.18 / k) * lerp(0.55, 1, near);
          ctx.drawImage(img, -SPR / 2, -SPR / 2);
          if (k === 0 && lit > 0.02) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.45 * lit * (0.6 + 0.4 * tum);
            ctx.drawImage(glow, -SPR / 2, -SPR / 2);
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      // Keep the words readable: a soft dark pool behind the lyric block.
      ctx.save();
      ctx.translate(560, 850);
      ctx.scale(1, 0.32);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 760);
      pool.addColorStop(0, 'rgba(3,1,1,0.72)');
      pool.addColorStop(1, 'rgba(3,1,1,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(-760, -760, 1520, 1520);
      ctx.restore();
    },
    [f],
  );
  const size = 64;
  const sp = 0.18;
  const stay = '太大了听不见我在说声';
  const stayLen = lineLength([...stay].length, size, sp);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <div style={{position: 'absolute', left: 212, top: 752, fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 28, letterSpacing: '0.2em', color: 'rgba(255,214,180,0.65)'}}>
        the autumn wind again
      </div>
      <GoldText text="秋风再起" x={fromLeft('秋风再起', 210, size, sp)} y={812} size={size} weight={300} spacing={sp} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.3} flat="#F3E6DA" />
      <GoldText text={stay} x={fromLeft(stay, 210, size, sp)} y={892} size={size} weight={500} spacing={sp} t={t} stagger={0.05} reveal={0.8} blur={10} glow={0.8} />
      <DustText text="爱你" x={210 + stayLen + size * sp + lineLength(2, size, sp) / 2} y={892} size={size} weight={500} spacing={sp} t={t} stagger={0.05} reveal={0.6} dissolve={3.4} dissolveDur={1.4} glow={0.8} wind={[300, -60]} seed="aini" />
    </AbsoluteFill>
  );
};
