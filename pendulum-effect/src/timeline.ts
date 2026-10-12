/**
 * 《摆锤效应》时间轴
 * ------------------------------------------------------------------
 * 所有时间单位都是「秒」，除特别注明外都是全片绝对时间。
 * 想调节奏，只改这个文件即可：镜头起止、字幕起点、各个事件的时刻、摆幅、镜头运动。
 *
 * 和摆锤有关的事件（“吼”浮现、震屏、手推摆球、牛顿摆碰撞……）不写死时刻，
 * 而是写「不早于某时刻」，由物理模拟找出摆球真正到达端点 / 经过某位置的那一帧，
 * 这样无论怎么改周期和摆幅，画面事件都和摆球严格同步。
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 100; // 总时长（秒）
export const DURATION_FRAMES = DURATION * FPS;

/* ------------------------------------------------------------------ */
/* 主摆锤（家长的摆锤）                                                  */
/* ------------------------------------------------------------------ */
export const PENDULUM = {
  length: 560, // 摆长（世界坐标 px，镜头缩放为 1 时即屏幕 px）
  bobRadius: 30, // 摆球半径（直径 60px）
  period: 3.0, // 小角度周期 T0（秒）；大摆幅时按真实单摆公式自动变长
  startAmplitude: 22, // 开场摆幅（度）
  /** 相位锚点：让摆球恰好在这个时刻到达左端（开场即在摆动，不从静止开始） */
  leftExtremeAt: 9.1,
  trailCount: 10, // 拖尾残影数量
};

/* ------------------------------------------------------------------ */
/* 字幕                                                                 */
/* ------------------------------------------------------------------ */
export const SUBTITLE_STYLE = {
  maxChars: 20, // 超过这个字数（不计标点）就拆段
  charStagger: 2, // 逐字淡入：相邻两字间隔（帧）
  charFade: 8, // 单字淡入时长（帧）
  minHold: 2.5, // 全部出现后至少停留（秒）
  fadeOut: 0.5, // 淡出时长（秒）
  gap: 0.25, // 前一段淡出完到后一段开始的间隔（秒）
  endPad: 0.35, // 默认在镜头结束前多久完成淡出（秒）
  fontSize: 46,
  centerY: 932, // 字幕中心线（屏幕 px）
};

/* ------------------------------------------------------------------ */
/* 镜头                                                                 */
/* ------------------------------------------------------------------ */

/** 镜头 1：吼 */
export const S1 = {
  name: '01 吼',
  start: 0,
  end: 10,
  subtitle: '晚上十点，作业还没写完，你终于吼了出来',
  subtitleAt: 0.5, // 相对镜头起点
  roarNotBefore: 2.2, // “吼”在这个时刻之后摆球第一次到左端时浮现
  shake: {px: 4, frames: 6},
};

/** 镜头 2：补偿 */
export const S2 = {
  name: '02 补偿',
  start: 10,
  end: 20,
  subtitle: '孩子哭着睡着后，你满心愧疚，第二天什么都依着他',
  subtitleAt: 0.5,
  /** 猛地荡向右端：摆球向右经过最低点时加力（以最低点为中心的一段平滑推力） */
  kick: {notBefore: 9.4, toAmplitude: 33, duration: 0.5},
  compensateNotBefore: 10.0, // “补偿”在此之后第一次到右端时浮现
  /** 拖尾变柔和、偏暖：[开始变暖, 完全变暖, 开始恢复, 完全恢复] */
  warm: [9.7, 11.2, 19.2, 21.0] as const,
};

/** 镜头 3：更凶 */
export const S3 = {
  name: '03 更凶',
  start: 20,
  end: 28,
  subtitle: '直到他又一次失控，你比上次吼得更凶',
  subtitleAt: 0.4,
  /** 荡回左端、摆幅更大：向左经过最低点时加力 */
  kick: {notBefore: 20.0, toAmplitude: 43, duration: 0.5},
  roarBrightness: 1.45, // “吼”比上次亮多少（1 = 原亮度）
  shake: {px: 7, frames: 8},
};

