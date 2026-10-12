/**
 * 视觉风格：颜色、字体、尺寸。改风格只需要动这里。
 */

export const COLORS = {
  /** 背景纯黑 */
  bg: '#0a0a0a',
  /** 主体金色渐变的两端 */
  gold0: '#D4AF37',
  gold1: '#F5D76E',
  /** 字幕：浅金白 */
  text: '#F5EFE0',
  /** 小球「变冷」后的颜色（镜头11 冰壳） */
  cold0: '#A9ABA4',
  cold1: '#ECEDE6',
  /** 冰壳 */
  ice: '#CFE3EA',
  /** 蛇石头熄灭前闪一下的暗红 */
  danger: '#8E2A22',
} as const;

export const FONTS = {
  serif: '"Noto Serif SC", "Source Han Serif SC", serif',
  sans: '"Noto Sans SC", "Source Han Sans SC", sans-serif',
} as const;

/** 主角小球 */
export const BALL = {
  /** 半径（直径约 56px） */
  radius: 28,
  /** 残影个数 */
  trailCount: 8,
  /** 相邻残影之间相隔的帧数 */
  trailStep: 3,
} as const;

/** 小球的「家」：大多数镜头里它悬停的位置（画面中央略偏上，给字幕留出下方空间） */
export const HOME = {x: 960, y: 420} as const;

export const SUBTITLE_STYLE = {
  fontSize: 46,
  fontWeight: 400,
  /** 字幕块底边距离画面底部 */
  bottom: 112,
  lineHeight: 1.7,
  letterSpacing: '0.06em',
} as const;

export const CITATION_STYLE = {
  fontSize: 18,
  opacity: 0.7,
  right: 56,
  bottom: 40,
} as const;

export const CLOCK_STYLE = {
  left: 72,
  top: 52,
  fontSize: 40,
  fontWeight: 100,
} as const;

export const GRAIN = {
  /** 颗粒对金色元素质感的影响（overlay，不改变黑底平均亮度） */
  overlayOpacity: 0.16,
  /** 黑底上可见的细微亮颗粒（screen，会让黑底平均亮度略升约 1 级） */
  screenOpacity: 0.04,
} as const;

/** 暗角：边缘最暗处叠加的黑色透明度 */
export const VIGNETTE = 0.42;
