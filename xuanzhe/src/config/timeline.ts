/**
 * 《你哭的不是选择，是悬着》—— 时间线配置（全片唯一需要改时间的地方）
 *
 * - 所有时间单位都是「秒」，以完整版 Full 的时间轴为准（镜头1 从 0 秒开始）。
 * - 上集 Part1 / 下集 Part2 直接复用这里的镜头，不另写一套时间。
 * - 字幕用「｜」分成两段，前一段完整停留并淡出后再出后一段。
 * - 字幕的具体出入点由 src/lib/subtitles.ts 按下面的「字幕节奏」自动排，
 *   一般只需要改镜头起止和文字；个别镜头需要微调时再写 subtitleWindow / segmentStarts。
 * - 改完可以运行 `npm run check` 检查每段字幕是否够时间读完，
 *   或在 Remotion Studio 里打开「工具 / 时间表」看图。
 *
 * 本文件不 import 任何东西，方便脚本直接读取。
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/* ------------------------------------------------------------------ */
/* 字幕节奏                                                            */
/* ------------------------------------------------------------------ */

export const SUBTITLE_TIMING = {
  /** 逐字淡入：相邻两个字的出现间隔（帧） */
  charStagger: 2,
  /** 逐字淡入：单个字从透明到完全显示用的帧数 */
  charFade: 8,
  /** 一段字幕全部出现后，至少停留多少秒（硬性要求） */
  minHold: 2.5,
  /** 阅读速度参考（字/秒）：一段字幕从第一个字出现到开始淡出，至少给到「字数 ÷ 此值」秒 */
  readingSpeed: 5,
  /** 一段字幕淡出用时（秒） */
  fadeOut: 0.4,
  /** 前一段淡出完成后，隔多久出下一段（秒） */
  gap: 0.15,
  /** 默认：镜头开始后多久出第一段字幕（秒） */
  lead: 0.6,
  /** 默认：镜头结束前多久字幕必须完全消失（秒） */
  tail: 0.4,
  /** 一行最多字数，超过时在标点处自动折成两行（也可以在文字里手写 \n 指定换行） */
  maxCharsPerLine: 24,
  /** 折行后单行最长允许的字数 */
  maxCharsPerWrappedLine: 28,
} as const;

/** 角标：字幕出现后多久开始淡入、淡入淡出用时、镜头结束前多久完全消失（秒） */
export const CITATION_TIMING = {
  delayAfterSubtitle: 0.5,
  fadeIn: 0.6,
  fadeOut: 0.6,
  endBeforeShotEnd: 0.15,
} as const;

/* ------------------------------------------------------------------ */
/* 镜头表                                                              */
/* ------------------------------------------------------------------ */

export interface ShotConfig {
  /** 镜头编号 1-17 */
  id: number;
  /** 内部名字，只用于 Studio 时间轴上辨认 */
  name: string;
  /** 起止时间（秒） */
  start: number;
  end: number;
  /** 字幕，用「｜」分两段 */
  subtitle: string;
  /** 右下角理论出处 */
  citation?: string;
  /**
   * 可选：字幕可用的时间窗口 [开始, 完全消失]，相对本镜头起点的秒数。
   * 默认 [lead, 时长 - tail]。可以是负数或超过镜头时长，用来向相邻镜头借时间。
   */
  subtitleWindow?: [number, number];
  /** 可选：手动指定每段字幕的开始时间（相对本镜头起点的秒数），用来和画面卡点 */
  segmentStarts?: number[];
  /** 可选：镜头组件提前多少秒开始渲染（入场叠化），默认 0 */
  head?: number;
  /** 可选：镜头组件在结束后继续渲染多少秒（退场叠化），默认 0 */
  tail?: number;
}

const DE_BERKER = 'de Berker et al., Nature Communications, 2016';