/** 镜头 4：摆锤效应 */
export const S4 = {
  name: '04 摆锤效应',
  start: 28,
  end: 38,
  subtitle: '越用力纠正，就越会荡向反面，这就是摆锤效应',
  subtitleAt: 0.5,
  titleAt: 29.5, // 标题开始浮现
  titleFadeIn: 1.1,
  sheenAt: 30.3, // 光泽开始从左向右扫
  sheenDuration: 1.5,
  titleOut: [38.0, 39.6] as const, // 标题溶解（延续到镜头 5 开头）
  titleFontSize: 120,
  titleY: 205, // 屏幕 px
};

/** 镜头 5：溶解变形 */
export const S5 = {
  name: '05 恐惧与愧疚',
  start: 38,
  end: 50,
  subtitle: '严的背后是恐惧，松的背后是愧疚。推动摆锤的，从来不是孩子',
  subtitleAt: 0.5,
  /** 粒子溶解：start 开始碎裂，duration 后在新位置聚合完毕 */
  morphs: [
    {side: 'left' as const, from: '吼', to: '恐惧', start: 39.4, duration: 2.8},
    {side: 'right' as const, from: '补偿', to: '愧疚', start: 41.0, duration: 2.8},
  ],
  particleCount: 900, // 每个词的粒子数
};

/** 镜头 6：四只手（重点） */
export const S6 = {
  name: '06 四只手',
  start: 50,
  end: 65,
  subtitle: '可你的恐惧，又是谁塞给你的？每一次你被推向严厉，背后都站着一整个焦虑的世界',
  subtitleAt: 0.6,
  /**
   * 每只手：
   *  at       —— 不早于这个时刻推（实际推的那一帧由摆球位置决定）
   *  contact  —— 摆球向左运动、经过“摆幅的多少倍”处时接触（1 = 右端点，0 = 最低点）
   *  approach —— 手指指向（度）：0 = 从右边伸进来指向左，正值 = 从右下方往左上指，负值 = 从右上方往左下指
   *  toAmplitude —— 推完后的摆幅（度），一级比一级大
   *  labelSide —— 词写在前臂的哪一侧（1 / -1）
   */
  hands: [
    {label: '家长群的排名', at: 50.9, contact: 0.3, approach: 25, toAmplitude: 50, labelSide: 1},
    {label: '别人家的孩子', at: 53.0, contact: 1.0, approach: -25, toAmplitude: 56, labelSide: -1},
    {label: '升学的独木桥', at: 55.6, contact: 0.6, approach: 5, toAmplitude: 62, labelSide: 1},
    {label: '刷到的育儿焦虑', at: 59.0, contact: 1.0, approach: -50, toAmplitude: 67, labelSide: 1},
  ],
  handEnter: 1.4, // 手伸入用时
  pushDuration: 0.38, // 推力持续
  rightWordOut: [50.4, 52.0] as const, // “愧疚”被手挤走
};

/** 镜头 7：社会的大摆锤（重点） */
export const S7 = {
  name: '07 社会的大摆锤',
  start: 65,
  end: 75,
  subtitle: '一会儿说要拼命鸡娃，一会儿说要快乐教育。连整个社会，都停不在中间',
  subtitleAt: 0.5,
  handsOut: [64.8, 66.6] as const,
  wordsOut: [64.6, 66.2] as const, // “恐惧/愧疚”淡出
  amplitude: {start: 65.3, end: 69.0, to: 40}, // 家长摆锤摆幅回落
  sync: {start: 65.8, end: 70.0}, // 逐渐与大摆锤同步
  big: {
    fadeIn: [65.4, 68.2] as const,
    opacity: 0.28, // 约 25%
    periodRatio: 3, // 周期约是小摆锤的 3 倍
    amplitude: 24,
    leftExtremeAt: 67.4, // 相位锚点：此刻到达“鸡娃”一端
    pivot: [800, -70] as const, // 屏幕坐标
    length: 880,
    bobRadius: 86,
    leftWord: '鸡娃',
    rightWord: '快乐教育',
  },
};

