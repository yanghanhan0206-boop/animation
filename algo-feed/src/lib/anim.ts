import {interpolate, random, spring} from 'remotion';
import {FPS} from '../timeline';

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** 0→1 between frames a and b (clamped), optionally eased. */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp((f - a) / (b - a)));

/** Clamped interpolate over several key frames. */
export const keys = (f: number, input: number[], output: number[]) =>
  interpolate(f, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export interface SpringOpts {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

/** Spring that starts at frame `start` (0 before it). */
export const spr = (f: number, start: number, opts: SpringOpts = {}) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: {damping: opts.damping ?? 12, stiffness: opts.stiffness ?? 140, mass: opts.mass ?? 0.8},
  });

/** Deterministic random in [0, 1). */
export const rnd = (seed: string | number) => random(`algo-${seed}`);
/** Deterministic random in [lo, hi). */
export const rndRange = (seed: string | number, lo: number, hi: number) => lo + rnd(seed) * (hi - lo);

/** Decaying camera shake that starts at `start`. */
export const shake = (f: number, start: number, dur: number, amp: number) => {
  const t = f - start;
  if (t < 0 || t > dur) return {x: 0, y: 0};
  const k = amp * Math.pow(1 - t / dur, 2);
  return {x: (rnd(`sx${t}`) * 2 - 1) * k, y: (rnd(`sy${t}`) * 2 - 1) * k};
};

/** Point on a quadratic Bézier. */
export const quad = (p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};

/** Smooth pseudo-noise in [-1, 1] built from a few sines (cheap, deterministic). */
export const wobble = (t: number, seed: number) =>
  (Math.sin(t * 0.9 + seed * 1.7) * 0.5 + Math.sin(t * 1.7 + seed * 3.1) * 0.3 + Math.sin(t * 2.9 + seed * 5.3) * 0.2);