export const SHOTS: ShotConfig[] = [
  {
    id: 1,
    name: '凌晨三点',
    start: 0,
    end: 7,
    subtitle: '凌晨三点，你又醒着',
    subtitleWindow: [1.4, 6.6],
  },
  {
    id: 2,
    name: '四条路',
    start: 7,
    end: 16,
    subtitle: '考研，保研，工作，出国｜每一条路，都还没有答案',
  },
  {
    id: 3,
    name: '掉眼泪',
    start: 16,
    end: 23,
    subtitle: '谁能在大三面对人生选择的时候，不掉眼泪',
  },
  {
    id: 4,
    name: '轨道碎裂',
    start: 23,
    end: 36,
    subtitle: '过去二十年，每道题都有标准答案｜大三，是你人生第一道开放题',
    // 第二段卡在轨道碎裂的瞬间
    segmentStarts: [0.6, 8.5],
    subtitleWindow: [0.6, 12.7],
    tail: 1.2,
  },
  {
    id: 5,
    name: '翻石头',
    start: 36,
    end: 50,
    subtitle: '2016年，伦敦大学学院让45个人玩一个游戏｜翻石头，下面可能有蛇，翻到就会被电',
    citation: DE_BERKER,
    tail: 1.2,
  },
  {
    id: 6,
    name: '倒U曲线',
    start: 50,
    end: 64,
    subtitle: '他们测了瞳孔和汗液｜压力最大的不是一定会被电，是有一半可能会被电',
    citation: DE_BERKER,
  },
  {
    id: 7,
    name: '不确定性',
    start: 64,
    end: 70,
    subtitle: '人能扛住坏消息，却扛不住不知道',
  },
  {
    id: 8,
    name: '预测机器',
    start: 70,
    end: 82,
    subtitle: '神经科学认为，大脑是一台预测机器｜无法预测，它就只能一直拉响警报',
    citation: 'Predictive Processing, Friston, 2010',
  },
  {
    id: 9,
    name: '担忧漩涡',
    start: 82,
    end: 98,
    subtitle:
      '于是你开始反复地想｜心理学发现，担忧是大脑想用思考消灭不确定。可这道题没有答案，你越想，它越悬',
    citation: 'Intolerance of Uncertainty Model, Dugas et al., 1998',
  },
  {
    id: 10,
    name: '焦虑在帮你',
    start: 98,
    end: 112,
    subtitle:
      '但同一个实验还发现｜压力越能跟着不确定性起伏的人，越能猜准哪块石头下有蛇。你的焦虑，在帮你判断风险',
    citation: DE_BERKER,
    // 提前 0.6 秒收字幕，给上集结尾的「下集」字幕留出位置
    subtitleWindow: [0.6, 13.4],
  },
  {
    id: 11,
    name: '冻住',
    start: 112,
    end: 126,
    subtitle: '心理学家发现，人在压力下会急着抓住一个答案｜然后冻住，不再思考别的可能',
    citation: 'Need for Cognitive Closure, Kruglanski & Webster, 1996',
  },
  {
    id: 12,
    name: '早闭与延缓',
    start: 126,
    end: 142,
    subtitle:
      '心理学家马西亚把它叫作早闭：没探索就做了承诺，常常落在别人替你选的路上｜而那个还在悬着、还在探索的阶段，叫延缓',
    citation: 'Identity Status Theory, Marcia, 1966',
  },
  {
    id: 13,
    name: '必经之路',
    start: 142,
    end: 152,
    subtitle: '延缓期最焦虑，却是真正长出自我的必经之路',
  },
  {
    id: 14,
    name: '星空',
    start: 152,
    end: 164,
    subtitle: '此刻，凌晨三点醒着的，不止你一个',
  },
  {
    id: 15,
    name: '自由的眩晕',
    start: 164,
    end: 176,
    subtitle: '1844年，克尔凯郭尔写道：焦虑，是自由的眩晕｜你悬着，是因为你面前还有路',
    citation: 'Kierkegaard,《焦虑的概念》, 1844',
  },
  {
    id: 16,
    name: '一块一块地翻',
    start: 176,
    end: 186,
    subtitle: '不必一次落地整个人生｜把一个巨大的悬，拆成很多块小石头，一块一块地翻',
    // 稍早收字幕，把时间让给镜头17
    subtitleWindow: [0.5, 9.6],
  },
  {
    id: 17,
    name: '所有可能性的中间',
    start: 186,
    end: 196,
    subtitle: '你哭，不是因为你走错了｜是因为你还站在所有可能性的中间',
    // 最后 2 秒只剩光点，所以字幕要在 194 秒前完全消失；第一段提前 0.3 秒出
    subtitleWindow: [-0.3, 8.0],
  },
];

