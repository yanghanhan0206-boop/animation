/**
 * 动画小工具：统一的缓入缓出曲线、补间、平滑噪声颤动、残影采样。
 */
import {noise2D} from '@remotion/noise';
import {Easing, interpolate, random} from 'remotion';
import {FPS} from '../config/timeline';
import {BALL} from '../config/theme';

/** 全片默认的缓入缓出曲线 */
export const EASE = Easing.bezier(0.45, 0, 0.55, 1);
/** 更柔和的缓入缓出，用于淡入淡出 */
export const EASE_SOFT = Easing.inOut(Easing.sin);

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** t 在 [t0, t1] 之间时从 v0 补间到 v1，两端夹住 */
export const tween = (t: number, t0: number, t1: number, v0 = 0, v1 = 1, easing = EASE) =>
  interpolate(t, [t0, t1], [v0, v1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** 关键帧：times 与 values 一一对应，每一段都用缓入缓出 */
export const keys = (t: number, times: number[], values: number[], easing = EASE) =>
  interpolate(t, times, values, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** 淡入 [a, b]，淡出 [c, d] */
export const fade = (t: number, a: number, b: number, c?: number, d?: number) => {
  const fin = tween(t, a, b, 0, 1, EASE_SOFT);
  return c === undefined || d === undefined ? fin : Math.min(fin, 1 - tween(t, c, d, 0, 1, EASE_SOFT));
};

/**
 * 悬空颤动：两层平滑噪声叠加，tension 越高，幅度越大、越急。
 * tension 0 ≈ 2px 缓慢漂移，1 ≈ 4px，2（剧烈）≈ 7px。
 * gt 用完整版的绝对时间，镜头切换时颤动不会跳。
 */
export const jitter = (gt: number, tension: number, seed: string | number = 'ball') => {
  const slowA = interpolate(tension, [0, 1, 2], [2.6, 3.0, 4.0], {extrapolateRight: 'clamp'});
  const fastA = interpolate(tension, [0, 1, 2], [0.15, 2.4, 6.0], {extrapolateRight: 'clamp'});
  const s = String(seed);
  return {
    x: noise2D(`${s}-sx`, gt * 0.85, 0) * slowA + noise2D(`${s}-fx`, gt * 5.2, 0.5) * fastA,
    y: noise2D(`${s}-sy`, gt * 0.85, 3.1) * slowA + noise2D(`${s}-fy`, gt * 5.2, 7.7) * fastA,
  };
};

export interface Point {
  x: number;
  y: number;
}

/** 沿运动轨迹往回采样残影位置（最近的在前） */
export const sampleTrail = (path: (t: number) => Point, t: number): Point[] =>
  Array.from({length: BALL.trailCount}, (_, i) => path(t - ((i + 1) * BALL.trailStep) / FPS));

/** 确定性随机数 [0,1) */
export const rand = (seed: string | number) => random(seed);
export const randRange = (seed: string | number, lo: number, hi: number) => lo + (hi - lo) * random(seed);

/** 三次贝塞尔曲线上的点 */
export const bezierPoint = (p0: Point, p1: Point, p2: Point, p3: Point, k: number): Point => {
  const u = 1 - k;
  return {
    x: u * u * u * p0.x + 3 * u * u * k * p1.x + 3 * u * k * k * p2.x + k * k * k * p3.x,
    y: u * u * u * p0.y + 3 * u * u * k * p1.y + 3 * u * k * k * p2.y + k * k * k * p3.y,
  };
};
