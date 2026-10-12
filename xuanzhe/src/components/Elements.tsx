/**
 * 多个镜头共用的画面元素：金色文字、四条路、对勾、冰壳、人影。
 */
import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {bezierPoint, type Point} from '../lib/anim';

/* ------------------------------ 金色文字 ------------------------------ */

export const GoldText: React.FC<{
  x: number;
  y: number;
  size: number;
  children: React.ReactNode;
  weight?: number;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: string;
  fill?: string;
  family?: string;
}> = ({x, y, size, children, weight = 400, opacity = 1, anchor = 'middle', spacing, fill, family}) => (
  <text
    x={x}
    y={y}
    fontFamily={family ?? FONTS.serif}
    fontSize={size}
    fontWeight={weight}
    textAnchor={anchor}
    dominantBaseline="central"
    letterSpacing={spacing}
    fill={fill ?? 'url(#gold-h)'}
    opacity={opacity}
  >
    {children}
  </text>
);

/* ------------------------------ 四条路 ------------------------------ */

export interface RoadGeometry {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

/** 从分叉点向下展开的第 i 条路（三次贝塞尔） */
export const roadGeometry = (origin: Point, spread: number, length: number, i: number, count = 4): RoadGeometry => {
  const ex = origin.x + spread * (-1 + (2 * i) / (count - 1));
  const ey = origin.y + length;
  return {
    p0: origin,
    p1: {x: origin.x, y: origin.y + length * 0.42},
    p2: {x: ex, y: ey - length * 0.55},
    p3: {x: ex, y: ey},
  };
};

const roadPath = (g: RoadGeometry, upto = 1) => {
  // 截取前 upto 部分：用 de Casteljau 分割
  const k = Math.max(0, Math.min(1, upto));
  const lerpP = (a: Point, b: Point) => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k});
  const a = lerpP(g.p0, g.p1);
  const b = lerpP(g.p1, g.p2);
  const c = lerpP(g.p2, g.p3);
  const d = lerpP(a, b);
  const e = lerpP(b, c);
  const f = lerpP(d, e);
  return `M ${g.p0.x} ${g.p0.y} C ${a.x} ${a.y} ${d.x} ${d.y} ${f.x} ${f.y}`;
};

