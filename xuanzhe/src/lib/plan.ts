/**
 * 把一集（Full / Part1 / Part2）的配置展开成帧级别的排期：
 * 每个镜头的 Sequence 区间、每段字幕、角标、时钟。纯函数。
 */
import {
  CITATION_TIMING,
  CLOCK,
  FPS,
  SHOTS,
  SUBTITLE_TIMING,
  type PartConfig,
  type ShotConfig,
} from '../config/timeline';
import {scheduleSubtitle, type ScheduledSegment} from './subtitles';

export const toFrames = (sec: number) => Math.round(sec * FPS);

export interface PlannedShot {
  shot: ShotConfig;
  /** 镜头名义起点（本集的帧） */
  from: number;
  /** Sequence 实际起点 / 长度（含 head / tail） */
  seqFrom: number;
  seqDuration: number;
  /** 组件内时间 t = 帧 / FPS + timeOffset（t=0 即镜头名义起点） */
  timeOffset: number;
  /** 退场后是否接片尾（片尾期间由这个镜头继续出画面） */
  extendsIntoOutro: boolean;
}

export interface PlannedSubtitle extends ScheduledSegment {
  key: string;
  owner: string;
  /** 本集帧号 */
  fromFrame: number;
  toFrame: number;
  holdToEnd: boolean;
}

export interface PlannedCitation {
  key: string;
  text: string;
  fromFrame: number;
  toFrame: number;
}

export interface PlannedClock {
  fromFrame: number;
  toFrame: number;
  fadeIn: number;
  fadeOut: number;
}

export interface Plan {
  durationInFrames: number;
  intro?: {frames: number; backdrop: ShotConfig};
  outro?: {fromFrame: number; frames: number};
  shots: PlannedShot[];
  subtitles: PlannedSubtitle[];
  citations: PlannedCitation[];
  clocks: PlannedClock[];
}

const defaultWindow = (shot: ShotConfig): [number, number] => [
  SUBTITLE_TIMING.lead,
  shot.end - shot.start - SUBTITLE_TIMING.tail,
];

export const buildPlan = (part: PartConfig): Plan => {
  const [firstId, lastId] = part.shots;
  const shots = SHOTS.filter((s) => s.id >= firstId && s.id <= lastId);
  const first = shots[0];
  const last = shots[shots.length - 1];
  const introSec = part.intro?.duration ?? 0;
  const outroSec = part.outro?.duration ?? 0;
  const bodySec = last.end - first.start;
  const durationInFrames = toFrames(introSec + bodySec + outroSec);

  /** 完整版绝对秒 → 本集秒 */
  const local = (abs: number) => abs - first.start + introSec;

  const plannedShots: PlannedShot[] = shots.map((shot) => {
    const isLast = shot.id === last.id;
    const head = shot.head ?? 0;
    const tail = isLast ? (shot.tail ?? 0) + outroSec : (shot.tail ?? 0);
    const from = toFrames(local(shot.start));
    const seqFrom = Math.max(0, toFrames(local(shot.start) - head));
    const seqTo = Math.min(durationInFrames, toFrames(local(shot.end) + tail));
    return {
      shot,
      from,
      seqFrom,
      seqDuration: Math.max(1, seqTo - seqFrom),
      timeOffset: (seqFrom - from) / FPS,
      extendsIntoOutro: isLast && outroSec > 0,
    };
  });

  const subtitles: PlannedSubtitle[] = [];
  const citations: PlannedCitation[] = [];

  const pushSegments = (
    owner: string,
    originSec: number,
    segments: ScheduledSegment[],
    holdToEnd: boolean,
  ) => {
    segments.forEach((seg, i) => {
      subtitles.push({
        ...seg,
        key: `${owner}-${i}`,
        owner,
        fromFrame: toFrames(originSec + seg.start),
        toFrame: toFrames(originSec + seg.end),
        holdToEnd: holdToEnd && i === segments.length - 1,
      });
    });
  };

  if (part.intro) {
    const segs = scheduleSubtitle(part.intro.subtitle, {
      window: part.intro.subtitleWindow,
      holdToEnd: part.intro.holdToEnd,
    });
    pushSegments('intro', 0, segs, !!part.intro.holdToEnd);
  }

  for (const shot of shots) {
    const window =
      part.subtitleWindowOverrides?.[shot.id] ?? shot.subtitleWindow ?? defaultWindow(shot);
    const segs = scheduleSubtitle(shot.subtitle, {
      window,
      segmentStarts: shot.segmentStarts,
    });
    const origin = local(shot.start);
    pushSegments(`shot${shot.id}`, origin, segs, false);

    if (shot.citation && segs.length > 0) {
      const inSec = origin + segs[0].start + CITATION_TIMING.delayAfterSubtitle;
      const outSec = origin + (shot.end - shot.start) - CITATION_TIMING.endBeforeShotEnd;
      citations.push({
        key: `cite${shot.id}`,
        text: shot.citation,
        fromFrame: toFrames(inSec),
        toFrame: toFrames(outSec),
      });
    }
  }

  if (part.outro) {
    const origin = introSec + bodySec;
    const segs = scheduleSubtitle(part.outro.subtitle, {
      window: part.outro.subtitleWindow,
      holdToEnd: part.outro.holdToEnd,
    });
    pushSegments('outro', origin, segs, !!part.outro.holdToEnd);
  }

  const clocks: PlannedClock[] = [];
  for (const w of CLOCK.windows) {
    const from = Math.max(w.from, first.start);
    const to = Math.min(w.to, last.end);
    if (to - from <= 0.2) {
      continue;
    }
    clocks.push({
      fromFrame: toFrames(local(from)),
      toFrame: toFrames(local(to)),
      // 被截断的一侧不做淡入/淡出
      fadeIn: from === w.from ? w.fadeIn : 0,
      fadeOut: to === w.to ? w.fadeOut : 0,
    });
  }

  return {
    durationInFrames,
    intro: part.intro
      ? {
          frames: toFrames(introSec),
          backdrop: SHOTS.find((s) => s.id === part.intro!.backdropShot)!,
        }
      : undefined,
    outro: part.outro ? {fromFrame: toFrames(introSec + bodySec), frames: toFrames(outroSec)} : undefined,
    shots: plannedShots,
    subtitles,
    citations,
    clocks,
  };
};
