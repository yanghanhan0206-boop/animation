import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FPS, TOTAL_FRAMES} from '../data';
import {clamp01} from '../theme';

/**
 * 全片叠加：极淡的金色噪点 + 暗角。片尾黑场时一起退掉，保证纯黑。
 * 噪点用固定纹理而不是逐帧变化：逐帧随机的噪点会让 H.264 码率涨十几倍
 * （1080p 实测 50 Mbps 以上），而肉眼几乎分辨不出差别。
 */
export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
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
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} stitchTiles="stitch" />
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
