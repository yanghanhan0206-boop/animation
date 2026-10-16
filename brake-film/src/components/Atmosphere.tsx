import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FPS, SCENES, TOTAL_FRAMES} from '../data';
import {S4} from '../scenes/Scene4Break';
import {clamp01} from '../theme';

// 第四场「画面静止一秒」时，噪点也一起定住
const FREEZE = [(SCENES[3].start + S4.touchAt) * FPS, (SCENES[3].start + S4.breakAt) * FPS];

/** 全片叠加：极淡的金色噪点 + 暗角。片尾黑场时一起退掉，保证纯黑。 */
export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const grainFrame = frame >= FREEZE[0] && frame < FREEZE[1] ? Math.floor(FREEZE[0]) : frame;
  const endFade = interpolate(frame, [TOTAL_FRAMES - 2.6 * FPS, TOTAL_FRAMES - 2.1 * FPS], [1, 0], clamp01);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 72% 68% at 50% 48%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.42) 82%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      <svg
        width={1920}
        height={1080}
        style={{position: 'absolute', inset: 0, opacity: 0.09 * endFade, mixBlendMode: 'screen'}}
      >
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={grainFrame % 97}
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.79  0 0 0 0 0.64  0 0 0 0 0.36  2.4 0 0 0 -1.05"
          />
        </filter>
        <rect width="1920" height="1080" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
