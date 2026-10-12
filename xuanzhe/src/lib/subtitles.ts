/**
 * 字幕排程：把一条「｜」分段的字幕，在给定时间窗口里排出每段的出入点，
 * 并检查是否满足「全部出现后至少停留 2.5 秒」和阅读速度。
 * 纯函数，不依赖 React，Film 组件、时间表和 check 脚本共用。
 */
import {FPS, SUBTITLE_TIMING} from '../config/timeline';

export interface ScheduledSegment {
  text: string;
  /** 折行后的每一行 */
  lines: string[];
  /** 字数（不含换行和空格） */
  chars: number;
  /** 以下时间都是相对窗口所属段落起点的秒数 */
  start: number;
  /** 最后一个字完全显示的时刻 */
  typed: number;
  /** 开始淡出 */
  fadeOutStart: number;
  /** 完全消失（holdToEnd 时等于窗口终点） */
  end: number;
  /** 全部出现后的停留时长 */
  hold: number;
  /** 从第一个字出现到开始淡出，平均每秒要读几个字 */
  cps: number;
  /** 满足最短停留 */
  holdOk: boolean;
  /** 满足阅读速度参考 */
  readOk: boolean;
}

export const splitSegments = (subtitle: string) =>
  subtitle
    .split('｜')
    .map((s) => s.trim())
    .filter(Boolean);

export const countChars = (text: string) => Array.from(text.replace(/[\s\n]/g, '')).length;

/** 逐字淡入需要的秒数 */
export const typingDuration = (chars: number) =>
  ((Math.max(chars, 1) - 1) * SUBTITLE_TIMING.charStagger + SUBTITLE_TIMING.charFade) / FPS;

const STRONG_BREAK = /[。：；！？]/;
const WEAK_BREAK = /[，、]/;

/** 长句在标点处折成两行；文字里手写的 \n 优先 */
export const wrapLines = (text: string): string[] => {
  if (text.includes('\n')) {
    return text.split('\n');
  }
  const chars = Array.from(text);
  if (chars.length <= SUBTITLE_TIMING.maxCharsPerLine) {
    return [text];
  }
  let best: {i: number; score: number} | null = null;
  for (let i = 1; i < chars.length - 1; i++) {
    const ch = chars[i - 1];
    const strong = STRONG_BREAK.test(ch);
    const weak = WEAK_BREAK.test(ch);
    const a = i;
    const b = chars.length - i;
    if (a > SUBTITLE_TIMING.maxCharsPerWrappedLine || b > SUBTITLE_TIMING.maxCharsPerWrappedLine) {
      continue;
    }
    const penalty = strong ? 0 : weak ? 10 : 30;
    const score = Math.abs(a - b) + penalty;
    if (!best || score < best.score) {
      best = {i, score};
    }
  }
  const cut = best ? best.i : Math.ceil(chars.length / 2);
  return [chars.slice(0, cut).join(''), chars.slice(cut).join('')];
};

export interface ScheduleOptions {
  /** 窗口 [开始, 完全消失]（秒） */
  window: [number, number];
  /** 手动指定每段开始时间 */
  segmentStarts?: number[];
  /** 最后一段不淡出 */
  holdToEnd?: boolean;
}

export const scheduleSubtitle = (subtitle: string, opts: ScheduleOptions): ScheduledSegment[] => {
  const T = SUBTITLE_TIMING;
  const texts = splitSegments(subtitle);
  const k = texts.length;
  if (k === 0) {
    return [];
  }
  const [a, b] = opts.window;
  const chars = texts.map(countChars);
  const typing = chars.map(typingDuration);
  const lastFade = opts.holdToEnd ? 0 : T.fadeOut;

  // 每段「可见时长」= 从第一个字出现到开始淡出
  let visible: number[];
  let starts: number[];

  if (opts.segmentStarts && opts.segmentStarts.length === k) {
    starts = [...opts.segmentStarts];
    visible = starts.map((s, i) =>
      i < k - 1 ? starts[i + 1] - T.gap - T.fadeOut - s : b - lastFade - s,
    );
  } else {
    const hard = typing.map((ty) => ty + T.minHold);
    const soft = hard.map((h, i) => Math.max(h, chars[i] / T.readingSpeed));
    const avail = b - a - T.fadeOut * (k - 1) - lastFade - T.gap * (k - 1);
    const sum = (xs: number[]) => xs.reduce((p, c) => p + c, 0);
    if (avail >= sum(soft)) {
      const extra = avail - sum(soft);
      visible = soft.map((s) => s + (extra * s) / sum(soft));
    } else if (avail >= sum(hard)) {
      const diff = soft.map((s, i) => s - hard[i]);
      const extra = avail - sum(hard);
      visible = hard.map((h, i) => h + (extra * diff[i]) / Math.max(sum(diff), 1e-6));
    } else {
      visible = hard.map((h) => (avail * h) / sum(hard));
    }
    starts = [];
    let cursor = a;
    for (let i = 0; i < k; i++) {
      starts.push(cursor);
      cursor += visible[i] + T.fadeOut + T.gap;
    }
  }

  return texts.map((text, i) => {
    const start = starts[i];
    const typed = start + typing[i];
    const fadeOutStart = start + visible[i];
    const isLast = i === k - 1;
    const end = isLast && opts.holdToEnd ? b : fadeOutStart + T.fadeOut;
    const hold = fadeOutStart - typed;
    const cps = chars[i] / Math.max(fadeOutStart - start, 1e-6);
    return {
      text,
      lines: wrapLines(text),
      chars: chars[i],
      start,
      typed,
      fadeOutStart,
      end,
      hold,
      cps,
      holdOk: hold >= T.minHold - 1e-6,
      readOk: cps <= T.readingSpeed + 1e-6,
    };
  });
};
