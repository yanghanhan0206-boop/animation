import React from 'react';
import {Easing, interpolate, interpolateColors, random, spring, useCurrentFrame} from 'remotion';
import {FPS, MONEY_CARDS, SCENES} from '../data';
import {Figure, Num} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {clamp01, COLORS, FONTS, tween} from '../theme';
import {arcPath, ringSegments} from './Scene5Ring';

/** 第六场 钱去了哪里：节拍（本场秒数） */
export const S6 = {
  collapseFrom: 0.3,
  collapseTo: 2.2,
  spinFrom: 2.3,
  spinTo: 4.2,
  crackFrom: 4.3,
  burstAt: 5.0,
  rainTo: 23.0,
  cardsAt: [4.7, 8.7, 12.7, 16.6, 20.7],
};

const COIN = {cx: 700, cy: 300, r: 118};
const CROWD = {x0: 150, x1: 1280, feet: 800, count: 21};
const HEADS_Y = CROWD.feet - 150;

/** 光点雨里铃声的时间点（本场秒数），音效轨用 */
export const chimeTimes = (): number[] => {
  const out: number[] = [];
  let t = S6.burstAt;
  let i = 0;
  while (t < S6.rainTo - 0.5) {
    out.push(Math.round(t * 100) / 100);
    t += 0.32 + random(`chime-${i++}`) * 0.5;
  }
  return out;
};

const SEGS = ringSegments();

const Coin: React.FC<{frame: number}> = ({frame}) => {
  const f = frame / FPS;
  const k = tween(frame, [S6.collapseFrom, S6.collapseTo], [0, 1], Easing.inOut(Easing.cubic));
  // 圆环收拢：半径变小、内径归零、段与段之间的缝合上
  const rOut = interpolate(k, [0, 1], [245, COIN.r]);
  const rIn = interpolate(k, [0, 1], [172, 0]);
  const pad = interpolate(k, [0, 0.7], [0.5, 0], clamp01);
  const cx = interpolate(k, [0, 1], [960, COIN.cx]);
  const cy = interpolate(k, [0, 1], [455, COIN.cy]);
  const coinFace = tween(frame, [S6.collapseTo - 0.3, S6.collapseTo + 0.2], [0, 1]);
  const spinT = tween(frame, [S6.spinFrom, S6.spinTo], [0, 1], Easing.inOut(Easing.cubic));
  const scaleX = Math.cos(spinT * Math.PI * 2);
  const crack = tween(frame, [S6.crackFrom, S6.burstAt], [0, 1], Easing.in(Easing.quad));
  const gone = f >= S6.burstAt;
  if (gone) {
    return null;
  }
  const cracks = Array.from({length: 7}, (_, i) => {
    const a0 = (i / 7) * 360 + random(`crack-a-${i}`) * 30;
    const pts = [[COIN.cx, COIN.cy]];
    for (let s = 1; s <= 4; s++) {
      const a = rad(a0 + (random(`crack-${i}-${s}`) - 0.5) * 40);
      const rr = (COIN.r * s) / 4;
      pts.push([COIN.cx + Math.cos(a) * rr, COIN.cy + Math.sin(a) * rr]);
    }
    return pts;
  });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="coinFace" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FFF1C9" />
          <stop offset="0.35" stopColor={COLORS.bright} />
          <stop offset="0.8" stopColor={COLORS.gold} />
          <stop offset="1" stopColor="#8E733F" />
        </radialGradient>
      </defs>
      <g transform={`translate(${COIN.cx} ${COIN.cy}) scale(${coinFace > 0 ? scaleX : 1} 1) translate(${-COIN.cx} ${-COIN.cy})`}>
        {coinFace < 1 ? (
          <g opacity={1 - coinFace}>
            {SEGS.map((s, i) => (
              <path
                key={i}
                d={arcPath(rIn, rOut, s.a0 + pad, s.a1 - pad, cx, cy)}
                fill={s.other ? COLORS.gray : COLORS.gold}
                opacity={0.85}
              />
            ))}
          </g>
        ) : null}
        {coinFace > 0 ? (
          <g opacity={coinFace} style={{filter: `drop-shadow(0 0 ${24 + crack * 30}px ${COLORS.bright}88)`}}>
            <circle cx={COIN.cx} cy={COIN.cy} r={COIN.r} fill="url(#coinFace)" />
            <circle cx={COIN.cx} cy={COIN.cy} r={COIN.r - 12} fill="none" stroke="#8E733F" strokeWidth={3} />
            <circle cx={COIN.cx} cy={COIN.cy} r={COIN.r - 22} fill="none" stroke="#FFF1C9" strokeWidth={1} opacity={0.6} />
            <text
              x={COIN.cx}
              y={COIN.cy + 30}
              textAnchor="middle"
              fontFamily={FONTS.num}
              fontWeight={500}
              fontSize={92}
              fill="#8E733F"
              opacity={Math.abs(scaleX) > 0.2 ? 0.9 : 0}
            >
              ¥
            </text>
            {crack > 0
              ? cracks.map((pts, i) => (
                  <polyline
                    key={i}
                    points={pts
                      .slice(0, 1 + Math.ceil(crack * 4))
                      .map((p) => p.join(','))
                      .join(' ')}
                    fill="none"
                    stroke="#FFF6DD"
                    strokeWidth={2.4}
                  />
                ))
              : null}
          </g>
        ) : null}
      </g>
    </svg>
  );
};

