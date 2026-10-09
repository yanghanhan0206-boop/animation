import React from 'react';
import {C} from '../theme';

interface Props {
  cx: number;
  cy: number;
  r: number;
  /** Outer ring rotation, degrees. */
  rot?: number;
  /** Inner dashed ring rotation, degrees. */
  inner?: number;
  /** Corner brackets sit this many radii from the centre. */
  bracket?: number;
  color?: string;
  opacity?: number;
}

/** Targeting reticle: segmented ring, dashed inner ring, cross ticks and viewfinder corners. */
export const Reticle: React.FC<Props> = ({cx, cy, r, rot = 0, inner = 0, bracket = 1.3, color = C.accent, opacity = 1}) => {
  const circ = 2 * Math.PI * r;
  const gap = Math.min(40, circ / 12);
  const len = r * 0.3;
  const d = r * bracket;
  return (
    <g opacity={opacity}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${circ / 4 - gap} ${gap}`}
        transform={`rotate(${rot + 45 + ((gap / 2) / circ) * 360} ${cx} ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.64}
        fill="none"
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={2.5}
        strokeDasharray="10 12"
        transform={`rotate(${inner} ${cx} ${cy})`}
      />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1={cx + r * 0.76}
          y1={cy}
          x2={cx + r * 1.16}
          y2={cy}
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(${a + rot * 0.25} ${cx} ${cy})`}
        />
      ))}
      {[
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([sx, sy]) => {
        const x = cx + sx * d;
        const y = cy + sy * d;
        return (
          <path
            key={`${sx}${sy}`}
            d={`M${x} ${y - sy * len} L${x} ${y} L${x - sx * len} ${y}`}
            stroke={color}
            strokeWidth={7}
            fill="none"
            strokeLinecap="square"
          />
        );
      })}
    </g>
  );
};
