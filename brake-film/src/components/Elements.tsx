import React from 'react';
import {random} from 'remotion';
import {CAP} from '../data';
import {COLORS, FONTS, LAYOUT, rollNumber} from '../theme';

/* ------------------------------------------------------------------ */
/* 数字：等宽窄体数字 + 中文前后缀，支持滚动计数                         */
/* ------------------------------------------------------------------ */

export const Num: React.FC<{
  value: string;
  progress?: number;
  /** 直接给出要显示的数字（比如跟随柱子高度的实时值），优先于 progress */
  display?: string;
  prefix?: string;
  /** 数字前的符号，如「+」，用数字字体 */
  sign?: string;
  unit?: string;
  size: number;
  color?: string;
  unitColor?: string;
  style?: React.CSSProperties;
}> = ({value, progress = 1, display, prefix, sign = '', unit, size, color = COLORS.gold, unitColor, style}) => {
  const text = sign + (display ?? rollNumber(value, progress));
  // 「%」这类西文单位用数字字体，中文单位用黑体
  const asciiUnit = unit ? /^[\x20-\x7e]+$/.test(unit) : false;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        whiteSpace: 'nowrap',
        color,
        ...style,
      }}
    >
      {prefix ? (
        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: size * 0.5,
            marginRight: size * 0.08,
            color: unitColor ?? color,
          }}
        >
          {prefix}
        </span>
      ) : null}
      <span
        style={{
          fontFamily: FONTS.num,
          fontWeight: 500,
          fontSize: size,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.01em',
        }}
      >
        {text}
      </span>
      {unit ? (
        <span
          style={{
            fontFamily: asciiUnit ? FONTS.num : FONTS.sans,
            fontWeight: 500,
            fontSize: asciiUnit ? size * 0.72 : size * 0.5,
            marginLeft: asciiUnit ? size * 0.03 : size * 0.08,
            color: unitColor ?? color,
          }}
        >
          {unit}
        </span>
      ) : null}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* 控制线：横贯画面的金色细线，标注「200亿」                            */
/* ------------------------------------------------------------------ */

export const GoldLine: React.FC<{
  /** 从左到右画出的进度 0..1 */
  progress?: number;
  opacity?: number;
  y?: number;
  x1?: number;
  x2?: number;
  color?: string;
  /** 标签显示进度 0..1，0 则不显示 */
  label?: number;
  /** 标签数字滚动进度 */
  labelRoll?: number;
  labelSize?: number;
  thickness?: number;
  glowStrength?: number;
  /** 画线时笔尖的光点 */
  spark?: boolean;
}> = ({
  progress = 1,
  opacity = 1,
  y = LAYOUT.lineY,
  x1 = LAYOUT.lineLeft,
  x2 = LAYOUT.lineRight,
  color = COLORS.gold,
  label = 1,
  labelRoll = 1,
  labelSize = 40,
  thickness = 2.4,
  glowStrength = 1,
  spark = false,
}) => {
  const xe = x1 + (x2 - x1) * progress;
  const gid = `gl${Math.round(y)}x${Math.round(x1)}x${Math.round(x2)}`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={x1} x2={x2} y1={0} y2={0}>
            <stop offset="0" stopColor={color} stopOpacity={0.15} />
            <stop offset="0.06" stopColor={color} stopOpacity={1} />
            <stop offset="0.94" stopColor={color} stopOpacity={1} />
            <stop offset="1" stopColor={color} stopOpacity={0.15} />
          </linearGradient>
          <filter id={`${gid}glow`} filterUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        {progress > 0 ? (
          <>
            <rect
              x={x1}
              y={y - thickness * 1.5}
              width={xe - x1}
              height={thickness * 3}
              fill={color}
              opacity={0.55 * glowStrength}
              filter={`url(#${gid}glow)`}
            />
            <rect
              x={x1}
              y={y - thickness / 2}
              width={xe - x1}
              height={thickness}
              rx={thickness / 2}
              fill={progress >= 1 ? `url(#${gid})` : color}
            />
          </>
        ) : null}
        {spark && progress > 0 && progress < 1 ? (
          <>
            <circle cx={xe} cy={y} r={16} fill={COLORS.bright} opacity={0.35} filter={`url(#${gid}glow)`} />
            <circle cx={xe} cy={y} r={3.5} fill="#FFF6DD" />
          </>
        ) : null}
      </svg>
      {label > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: x2 - 300,
            width: 300,
            top: y - labelSize - 22,
            textAlign: 'right',
            opacity: label,
            transform: `translateY(${(1 - label) * 14}px)`,
            filter: `drop-shadow(0 0 10px ${color}55)`,
          }}
        >
          <Num value={CAP.value} progress={labelRoll} unit={CAP.unit} size={labelSize} color={color} />
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 金粉：一次性迸溅的粒子（确定性随机，逐帧可重算）                      */
/* ------------------------------------------------------------------ */

