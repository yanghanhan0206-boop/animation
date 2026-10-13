/**
 * 叠在画面最上层的东西：字幕、角标、时钟、暗角、胶片颗粒。
 * 它们的时间全部来自 src/lib/plan.ts 的排期，镜头组件不用管。
 */
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CITATION_STYLE, CLOCK_STYLE, COLORS, FONTS, GRAIN, SUBTITLE_STYLE, VIGNETTE} from '../config/theme';
import {CITATION_TIMING, CLOCK, FPS, SUBTITLE_TIMING} from '../config/timeline';
import {EASE_SOFT, tween} from '../lib/anim';
import type {PlannedClock, PlannedSubtitle} from '../lib/plan';

const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: `linear-gradient(120deg, ${COLORS.gold0} 0%, ${COLORS.gold1} 55%, ${COLORS.gold0} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

/* ------------------------------ 字幕 ------------------------------ */

/** 一段字幕：放在从 fromFrame 开始的 Sequence 里，逐字淡入，到点淡出 */
export const SubtitleSegment: React.FC<{seg: PlannedSubtitle}> = ({seg}) => {
  const frame = useCurrentFrame();
  const fadeOutStart = (seg.fadeOutStart - seg.start) * FPS;
  const out = seg.holdToEnd
    ? 0
    : tween(frame, fadeOutStart, fadeOutStart + SUBTITLE_TIMING.fadeOut * FPS, 0, 1, EASE_SOFT);
  let index = 0;
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: SUBTITLE_STYLE.bottom,
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.serif,
          fontSize: SUBTITLE_STYLE.fontSize,
          fontWeight: SUBTITLE_STYLE.fontWeight,
          lineHeight: SUBTITLE_STYLE.lineHeight,
          letterSpacing: SUBTITLE_STYLE.letterSpacing,
          color: COLORS.text,
          textAlign: 'center',
          textShadow: '0 0 18px rgba(10,10,10,0.95), 0 0 6px rgba(10,10,10,0.9)',
        }}
      >
        {seg.lines.map((line, li) => (
          <div key={li} style={{whiteSpace: 'nowrap'}}>
            {Array.from(line).map((ch, ci) => {
              const i = index++;
              const a0 = i * SUBTITLE_TIMING.charStagger;
              const a = tween(frame, a0, a0 + SUBTITLE_TIMING.charFade, 0, 1, EASE_SOFT);
              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    opacity: a,
                    transform: `translateY(${(1 - a) * 5}px)`,
                    filter: a < 1 ? `blur(${(1 - a) * 3}px)` : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------ 角标 ------------------------------ */

export const Citation: React.FC<{text: string; durationInFrames: number}> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const a =
    tween(frame, 0, CITATION_TIMING.fadeIn * FPS, 0, 1, EASE_SOFT) *
    (1 - tween(frame, durationInFrames - CITATION_TIMING.fadeOut * FPS, durationInFrames, 0, 1, EASE_SOFT));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          right: CITATION_STYLE.right,
          bottom: CITATION_STYLE.bottom,
          fontFamily: FONTS.sans,
          fontSize: CITATION_STYLE.fontSize,
          fontWeight: 400,
          letterSpacing: '0.04em',
          color: COLORS.gold0,
          opacity: CITATION_STYLE.opacity * a,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------ 时钟 ------------------------------ */

export const Clock: React.FC<{windows: PlannedClock[]}> = ({windows}) => {
  const frame = useCurrentFrame();
  let a = 0;
  for (const w of windows) {
    if (frame < w.fromFrame - 1 || frame > w.toFrame + 1) {
      continue;
    }
    const fi = w.fadeIn > 0 ? tween(frame, w.fromFrame, w.fromFrame + w.fadeIn * FPS, 0, 1, EASE_SOFT) : 1;
    const fo = w.fadeOut > 0 ? 1 - tween(frame, w.toFrame - w.fadeOut * FPS, w.toFrame, 0, 1, EASE_SOFT) : 1;
    a = Math.max(a, Math.min(fi, fo));
  }
  if (a <= 0.001) {
    return null;
  }
  const [hh, mm] = CLOCK.text.split(':');
  // 冒号缓慢明暗：余弦曲线本身就是缓入缓出
  const blink = 0.18 + 0.82 * (0.5 + 0.5 * Math.cos((2 * Math.PI * frame) / (CLOCK.blinkPeriod * FPS)));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: CLOCK_STYLE.left,
          top: CLOCK_STYLE.top,
          fontFamily: FONTS.sans,
          fontWeight: CLOCK_STYLE.fontWeight,
          fontSize: CLOCK_STYLE.fontSize,
          letterSpacing: '0.14em',
          fontVariantNumeric: 'tabular-nums',
          opacity: a,
          filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.35))',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={GOLD_TEXT}>{hh}</span>
        <span style={{...GOLD_TEXT, opacity: blink, margin: '0 0.04em', transform: 'translateY(-0.06em)'}}>:</span>
        <span style={GOLD_TEXT}>{mm}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------ 暗角 ------------------------------ */

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 72% 72% at 50% 48%, rgba(0,0,0,0) 58%, rgba(0,0,0,${VIGNETTE}) 100%)`,
    }}
  />
);

