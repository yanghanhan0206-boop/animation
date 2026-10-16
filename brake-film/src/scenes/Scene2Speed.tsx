import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {FPS, SCENES} from '../data';
import {Figure, GoldLine} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {clamp01, COLORS, tween} from '../theme';

/** 第二场 为什么要限速：节拍（本场秒数） */
export const S2 = {
  walkFrom: 0.4,
  ticksFrom: 0.5,
  /** 滴答在第二条字幕结束时停止 */
  ticksTo: SCENES[1].subtitles[SCENES[1].subtitles.length - 1].to,
  shakeFrom: 7.4,
  shakeFull: 9.4,
};

/** 逐渐加速的滴答时间点（本场秒数），画面上的表针和音效共用 */
export const tickTimes = (): number[] => {
  const out: number[] = [];
  let t = S2.ticksFrom;
  const span = S2.ticksTo - S2.ticksFrom;
  while (t < S2.ticksTo - 0.05) {
    out.push(Math.round(t * 1000) / 1000);
    const k = Math.min(1, (t - S2.ticksFrom) / span);
    t += 0.78 - 0.66 * Math.pow(k, 1.25);
  }
  return out;
};
const TICKS = tickTimes();

const COUNT = 14;
const SPACING = 128;
const WALL_X = 1770;
const CROWD_GAP = 30;
const FEET_Y = 742;
const SCALE = 1.75;

/** 行走速度（像素/帧），越走越快 */
const speedAt = (t: number) => 3 + 26 * Math.pow(Math.max(0, t) / 300, 2);

export const Scene2Speed: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[1];
  const t0 = S2.walkFrom * FPS;

  // 逐帧积分出走过的距离与步态相位（确定性，可从任意帧重算）
  let dist = 0;
  let phase = 0;
  for (let f = t0; f < frame; f++) {
    const v = speedAt(f - t0);
    dist += v;
    phase += Math.min((v / 70) * Math.PI * 2, 1.25);
  }
  const v = speedAt(frame - t0);
  const runFactor = interpolate(v, [3, 26], [0, 1], clamp01);

  const shakeAmp =
    interpolate(frame, [S2.shakeFrom * FPS, S2.shakeFull * FPS], [0, 6], clamp01) *
    interpolate(frame, [S2.ticksTo * FPS, S2.ticksTo * FPS + 12], [1, 0.25], clamp01);
  const sx = (random(`s2x${frame}`) - 0.5) * 2 * shakeAmp;
  const sy = (random(`s2y${frame}`) - 0.5) * 2 * shakeAmp;

  const figures = [];
  const streaks = [];
  for (let i = 0; i < COUNT; i++) {
    const free = -80 + dist - i * SPACING;
    const slot = WALL_X - i * CROWD_GAP;
    const blocked = free >= slot;
    const x = Math.min(free, slot);
    if (x < -120) {
      continue;
    }
    const jitter = blocked ? Math.sin(frame * 0.9 + i * 1.7) * 2.2 : 0;
    const p = blocked ? frame * 0.9 + i : phase + i * 0.6;
    const swing = blocked ? 10 : 24 + 16 * runFactor;
    figures.push(
      <Figure
        key={i}
        x={x + jitter}
        y={FEET_Y}
        scale={SCALE}
        phase={p}
        swing={swing}
        lean={blocked ? 4 : 2 + 10 * runFactor}
        color={COLORS.gold}
        opacity={blocked ? 0.78 : 0.9}
      />,
    );
    if (!blocked && runFactor > 0.15) {
      const len = 40 + 260 * runFactor;
      streaks.push(
        <rect
          key={`st${i}`}
          x={x - len - 18}
          y={FEET_Y - 120 + (i % 3) * 30}
          width={len}
          height={2}
          fill="url(#s2streak)"
          opacity={0.5 * runFactor}
        />,
      );
    }
  }

  // 表针：每声滴答跳一格
  const ticksDone = TICKS.filter((t) => frame >= t * FPS).length;
  const handAngle = ticksDone * 30;
  const dialIn = tween(frame, [0.4, 1.2], [0, 1]);

  return (
    <SceneShell
      scene={scene}
      camera={{transform: `translate(${sx}px, ${sy}px)`}}
    >
      <Motes frame={frame + 400} seed="s2" />
      <GoldLine />
      {/* 地面 */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: FEET_Y + 2,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gray} 12%, ${COLORS.gray} 88%, transparent)`,
          opacity: 0.8,
        }}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s2streak" x1="0" x2="1">
            <stop offset="0" stopColor={COLORS.gold} stopOpacity={0} />
            <stop offset="1" stopColor={COLORS.gold} stopOpacity={0.9} />
          </linearGradient>
        </defs>
        {streaks}
        {figures}
        {/* 小表盘 */}
        <g transform="translate(1760 150)" opacity={dialIn * 0.85}>
          <circle r={34} fill="none" stroke={COLORS.gray} strokeWidth={2} />
          {Array.from({length: 12}).map((_, k) => (
            <line
              key={k}
              x1={0}
              y1={-28}
              x2={0}
              y2={-24}
              stroke={COLORS.gray}
              strokeWidth={2}
              transform={`rotate(${k * 30})`}
            />
          ))}
          <line x1={0} y1={4} x2={0} y2={-26} stroke={COLORS.gold} strokeWidth={2.4} transform={`rotate(${handAngle})`} />
          <circle r={3} fill={COLORS.gold} />
        </g>
      </svg>
    </SceneShell>
  );
};
