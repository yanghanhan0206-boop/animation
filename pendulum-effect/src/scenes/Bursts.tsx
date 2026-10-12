/** 镜头 1 / 3：“吼”出现那一刻，从字上荡开的一圈金色声波 */
import React from 'react';
import {easeOutCubic, ramp} from '../lib/math';
import {poleWordPos} from './PoleWords';

export const RoarBurst: React.FC<{t: number; at: number; strength: number}> = ({t, at, strength}) => {
  const rings = [];
  const n = strength > 1 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const t0 = at + k * 0.12;
    const u = ramp(t, t0, t0 + 1.1 + 0.2 * strength, easeOutCubic);
    if (t < t0 || u >= 1) continue;
    const p = poleWordPos('left', t0, '吼');
    rings.push(
      <circle
        key={k}
        cx={p.x}
        cy={p.y}
        r={70 + u * (150 + 90 * strength)}
        fill="none"
        stroke="#F5D76E"
        strokeWidth={(2.2 - 1.6 * u) * (0.7 + 0.3 * strength)}
        vectorEffect="non-scaling-stroke"
        opacity={(1 - u) * (0.55 - k * 0.12) * Math.min(1.4, strength)}
      />,
    );
  }
  return <g>{rings}</g>;
};
