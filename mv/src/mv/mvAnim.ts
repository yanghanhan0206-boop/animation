export {easeInOutSine, easeOutCubic, lerp, prog} from '../lib/anim';

/** A flash that peaks at `at` and decays over `fall` seconds (a two-frame rise). */
export const keysFlash = (time: number, at: number, peak: number, fall: number) => {
  if (time < at - 1 / 12 || time > at + fall) return 0;
  if (time < at) return peak * (1 - (at - time) * 12);
  return peak * Math.pow(1 - (time - at) / fall, 2);
};
