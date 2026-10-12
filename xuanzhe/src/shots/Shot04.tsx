/**
 * 镜头4（23–36s）小球身后出现一条从左到右的笔直金色轨道，小球沿轨道匀速平稳前进，
 * 依次经过「中考」「高考」「期末」「绩点」，每经过一个，刻度旁亮起金色对勾。
 * 到画面中央时，轨道在小球脚下碎裂成金色粒子散落，前方是空旷黑暗。小球悬停，剧烈颤动。
 */
import React from 'react';
import {Check, GoldText} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {BALL, COLORS, HOME} from '../config/theme';
import {LABELS} from '../config/timeline';
import {EASE, clamp, fade, jitter, keys, lerp, randRange, sampleTrail, tween, type Point} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {SHOT3_END_TENSION} from './Shot03';

const TRACK_Y = 600;
const RIDE_Y = TRACK_Y - BALL.radius - 6;
const TRACK_X0 = 120;
const TRACK_X1 = 1040;
/** 从这里往右的轨道会碎掉（在「绩点」与对勾的右侧） */
const BREAK_X = 892;
const START_X = 250;
const STOP_X = HOME.x;
const TICKS_X = [400, 540, 680, 820];

/** 时间点（秒，相对本镜头） */
const SWOOP = [0.3, 2.0];
const RIDE = [2.2, 8.2];
const BREAK = 8.3;

/** 匀速巡航，两端各 0.45s 缓入缓出 */
const ride = (t: number) => {
  const [a, b] = RIDE;
  const ramp = 0.45;
  const T = b - a;
  const vmax = 1 / (T - ramp);
  const u = clamp(t - a, 0, T);
  if (u < ramp) {
    return (vmax * u * u) / (2 * ramp);
  }
  if (u > T - ramp) {
    const r = T - u;
    return 1 - (vmax * r * r) / (2 * ramp);
  }
  return vmax * ramp * 0.5 + vmax * (u - ramp);
};

/** 不含颤动的小球轨迹 */
const ballPath = (t: number): Point => {
  if (t < RIDE[0]) {
    const k = EASE(clamp((t - SWOOP[0]) / (SWOOP[1] - SWOOP[0])));
    return {
      x: lerp(HOME.x, START_X, k),
      y: lerp(HOME.y, RIDE_Y, k) - 90 * Math.sin(Math.PI * k),
    };
  }
  const x = lerp(START_X, STOP_X, ride(t));
  const lift = tween(t, BREAK + 0.2, BREAK + 1.4, 0, 18);
  return {x, y: RIDE_Y - lift};
};

/** 小球经过第 i 个刻度的时刻 */
const passTime = (x: number) => {
  // ride() 单调，二分求解
  let lo = RIDE[0];
  let hi = RIDE[1];
  const target = (x - START_X) / (STOP_X - START_X);
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (ride(mid) < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
};

const SHARDS = Array.from({length: 110}, (_, i) => {
  const x = randRange(`shard-x-${i}`, BREAK_X, TRACK_X1);
  return {
    x,
    vx: randRange(`shard-vx-${i}`, -28, 28),
    vy: randRange(`shard-vy-${i}`, -90, 15),
    /** 0 = 小光点，其余为线段碎片 */
    len: i % 3 === 0 ? 0 : randRange(`shard-len-${i}`, 4, 12),
    rot0: randRange(`shard-r0-${i}`, 0, 180),
    spin: randRange(`shard-spin-${i}`, -400, 400),
    delay: Math.abs(x - STOP_X) / 900 + randRange(`shard-d-${i}`, 0, 0.12),
    life: randRange(`shard-life-${i}`, 1.1, 1.9),
  };
});

export const Shot04: React.FC = () => {
  const {t, gt, dur} = useShot();

  const pos = ballPath(t);
  const tension = keys(
    t,
    [0, SWOOP[1], RIDE[0] + 0.6, BREAK, BREAK + 0.35, dur],
    [SHOT3_END_TENSION, 0.8, 0.15, 0.15, 2.0, 1.9],
  );
  const j = jitter(gt, tension);
  const trail = sampleTrail(ballPath, t);

  // 轨道从左向右画出；前端渐隐，前方没有路
  const trackDraw = tween(t, 0.8, 2.6);
  const trackHead = lerp(TRACK_X0, TRACK_X1, trackDraw);
  const broken = t >= BREAK;
  const breakX = BREAK_X;
  const exitFade = 1 - tween(t, dur - 0.4, dur + 0.9);
  const crackFlash = keys(t, [BREAK - 0.15, BREAK, BREAK + 0.25], [0, 1, 0]);

  return (
    <Stage opacity={exitFade}>
      <defs>
        <linearGradient id="track-fade" gradientUnits="userSpaceOnUse" x1={TRACK_X0} y1="0" x2={TRACK_X1} y2="0">
          <stop offset="0" stopColor={COLORS.gold0} stopOpacity="0" />
          <stop offset="0.08" stopColor={COLORS.gold0} stopOpacity="1" />
          <stop offset="0.82" stopColor={COLORS.gold1} stopOpacity="1" />
          <stop offset="1" stopColor={COLORS.gold1} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 轨道 */}
      <line
        x1={TRACK_X0}
        y1={TRACK_Y}
        x2={broken ? breakX : trackHead}
        y2={TRACK_Y}
        stroke="url(#track-fade)"
        strokeWidth={2}
        opacity={broken ? 0.65 : 1}
      />
      {crackFlash > 0 && (
        <line
          x1={breakX}
          y1={TRACK_Y}
          x2={TRACK_X1}
          y2={TRACK_Y}
          stroke={COLORS.gold1}
          strokeWidth={3}
          opacity={crackFlash}
          filter="url(#glow)"
        />
      )}

      {/* 刻度、文字、对勾 */}
      {TICKS_X.map((x, i) => {
        const on = fade(t, 1.0 + i * 0.25, 2.0 + i * 0.25);
        const check = tween(t, passTime(x), passTime(x) + 0.45);
        return (
          <g key={i} opacity={on}>
            <line x1={x} y1={TRACK_Y - 9} x2={x} y2={TRACK_Y + 9} stroke="url(#gold-stroke)" strokeWidth={2} />
            <GoldText x={x} y={TRACK_Y + 44} size={28} spacing="0.1em" opacity={0.55 + 0.45 * check}>
              {LABELS.trackTicks[i]}
            </GoldText>
            <Check x={x + 50} y={TRACK_Y + 44} size={20} progress={check} />
          </g>
        );
      })}

      {/* 碎裂的粒子 */}
      {broken &&
        SHARDS.map((s, i) => {
          const u = t - BREAK - s.delay;
          if (u < 0) {
            return (
              <line key={i} x1={s.x} y1={TRACK_Y} x2={s.x + 6} y2={TRACK_Y} stroke={COLORS.gold1} strokeWidth={2} />
            );
          }
          const x = s.x + s.vx * u;
          const y = TRACK_Y + s.vy * u + 0.5 * 820 * u * u;
          const a = 1 - tween(u, s.life * 0.4, s.life);
          if (a <= 0) {
            return null;
          }
          const rot = s.rot0 + s.spin * u;
          if (s.len === 0) {
            return <circle key={i} cx={x} cy={y} r={2} fill="#FFF3C8" opacity={a} filter="url(#glow-soft)" />;
          }
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={a}>
              <line x1={-s.len / 2} y1={0} x2={s.len / 2} y2={0} stroke={COLORS.gold1} strokeWidth={1.8} />
            </g>
          );
        })}

      <GoldBall x={pos.x + j.x} y={pos.y + j.y} trail={trail} />
    </Stage>
  );
};