/** 按编号取镜头 */
export const shotById = (id: number): ShotConfig => {
  const shot = SHOTS.find((s) => s.id === id);
  if (!shot) {
    throw new Error(`没有镜头 ${id}`);
  }
  return shot;
};

/** 某镜头开始后 offset 秒，对应完整版的绝对时间 */
export const at = (id: number, offset = 0) => shotById(id).start + offset;
/** 某镜头结束前 offset 秒（offset 写负数），对应完整版的绝对时间 */
export const atEnd = (id: number, offset = 0) => shotById(id).end + offset;

/* ------------------------------------------------------------------ */
/* 左上角时钟                                                          */
/* ------------------------------------------------------------------ */

export const CLOCK = {
  text: '03:07',
  /** 冒号一次明暗的周期（秒） */
  blinkPeriod: 2.4,
  /** 出现的时间段（完整版绝对秒），from/to 是完全显示的起止，淡入淡出在区间内完成 */
  windows: [
    // 镜头1：出现，镜头1 结束时淡出
    {from: at(1, 0.3), to: atEnd(1, 0), fadeIn: 1.4, fadeOut: 1.0},
    // 镜头9：重新出现
    {from: at(9, 0.2), to: atEnd(9, -0.3), fadeIn: 1.0, fadeOut: 1.0},
    // 镜头14 出现，一直到镜头17 缓缓淡出（最后 2 秒画面只剩光点）
    {from: at(14, 0.3), to: at(17, 6.5), fadeIn: 1.4, fadeOut: 3.0},
  ],
};

/* ------------------------------------------------------------------ */
/* 上下集                                                              */
/* ------------------------------------------------------------------ */

export interface CardConfig {
  /** 时长（秒） */
  duration: number;
  /** 字幕，同样可用「｜」分两段 */
  subtitle: string;
  /** 字幕窗口，相对本段起点（秒）；可以为负数或超过时长，向相邻镜头借时间 */
  subtitleWindow: [number, number];
  /** 最后一段字幕不淡出，一直留到画面结束 */
  holdToEnd?: boolean;
}

export interface PartConfig {
  /** 包含的镜头范围（含首尾） */
  shots: [number, number];
  /** 片头引子 */
  intro?: CardConfig & {
    /** 引子的背景画面：重放这个镜头的最后几秒 */
    backdropShot: number;
  };
  /** 片尾 */
  outro?: CardConfig;
  /** 只在这一集里覆盖某些镜头的字幕窗口 */
  subtitleWindowOverrides?: Record<number, [number, number]>;
}

export const FULL: PartConfig = {
  shots: [1, 17],
};

export const PART1: PartConfig = {
  shots: [1, 10],
  outro: {
    duration: 3,
    subtitle: '下集：很多人，选择了逃',
    // 提前 0.5 秒开始逐字出现（镜头10 的字幕此时已淡出），保证停留满 2.5 秒
    subtitleWindow: [-0.5, 3],
    holdToEnd: true,
  },
};

export const PART2: PartConfig = {
  shots: [11, 17],
  intro: {
    duration: 5,
    subtitle: '上集说到，你的焦虑在帮你判断风险｜但很多人，选择了逃',
    // 两段字幕各停留 2.5 秒以上需要约 8 秒，第二段会延续到镜头11 的前 3.6 秒（正好配小球慌乱下坠）
    subtitleWindow: [0.3, 8.6],
    backdropShot: 10,
  },
  // 下集里镜头11 自己的字幕顺延到引子字幕之后
  subtitleWindowOverrides: {11: [3.8, 13.6]},
};

/* ------------------------------------------------------------------ */
/* 画面里的文字（集中放这里，方便改，也用于预加载字体）                    */
/* ------------------------------------------------------------------ */

export const LABELS = {
  roads: ['考研', '保研', '工作', '出国'],
  /** 镜头9 漩涡依次掠过的顺序 */
  vortexOrder: ['考研', '工作', '出国', '保研'],
  trackTicks: ['中考', '高考', '期末', '绩点'],
  axisX: '被电的可能性',
  axisY: '压力',
  axisTicks: ['0%', '50%', '100%'],
  uncertainty: '不确定性',
  foreclosure: '早闭',
  moratorium: '延缓',
  parents: '爸妈的期待',
};
