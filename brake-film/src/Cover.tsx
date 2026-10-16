import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {ANNUAL_SALES, CAP, COVER} from './data';
import {Num} from './components/Elements';
import {COLORS, FONTS} from './theme';

/**
 * 9:16 竖屏封面（1080×1920）。
 * 主视觉取第四场：第四根柱子顶破「200亿」那条金线。
 * 标题和图表都落在画面中部 3:4 区域内（y 240～1680），平台按 3:4 裁切缩略图时不会被切掉。
 */
const W = 1080;
const H = 1920;
const LINE_Y = 900;
const BASE_Y = 1520;
const PX = (BASE_Y - LINE_Y) / 200;
const XS = [210, 420, 630, 862];
const BW = 150;
const yOf = (v: number) => BASE_Y - v * PX;

const Shards: React.FC<{cx: number; cy: number}> = ({cx, cy}) => {
  const pieces = [];
  for (let i = 0; i < 22; i++) {
    const r = (k: string) => random(`cover-shard-${i}-${k}`);
    const a = (-160 + r('a') * 140) * (Math.PI / 180);
    const d = 40 + Math.pow(r('d'), 0.8) * 230;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.9;
    const len = 14 + r('l') * 34;
    const rot = r('rot') * 180;
    pieces.push(
      <line
        key={i}
        x1={-len / 2}
        x2={len / 2}
        y1={0}
        y2={0}
        stroke={r('c') > 0.5 ? COLORS.bright : COLORS.gold}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.95 - (d / 270) * 0.6}
        transform={`translate(${x} ${y}) rotate(${rot})`}
      />,
    );
  }
  const dust = [];
  for (let i = 0; i < 90; i++) {
    const r = (k: string) => random(`cover-dust-${i}-${k}`);
    const a = (-175 + r('a') * 170) * (Math.PI / 180);
    const d = 20 + Math.pow(r('d'), 1.4) * 300;
    dust.push(
      <circle
        key={i}
        cx={cx + Math.cos(a) * d}
        cy={cy + Math.sin(a) * d * 0.85}
        r={0.8 + r('s') * 2.6}
        fill={r('c') > 0.4 ? COLORS.bright : '#FFF1C9'}
        opacity={0.35 + r('o') * 0.6}
      />,
    );
  }
  return (
    <>
      <g style={{filter: `drop-shadow(0 0 8px ${COLORS.bright})`}}>{pieces}</g>
      <g style={{filter: `drop-shadow(0 0 4px ${COLORS.bright})`}}>{dust}</g>
    </>
  );
};

