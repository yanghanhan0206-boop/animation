import {random} from 'remotion';

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
export const easeInSine = (t: number) => 1 - Math.cos((t * Math.PI) / 2);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInCubic = (t: number) => t * t * t;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** 0→1 between times a and b (clamped), eased. */
export const prog = (t: number, a: number, b: number, ease: (x: number) => number = (x) => x) =>
  ease(clamp((t - a) / (b - a)));

/** Rises over [a, a+inDur], holds, falls over [b-outDur, b]. */
export const envelope = (t: number, a: number, b: number, inDur: number, outDur: number, ease = easeInOutSine) =>
  Math.min(prog(t, a, a + inDur, ease), 1 - prog(t, b - outDur, b, ease));

export const rnd = (seed: string | number) => random(`mv-${seed}`);
export const rndRange = (seed: string | number, lo: number, hi: number) => lo + rnd(seed) * (hi - lo);

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Smooth 1D value noise in [-1, 1]. */
export const noise1 = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i), hash(i + 1), u) * 2 - 1;
};

/** Two octaves of value noise, roughly in [-1, 1]. */
export const fbm1 = (x: number) => noise1(x) * 0.66 + noise1(x * 2.13 + 17.3) * 0.34;