/** 路上 k0→k1 这一段（折线近似） */
export const roadSegmentPath = (g: RoadGeometry, k0: number, k1: number) => {
  const n = 32;
  return Array.from({length: n + 1}, (_, i) => {
    const p = bezierPoint(g.p0, g.p1, g.p2, g.p3, k0 + ((k1 - k0) * i) / n);
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');
};

export const Roads: React.FC<{
  origin: Point;
  spread?: number;
  length?: number;
  /** 生长进度 0→1，可每条单独给 */
  draw?: number | number[];
  /** 每条路的点亮程度 0→1 */
  lit?: number[];
  /** 未点亮时的不透明度，可每条单独给 */
  base?: number | number[];
  labels?: string[];
  labelSize?: number;
  labelOpacity?: number | number[];
  strokeWidth?: number;
}> = ({
  origin,
  spread = 450,
  length = 270,
  draw = 1,
  lit = [],
  base: baseIn = 0.55,
  labels = [],
  labelSize = 34,
  labelOpacity: labelOpacityIn = 1,
  strokeWidth = 2,
}) => {
  const count = Math.max(labels.length, 4);
  return (
    <g>
      {Array.from({length: count}, (_, i) => {
        const g = roadGeometry(origin, spread, length, i, count);
        const d = Array.isArray(draw) ? (draw[i] ?? 1) : draw;
        const l = lit[i] ?? 0;
        const base = Array.isArray(baseIn) ? (baseIn[i] ?? 0.55) : baseIn;
        const labelOpacity = Array.isArray(labelOpacityIn) ? (labelOpacityIn[i] ?? 1) : labelOpacityIn;
        if (d <= 0.001 || base + l <= 0.001) {
          return null;
        }
        const path = roadPath(g, d);
        const end = bezierPoint(g.p0, g.p1, g.p2, g.p3, d);
        return (
          <g key={i}>
            <path d={path} fill="none" stroke="url(#gold-stroke)" strokeWidth={strokeWidth} opacity={base} />
            {l > 0.001 && (
              <path
                d={path}
                fill="none"
                stroke={COLORS.gold1}
                strokeWidth={strokeWidth + 1}
                opacity={l}
                filter="url(#glow)"
              />
            )}
            <circle cx={end.x} cy={end.y} r={3 + l * 1.5} fill={COLORS.gold1} opacity={(base + l) * 0.8} />
            {labels[i] && (
              <GoldText
                x={g.p3.x}
                y={g.p3.y + labelSize * 1.35}
                size={labelSize}
                spacing="0.12em"
                opacity={labelOpacity * Math.min(1, d * 1.2) * Math.min(1, base / 0.55 + l) * (0.55 + 0.45 * l)}
              >
                {labels[i]}
              </GoldText>
            )}
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------ 对勾 ------------------------------ */

export const Check: React.FC<{x: number; y: number; size?: number; progress: number}> = ({
  x,
  y,
  size = 22,
  progress,
}) => {
  if (progress <= 0.001) {
    return null;
  }
  const s = size / 22;
  return (
    <path
      d={`M ${x - 10 * s} ${y} L ${x - 3 * s} ${y + 8 * s} L ${x + 12 * s} ${y - 10 * s}`}
      fill="none"
      stroke={COLORS.gold1}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={`${progress} 2`}
      filter="url(#glow-soft)"
    />
  );
};

/* ------------------------------ 冰壳 ------------------------------ */

/** 半透明金色冰壳：带几道棱面高光，amount 0→1 为结冰过程 */
export const IceShell: React.FC<{x: number; y: number; r: number; amount: number}> = ({x, y, r, amount}) => {
  if (amount <= 0.001) {
    return null;
  }
  const R = r * 1.32;
  const facets = [
    [-0.75, -0.35, -0.2, -0.85],
    [-0.2, -0.85, 0.55, -0.6],
    [0.55, -0.6, 0.85, 0.15],
    [-0.75, -0.35, -0.85, 0.35],
    [-0.2, -0.85, 0.05, -0.2],
    [0.05, -0.2, 0.55, -0.6],
  ];
  return (
    <g opacity={amount}>
      <circle cx={x} cy={y} r={R} fill="url(#ice)" />
      <circle cx={x} cy={y} r={R} fill="none" stroke={COLORS.ice} strokeOpacity={0.55} strokeWidth={1.4} />
      {facets.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x + x1 * R}
          y1={y + y1 * R}
          x2={x + x2 * R}
          y2={y + y2 * R}
          stroke={COLORS.ice}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      <path
        d={`M ${x - R * 0.62} ${y - R * 0.52} A ${R * 0.85} ${R * 0.85} 0 0 1 ${x + R * 0.1} ${y - R * 0.82}`}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.6}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
};

/* ------------------------------ 人影 ------------------------------ */

/** 淡淡的人影轮廓（头 + 肩），cx/cy 为头部中心 */
export const Silhouette: React.FC<{cx: number; cy: number; scale?: number; opacity?: number}> = ({
  cx,
  cy,
  scale = 1,
  opacity = 0.4,
}) => {
  const s = scale;
  return (
    <g opacity={opacity} fill="none" stroke="url(#gold-stroke)" strokeWidth={1.6} strokeLinecap="round">
      <circle cx={cx} cy={cy} r={30 * s} />
      <path
        d={`M ${cx - 92 * s} ${cy + 128 * s}
            C ${cx - 90 * s} ${cy + 78 * s} ${cx - 62 * s} ${cy + 52 * s} ${cx - 24 * s} ${cy + 46 * s}
            L ${cx - 14 * s} ${cy + 30 * s}
            M ${cx + 14 * s} ${cy + 30 * s}
            L ${cx + 24 * s} ${cy + 46 * s}
            C ${cx + 62 * s} ${cy + 52 * s} ${cx + 90 * s} ${cy + 78 * s} ${cx + 92 * s} ${cy + 128 * s}`}
      />
    </g>
  );
};
