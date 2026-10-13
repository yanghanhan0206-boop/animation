/**
 * 视频封面（静帧，1920×1080）：左边是主句，右边是悬在四条路上方的金色小球。
 * 文字在 src/config/timeline.ts 的 COVER 里改。
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GoldText, Roads} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {GoldDefs} from '../components/GoldDefs';
import {Clock, FilmGrain, Vignette} from '../components/Overlays';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../config/theme';
import {COVER, LABELS} from '../config/timeline';
import {useFontsReady} from '../lib/fonts';

const BALL = {x: 1450, y: 375, r: 46};
/** 文字块左上角与各行尺寸 */
const TEXT = {left: 150, top: 280, size: 84, lineHeight: 1.42, emphasis: 156, emphasisLine: 1.3};
const EMPHASIS_Y = TEXT.top + TEXT.size * TEXT.lineHeight * 2 + 6 + (TEXT.emphasis * TEXT.emphasisLine) / 2;
const ROAD_ORIGIN = {x: BALL.x, y: BALL.y + 74};


/** 一滴金色的泪，从小球左下方落下 */
export const Tear: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g filter="url(#glow-soft)">
    <path
      d={`M ${x} ${y - 22 * s} C ${x + 4 * s} ${y - 12 * s} ${x + 11 * s} ${y - 2 * s} ${x + 11 * s} ${y + 6 * s} A ${11 * s} ${11 * s} 0 0 1 ${x - 11 * s} ${y + 6 * s} C ${x - 11 * s} ${y - 2 * s} ${x - 4 * s} ${y - 12 * s} ${x} ${y - 22 * s} Z`}
      fill="url(#ball-body)"
      opacity={0.95}
    />
  </g>
);

export const Cover: React.FC = () => {
  useFontsReady();
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <GoldDefs />
      <Stage>
        <Roads
          origin={ROAD_ORIGIN}
          spread={310}
          length={300}
          lit={[0, 0.85, 0, 0]}
          base={0.5}
          labels={LABELS.roads}
          labelSize={32}
        />
        <GoldBall x={BALL.x} y={BALL.y} r={BALL.r} glow={1.15} />
        <Tear x={BALL.x - 58} y={BALL.y + 64} s={1.05} />

        {/* 「不掉眼泪」：金色大字 + 一道静止的光泽 */}
        <defs>
          <linearGradient id="cover-sheen" gradientUnits="userSpaceOnUse" x1="430" y1="0" x2="700" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFFBEA" stopOpacity="0.75" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g filter="url(#glow-soft)">
          <GoldText x={TEXT.left - 4} y={EMPHASIS_Y} size={TEXT.emphasis} weight={600} anchor="start" spacing="0.1em">
            {COVER.emphasis}
          </GoldText>
        </g>
        <GoldText x={TEXT.left - 4} y={EMPHASIS_Y} size={TEXT.emphasis} weight={600} anchor="start" spacing="0.1em" fill="url(#cover-sheen)">
          {COVER.emphasis}
        </GoldText>
      </Stage>
      <Vignette />

      <div
        style={{
          position: 'absolute',
          left: TEXT.left,
          top: TEXT.top,
          fontFamily: FONTS.serif,
          fontWeight: 600,
          color: COLORS.text,
          letterSpacing: '0.05em',
          textShadow: '0 0 24px rgba(10,10,10,0.9)',
        }}
      >
        {COVER.lines.map((l) => (
          <div key={l} style={{fontSize: TEXT.size, lineHeight: TEXT.lineHeight}}>
            {l}
          </div>
        ))}
        {/* 给 SVG 画的「不掉眼泪」留出位置 */}
        <div style={{height: TEXT.emphasis * TEXT.emphasisLine, marginTop: 6}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 34}}>
          <div style={{width: 64, height: 1.5, background: `linear-gradient(90deg, ${COLORS.gold0}, ${COLORS.gold1})`}} />
          <div style={{fontSize: 36, fontWeight: 400, letterSpacing: '0.24em', color: COLORS.gold1, opacity: 0.9, textShadow: 'none'}}>
            {COVER.title}
          </div>
        </div>
      </div>

      <Clock windows={[{fromFrame: -100, toFrame: 100, fadeIn: 0, fadeOut: 0}]} />
      <FilmGrain />
    </AbsoluteFill>
  );
};