const rad = (d: number) => (d * Math.PI) / 180;

/** 金币碎成光点，像雨一样落下 */
const GoldRain: React.FC<{frame: number}> = ({frame}) => {
  const t = frame - S6.burstAt * FPS;
  if (t < 0) {
    return null;
  }
  const dots: React.ReactNode[] = [];
  // 1. 碎裂瞬间的迸散
  for (let i = 0; i < 320; i++) {
    const r = (k: string) => random(`burst-${i}-${k}`);
    const a = r('a') * Math.PI * 2;
    const v = 3 + r('v') * 13;
    const drag = Math.pow(0.94, t);
    const d = (v * (1 - drag)) / 0.06;
    const x = COIN.cx + Math.cos(a) * d * 1.6;
    const y = COIN.cy + Math.sin(a) * d * 0.8 + 0.09 * t * t;
    if (y > HEADS_Y + 40 || t > 90) {
      continue;
    }
    const op = interpolate(t, [0, 4, 70, 90], [0, 1, 0.8, 0], clamp01);
    dots.push(<circle key={`b${i}`} cx={x} cy={y} r={1.4 + r('s') * 2.8} fill={r('c') > 0.5 ? COLORS.bright : COLORS.gold} opacity={op} />);
  }
  // 2. 持续的光点雨
  const rainFrames = (S6.rainTo - S6.burstAt) * FPS;
  const total = 1100;
  for (let i = 0; i < total; i++) {
    const r = (k: string) => random(`rain-${i}-${k}`);
    const born = (i / total) * rainFrames + r('b') * 6;
    const age = t - born;
    if (age < 0) {
      continue;
    }
    const x = CROWD.x0 - 30 + r('x') * (CROWD.x1 - CROWD.x0 + 60);
    const vy = 3.2 + r('v') * 4.5;
    const y0 = -20 + r('y') * 260;
    const y = y0 + vy * age + 0.02 * age * age;
    const land = HEADS_Y + 10 + r('l') * 120;
    if (y > land + 20) {
      continue;
    }
    const fade = interpolate(y, [land - 30, land + 20], [1, 0], clamp01);
    const tw = 0.55 + 0.45 * Math.sin(age * (0.2 + r('f') * 0.3) + r('p') * 6);
    const size = 1 + r('s') * 2.6;
    dots.push(
      <g key={`r${i}`} opacity={fade * tw}>
        <line x1={x} x2={x} y1={y - size * 5} y2={y} stroke={COLORS.gold} strokeWidth={size * 0.6} opacity={0.35} />
        <circle cx={x} cy={y} r={size} fill={r('c') > 0.7 ? COLORS.bright : COLORS.gold} />
      </g>,
    );
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <g style={{filter: `drop-shadow(0 0 4px ${COLORS.bright})`}}>{dots}</g>
    </svg>
  );
};

