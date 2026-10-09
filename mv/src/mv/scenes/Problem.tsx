import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {easeInOutSine, lerp, prog} from '../../lib/anim';
import {GOLD, SERIF_EN} from '../../theme';
import {LyricLine} from '../Lyrics';

// 「大步跨过也跨不过的 problem」: the word PROBLEM, too big for the frame, slides past while
// a small figure strides on a gold line and never gets beyond it.

const STRIDE =
  'M50 7 C61 7 68 15 68 26 C68 37 61 44 50 44 C39 44 32 37 32 26 C32 15 39 7 50 7 Z ' +
  'M40 48 L60 48 C70 50 74 60 74 72 L80 130 L86 168 C87 176 80 178 77 171 L68 132 L64 104 L62 150 L84 220 L94 288 ' +
  'C95 296 86 298 82 292 L66 232 L52 196 L40 236 L26 292 C23 298 14 296 16 288 L28 222 L38 150 L36 104 L30 136 L20 170 ' +
  'C17 176 10 174 12 166 L22 128 L26 72 C26 60 30 50 40 48 Z';
const LINE_Y = 742;

export const Problem: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const slide = lerp(260, -980, prog(t, 0, dur, easeInOutSine));
  const sweep = prog(t, 0.2, dur - 0.2);
  // Walking in place: a small bob on every step.
  const step = Math.abs(Math.sin(t * Math.PI * 2.4));
  const figH = 170;
  const sc = figH / 300;
  return (
    <AbsoluteFill>
      <Bokeh seed="problem" count={70} focus={0.6} drift={[-30, -4]} intensity={0.6} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="prob-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset={Math.max(0, sweep - 0.12)} stopColor={GOLD.dark} />
            <stop offset={sweep} stopColor="#FFF4D6" />
            <stop offset={Math.min(1, sweep + 0.12)} stopColor={GOLD.dark} />
          </linearGradient>
          <linearGradient id="prob-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={GOLD.champagne} stopOpacity="0" />
            <stop offset="0.2" stopColor={GOLD.light} />
            <stop offset="0.8" stopColor={GOLD.light} />
            <stop offset="1" stopColor={GOLD.champagne} stopOpacity="0" />
          </linearGradient>
        </defs>
        <text
          x={slide}
          y={LINE_Y - 22}
          fontFamily={SERIF_EN}
          fontWeight={500}
          fontSize={560}
          letterSpacing={18}
          fill="rgba(222,186,122,0.05)"
          stroke="url(#prob-stroke)"
          strokeWidth={3}
        >
          PROBLEM
        </text>
        <rect x={0} y={LINE_Y} width={1920} height={2} fill="url(#prob-line)" />
        <g transform={`translate(${720 - 50 * sc} ${LINE_Y - figH - step * 4}) scale(${sc})`}>
          <path d={STRIDE} fill="#020203" stroke={GOLD.light} strokeWidth={2 / sc} strokeOpacity={0.55} />
        </g>
      </svg>
      <LyricLine text="大步跨过也跨不过的" top={892} t={t} span={0.55} out={prog(t, dur - 0.32, dur)} gold />
    </AbsoluteFill>
  );
};
