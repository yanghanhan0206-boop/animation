/**
 * 《踩不住的刹车》全部内容数据。
 *
 * 改这里就能改片子：字幕、数字、数据来源、分场时间、音频文件名都在这个文件里。
 *
 * 约定
 * 1. 需要滚动计数的数字一律写成字符串（如 '169.64'），小数位按字符串原样保留，
 *    动画结束时画面上显示的就是这串字符，一位都不会改。
 * 2. 时间单位是秒；字幕时间是相对本场开始的秒数 [出现, 消失]。
 *    每条字幕淡入 SUBTITLE_FADE_IN 帧、淡出 SUBTITLE_FADE_OUT 帧，中间完全可见的部分
 *    必须不少于 2 秒，Studio 打开时会自动检查（见 validate.ts）。
 * 3. 文字里不要出现破折号。
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const FILM_TITLE = '踩不住的刹车';

/** 字幕淡入、淡出的帧数 */
export const SUBTITLE_FADE_IN = 8;
export const SUBTITLE_FADE_OUT = 6;

/** 每场左上角是否显示分场标题（Noto Serif SC 粗体） */
export const SHOW_CHAPTER_TITLES = true;

/** 贯穿全片的控制线 */
export const CAP = {
  value: '200',
  unit: '亿',
};

export type Subtitle = {text: string; from: number; to: number};

export type SceneId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8';

export type SceneMeta = {
  id: SceneId;
  index: number;
  title: string;
  /** 在全片中的开始、结束时间（秒） */
  start: number;
  end: number;
  /** 右下角数据来源，空字符串表示本场不显示 */
  source: string;
  subtitles: Subtitle[];
  /** 本场画面淡入、淡出帧数（与相邻场衔接用） */
  fadeIn: number;
  fadeOut: number;
};

export const SCENES: SceneMeta[] = [
  {
    id: 's1',
    index: 1,
    title: '一条线',
    start: 0,
    end: 12,
    source: '于东来，2025中国超市周',
    fadeIn: 0,
    fadeOut: 14,
    subtitles: [
      {text: '2025年3月28日', from: 2.6, to: 5.6},
      {text: '一位老板，给自己的公司画了一条线', from: 5.8, to: 8.8},
      {text: '“尽量控制在200亿以内”', from: 9.0, to: 11.7},
    ],
  },
  {
    id: 's2',
    index: 2,
    title: '为什么要限速',
    start: 12,
    end: 24,
    source: '',
    fadeIn: 12,
    fadeOut: 14,
    subtitles: [
      {text: '他的理由很简单', from: 0.8, to: 4.6},
      {text: '卖得太快，员工就要加班', from: 5.0, to: 11.2},
    ],
  },
  {
    id: 's3',
    index: 3,
    title: '一路狂奔',
    start: 24,
    end: 45,
    source: '于东来公开数据',
    fadeIn: 12,
    fadeOut: 0,
    subtitles: [
      {text: '可这家公司，已经跑了三年', from: 0.6, to: 4.2},
      {text: '2022年 约70亿', from: 4.4, to: 7.8},
      {text: '2023年 107亿', from: 8.0, to: 11.4},
      {text: '2024年 169.64亿', from: 11.6, to: 15.0},
      {text: '离那条线，只剩30亿', from: 15.3, to: 20.6},
    ],
  },
  {
    id: 's4',
    index: 4,
    title: '冲线',
    start: 45,
    end: 72,
    source: '胖东来官网；2025年度销售数据',
    fadeIn: 0,
    fadeOut: 18,
    subtitles: [
      {text: '2025年，第四根柱子开始生长', from: 0.8, to: 4.8},
      {text: '11月8日，200.35亿', from: 8.2, to: 11.4},
      {text: '线，被冲破了', from: 11.6, to: 14.6},
      {text: '全年 235.31亿，同比 +38.71%', from: 14.8, to: 18.6},
      {text: '比上限，多出35亿', from: 18.8, to: 22.3},
      {text: '刹车，为什么踩不住？', from: 22.5, to: 26.4},
    ],
  },
  {
    id: 's5',
    index: 5,
    title: '拆开这235亿',
    start: 72,
    end: 102,
    source: '于东来公布的2025年度数据；各业态数据为新浪财经整理',
    fadeIn: 12,
    fadeOut: 18,
    subtitles: [
      {text: '它以超市出名', from: 0.7, to: 4.0},
      {text: '超市 126.43亿，占 53.7%', from: 4.2, to: 7.9},
      {text: '另一半，来自超市以外', from: 8.1, to: 11.4},
      {text: '珠宝 24.51亿｜百货 23.79亿｜电器 21.55亿', from: 11.6, to: 15.6},
      {text: '服饰 18.59亿｜茶叶 10.63亿｜医药 5.33亿', from: 15.8, to: 19.8},
      {text: '门店只有十余家，只在许昌、新乡两座城市', from: 20.0, to: 24.4},
      {text: '其中一家店，一年卖了约60亿', from: 24.6, to: 29.3},
    ],
  },
  {
    id: 's6',
    index: 6,
    title: '钱去了哪里',
    start: 102,
    end: 128,
    source: '胖东来官方账号；胖东来官网人员流失数据；于东来资产分配明细',
    fadeIn: 12,
    fadeOut: 18,
    subtitles: [
      {text: '赚来的钱，去了哪里？', from: 0.5, to: 4.2},
      {text: '2025年净利润，于东来预估约15亿', from: 4.5, to: 8.3},
      {text: '员工平均到手工资，每月 8974元', from: 8.5, to: 12.3},
      {text: '全年人员流失率，1.05%', from: 12.5, to: 16.2},
      {text: '2026年3月，37.93亿资产转为股本', from: 16.4, to: 20.3},
      {text: '分给了 10194 名员工', from: 20.5, to: 25.2},
    ],
  },
  {
    id: 's7',
    index: 7,
    title: '还在加速',
    start: 128,
    end: 144,
    source: '许昌市政府，商务部新闻发布会；中国连锁经营协会《2026年中国超市Top100》',
    fadeIn: 12,
    fadeOut: 18,
    subtitles: [
      {text: '2026年，它没有慢下来', from: 0.4, to: 3.9},
      {text: '上半年 约145亿，同比 +24%', from: 4.1, to: 7.6},
      {text: '来这里研学的人，超过100万人次', from: 7.8, to: 11.6},
      {text: '中国超市百强，第9名', from: 11.9, to: 15.5},
    ],
  },
  {
    id: 's8',
    index: 8,
    title: '郑州，还没有答案',
    start: 144,
    end: 156,
    source: '',
    fadeIn: 12,
    fadeOut: 0,
    subtitles: [
      {text: '下一站，郑州', from: 0.0, to: 2.47},
      {text: '什么时候开？还没有定数', from: 2.47, to: 4.94},
      {text: '第一次走出许昌和新乡', from: 4.94, to: 7.41},
      {text: '这一次，刹车还踩得住吗？', from: 7.41, to: 9.88},
    ],
  },
];

