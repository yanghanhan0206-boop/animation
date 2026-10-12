/**
 * 三排金色线条勾勒的石头（镜头5、6、10 共用），以及蛇、电光。
 */
import React from 'react';
import {COLORS} from '../config/theme';
import {EASE, clamp, randRange} from '../lib/anim';

export interface StoneSpec {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  snake: boolean;
}

const ROWS = [
  {y: 300, n: 6, w: 112, h: 58, spacing: 178},
  {y: 445, n: 6, w: 138, h: 72, spacing: 208},
  {y: 610, n: 5, w: 168, h: 86, spacing: 258},
];

const SNAKES = new Set(['r0c2', 'r1c0', 'r1c3', 'r2c1', 'r2c4']);

export const STONES: StoneSpec[] = ROWS.flatMap((row, r) =>
  Array.from({length: row.n}, (_, c) => {
    const key = `r${r}c${c}`;
    return {
      key,
      x: 960 + (c - (row.n - 1) / 2) * row.spacing + randRange(`${key}-dx`, -14, 14),
      y: row.y + randRange(`${key}-dy`, -8, 8),
      w: row.w * randRange(`${key}-sw`, 0.9, 1.1),
      h: row.h * randRange(`${key}-sh`, 0.9, 1.1),
      snake: SNAKES.has(key),
    };
  }),
);

export const stoneByKey = (key: string) => STONES.find((s) => s.key === key)!;

/** 用闭合 Catmull-Rom 曲线画一块不规则的鹅卵石，底部略平 */
const stonePath = (s: StoneSpec) => {
  const N = 11;
  const pts = Array.from({length: N}, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const k = 1 + randRange(`${s.key}-r${i}`, -0.1, 0.1);
    let y = Math.sin(a) * (s.h / 2) * k;
    if (y > 0) {
      y *= 0.78;
    }
    return {x: Math.cos(a) * (s.w / 2) * k, y};
  });
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return `${d} Z`;
};

const PATHS = new Map(STONES.map((s) => [s.key, stonePath(s)]));

/** 盘着的蛇：一圈椭圆螺旋 + 抬起的头 + 分叉的信子 */
export const Snake: React.FC<{x: number; y: number; size: number; opacity?: number; tongue?: number}> = ({
  x,
  y,
  size,
  opacity = 1,
  tongue = 0,
}) => {
  const turns = 2.3;
  const steps = 90;
  let d = '';
  let end = {x: 0, y: 0};
  let prev = {x: 0, y: 0};
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const a = k * turns * Math.PI * 2;
    const r = size * (0.12 + 0.88 * k);
    const p = {x: Math.cos(a) * r, y: Math.sin(a) * r * 0.5};
    d += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    prev = end;
    end = p;
  }
  const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
  const hx = end.x + Math.cos(ang) * size * 0.18;
  const hy = end.y - size * 0.32;
  const tl = size * 0.22 * tongue;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity} filter="url(#glow-soft)">
      <path d={d} fill="none" stroke={COLORS.gold1} strokeWidth={2.2} strokeLinecap="round" />
      <path
        d={`M ${end.x} ${end.y} Q ${end.x + Math.cos(ang) * size * 0.2} ${end.y - size * 0.05} ${hx} ${hy}`}
        fill="none"
        stroke={COLORS.gold1}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <ellipse cx={hx} cy={hy} rx={size * 0.13} ry={size * 0.085} fill="none" stroke={COLORS.gold1} strokeWidth={2} />
      <circle cx={hx + size * 0.04} cy={hy - size * 0.02} r={1.6} fill={COLORS.gold1} />
      {tl > 0.5 && (
        <path
          d={`M ${hx + size * 0.12} ${hy} l ${tl} 0 m 0 0 l ${tl * 0.35} ${-tl * 0.3} m ${-tl * 0.35} ${tl * 0.3} l ${tl * 0.35} ${tl * 0.3}`}
          fill="none"
          stroke={COLORS.gold1}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

/** 一道折线电光，从 (x, y0) 劈到 (x, y1) */
export const Lightning: React.FC<{x: number; y0: number; y1: number; seed: string; opacity: number}> = ({
  x,
  y0,
  y1,
  seed,
  opacity,
}) => {
  if (opacity <= 0.01) {
    return null;
  }
  const n = 8;
  const pts = Array.from({length: n + 1}, (_, i) => ({
    x: x + (i === 0 || i === n ? 0 : randRange(`${seed}-${i}`, -30, 30)),
    y: y0 + ((y1 - y0) * i) / n,
  }));
  const main = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const b = pts[3];
  const branch = `M ${b.x} ${b.y} L ${b.x + 34} ${b.y + 30} L ${b.x + 26} ${b.y + 58} L ${b.x + 52} ${b.y + 88}`;
  return (
    <g opacity={opacity} filter="url(#glow)">
      <path d={main} fill="none" stroke="#FFF8E2" strokeWidth={3} strokeLinejoin="round" />
      <path d={branch} fill="none" stroke="#FFF8E2" strokeWidth={1.6} strokeLinejoin="round" opacity={0.8} />
    </g>
  );
};

/**
 * 一块石头。flip 0→1 为被掀开的过程：抬起、翻转、移到一旁变淡，露出下面（空坑或蛇）。
 */
export const Stone: React.FC<{
  s: StoneSpec;
  /** 出现（线条画出） */
  appear?: number;
  flip?: number;
  opacity?: number;
  /** 暗红色闪光（镜头10） */
  danger?: number;
  tongue?: number;
}> = ({s, appear = 1, flip = 0, opacity = 1, danger = 0, tongue = 0}) => {
  if (appear <= 0.001 || opacity <= 0.001) {
    return null;
  }
  const f = EASE(clamp(flip));
  const reveal = clamp((flip - 0.2) / 0.5);
  const path = PATHS.get(s.key)!;
  return (
    <g opacity={opacity}>
      {reveal > 0 && (
        <g opacity={reveal}>
          <ellipse
            cx={s.x}
            cy={s.y + s.h * 0.08}
            rx={s.w * 0.44}
            ry={s.h * 0.3}
            fill="none"
            stroke="url(#gold-stroke)"
            strokeWidth={1.2}
            strokeDasharray="4 6"
            opacity={0.55}
          />
          {s.snake && <Snake x={s.x} y={s.y + s.h * 0.1} size={s.w * 0.36} tongue={tongue} />}
        </g>
      )}
      <g
        transform={`translate(${s.x + f * s.w * 0.28} ${s.y - f * s.h * 0.9}) rotate(${f * 20}) scale(1 ${1 - f * 0.45})`}
        opacity={1 - f}
      >
        <path
          d={path}
          fill={COLORS.bg}
          stroke="url(#gold)"
          strokeWidth={1.8}
          pathLength={1}
          strokeDasharray={`${appear} 2`}
        />
        <path
          d={`M ${-s.w * 0.26} ${-s.h * 0.18} Q ${-s.w * 0.1} ${-s.h * 0.34} ${s.w * 0.12} ${-s.h * 0.3}`}
          fill="none"
          stroke={COLORS.gold1}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.5 * appear}
        />
        {danger > 0 && (
          <path d={path} fill={COLORS.danger} fillOpacity={0.45 * danger} stroke={COLORS.danger} strokeWidth={3} opacity={danger} />
        )}
      </g>
    </g>
  );
};
