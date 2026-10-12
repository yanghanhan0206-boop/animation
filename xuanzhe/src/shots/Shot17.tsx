/**
 * 镜头17（186–196s）最后一颗光点停在路的前端，没有完全静止，而是极轻地呼吸闪烁
 * （光圈缓慢放大缩小，周期约 3 秒）。时钟 03:07 缓缓淡出（全局层）。最后 2 秒只剩这颗光点。
 */
import React from 'react';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {MiniCurve} from '../components/StressCurve';
import {COLORS} from '../config/theme';
import {at} from '../config/timeline';
import {EASE, clamp, jitter, lerp, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {DOT_R, LAST_DOT, LandedDots, MINI, RoadSegments, markerAt} from './Shot16';

/** 呼吸周期（秒） */
const BREATH = 3;

export const Shot17: React.FC = () => {
  const {t, gt} = useShot();
  // 镜头16 的时间继续往后算，路面和光点保持镜头16 结束时的样子
  const t16 = gt - at(16);
  // 摄影机慢慢推近并把光点移到画面中央
  const k = EASE(clamp((t - 0.4) / 7.2));
  const focus = {x: lerp(960, LAST_DOT.land.x, k), y: lerp(540, LAST_DOT.land.y, k)};
  const zoom = lerp(1, 2.0, k);
  // 路面、其他光点、小曲线在 194 秒前淡出，最后 2 秒只剩这颗光点
  const rest = 1 - tween(t, 3.6, 7.4);
  const breath = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / BREATH);
  const amp = tween(t, 0, 1.5);
  // 与镜头16 里这颗光点的颤动一致：极轻
  const j = jitter(gt, 0.3, `dot${LAST_DOT.m}`);
  const p = LAST_DOT.land;
  return (
    <Stage focus={focus} zoom={zoom}>
      <RoadSegments t={t16} opacity={rest} />
      <LandedDots t={t16} gt={gt} opacity={rest} skipLast />
      <MiniCurve x={MINI.x} y={MINI.y} w={MINI.w} h={MINI.h} marker={markerAt(t16)} opacity={rest} />
      {/* 呼吸的光圈 */}
      <circle cx={p.x} cy={p.y} r={DOT_R * (2.2 + 1.6 * breath)} fill="url(#ball-glow)" opacity={amp * (0.35 + 0.35 * breath)} />
      <circle
        cx={p.x}
        cy={p.y}
        r={DOT_R * (1.8 + 1.4 * breath)}
        fill="none"
        stroke={COLORS.gold1}
        strokeWidth={0.8}
        opacity={amp * (0.15 + 0.35 * breath)}
      />
      <GoldBall x={p.x + j.x * 0.25} y={p.y + j.y * 0.25} r={DOT_R} glow={1 + 0.3 * breath * amp} />
    </Stage>
  );
};