/** 镜头 8：牛顿摆 */
export const S8 = {
  name: '08 牛顿摆',
  start: 75,
  end: 88,
  subtitle: '你发誓不要成为父母那样，可你接过的力量，正要撞向下一颗',
  subtitleAt: 0.6,
  bigOut: [75.0, 77.2] as const,
  unsync: {start: 75.0, end: 77.5},
  settle: {start: 75.5, end: 80.0, to: 0}, // 摆幅收到静止，屏息等待冲击
  beamDraw: [77.6, 78.9] as const, // 横梁从家长摆锤的支点向左画出
  grandAppear: [78.2, 79.6] as const, // 祖辈从上方降下
  parentAppear: [78.8, 80.2] as const, // 你的父母从上方降下
  cradleStart: 80.2, // 之后进入牛顿摆碰撞模拟
  grandKick: {at: 80.6, toAmplitude: 26, duration: 0.35}, // 祖辈的球荡起
  childAppear: [82.9, 84.2] as const,
  childStartSway: 2.2, // 孩子开始轻轻晃动的摆幅（度）
  childRipplePush: 1.6, // 每次冲击传到孩子时增加的摆幅（度）
};

/** 镜头 9：停在你这里 */
export const S9 = {
  name: '09 停在你这里',
  start: 88,
  end: 100,
  subtitle: '你停不下这个世界的摆锤。但你可以站在它和孩子之间，让力量停在你这里',
  subtitleAt: 0.2,
  subtitleEndPad: 2.8, // 字幕在最后 3 秒前收完
  absorbNotBefore: 88.0, // 此后上方传来的第一次冲击被家长吸收
  handsLead: 1.1, // 手提前多久伸入
  handsStandoff: 250, // 手停在离摆球多远处（世界 px），只在画面边缘推一下
  handsAngles: [2, -40, 40, -68], // 四只手伸来的方向（同镜头 6 的 approach）
  handsStay: 0.7, // 推完停留多久后退出
  childSettle: 2.0, // 孩子轻轻动一下后多久安静
  breathPeriod: 3.0, // 呼吸光圈周期
  finalFade: [97.0, 99.3] as const, // 最后 3 秒其余元素淡出
};

export const SHOTS = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

/* ------------------------------------------------------------------ */
/* 牛顿摆                                                               */
/* ------------------------------------------------------------------ */
export const CRADLE = {
  gap: 0.5, // 相邻两球之间的缝隙（世界 px），几乎相贴
  ballRadius: 30,
  transmitDelay: 0.12, // 冲击穿过中间那颗球的“咔嗒”间隔（秒）
  airDamping: 0.03,
  absorbTransfer: 0.1, // 吸收时只有这么多速度留给家长自己的摆
  childPin: 640, // 孩子摆锤支点的 y（世界 px，主摆支点为 0）
  childLength: 92,
  childRadius: 13,
};

/* ------------------------------------------------------------------ */
/* 镜头运动（长镜头）                                                      */
/* ------------------------------------------------------------------ */
/**
 * 每个关键帧：在时刻 t，世界坐标 focus 这个点出现在屏幕 at 处，缩放为 zoom。
 * 世界原点 (0,0) 是主摆锤的支点。相邻关键帧之间用缓入缓出插值。
 */
export type CameraKey = {t: number; zoom: number; focus: [number, number]; at: [number, number]};
export const CAMERA: CameraKey[] = [
  {t: 0, zoom: 1.0, focus: [0, 0], at: [960, 92]},
  {t: 27.6, zoom: 1.035, focus: [0, 0], at: [960, 92]},
  {t: 30.8, zoom: 0.78, focus: [0, 0], at: [960, 360]},
  {t: 37.8, zoom: 0.8, focus: [0, 0], at: [960, 352]},
  {t: 41.0, zoom: 0.86, focus: [0, 0], at: [960, 232]},
  {t: 50.0, zoom: 0.87, focus: [0, 0], at: [950, 236]},
  {t: 64.6, zoom: 0.56, focus: [0, 0], at: [860, 300]},
  {t: 72.5, zoom: 0.27, focus: [0, 0], at: [1700, 590]},
  {t: 75.2, zoom: 0.265, focus: [0, 0], at: [1700, 592]},
  {t: 79.6, zoom: 0.9, focus: [-90, 0], at: [960, 132]},
  {t: 94.0, zoom: 0.91, focus: [-90, 0], at: [960, 132]},
  {t: 100, zoom: 1.12, focus: [0, 768], at: [960, 545]},
];
