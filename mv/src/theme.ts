// Black and gold, nothing else.

export const W = 1920;
export const H = 1080;
export const FPS = 24;
/** 2.39:1 letterbox inside the 16:9 frame. */
export const BAR = Math.round((H - W / 2.39) / 2);

export const INK = {
  black: '#050505',
  warm: '#0B0A08',
  bar: '#000000',
  paper: '#E9E3D6',
} as const;

export const GOLD = {
  deep: '#4E391B',
  dark: '#7A5C2E',
  mid: '#A88650',
  champagne: '#C8A96A',
  light: '#E3C88F',
  hi: '#F6E7C1',
} as const;

/** Gold as RGB for canvas work. */
export const GOLD_RGB: [number, number, number] = [222, 186, 122];
export const gold = (a: number) => `rgba(222,186,122,${a})`;
export const goldHi = (a: number) => `rgba(246,231,193,${a})`;

export const SERIF_CN = '"Noto Serif SC", serif';
export const SERIF_EN = '"Cormorant Garamond", serif';
export const SANS_CN = '"Noto Sans SC", sans-serif';
export const MONO = '"JetBrains Mono", "Noto Sans SC", monospace';
