import React from 'react';
import {random} from 'remotion';
import {COLORS} from '../theme';

/** 背景里缓慢漂浮的极淡金尘，给纯黑画面一点空气感 */
export const Motes: React.FC<{frame: number; seed: string; count?: number; opacity?: number}> = ({
  frame,
  seed,
  count = 28,
  opacity = 1,
}) => {
  const dots = [];
  for (let i = 0; i < count; i++) {
    const r = (k: string) => random(`${seed}-mote-${i}-${k}`);
    const x0 = r('x') * 1920;
    const y0 = r('y') * 1080;
    const vx = (r('vx') - 0.5) * 0.25;
    const vy = -0.08 - r('vy') * 0.22;
    const x = (((x0 + vx * frame) % 1920) + 1920) % 1920;
    const y = (((y0 + vy * frame) % 1080) + 1080) % 1080;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * (0.03 + r('f') * 0.05) + r('p') * 6.28));
    dots.push(<circle key={i} cx={x} cy={y} r={0.8 + r('s') * 1.6} fill={COLORS.gold} opacity={tw * 0.32} />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity}}>
      {dots}
    </svg>
  );
};
