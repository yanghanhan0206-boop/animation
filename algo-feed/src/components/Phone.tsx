import React from 'react';
import {whiteA} from '../theme';

interface Props {
  /** Unique id, used for the screen clip path. */
  id: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  stroke?: string;
  children?: React.ReactNode;
}

export const PHONE_INSET = 14;

/** Flat phone outline; children are drawn in page coordinates and clipped to the screen. */
export const Phone: React.FC<Props> = ({id, cx, cy, w, h, stroke = whiteA(0.86), children}) => {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const i = PHONE_INSET;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-screen`}>
          <rect x={x + i} y={y + i} width={w - 2 * i} height={h - 2 * i} rx={40} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={54} fill="#0D1210" stroke={stroke} strokeWidth={5} />
      <rect x={x + i} y={y + i} width={w - 2 * i} height={h - 2 * i} rx={40} fill="#121915" />
      <g clipPath={`url(#${id}-screen)`}>{children}</g>
      <rect x={cx - 46} y={y + i + 10} width={92} height={22} rx={11} fill="#0D1210" />
    </g>
  );
};
