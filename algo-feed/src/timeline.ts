// The narration is the master clock: every subtitle line, its timing, and the shot
// boundaries derived from it live here. This file has no imports so plain Node can
// load it too (SRT export, key-frame and QA scripts).

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Speaking rate every line is timed at (characters per second). */
export const CHARS_PER_SECOND = 4.5;

/**
 * hook     – drawn large by the hook shot itself
 * sub      – regular subtitle in the subtitle band
 * title    – spoken step title, drawn by the title card
 * question – the closing question, drawn by the last shot
 */
export type CueMode = 'hook' | 'sub' | 'title' | 'question';

interface LineDef {
  /** 「」 marks the emphasised words, '/' forces a line break, a space is a breath. */
  text: string;
  /** Frames of silence after the line has been spoken. */
  pause: number;
  mode?: CueMode;
}

const LINES: LineDef[] = [
  {text: '你刷到这条视频', pause: 5, mode: 'hook'},
  {text: '「不是巧合」', pause: 11, mode: 'hook'},
  {text: '是「算法」挑给你的', pause: 6},
  {text: '怎么挑的？就「四步」', pause: 10},

  {text: '第一步 记小本本', pause: 8, mode: 'title'},
  {text: '你在猫视频上 多停了「3秒」', pause: 6},
  {text: '「看完」了 还点了个「赞」', pause: 6},
  {text: '下一条 你「秒划走」', pause: 6},
  {text: '这些 它「全记着」呢', pause: 12},

  {text: '第二步 先捞一网', pause: 8, mode: 'title'},
  {text: '平台上有「上亿条」视频', pause: 6},
  {text: '一条条挑 「太慢了」', pause: 6},
  {text: '所以先捞出「几千条」', pause: 6},
  {text: '你可能「爱看」的', pause: 12},

  {text: '第三步 挨个打分', pause: 8, mode: 'title'},
  {text: '就猜「一件事」', pause: 4},
  {text: '你会不会「看完」', pause: 6},
  {text: '越可能看完 「分越高」', pause: 6},
  {text: '按分数「排好队」', pause: 6},
  {text: '「第一名」 送到你面前', pause: 16},

  {text: '第四步 越刷越懂你', pause: 8, mode: 'title'},
  {text: '你刷得「越多」', pause: 5},
  {text: '它就「越懂你」', pause: 6},
  {text: '推得越来越「对胃口」', pause: 6},
  {text: '别的「越来越少」', pause: 6},
  {text: '最后 满屏「都是猫」', pause: 24},

  {text: '你刷视频', pause: 3},
  {text: '它在「刷你」', pause: 13},
  {text: '你多久没刷到/「陌生」的内容了？', pause: 0, mode: 'question'},
];

export interface Cue {
  id: number;
  /** Text with markup (「」 emphasis, '/' line break). */
  text: string;
  /** Text as it is read out: markup removed, line break kept as '\n'. */
  plain: string;
  /** Spoken characters (punctuation, spaces and markup do not count). */
  chars: number;
  start: number;
  /** Frame where the speech itself ends; the pause runs from here to `end`. */
  speechEnd: number;
  end: number;
  mode: CueMode;
}

const NOT_SPOKEN = /[\s/「」，。？！、：；…—“”‘’（）,.?!:;()]/g;
export const countChars = (text: string): number => text.replace(NOT_SPOKEN, '').length;
export const plainText = (text: string): string => text.replace(/[「」]/g, '').replace(/\//g, '\n');

export const CUES: Cue[] = (() => {
  let t = 0;
  return LINES.map((line, i) => {
    const chars = countChars(line.text);
    const speech = Math.round((chars / CHARS_PER_SECOND) * FPS);
    const c: Cue = {
      id: i + 1,
      text: line.text,
      plain: plainText(line.text),
      chars,
      start: t,
      speechEnd: t + speech,
      end: t + speech + line.pause,
      mode: line.mode ?? 'sub',
    };
    t = c.end;
    return c;
  });
})();

export const cue = (id: number): Cue => {
  const c = CUES[id - 1];
  if (!c) throw new Error(`No cue #${id}`);
  return c;
};

export const DURATION = CUES[CUES.length - 1].end;

export interface Step {
  n: number;
  num: string;
  title: string;
  jargon: string;
  titleCue: number;
  lastCue: number;
  from: number;
  to: number;
}

const step = (n: number, title: string, jargon: string, titleCue: number, lastCue: number): Step => ({
  n,
  num: `0${n}`,
  title,
  jargon,
  titleCue,
  lastCue,
  from: cue(titleCue).start,
  to: cue(lastCue).end,
});

export const STEPS: Step[] = [
  step(1, '记小本本', '收集信号', 5, 9),
  step(2, '先捞一网', '召回', 10, 14),
  step(3, '挨个打分', '排序', 15, 20),
  step(4, '越刷越懂你', '反馈循环', 21, 26),
];

export interface Shot {
  id: string;
  name: string;
  from: number;
  to: number;
  /** Representative frame exported as the shot's key frame. */
  key: number;
}

const shot = (id: string, name: string, firstCue: number, lastCue: number, keyFromEnd: number): Shot => ({
  id,
  name,
  from: cue(firstCue).start,
  to: cue(lastCue).end,
  key: cue(lastCue).end - keyFromEnd,
});

/** Shot list. `key` is counted back from the shot's last frame to land where it is fully built. */
export const SHOTS: Shot[] = [
  shot('S01', '钩子', 1, 2, 14),
  shot('S02', '引子', 3, 4, 14),
  shot('S03', '第一步标题卡', 5, 5, 16),
  shot('S04', '收集信号', 6, 9, 22),
  shot('S05', '第二步标题卡', 10, 10, 16),
  shot('S06', '召回', 11, 14, 18),
  shot('S07', '第三步标题卡', 15, 15, 16),
  shot('S08', '排序', 16, 20, 74),
  shot('S09', '第四步标题卡', 21, 21, 16),
  shot('S10', '反馈循环', 22, 26, 20),
  shot('S11', '反转', 27, 28, 12),
  shot('S12', '互动提问', 29, 29, 6),
];

/** Every character that appears on screen, for font loading and glyph-coverage checks. */
export const ALL_TEXT: string = [
  ...CUES.map((c) => c.plain),
  ...STEPS.map((s) => s.title + s.jargon),
  '行话',
  '0123456789.,%+~?/s',
].join('');
