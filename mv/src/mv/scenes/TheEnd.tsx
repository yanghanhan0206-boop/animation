import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeInCubic, easeOutCubic, lerp, prog, rnd} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, SERIF_EN, W} from '../../theme';

// 「你说过这可能是你能想到的最好的结局」: the end card of an old film. Projector flicker,
// gate weave, scratches and dust; at the end the film burns through into the next shot.

export const TheEnd: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const flicker = 0.9 + 0.1 * rnd(`flk${f}`);
  const weave = {x: (rnd(`wx${f}`) - 0.5) * 3, y: (rnd(`wy${f}`) - 0.5) * 3};
  const burn = prog(t, dur - 0.55, dur, easeInCubic);
  const ref = useCanvas(
    (ctx) => {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1100);
      g.addColorStop(0, `rgba(46,38,28,${flicker})`);
      g.addColorStop(1, `rgba(8,6,4,${flicker})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Scratches and dust, new every frame.
      for (let i = 0; i < 3; i++) {
        if (rnd(`sc${f}${i}`) < 0.55) continue;
        const x = rnd(`sx${f}${i}`) * W;
        ctx.strokeStyle = `rgba(230,220,200,${0.12 + rnd(`sa${f}${i}`) * 0.2})`;
        ctx.lineWidth = 1 + rnd(`sw${f}${i}`);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (rnd(`sd${f}${i}`) - 0.5) * 30, H);
        ctx.stroke();
      }
      for (let i = 0; i < 26; i++) {
        const x = rnd(`dx${f}${i}`) * W;
        const y = rnd(`dy${f}${i}`) * H;
        const r = 1 + rnd(`dr${f}${i}`) * 3.5;
        ctx.fillStyle = rnd(`dc${f}${i}`) < 0.5 ? 'rgba(0,0,0,0.55)' : 'rgba(240,230,210,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (0.5 + rnd(`de${f}${i}`)), rnd(`da${f}${i}`) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Film burn: a hot hole opening from the right edge.
      if (burn > 0) {
        const bx = W + 200 - burn * 900;
        const bg = ctx.createRadialGradient(bx, 560, 0, bx, 560, 300 + burn * 1600);
        bg.addColorStop(0, 'rgba(255,250,235,1)');
        bg.addColorStop(0.25, 'rgba(255,190,90,0.95)');
        bg.addColorStop(0.45, 'rgba(200,70,20,0.75)');
        bg.addColorStop(0.6, 'rgba(60,10,0,0.4)');
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      }
    },
    [f, burn],
  );
  const inP = prog(t, 0.05, 0.9, easeOutCubic);
  return (
    <AbsoluteFill style={{transform: `translate(${weave.x}px, ${weave.y}px) scale(${lerp(1.0, 1.04, t / dur)})`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 360,
          textAlign: 'center',
          fontFamily: SERIF_EN,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 168,
          letterSpacing: '0.04em',
          color: `rgba(238,226,204,${0.92 * flicker * inP})`,
          filter: `blur(${(1 - inP) * 10}px)`,
          textShadow: '0 0 30px rgba(255,220,170,0.25)',
        }}
      >
        The End
      </div>
      <div style={{position: 'absolute', left: 860, width: 200, top: 590, height: 1.5, background: `rgba(238,226,204,${0.6 * inP})`}} />
    </AbsoluteFill>
  );
};
