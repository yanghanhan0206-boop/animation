import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  FPS,
  SceneMeta,
  SHOW_CHAPTER_TITLES,
  SUBTITLE_FADE_IN,
  SUBTITLE_FADE_OUT,
} from '../data';
import {clamp01, COLORS, FONTS, LAYOUT} from '../theme';

/** 下三分之一字幕：一次一条，逐条淡入，细金色描边 */
export const Subtitles: React.FC<{scene: SceneMeta}> = ({scene}) => {
  const frame = useCurrentFrame();
  const active = scene.subtitles.find(
    (s) => frame >= s.from * FPS && frame < s.to * FPS,
  );
  if (!active) {
    return null;
  }
  const a = active.from * FPS;
  const b = active.to * FPS;
  const opacity = interpolate(
    frame,
    [a, a + SUBTITLE_FADE_IN, b - SUBTITLE_FADE_OUT, b],
    [0, 1, 1, 0],
    clamp01,
  );
  const rise = interpolate(frame, [a, a + SUBTITLE_FADE_IN * 2], [10, 0], clamp01);
  const textStyle: React.CSSProperties = {
    fontFamily: FONTS.sans,
    fontWeight: 500,
    fontSize: 46,
    letterSpacing: '0.06em',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: LAYOUT.subtitleBottom,
          display: 'flex',
          justifyContent: 'center',
          opacity,
          transform: `translateY(${rise}px)`,
        }}
      >
        <div style={{position: 'relative'}}>
          {/* 底层：金色描边（只露出字形外侧一圈） */}
          <span
            style={{
              ...textStyle,
              position: 'absolute',
              left: 0,
              top: 0,
              color: 'transparent',
              WebkitTextStroke: `2.6px ${COLORS.gold}`,
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
            }}
          >
            {active.text}
          </span>
          {/* 上层：文字本体 */}
          <span style={{...textStyle, position: 'relative', color: COLORS.text}}>
            {active.text}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 右下角数据来源 */
export const SourceTag: React.FC<{text: string; at?: number}> = ({text, at = 0.8}) => {
  const frame = useCurrentFrame();
  if (!text) {
    return null;
  }
  const opacity = interpolate(frame, [at * FPS, at * FPS + 20], [0, 1], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        right: 64,
        bottom: 38,
        fontFamily: FONTS.sans,
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: '0.04em',
        color: COLORS.gray,
        opacity,
      }}
    >
      数据来源：{text}
    </div>
  );
};

/** 左上角分场标题 */
export const ChapterTitle: React.FC<{scene: SceneMeta; at?: number}> = ({scene, at = 0.5}) => {
  const frame = useCurrentFrame();
  if (!SHOW_CHAPTER_TITLES) {
    return null;
  }
  const t = interpolate(frame, [at * FPS, at * FPS + 24], [0, 1], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        left: 92,
        top: 66,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity: t * 0.92,
        transform: `translateX(${(1 - t) * -12}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.num,
          fontWeight: 500,
          fontSize: 26,
          color: COLORS.gold,
          letterSpacing: '0.08em',
        }}
      >
        {String(scene.index).padStart(2, '0')}
      </span>
      <span style={{width: 34 * t, height: 1, background: COLORS.gold, opacity: 0.7}} />
      <span
        style={{
          fontFamily: FONTS.title,
          fontWeight: 700,
          fontSize: 30,
          color: COLORS.text,
          letterSpacing: '0.12em',
        }}
      >
        {scene.title}
      </span>
    </div>
  );
};

/**
 * 每一场的外壳：入出场淡入淡出、镜头层（推拉、抖动）、字幕与角标。
 * 镜头层只作用在画面内容上，字幕和角标保持不动。
 */
export const SceneShell: React.FC<{
  scene: SceneMeta;
  children: React.ReactNode;
  camera?: React.CSSProperties;
  chapterAt?: number;
  sourceAt?: number;
  /** 分场标题与角标的透明度（片尾随画面一起黑下去） */
  chromeOpacity?: number;
}> = ({scene, children, camera, chapterAt, sourceAt, chromeOpacity = 1}) => {
  const frame = useCurrentFrame();
  const dur = Math.round((scene.end - scene.start) * FPS);
  const fadeIn = scene.fadeIn > 0 ? interpolate(frame, [0, scene.fadeIn], [0, 1], clamp01) : 1;
  const fadeOut =
    scene.fadeOut > 0 ? interpolate(frame, [dur - scene.fadeOut, dur], [1, 0], clamp01) : 1;
  return (
    <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
      <AbsoluteFill style={camera}>{children}</AbsoluteFill>
      <AbsoluteFill style={{opacity: chromeOpacity}}>
        <ChapterTitle scene={scene} at={chapterAt} />
        <SourceTag text={scene.source} at={sourceAt} />
      </AbsoluteFill>
      <Subtitles scene={scene} />
    </AbsoluteFill>
  );
};
