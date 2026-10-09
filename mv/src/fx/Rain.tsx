import React from 'react';
import {useCurrentFrame} from 'remotion';
import {lerp, rnd} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {FPS, H, W} from '../theme';

export interface RainProps {
  seed: string;
  count: number;
  /** Light source that tints nearby drops gold. */
  glow?: {x: number; y: number; r: number};
  /** Street level: drops below it splash instead of falling on. */
  ground?: number;
  intensity?: number;
  angle?: number;
}

/** Thin rain in three depths, drops near the light turn gold, small splashes on the street. */
export const Rain: React.FC<RainProps> = ({seed, count, glow, ground = H, intensity = 1, angle = 0.14}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      const t = f / FPS;
      ctx.lineCap = 'round';
      const spanY = H + 300;
      for (let i = 0; i < count; i++) {
        const z = rnd(`${seed}z${i}`);
        const v = lerp(1900, 750, z);
        const len = v * 0.024;
        const x0 = rnd(`${seed}x${i}`) * (W + 300) - 150;
        const y = ((rnd(`${seed}y${i}`) * spanY + v * t) % spanY) - 150;
        const x = x0 + Math.tan(angle) * y;
        if (y > ground + 40 * (1 - z)) continue;
        let a = lerp(0.2, 0.05, z) * intensity;
        let col = '205,198,184';
        if (glow) {
          const d = Math.hypot(x - glow.x, y - glow.y);
          const g = Math.max(0, 1 - d / glow.r);
          if (g > 0) {
            a *= 1 + g * 3.5;
            col = `${Math.round(lerp(205, 240, g))},${Math.round(lerp(198, 206, g))},${Math.round(lerp(184, 150, g))}`;
          }
        }
        ctx.strokeStyle = `rgba(${col},${Math.min(0.85, a)})`;
        ctx.lineWidth = lerp(1.7, 0.7, z);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.tan(angle) * len, y - len);
        ctx.stroke();
      }
      if (ground < H) {
        for (let i = 0; i < Math.round(count / 6); i++) {
          const period = 0.55 + rnd(`${seed}sp${i}`) * 0.5;
          const phase = rnd(`${seed}sq${i}`) * period;
          const cycle = Math.floor((t + phase) / period);
          const age = ((t + phase) % period) / period;
          const sx = rnd(`${seed}sx${i}-${cycle}`) * W;
          const depth = rnd(`${seed}sd${i}-${cycle}`);
          const sy = ground + 10 + depth * 200;
          const r = (4 + depth * 14) * age;
          ctx.strokeStyle = `rgba(210,200,182,${0.16 * (1 - age) * intensity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(sx, sy, r * 2.4, r * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    [f, seed, count, intensity, ground],
  );
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};
