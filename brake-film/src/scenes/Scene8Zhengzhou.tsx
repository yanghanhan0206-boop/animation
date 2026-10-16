import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {FPS, NEXT_STOP, SCENES} from '../data';
import {GoldLine} from '../components/Elements';
import {SceneShell} from '../components/SceneShell';
import {CITY_COORDS, HENAN_OUTLINE} from '../geo/henan';
import {COLORS, FONTS, tween} from '../theme';

/** 第八场 郑州，还没有答案：节拍（本场秒数） */
export const S8 = {
  outlineFrom: 0.1,
  outlineTo: 1.6,
  citiesAt: 0.5,
  zoomFrom: 0.8,
  zoomTo: 4.2,
  dashFrom: 2.7,
  dashTo: 4.3,
  /** 问号开始闪烁，每次闪烁一声心跳 */
  blinkFrom: 4.4,
  blinkPeriod: 1.0,
  capFrom: 6.4,
  capTo: 8.0,
  darkFrom: 8.4,
  darkTo: 9.85,
};

/** 问号闪烁（=心跳）的时间点（本场秒数） */
export const heartbeatTimes = () => {
  const out: number[] = [];
  for (let t = S8.blinkFrom; t < S8.darkTo - 0.4; t += S8.blinkPeriod) {
    out.push(Math.round(t * 100) / 100);
  }
  return out;
};

const LON0 = 113.5;
const LAT0 = 33.875;
const KY = 124;
const KX = KY * Math.cos((33.9 * Math.PI) / 180);
const base = ([lon, lat]: [number, number]) => [960 + (lon - LON0) * KX, 470 - (lat - LAT0) * KY];
const FOCUS = base([113.85, 34.66]);

export const Scene8Zhengzhou: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[7];
  const f = frame / FPS;

  const zk = tween(frame, [S8.zoomFrom, S8.zoomTo], [0, 1], Easing.inOut(Easing.cubic));
  const zoom = 1 + 1.6 * zk;
  const tx = 960 + (FOCUS[0] - 960) * (1 - zk);
  const ty = FOCUS[1] + (430 - FOCUS[1]) * zk;
  const P = (ll: [number, number]) => {
    const [x, y] = base(ll);
    return [tx + (x - FOCUS[0]) * zoom, ty + (y - FOCUS[1]) * zoom];
  };

  const outline = `M ${HENAN_OUTLINE.map((p) => P(p).map((v) => v.toFixed(1)).join(',')).join(' L ')} Z`;
  const draw = tween(frame, [S8.outlineFrom, S8.outlineTo], [0, 1], Easing.inOut(Easing.cubic));
  const cities = tween(frame, [S8.citiesAt, S8.citiesAt + 0.7], [0, 1], Easing.out(Easing.cubic));
  const zzIn = tween(frame, [S8.citiesAt + 0.5, S8.citiesAt + 1.2], [0, 1]);
  const dash = tween(frame, [S8.dashFrom, S8.dashTo], [0, 1], Easing.out(Easing.cubic));
  const cap = tween(frame, [S8.capFrom, S8.capTo], [0, 1], Easing.inOut(Easing.sin));
  const dark = tween(frame, [S8.darkFrom, S8.darkTo], [1, 0], Easing.in(Easing.quad));

  const xu = P(CITY_COORDS.xuchang);
  const xx = P(CITY_COORDS.xinxiang);
  const zz = P(CITY_COORDS.zhengzhou);
  // 虚线只走到许昌与郑州之间的一半
  const end = [xu[0] + (zz[0] - xu[0]) * 0.5 * dash, xu[1] + (zz[1] - xu[1]) * 0.5 * dash];

  // 问号：心跳式的两下闪
  let blink = 0;
  if (f >= S8.blinkFrom) {
    const ph = ((f - S8.blinkFrom) % S8.blinkPeriod) / S8.blinkPeriod;
    blink = Math.max(Math.exp(-Math.pow((ph - 0.04) / 0.06, 2)), 0.7 * Math.exp(-Math.pow((ph - 0.24) / 0.06, 2)));
  }
  const qIn = tween(frame, [S8.dashTo - 0.2, S8.dashTo + 0.2], [0, 1]);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.12);

  const cityDot = (p: number[], label: string, key: string, labelLeft = false) => (
    <g key={key} opacity={cities}>
      <circle cx={p[0]} cy={p[1]} r={26 + pulse * 6} fill="url(#s8glow)" />
      <circle cx={p[0]} cy={p[1]} r={6.5} fill={COLORS.bright} />
      <text
        x={labelLeft ? p[0] - 22 : p[0] + 22}
        y={p[1] + 10}
        textAnchor={labelLeft ? 'end' : 'start'}
        fontFamily={FONTS.sans}
        fontWeight={500}
        fontSize={30}
        letterSpacing="0.08em"
        fill={COLORS.gold}
      >
        {label}
      </text>
    </g>
  );

  return (
    <SceneShell scene={scene} chromeOpacity={dark}>
      <div style={{position: 'absolute', inset: 0, opacity: dark}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <radialGradient id="s8glow">
              <stop offset="0" stopColor={COLORS.bright} stopOpacity={0.55} />
              <stop offset="1" stopColor={COLORS.bright} stopOpacity={0} />
            </radialGradient>
          </defs>
          <path
            d={outline}
            fill={COLORS.gold}
            fillOpacity={0.035 * draw}
            stroke={COLORS.gold}
            strokeWidth={1.6}
            strokeOpacity={0.55}
            pathLength={1}
            strokeDasharray={`${draw} 1`}
            strokeLinejoin="round"
          />
          {cityDot(xu, NEXT_STOP.from, 'xu')}
          {cityDot(xx, NEXT_STOP.other, 'xx')}
          {/* 郑州：还没点亮 */}
          <g opacity={zzIn}>
            <circle cx={zz[0]} cy={zz[1]} r={8} fill="none" stroke={COLORS.gray} strokeWidth={2.2} />
            <text
              x={zz[0] - 22}
              y={zz[1] + 10}
              textAnchor="end"
              fontFamily={FONTS.sans}
              fontWeight={500}
              fontSize={30}
              letterSpacing="0.08em"
              fill={COLORS.text}
              opacity={0.75}
            >
              {NEXT_STOP.to}
            </text>
          </g>
          {dash > 0 ? (
            <line
              x1={xu[0]}
              y1={xu[1]}
              x2={end[0]}
              y2={end[1]}
              stroke={COLORS.gold}
              strokeWidth={2.4}
              strokeDasharray="8 9"
              strokeDashoffset={-frame * 0.6}
              strokeLinecap="round"
            />
          ) : null}
          {qIn > 0 ? (
            <g opacity={qIn * (0.3 + 0.7 * blink)}>
              <circle cx={end[0]} cy={end[1]} r={30 + blink * 8} fill="url(#s8glow)" />
              <text
                x={end[0] + 26}
                y={end[1] + 18}
                fontFamily={FONTS.num}
                fontWeight={500}
                fontSize={54 + blink * 6}
                fill={COLORS.bright}
              >
                ?
              </text>
            </g>
          ) : null}
        </svg>
        {/* 郑州上空，那条「200亿」的线淡淡亮起 */}
        {cap > 0 ? (
          <GoldLine
            y={zz[1] - 64}
            x1={zz[0] - 230}
            x2={zz[0] + 230}
            opacity={cap * 0.5}
            labelSize={30}
            label={cap}
            thickness={2}
          />
        ) : null}
      </div>
    </SceneShell>
  );
};
