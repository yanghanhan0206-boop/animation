/**
 * 竖版封面：9:16（1080×1920，手机全屏）和 3:4（1080×1440）。
 * 上半部分是悬在四条路上方、挂着一滴泪的金色小球，下半部分是居中的主句。
 * 文字同样在 src/config/timeline.ts 的 COVER 里改。
 */
import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {GoldText, Roads} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {GoldDefs} from '../components/GoldDefs';
import {Clock, FilmGrain, Vignette} from '../components/Overlays';
import {COLORS} from '../config/theme';
import {COVER, LABELS} from '../config/timeline';
import {useFontsReady} from '../lib/fonts';
import {Tear} from './Cover';

const W = 1080;

/** 两种比例的纵向排版（y 坐标） */
const LAYOUTS = {
  1920: {ball: 500, roadLen: 300, line1: 1090, line2: 1208, emphasis: 1388, title: 1580},
  1440: {ball: 300, roadLen: 250, line1: 790, line2: 902, emphasis: 1072, title: 1250},
} as const;

const LINE_SIZE = 80;
const LINE_SPACING = 0.05;
const EMPHASIS_SIZE = 172;
const EMPHASIS_SPACING = 0.1;
const TITLE_SIZE = 38;
const TITLE_SPACING = 0.2;
/** SVG 的 letter-spacing 会在最后一个字后面也留空，居中时往右补半个字距 */
const centered = (size: number, spacing: number) => W / 2 + (size * spacing) / 2;

export const CoverVertical: React.FC = () => {
  useFontsReady();
  const {height} = useVideoConfig();
  const L = height >= 1920 ? LAYOUTS[1920] : LAYOUTS[1440];
  const ball = {x: W / 2, y: L.ball, r: 50};
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <GoldDefs />
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="cover-v-sheen" gradientUnits="userSpaceOnUse" x1="470" y1="0" x2="760" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFFBEA" stopOpacity="0.75" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <Roads
          origin={{x: ball.x, y: ball.y + 78}}
          spread={360}
          length={L.roadLen}
          lit={[0, 0.85, 0, 0]}
          base={0.5}
          labels={LABELS.roads}
          labelSize={36}
        />
        <GoldBall x={ball.x} y={ball.y} r={ball.r} glow={1.15} />
        <Tear x={ball.x - 64} y={ball.y + 70} s={1.15} />

        {COVER.lines.map((l, i) => (
          <GoldText
            key={l}
            x={centered(LINE_SIZE, LINE_SPACING)}
            y={i === 0 ? L.line1 : L.line2}
            size={LINE_SIZE}
            weight={600}
            spacing={`${LINE_SPACING}em`}
            fill={COLORS.text}
          >
            {l}
          </GoldText>
        ))}

        <g filter="url(#glow-soft)">
          <GoldText
            x={centered(EMPHASIS_SIZE, EMPHASIS_SPACING)}
            y={L.emphasis}
            size={EMPHASIS_SIZE}
            weight={600}
            spacing={`${EMPHASIS_SPACING}em`}
          >
            {COVER.emphasis}
          </GoldText>
        </g>
        <GoldText
          x={centered(EMPHASIS_SIZE, EMPHASIS_SPACING)}
          y={L.emphasis}
          size={EMPHASIS_SIZE}
          weight={600}
          spacing={`${EMPHASIS_SPACING}em`}
          fill="url(#cover-v-sheen)"
        >
          {COVER.emphasis}
        </GoldText>

        <line x1={W / 2 - 40} y1={L.title - 58} x2={W / 2 + 40} y2={L.title - 58} stroke="url(#gold-stroke)" strokeWidth={1.5} />
        <GoldText
          x={centered(TITLE_SIZE, TITLE_SPACING)}
          y={L.title}
          size={TITLE_SIZE}
          spacing={`${TITLE_SPACING}em`}
          fill={COLORS.gold1}
          opacity={0.9}
        >
          {COVER.title}
        </GoldText>
      </svg>
      <Vignette />
      <Clock windows={[{fromFrame: -100, toFrame: 100, fadeIn: 0, fadeOut: 0}]} />
      <FilmGrain />
    </AbsoluteFill>
  );
};
