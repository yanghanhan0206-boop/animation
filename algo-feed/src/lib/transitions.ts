import {cue, type Step} from '../timeline';
import {easeInCubic, easeInOutCubic, lerp, prog} from './anim';

/** Cut points between shots, all derived from the narration. */
export const CUT = {
  s01: cue(2).end,
  s02: cue(4).end,
  s03: cue(5).end,
  s04: cue(9).end,
  s05: cue(10).end,
  s06: cue(14).end,
  s07: cue(15).end,
  s08: cue(20).end,
  s09: cue(21).end,
  s10: cue(26).end,
  s11: cue(28).end,
} as const;

/** A title card starts folding into the step bar this many frames before its line ends. */
export const COLLAPSE_LEAD = 8;
export const COLLAPSE_LEN = 14;
export const collapseStart = (s: Step) => cue(s.titleCue).end - COLLAPSE_LEAD;
export const collapseEnd = (s: Step) => collapseStart(s) + COLLAPSE_LEN;

/** Frame windows where a transition is in flight (content may pass through the UI zones). */
export const TRANSITIONS = [
  {name: 'S01→S02 放大穿越', from: CUT.s01 - 6, to: CUT.s01 + 12},
  {name: 'S02→S03 推近 01', from: CUT.s02 - 10, to: CUT.s02 + 12},
  {name: 'S03→S04 标题收进进度条', from: CUT.s03 - COLLAPSE_LEAD, to: CUT.s03 + 15},
  {name: 'S04→S05 整屏上推', from: CUT.s04 - 8, to: CUT.s04 + 8},
  {name: 'S05→S06 标题收进进度条', from: CUT.s05 - COLLAPSE_LEAD, to: CUT.s05 + 15},
  {name: 'S06→S07 荧光横扫', from: CUT.s06 - 8, to: CUT.s06 + 8},
  {name: 'S07→S08 标题收进进度条', from: CUT.s07 - COLLAPSE_LEAD, to: CUT.s07 + 15},
  {name: 'S08→S09 圆形遮罩', from: CUT.s08 - 8, to: CUT.s08 + 8},
  {name: 'S09→S10 标题收进进度条', from: CUT.s09 - COLLAPSE_LEAD, to: CUT.s09 + 15},
  {name: 'S10→S11 坍缩 + 故障闪', from: CUT.s10 - 10, to: CUT.s10 + 10},
  {name: 'S11→S12 瞄准镜松开', from: CUT.s11 - 2, to: CUT.s11 + 14},
];

export interface Flash {
  at: number;
  peak: number;
  rise: number;
  fall: number;
}

export const LOCK_ON = cue(2).start;
export const ZOOM_FLASH = CUT.s01 + 5;
export const REVERSE_LOCK = cue(28).start + 12;

export const FLASHES: Flash[] = [
  {at: LOCK_ON, peak: 0.55, rise: 1, fall: 7},
  {at: ZOOM_FLASH, peak: 0.95, rise: 4, fall: 8},
  {at: CUT.s10, peak: 0.5, rise: 3, fall: 8},
  {at: REVERSE_LOCK, peak: 0.4, rise: 1, fall: 6},
];

/** Whole-frame push upwards: the old shot leaves through the top, the new one rises in. */
export const pushUp = (f: number, cut: number, half = 8) => {
  const p = easeInOutCubic(prog(f, cut - half, cut + half));
  return {p, outY: -p * 1920, inY: (1 - p) * 1920};
};

/** A bright vertical bar sweeps left→right; the new shot is revealed behind it. */
export const wipeRight = (f: number, cut: number, half = 8) => {
  const p = easeInOutCubic(prog(f, cut - half, cut + half));
  const x = lerp(-90, 1170, p);
  return {p, x, outClip: `inset(0 0 0 ${Math.max(0, x)}px)`, inClip: `inset(0 ${Math.max(0, 1080 - x)}px 0 0)`};
};

/** The new shot opens as a growing circle from (cx, cy) while the old one zooms in. */
export const irisOpen = (f: number, cut: number, cx: number, cy: number, half = 8) => {
  const p = easeInCubic(prog(f, cut - half, cut + half));
  return {p, inClip: `circle(${p * 2300}px at ${cx}px ${cy}px)`, outScale: 1 + p * 1.8};
};