export const Cover: React.FC = () => {
  const [head, tail] = COVER.title.includes('：')
    ? [COVER.title.slice(0, COVER.title.indexOf('：') + 1), COVER.title.slice(COVER.title.indexOf('：') + 1)]
    : ['', COVER.title];
  const x4 = XS[3];
  const top4 = yOf(parseFloat(ANNUAL_SALES[3].value));

  return (
    <AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
      {/* 冲破点后方的光 */}
      <div
        style={{
          position: 'absolute',
          left: x4 - 520,
          top: LINE_Y - 520,
          width: 1040,
          height: 1040,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.bright}40 0%, ${COLORS.gold}14 30%, ${COLORS.gold}00 62%)`,
        }}
      />

      {/* 标题 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONTS.title,
            fontWeight: 700,
            fontSize: 82,
            letterSpacing: '0.16em',
            color: COLORS.gold,
            marginRight: '-0.16em',
            marginBottom: 26,
          }}
        >
          {head}
        </div>
        <div
          style={{
            fontFamily: FONTS.title,
            fontWeight: 700,
            fontSize: 142,
            lineHeight: 1.1,
            letterSpacing: '0.04em',
            backgroundImage: `linear-gradient(180deg, #FFF6E2 0%, ${COLORS.bright} 55%, ${COLORS.gold} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 0 26px ${COLORS.gold}55)`,
          }}
        >
          {tail}
        </div>
        <div
          style={{
            marginTop: 34,
            width: 420,
            height: 2,
            background: `linear-gradient(90deg, ${COLORS.gold}00, ${COLORS.gold}, ${COLORS.gold}00)`,
          }}
        />
      </div>

      {/* 图表 */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="coverBar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={COLORS.gold} stopOpacity={0.45} />
            <stop offset="0.5" stopColor={COLORS.gold} stopOpacity={0.2} />
            <stop offset="1" stopColor={COLORS.gold} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="coverHot" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={COLORS.bright} stopOpacity={0.95} />
            <stop offset="0.35" stopColor={COLORS.gold} stopOpacity={0.55} />
            <stop offset="1" stopColor={COLORS.gold} stopOpacity={0.08} />
          </linearGradient>
          <filter id="coverGlow" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <feGaussianBlur stdDeviation={8} />
          </filter>
        </defs>

        {/* 基线 */}
        <line x1={90} x2={990} y1={BASE_Y} y2={BASE_Y} stroke={COLORS.gray} strokeWidth={1.5} />

        {/* 前三根柱子 */}
        {XS.slice(0, 3).map((x, i) => {
          const top = yOf(parseFloat(ANNUAL_SALES[i].value));
          return (
            <g key={i}>
              <rect x={x - BW / 2} y={top} width={BW} height={BASE_Y - top} fill="url(#coverBar)" />
              <line x1={x - BW / 2} x2={x - BW / 2} y1={top} y2={BASE_Y} stroke={COLORS.gold} strokeOpacity={0.5} />
              <line x1={x + BW / 2} x2={x + BW / 2} y1={top} y2={BASE_Y} stroke={COLORS.gold} strokeOpacity={0.5} />
              <rect x={x - BW / 2} y={top} width={BW} height={3} fill={COLORS.bright} />
            </g>
          );
        })}

        {/* 金线：左边完整，冲破处断开，右边一截下坠 */}
        <rect x={50} y={LINE_Y - 4} width={x4 - BW / 2 - 70} height={8} fill={COLORS.gold} opacity={0.6} filter="url(#coverGlow)" />
        <rect x={50} y={LINE_Y - 1.5} width={x4 - BW / 2 - 70} height={3} rx={1.5} fill={COLORS.gold} />
        <g transform={`translate(${x4 + BW / 2 + 26} ${LINE_Y + 6}) rotate(9)`}>
          <rect x={0} y={-1.5} width={150} height={3} rx={1.5} fill={COLORS.gold} opacity={0.85} />
        </g>

        {/* 第四根柱子 */}
        <rect x={x4 - BW / 2 - 30} y={top4 - 30} width={BW + 60} height={BASE_Y - top4 + 30} fill={COLORS.bright} opacity={0.22} filter="url(#coverGlow)" />
        <rect x={x4 - BW / 2} y={top4} width={BW} height={BASE_Y - top4} fill="url(#coverHot)" />
        <line x1={x4 - BW / 2} x2={x4 - BW / 2} y1={top4} y2={BASE_Y} stroke={COLORS.bright} strokeOpacity={0.7} />
        <line x1={x4 + BW / 2} x2={x4 + BW / 2} y1={top4} y2={BASE_Y} stroke={COLORS.bright} strokeOpacity={0.7} />
        <rect x={x4 - BW / 2} y={top4} width={BW} height={4} fill="#FFF1C9" />

        <Shards cx={x4} cy={LINE_Y} />
        {/* 金线的两个断口 */}
        <circle cx={x4 - BW / 2 - 20} cy={LINE_Y} r={14} fill="#FFF6DD" opacity={0.7} filter="url(#coverGlow)" />
        <circle cx={x4 - BW / 2 - 20} cy={LINE_Y} r={3} fill="#FFF6DD" />
        <circle cx={x4 + BW / 2 + 26} cy={LINE_Y + 6} r={12} fill="#FFF6DD" opacity={0.6} filter="url(#coverGlow)" />
      </svg>

      {/* 线的标注 */}
      <div style={{position: 'absolute', left: 58, top: LINE_Y - 82, filter: `drop-shadow(0 0 10px ${COLORS.gold}55)`}}>
        <Num value={CAP.value} unit={CAP.unit} size={58} color={COLORS.gold} />
      </div>

      {/* 柱内数值与年份 */}
      {XS.map((x, i) => {
        const d = ANNUAL_SALES[i];
        const top = yOf(parseFloat(d.value));
        const hero = i === 3;
        return (
          <React.Fragment key={d.year}>
            <div style={{position: 'absolute', left: x - 110, width: 220, top: top + 18, display: 'flex', justifyContent: 'center'}}>
              <Num
                value={d.value}
                prefix={d.prefix}
                unit="亿"
                size={hero ? 44 : 40}
                color={hero ? '#FFF6E2' : COLORS.gold}
                style={hero ? {filter: `drop-shadow(0 0 10px ${COLORS.bright})`} : undefined}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                left: x - 100,
                width: 200,
                top: BASE_Y + 22,
                textAlign: 'center',
                fontFamily: FONTS.num,
                fontWeight: 500,
                fontSize: 38,
                letterSpacing: '0.06em',
                color: hero ? COLORS.bright : COLORS.gold,
                opacity: hero ? 1 : 0.75,
              }}
            >
              {d.year}
            </div>
          </React.Fragment>
        );
      })}

      {/* 暗角与极淡的金色噪点，与正片一致 */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 80% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 84%, rgba(0,0,0,0.8) 100%)',
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.1, mixBlendMode: 'screen'}}>
        <filter id="coverGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.79  0 0 0 0 0.64  0 0 0 0 0.36  2.4 0 0 0 -1.05" />
        </filter>
        <rect width={W} height={H} filter="url(#coverGrain)" />
      </svg>
    </AbsoluteFill>
  );
};