/* ---------------------------- 胶片颗粒 ---------------------------- */

const TILE = 256;
const TILE_COUNT = 6;
type GrainKind = 'tone' | 'specks';
const tiles: Partial<Record<GrainKind, HTMLCanvasElement[]>> = {};

/**
 * 预先生成几张噪声贴图（确定性随机），每帧随机挑一张、随机偏移。
 * tone：以中灰为中心的颗粒，用 overlay 叠加，只改变金色元素的质感，不改变黑底平均亮度；
 * specks：只有亮点的颗粒，用 screen 叠加，让黑底上也看得到细微颗粒。
 */
const getTiles = (kind: GrainKind) => {
  const cached = tiles[kind];
  if (cached) {
    return cached;
  }
  let s = kind === 'tone' ? 1234567 : 7654321;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const made = Array.from({length: TILE_COUNT}, () => {
    const c = document.createElement('canvas');
    c.width = TILE;
    c.height = TILE;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(TILE, TILE);
    for (let i = 0; i < TILE * TILE; i++) {
      // 近似高斯：三个均匀分布求平均
      const g = (rnd() + rnd() + rnd()) / 3 - 0.5;
      const v = kind === 'tone' ? 128 + g * 2.4 * 255 : Math.max(0, g - 0.08) * 4 * 255;
      const c8 = Math.max(0, Math.min(255, v));
      img.data[i * 4] = c8;
      img.data[i * 4 + 1] = c8;
      img.data[i * 4 + 2] = c8;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  });
  tiles[kind] = made;
  return made;
};

const GrainCanvas: React.FC<{kind: GrainKind; blend: 'overlay' | 'screen'; opacity: number}> = ({
  kind,
  blend,
  opacity,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d')!;
    const all = getTiles(kind);
    const h = (Math.imul(frame + (kind === 'tone' ? 0 : 977), 2654435761) ^ 0x5bd1e995) >>> 0;
    const tile = all[h % TILE_COUNT];
    const ox = (h >>> 8) % TILE;
    const oy = (h >>> 16) % TILE;
    const pattern = ctx.createPattern(tile, 'repeat')!;
    ctx.setTransform(1, 0, 0, 1, -ox, -oy);
    ctx.fillStyle = pattern;
    ctx.fillRect(ox, oy, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [frame, kind, width, height]);
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{position: 'absolute', inset: 0, mixBlendMode: blend, opacity, pointerEvents: 'none'}}
    />
  );
};

export const FilmGrain: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <GrainCanvas kind="tone" blend="overlay" opacity={GRAIN.overlayOpacity} />
    <GrainCanvas kind="specks" blend="screen" opacity={GRAIN.screenOpacity} />
  </AbsoluteFill>
);