const Crowd: React.FC<{frame: number}> = ({frame}) => {
  const lit = tween(frame, [S6.burstAt + 0.5, S6.rainTo - 1], [0, 1], Easing.inOut(Easing.sin));
  const color = interpolateColors(lit, [0, 1], [COLORS.gray, COLORS.gold]);
  const people = [];
  for (let i = 0; i < CROWD.count; i++) {
    const r = (k: string) => random(`crowd-${i}-${k}`);
    const x = CROWD.x0 + ((CROWD.x1 - CROWD.x0) * i) / (CROWD.count - 1) + (r('x') - 0.5) * 24;
    const scale = 1.35 + r('s') * 0.35;
    const sway = Math.sin(frame * 0.05 + r('p') * 6) * 1.5;
    // 每个人被照亮的时间略有先后
    const own = interpolate(lit, [r('d') * 0.35, r('d') * 0.35 + 0.65], [0, 1], clamp01);
    people.push(
      <Figure
        key={i}
        x={x}
        y={CROWD.feet + (i % 2) * 6}
        scale={scale}
        lean={sway}
        color={interpolateColors(own, [0, 1], [COLORS.gray, COLORS.gold])}
        opacity={0.75 + own * 0.25}
      />,
    );
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="crowdGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLORS.gold} stopOpacity={0.3} />
          <stop offset="0.5" stopColor={COLORS.gold} stopOpacity={0.12} />
          <stop offset="1" stopColor={COLORS.gold} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={(CROWD.x0 + CROWD.x1) / 2} cy={CROWD.feet + 20} rx={760} ry={300} fill="url(#crowdGlow)" opacity={lit * 0.75} />
      <g style={{filter: lit > 0.05 ? `drop-shadow(0 0 ${8 * lit}px ${color})` : undefined}}>{people}</g>
    </svg>
  );
};

const Card: React.FC<{frame: number; i: number}> = ({frame, i}) => {
  const at = S6.cardsAt[i] * FPS;
  if (frame < at) {
    return null;
  }
  const c = MONEY_CARDS[i];
  const pop = spring({frame: frame - at, fps: FPS, config: {damping: 14, stiffness: 160, mass: 0.7}});
  const roll = interpolate(frame, [at + 4, at + 4 + 1.3 * FPS], [0, 1], {...clamp01, easing: Easing.out(Easing.cubic)});
  const isNew = interpolate(frame - at, [0, 10, 40], [0, 1, 0], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1372,
        top: 112 + i * 122,
        width: 468,
        height: 104,
        boxSizing: 'border-box',
        padding: '14px 24px 0 28px',
        background: `linear-gradient(90deg, ${COLORS.gold}1F, ${COLORS.gold}08)`,
        border: `1px solid ${COLORS.gold}${isNew > 0.1 ? 'CC' : '55'}`,
        borderLeft: `3px solid ${COLORS.gold}`,
        opacity: pop,
        transform: `translateX(${(1 - pop) * 40}px) scale(${0.92 + 0.08 * pop})`,
        transformOrigin: 'right center',
        boxShadow: isNew > 0 ? `0 0 ${26 * isNew}px ${COLORS.gold}55` : undefined,
      }}
    >
      <div style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 21, color: COLORS.text, opacity: 0.72, letterSpacing: '0.04em'}}>
        {c.label}
      </div>
      <div style={{marginTop: 4}}>
        <Num value={c.value} progress={roll} prefix={c.prefix} unit={c.unit} size={50} color={COLORS.gold} />
      </div>
    </div>
  );
};

export const Scene6Money: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[5];
  return (
    <SceneShell scene={scene}>
      <Motes frame={frame + 3000} seed="s6" />
      <Crowd frame={frame} />
      <GoldRain frame={frame} />
      <Coin frame={frame} />
      {frame >= S6.burstAt * FPS && frame < S6.burstAt * FPS + 14 ? (
        <div
          style={{
            position: 'absolute',
            left: COIN.cx - 300,
            top: COIN.cy - 300,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, #FFF6DDDD 0%, ${COLORS.bright}55 25%, ${COLORS.bright}00 65%)`,
            opacity: interpolate(frame - S6.burstAt * FPS, [0, 14], [1, 0], clamp01),
          }}
        />
      ) : null}
      {MONEY_CARDS.map((_, i) => (
        <Card key={i} frame={frame} i={i} />
      ))}
    </SceneShell>
  );
};