export const DustBurst: React.FC<{
  frame: number;
  start: number;
  x: number;
  y: number;
  seed: string;
  count?: number;
  /** 发射角范围（度，0 = 向右，-90 = 向上） */
  angle?: [number, number];
  speed?: [number, number];
  gravity?: number;
  life?: number;
  spreadX?: number;
  colors?: string[];
  size?: [number, number];
}> = ({
  frame,
  start,
  x,
  y,
  seed,
  count = 46,
  angle = [-165, -15],
  speed = [4, 15],
  gravity = 0.42,
  life = 46,
  spreadX = 70,
  colors = [COLORS.gold, COLORS.bright, '#FFF1C9'],
  size = [1.4, 4.2],
}) => {
  const t = frame - start;
  if (t < 0 || t > life + 20) {
    return null;
  }
  const dots = [];
  for (let i = 0; i < count; i++) {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const a = ((angle[0] + (angle[1] - angle[0]) * r('a')) * Math.PI) / 180;
    const v = speed[0] + (speed[1] - speed[0]) * Math.pow(r('v'), 1.6);
    const myLife = life * (0.55 + 0.45 * r('l'));
    if (t > myLife) {
      continue;
    }
    const drag = Math.pow(0.965, t);
    const dist = (v * (1 - drag)) / (1 - 0.965);
    const px = x + (r('x') - 0.5) * spreadX + Math.cos(a) * dist;
    const py = y + Math.sin(a) * dist + 0.5 * gravity * t * t * 0.6;
    const k = t / myLife;
    const op = (1 - k) * (0.6 + 0.4 * Math.sin(t * 0.9 + i));
    const s = size[0] + (size[1] - size[0]) * r('s');
    dots.push(
      <circle
        key={i}
        cx={px}
        cy={py}
        r={s * (1 - k * 0.5)}
        fill={colors[Math.floor(r('c') * colors.length)]}
        opacity={Math.max(0, op)}
      />,
    );
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g style={{filter: `drop-shadow(0 0 4px ${COLORS.bright})`}}>{dots}</g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* 小人剪影                                                            */
/* ------------------------------------------------------------------ */

export const Figure: React.FC<{
  x: number;
  y: number;
  scale?: number;
  /** 步态相位（弧度） */
  phase?: number;
  /** 摆臂摆腿幅度（度） */
  swing?: number;
  color?: string;
  opacity?: number;
  lean?: number;
}> = ({x, y, scale = 1, phase = 0, swing = 0, color = COLORS.gold, opacity = 1, lean = 0}) => {
  const s = Math.sin(phase);
  const legA = swing * s;
  const armA = swing * 0.8 * s;
  const bob = -Math.abs(Math.cos(phase)) * swing * 0.06;
  const limb = {stroke: color, strokeWidth: 8, strokeLinecap: 'round' as const};
  return (
    <g transform={`translate(${x} ${y + bob * scale}) scale(${scale}) rotate(${lean})`} opacity={opacity}>
      {/* 后侧腿、臂 */}
      <g opacity={0.72}>
        <line x1={-3} y1={-42} x2={-3} y2={0} {...limb} transform={`rotate(${-legA} -3 -42)`} />
        <line x1={-8} y1={-70} x2={-8} y2={-40} {...limb} strokeWidth={7} transform={`rotate(${armA} -8 -70)`} />
      </g>
      <circle cx={0} cy={-88} r={10.5} fill={color} />
      <path d="M -12 -75 Q 0 -79 12 -75 L 9.5 -40 Q 0 -37 -9.5 -40 Z" fill={color} />
      <line x1={3} y1={-42} x2={3} y2={0} {...limb} transform={`rotate(${legA} 3 -42)`} />
      <line x1={8} y1={-70} x2={8} y2={-40} {...limb} strokeWidth={7} transform={`rotate(${-armA} 8 -70)`} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 柱子：半透明金色填充 + 亮金顶边，数值标签嵌在柱顶内侧（从地面「长」出来） */
/* ------------------------------------------------------------------ */

export const Bar: React.FC<{
  x: number;
  width: number;
  value: number;
  color?: string;
  opacity?: number;
  /** 顶部高光强度 0..1 */
  hot?: number;
  /** 填充浓度 */
  fill?: number;
  children?: React.ReactNode;
}> = ({x, width, value, color = COLORS.gold, opacity = 1, hot = 0, fill = 1, children}) => {
  const h = Math.max(0, value * ((LAYOUT.baseY - LAYOUT.lineY) / 200));
  const top = LAYOUT.baseY - h;
  const a = (v: number) =>
    Math.round(Math.min(1, v * fill) * 255)
      .toString(16)
      .padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top,
        width,
        height: h,
        opacity,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${color}${a(0.42)} 0%, ${color}${a(0.2)} 45%, ${color}${a(0.05)} 100%)`,
        borderLeft: `1px solid ${color}88`,
        borderRight: `1px solid ${color}88`,
        boxShadow: `0 -6px ${16 + hot * 50}px ${hot > 0 ? COLORS.bright : color}${hot > 0.05 ? '88' : '22'}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 3,
          background: hot > 0.05 ? '#FFF1C9' : color === COLORS.gold ? COLORS.bright : color,
          boxShadow: color === COLORS.gold ? `0 0 12px ${COLORS.bright}` : undefined,
        }}
      />
      {hot > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: Math.min(h, 160),
            opacity: hot,
            background: `linear-gradient(180deg, ${COLORS.bright}AA 0%, ${COLORS.bright}00 100%)`,
          }}
        />
      ) : null}
      {children ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 14, display: 'flex', justifyContent: 'center'}}>
          {children}
        </div>
      ) : null}
    </div>
  );
};

/** 柱子基线 */
export const Baseline: React.FC<{x1: number; x2: number; opacity?: number}> = ({x1, x2, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x1,
      width: x2 - x1,
      top: LAYOUT.baseY,
      height: 1,
      background: COLORS.gray,
      opacity,
    }}
  />
);
