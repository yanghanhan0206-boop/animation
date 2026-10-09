import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useCanvas} from '../lib/canvas';
import {H, W} from '../theme';

export interface FlareProps {
  x: number;
  y: number;
  /** 0..1+ brightness. */
  intensity: number;
  size?: number;
  /** Length of the horizontal anamorphic streak, as a multiple of the default. */
  streak?: number;
}

/** A distant light: hot core, wide halo and a thin horizontal anamorphic streak. */
export const Flare: React.FC<FlareProps> = ({x, y, intensity, size = 1, streak = 1}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      if (intensity <= 0.001) return;
      const I = intensity;
      ctx.globalCompositeOperation = 'lighter';

      const halo = ctx.createRadialGradient(x, y, 0, x, y, 300 * size);
      halo.addColorStop(0, `rgba(222,186,122,${0.2 * I})`);
      halo.addColorStop(0.4, `rgba(200,160,96,${0.06 * I})`);
      halo.addColorStop(1, 'rgba(200,160,96,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(x - 300 * size, y - 300 * size, 600 * size, 600 * size);

      for (const [sy, a, len] of [
        [0.02, 0.32, 1],
        [0.006, 0.6, 0.7],
      ] as const) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, sy);
        const L = 950 * size * streak * len;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, L);
        g.addColorStop(0, `rgba(250,232,190,${a * I})`);
        g.addColorStop(0.25, `rgba(222,186,122,${a * 0.35 * I})`);
        g.addColorStop(1, 'rgba(222,186,122,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-L, -L, L * 2, L * 2);
        ctx.restore();
      }

      const core = ctx.createRadialGradient(x, y, 0, x, y, 30 * size);
      core.addColorStop(0, `rgba(255,252,240,${Math.min(1, I)})`);
      core.addColorStop(0.25, `rgba(250,226,170,${0.75 * I})`);
      core.addColorStop(1, 'rgba(222,186,122,0)');
      ctx.fillStyle = core;
      ctx.fillRect(x - 30 * size, y - 30 * size, 60 * size, 60 * size);
    },
    [f, x, y, intensity, size, streak],
  );
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};
