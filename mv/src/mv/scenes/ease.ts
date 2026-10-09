export {easeInOutSine, lerp, prog} from '../../lib/anim';

/** A gentle overshoot (about 4%) for things that pop into place. */
export const easeOutBackLite = (t: number) => {
  const c1 = 0.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