/** 第三、四场：年度销售额柱子（单位：亿元） */
export const ANNUAL_SALES = [
  {year: '2022', value: '70', prefix: '约'},
  {year: '2023', value: '107', prefix: ''},
  {year: '2024', value: '169.64', prefix: ''},
  {year: '2025', value: '235.31', prefix: ''},
];

/** 第三场：离线的距离 */
export const GAP_TO_CAP_2024 = '30';

/** 第四场：冲线 */
export const BREAKTHROUGH = {
  year: 2025,
  month: 11,
  day: 8,
  dateLabel: '11月8日',
  value: '200.35',
  yearTotal: '235.31',
  yoy: '38.71',
  overCap: '35',
};

/** 第五场：业态拆分（单位：亿元）。「其他」由总额减去以上各项自动算出，灰色、不标数字 */
export const BREAKDOWN = {
  total: '235.31',
  supermarketShare: '53.7',
  segments: [
    {name: '超市', value: '126.43'},
    {name: '珠宝', value: '24.51'},
    {name: '百货', value: '23.79'},
    {name: '电器', value: '21.55'},
    {name: '服饰', value: '18.59'},
    {name: '茶叶', value: '10.63'},
    {name: '医药', value: '5.33'},
  ],
  otherName: '其他',
  otherNote: '餐饮、电玩、电影等',
  store: {name: '时代广场店', sales: '60', prefix: '约', unit: '亿'},
};

/** 第六场：数据卡（依次弹出） */
export const MONEY_CARDS = [
  {label: '2025年净利润（于东来预估）', prefix: '约', value: '15', unit: '亿'},
  {label: '员工平均到手工资（每月）', prefix: '', value: '8974', unit: '元'},
  {label: '全年人员流失率', prefix: '', value: '1.05', unit: '%'},
  {label: '2026年3月 资产转为股本', prefix: '', value: '37.93', unit: '亿'},
  {label: '分给员工', prefix: '', value: '10194', unit: '名'},
];

/** 第七场：还在加速 */
export const ACCELERATING = {
  barLabel: '2026年上半年',
  value: '145',
  prefix: '约',
  yoy: '24',
  studyTours: {label: '研学', prefix: '超过', value: '100', unit: '万人次'},
  ranking: {title: '中国超市百强', name: '胖东来', rank: 9, rows: 40},
};

/** 第八场：郑州 */
export const NEXT_STOP = {
  from: '许昌',
  other: '新乡',
  to: '郑州',
};

/**
 * 音频。文件放进 public/audio 即可，没有文件时自动跳过，不影响渲染。
 * 每个音效的触发时间见 src/audio/cues.ts，Studio 时间线上也能看到同名的轨道。
 */
export const AUDIO = {
  bgm: {file: 'audio/bgm.mp3', volume: 0.5},
  sfx: {
    hum: {file: 'audio/sfx_hum.mp3', label: '金线划出 嗡', volume: 0.8},
    tick: {file: 'audio/sfx_tick.mp3', label: '时钟滴答', volume: 0.6},
    hit: {file: 'audio/sfx_hit.mp3', label: '重拍', volume: 0.9},
    glass: {file: 'audio/sfx_glass.mp3', label: '玻璃碎裂', volume: 1},
    ding: {file: 'audio/sfx_ding.mp3', label: '金属音', volume: 0.7},
    chime: {file: 'audio/sfx_chime.mp3', label: '细碎铃声', volume: 0.35},
    heartbeat: {file: 'audio/sfx_heartbeat.mp3', label: '心跳', volume: 0.7},
  },
};

export const TOTAL_SECONDS = SCENES[SCENES.length - 1].end;
export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);
