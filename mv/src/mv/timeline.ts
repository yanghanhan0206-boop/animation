// The music video's clock. Everything is placed on the song's bar grid, measured from
// the audio: 85 BPM, first downbeat at 1.87 s, so bar k starts at 1.87 + k × 2.8244 s.
//   bars 0–7    soft hook (no drums)
//   bars 8–15   hook with drums
//   bars 16–31  verse (one line, or a pair of short lines, per bar)
// No imports: scripts read this file too.

export const FPS = 24;
export const DURATION_S = 92.54;
export const DURATION = Math.round(DURATION_S * FPS);
export const BAR0 = 1.87;
export const BAR = 2.8244;
export const BEAT = BAR / 4;
export const bar = (k: number) => BAR0 + k * BAR;

export type Grade = 'gold' | 'night' | 'dawn' | 'autumn' | 'lantern' | 'neutral' | 'jewel' | 'neon' | 'paper';

export interface Cue {
  /** Seconds. */
  start: number;
  end: number;
  /** Small English line above (italic). */
  en?: string;
  /** One or two Chinese lines. */
  zh?: string[];
  /** Seconds after `start` when the second Chinese line comes in. */
  zh2At?: number;
  /** Drawn by the shot itself (big title type, vertical text…), not by the lyric track. */
  owned?: boolean;
  /** The last two characters of the last line blow away as dust before the cue ends. */
  dust?: boolean;
}

// Lyrics as sung. English lines carry their Chinese counterparts beneath them.
export const CUES: Cue[] = [
  // Soft hook.
  {start: 1.45, end: 4.7, en: "It's a love song, tough song", zh: ['这是流着泪的情歌'], owned: true},
  {start: 4.75, end: 7.45, zh: ['握紧我的话筒']},
  {start: 7.55, end: 13.05, zh: ['能否放得下', '站在未来的分叉口'], zh2At: 2.45},
  {start: 13.15, end: 15.85, en: 'Awful, awful', zh: ['痛扼咽喉']},
  {start: 15.95, end: 18.7, zh: ['夜宵用眼泪下酒']},
  {start: 18.8, end: 21.5, en: 'How can I survive?', zh: ['我该怎么办']},
  {start: 21.55, end: 24.3, en: 'probably turning to the Bible', zh: ['或许只能诉诸神明']},
  // Hook with drums.
  {start: 24.47, end: 27.2, en: 'love song, tough song', owned: true},
  {start: 27.29, end: 30.0, zh: ['握紧我的话筒']},
  {start: 30.11, end: 35.65, zh: ['能否放得下', '站在未来的分叉口'], zh2At: 1.8},
  {start: 35.76, end: 38.5, zh: ['大步跨过也跨不过的'], en: 'problem', owned: true},
  {start: 38.59, end: 41.3, en: 'How can I survive?', zh: ['我该怎么办']},
  {start: 41.41, end: 46.7, en: 'probably turning to the Bible', zh: ['祈祷着等待答案']},
  // Verse.
  {start: 47.0, end: 49.8, zh: ['你说过这可能是', '你能想到的最好的结局'], zh2At: 0.9},
  {start: 49.88, end: 52.6, zh: ['到纽约的班机', '难道是最后一场别离'], zh2At: 0.9},
  {start: 52.71, end: 55.45, zh: ['微信里多少段小作文', '证明我们也许还有也许'], zh2At: 1.2},
  {start: 55.53, end: 58.25, zh: ['可结论是', '这事儿暂时别提'], zh2At: 0.7},
  {start: 58.36, end: 61.1, zh: ['天空突然间晴转阴']},
  {start: 61.18, end: 63.9, zh: ['快四年半了', '算不算是度过了敏感期'], zh2At: 0.8},
  {start: 64.01, end: 66.75, zh: ['教给我的成长', '我全部发自内心感激'], zh2At: 0.9},
  {start: 66.83, end: 69.55, zh: ['但好像这个故事里面', '我们都是林宛瑜'], zh2At: 1.1},
  {start: 69.66, end: 72.4, en: 'mic check one', zh: ['让我 mic check one 算了', '突然嗓子有点痛'], zh2At: 1.32},
  {start: 72.48, end: 75.2, zh: ['翻聊天记录看', '直到早上九点钟'], zh2At: 1.4},
  {start: 75.3, end: 78.05, zh: ['秋风再起', '太大了听不见我在说声爱你'], zh2At: 1.35, dust: true},
  {start: 78.13, end: 80.85, zh: ['最终还是决定', '把你写进 New Boombap 里'], zh2At: 0.9},
  {start: 80.95, end: 83.7, zh: ['祝的愿丢进忘川', '被遗弃'], owned: true},
  {start: 83.78, end: 86.5, zh: ['互相欠的太多', '我不想账单会逾期'], zh2At: 0.9},
  {start: 86.6, end: 89.35, zh: ['不争辩是谁错了', '过去的都让他过吧'], zh2At: 1.36},
  {start: 89.43, end: 92.4, zh: ['我知道你是诺诺', '不是上杉绘梨衣'], zh2At: 1.2},
];

export type SceneId =
  | 'love-song'
  | 'mic'
  | 'fork'
  | 'supper'
  | 'sanctuary'
  | 'problem'
  | 'candle'
  | 'the-end'
  | 'departure'
  | 'chat'
  | 'sky'
  | 'days'
  | 'memory'
  | 'title'
  | 'dawn-chat'
  | 'autumn'
  | 'vinyl'
  | 'lethe'
  | 'receipt'
  | 'farewell'
  | 'ending';

export interface Shot {
  scene: SceneId;
  start: number;
  end: number;
  grade: Grade;
  /** Scene-specific variant. */
  v?: string;
}

const s = (scene: SceneId, a: number, b: number, grade: Grade, v?: string): Shot => ({scene, start: a, end: b, grade, v});

export const SHOTS: Shot[] = [
  s('love-song', 0, bar(2), 'gold', 'intro'),
  s('fork', bar(2), bar(4), 'night', 'slow'),
  s('supper', bar(4), bar(6), 'neon'),
  s('sanctuary', bar(6), bar(8), 'jewel', 'wide'),
  s('love-song', bar(8), bar(9), 'gold', 'drop'),
  s('mic', bar(9), bar(10), 'gold'),
  s('fork', bar(10), bar(12), 'night', 'fly'),
  s('problem', bar(12), bar(13), 'gold'),
  s('sanctuary', bar(13), bar(14), 'jewel', 'close'),
  s('candle', bar(14), bar(16), 'gold'),
  s('the-end', bar(16), bar(17), 'neutral'),
  s('departure', bar(17), bar(18), 'night', 'flip'),
  s('chat', bar(18), bar(19), 'night', 'night'),
  s('chat', bar(19), bar(20), 'night', 'reply'),
  s('sky', bar(20), bar(21), 'dawn'),
  s('days', bar(21), bar(22), 'night'),
  s('memory', bar(22), bar(23), 'gold'),
  s('title', bar(23), bar(24), 'gold'),
  s('mic', bar(24), bar(25), 'gold', 'check'),
  s('dawn-chat', bar(25), bar(26), 'dawn'),
  s('autumn', bar(26), bar(27), 'autumn'),
  s('vinyl', bar(27), bar(28), 'gold'),
  s('lethe', bar(28), bar(29), 'lantern'),
  s('receipt', bar(29), bar(30), 'paper'),
  s('farewell', bar(30), bar(31), 'night'),
  s('ending', bar(31), DURATION_S, 'gold'),
];

export const shotAt = (t: number) => SHOTS.find((x) => t >= x.start && t < x.end) ?? SHOTS[SHOTS.length - 1];
