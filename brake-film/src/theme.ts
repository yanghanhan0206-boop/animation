import {Easing, interpolate} from 'remotion';
import {FPS} from './data';

export const COLORS = {
  bg: '#0A0A0A',
  gold: '#C9A45C',
  /** 亮金：只用于冲破、高光时刻 */
  bright: '#E8C77A',
  gray: '#5A5A5A',
  /** 全片只用一次：第四场金线断裂 */
  red: '#D3262E',
  text: '#F3ECDD',
};

export const FONTS = {
  title: '"Noto Serif SC", "Songti SC", serif',
  sans: '"Noto Sans SC", "PingFang SC", sans-serif',
  num: '"Oswald", "Noto Sans SC", sans-serif',
};

/** 画面布局：控制线高度、柱子基线、每亿元对应的像素 */
export const LAYOUT = {
  lineY: 360,
  baseY: 790,
  lineLeft: 80,
  lineRight: 1840,
  subtitleBottom: 118,
};
export const PX_PER_YI = (LAYOUT.baseY - LAYOUT.lineY) / 200;
export const valueToY = (v: number) => LAYOUT.baseY - v * PX_PER_YI;

export const sec = (s: number) => Math.round(s * FPS);

/** 小数位数按字符串原样计算 */
export const decimalsOf = (s: string) => (s.includes('.') ? s.split('.')[1].length : 0);

/**
 * 滚动计数：progress 0..1；到 1 时直接返回原字符串，保证最终数值一字不差。
 */
export const rollNumber = (target: string, progress: number) => {
  if (progress >= 1) {
    return target;
  }
  const v = parseFloat(target) * Math.max(0, progress);
  return v.toFixed(decimalsOf(target));
};

/** 当前帧在 [from, to] 秒之间的计数进度（带缓出） */
export const rollProgress = (frame: number, fromSec: number, toSec: number) =>
  interpolate(frame, [fromSec * FPS, toSec * FPS], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

export const clamp01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 秒为单位的 interpolate，默认两端夹住 */
export const tween = (
  frame: number,
  secs: number[],
  out: number[],
  easing?: (t: number) => number,
) => interpolate(frame, secs.map((s) => s * FPS), out, {...clamp01, easing});

export const glow = (color: string, r = 12) =>
  `drop-shadow(0 0 ${r * 0.35}px ${color}) drop-shadow(0 0 ${r}px ${color}66)`;
