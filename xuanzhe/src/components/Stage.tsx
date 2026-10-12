/**
 * 镜头画布：一张 1920×1080 的 SVG，带一个简单的「摄影机」
 * （zoom 推拉、focus 对准哪个点、shake 抖动）。
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HEIGHT, WIDTH} from '../config/timeline';
import type {Point} from '../lib/anim';

export const Stage: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  /** 推拉：>1 推近，<1 拉远 */
  zoom?: number;
  /** 摄影机对准的点（画面坐标），默认画面中心 */
  focus?: Point;
  /** 画面抖动位移 */
  shake?: Point;
}> = ({children, opacity = 1, zoom = 1, focus, shake}) => {
  const fx = focus?.x ?? WIDTH / 2;
  const fy = focus?.y ?? HEIGHT / 2;
  const sx = shake?.x ?? 0;
  const sy = shake?.y ?? 0;
  const transform = `translate(${WIDTH / 2 + sx} ${HEIGHT / 2 + sy}) scale(${zoom}) translate(${-fx} ${-fy})`;
  return (
    <AbsoluteFill style={{opacity}}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{position: 'absolute', inset: 0, overflow: 'visible'}}
      >
        <g transform={transform}>{children}</g>
      </svg>
    </AbsoluteFill>
  );
};
