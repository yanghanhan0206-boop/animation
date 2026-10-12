/** 数学与缓动工具（全部为纯函数，保证每一帧可重复渲染） */

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => (b === a ? (x >= b ? 1 : 0) : (x - a) / (b - a));
export const rad = (deg: number) => (deg * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
export const TAU = Math.PI * 2;
export const mod = (a: number, n: number) => ((a % n) + n) % n;

export const easeInOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp(t), 3);
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - clamp(t), 5);
export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/** 在 [a,b] 区间内从 0 平滑过渡到 1 */
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = easeInOutCubic) =>
  ease(invLerp(a, b, t));

/** 梯形包络：a→b 淡入，c→d 淡出 */
export const envelope = (
  t: number,
  a: number,
  b: number,
  c: number,
  d: number,
  ease: (x: number) => number = easeInOutCubic,
) => Math.min(ramp(t, a, b, ease), 1 - ramp(t, c, d, ease));

/** 分段关键帧插值，段内缓入缓出 */
export const keyframes = (
  t: number,
  keys: ReadonlyArray<readonly [number, number]>,
  ease: (x: number) => number = easeInOutCubic,
) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, ease(invLerp(t0, t1, t)));
  }
  return keys[keys.length - 1][1];
};

/** 可复现的伪随机数（mulberry32） */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 整数哈希 → [0,1) */
export const hash01 = (n: number) => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

/** 光晕脉冲：到达前快速升起，到达后指数衰减 */
export const pulse = (dt: number, rise = 0.14, decay = 0.75) =>
  dt < 0 ? Math.exp(-((dt / rise) ** 2)) : Math.exp(-dt / decay);
