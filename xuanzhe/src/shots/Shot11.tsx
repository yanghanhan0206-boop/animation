/**
 * 镜头11（112–126s）小球突然慌乱下坠，落在最近的一条路上，发出「咔」的锁定感（缩放回弹 6 帧），
 * 随即表面结出一层半透明金色冰壳，完全静止，光芒变冷。
 */
import React from 'react';
import {GoldText, IceShell, Roads, roadGeometry, roadSegmentPath} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {STONES, Stone} from '../components/Stones';
import {BALL, COLORS} from '../config/theme';
import {FPS, LABELS} from '../config/timeline';
import {EASE, bezierPoint, clamp, fade, jitter, keys, lerp, sampleTrail, tween, type Point} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {ROAD_LENGTH, ROAD_ORIGIN, ROAD_SPREAD} from './Shot02';
import {SAFE_STONE, SHOT10_END, SNAKE_STONE} from './Shot10';

/** 落在第 2 条路（工作）上，路程一半的位置 */
export const FALL_ROAD = 2;
export const FALL_K = 0.5;
export const FALL_GEOM = roadGeometry(ROAD_ORIGIN, ROAD_SPREAD, ROAD_LENGTH, FALL_ROAD);
const ON_ROAD = bezierPoint(FALL_GEOM.p0, FALL_GEOM.p1, FALL_GEOM.p2, FALL_GEOM.p3, FALL_K);
/** 冻住的小球中心 */
export const LANDED: Point = {x: ON_ROAD.x, y: ON_ROAD.y - BALL.radius - 3};
const HOVER: Point = {x: LANDED.x + 18, y: 430};

const PANIC = [1.8, 2.4];
const FALL = [2.4, 2.88];
const LOCK = FALL[1];
const ICE = [3.1, 5.2];

const ballPath = (t: number): Point => {
  if (t < FALL[0]) {
    return {x: keys(t, [0.3, 1.8], [SHOT10_END.x, HOVER.x]), y: keys(t, [0.3, 1.8], [SHOT10_END.y, HOVER.y])};
  }
  // 下坠：缓入（越落越快），到路面时停住
  const k = clamp((t - FALL[0]) / (FALL[1] - FALL[0]));
  const e = k * k;
  return {x: lerp(HOVER.x, LANDED.x, e), y: lerp(HOVER.y, LANDED.y, e)};
};

/** 镜头11 结束时的场景（镜头12 左半直接平移它） */
export const FrozenScene: React.FC<{
  upper: number;
  lower: number;
  ice: number;
  cold: number;
  label?: number;
  /** 是否画小球（镜头11 锁定瞬间小球要单独画在最上层做回弹） */
  ball?: boolean;
}> = ({upper, lower, ice, cold, label = 0, ball = true}) => (
  <g>
    {upper > 0.001 && (
      <path d={roadSegmentPath(FALL_GEOM, 0, FALL_K)} fill="none" stroke="url(#gold-stroke)" strokeWidth={2} opacity={upper} />
    )}
    <path d={roadSegmentPath(FALL_GEOM, FALL_K, 1)} fill="none" stroke="url(#gold-stroke)" strokeWidth={2} opacity={lower} />
    {label > 0.001 && (
      <GoldText x={FALL_GEOM.p3.x} y={FALL_GEOM.p3.y + 34 * 1.35} size={34} spacing="0.12em" opacity={label}>
        {LABELS.roads[FALL_ROAD]}
      </GoldText>
    )}
    {ball && <GoldBall x={LANDED.x} y={LANDED.y} cold={cold} glow={1 - 0.5 * cold} />}
    {ball && <IceShell x={LANDED.x} y={LANDED.y} r={BALL.radius} amount={ice} />}
  </g>
);

export const Shot11: React.FC = () => {
  const {t, gt} = useShot();
  const stones = 1 - tween(t, 0, 1.2);
  const draw = LABELS.roads.map((_, i) => tween(t, 0.6 + i * 0.15, 2.0 + i * 0.15));
  const labelsOn = LABELS.roads.map((_, i) => fade(t, 1.2 + i * 0.15, 2.2 + i * 0.15) * (1 - tween(t, 3.4, 5.4)));
  const others = keys(t, [LOCK, LOCK + 1.4], [0.55, 0]);
  const hit = keys(t, [LOCK, LOCK + 0.1, LOCK + 1.2], [0, 1, 0]);

  // 颤动：平时 0.6，慌乱时剧烈，锁定后很快完全静止
  const tension = keys(t, [0, PANIC[0], PANIC[1]], [0.6, 0.7, 2.4]);
  const still = 1 - tween(t, LOCK, LOCK + 0.5);
  const j = jitter(gt, tension);
  const pos = ballPath(t);
  const trail = t > 0.3 && t < LOCK + 0.4 ? sampleTrail(ballPath, t) : undefined;

  // 「咔」：6 帧缩放回弹 + 一圈收紧的锁环
  const f = (t - LOCK) * FPS;
  const snap = f >= 0 && f <= 6 ? keys(f, [0, 1.5, 3, 4.5, 6], [1, 0.84, 1.1, 0.97, 1]) : 1;
  const ring = f >= 0 && f <= 8 ? f / 8 : -1;

  const ice = tween(t, ICE[0], ICE[1]);
  const cold = tween(t, ICE[0], ICE[1] + 0.3);
  const locked = t >= LOCK;

  return (
    <Stage>
      {stones > 0 &&
        STONES.map((s) => {
          const main = s.key === SNAKE_STONE.key || s.key === SAFE_STONE.key;
          return <Stone key={s.key} s={s} opacity={(main ? (s.key === SNAKE_STONE.key ? 0.12 : 1) : 0.16) * stones} />;
        })}

      <Roads
        origin={ROAD_ORIGIN}
        spread={ROAD_SPREAD}
        length={ROAD_LENGTH}
        draw={draw}
        base={LABELS.roads.map((_, i) => (i === FALL_ROAD ? (locked ? 0 : 0.55) : others))}
        lit={LABELS.roads.map((_, i) => (i === FALL_ROAD ? hit : 0))}
        labels={LABELS.roads.map((l, i) => (i === FALL_ROAD ? '' : l))}
        labelOpacity={labelsOn}
      />
      {!locked && (
        <GoldText
          x={FALL_GEOM.p3.x}
          y={FALL_GEOM.p3.y + 34 * 1.35}
          size={34}
          spacing="0.12em"
          opacity={labelsOn[FALL_ROAD] * Math.min(1, draw[FALL_ROAD] * 1.2) * 0.55}
        >
          {LABELS.roads[FALL_ROAD]}
        </GoldText>
      )}

      {locked ? (
        <g>
          <FrozenScene
            upper={keys(t, [LOCK, ICE[0], ICE[1] + 0.8], [0.55, 0.55, 0])}
            lower={keys(t, [LOCK, ICE[1] + 0.8], [0.55, 0.4])}
            ice={0}
            cold={0}
            label={0.55 * labelsOn[FALL_ROAD]}
            ball={false}
          />
          {hit > 0 && (
            <path
              d={roadSegmentPath(FALL_GEOM, 0, 1)}
              fill="none"
              stroke={COLORS.gold1}
              strokeWidth={3}
              opacity={hit}
              filter="url(#glow)"
            />
          )}
          {/* 小球单独画在最上层：回弹、变冷、结冰 */}
          <g transform={`translate(${LANDED.x} ${LANDED.y}) scale(${snap}) translate(${-LANDED.x} ${-LANDED.y})`}>
            <GoldBall x={LANDED.x + j.x * still} y={LANDED.y + j.y * still} cold={cold} glow={1 - 0.5 * cold} />
          </g>
          <IceShell x={LANDED.x} y={LANDED.y} r={BALL.radius} amount={ice} />
          {ring >= 0 && (
            <circle
              cx={LANDED.x}
              cy={LANDED.y}
              r={BALL.radius * lerp(2.4, 1.2, EASE(ring))}
              fill="none"
              stroke={COLORS.gold1}
              strokeWidth={2}
              opacity={1 - ring}
            />
          )}
        </g>
      ) : (
        <GoldBall x={pos.x + j.x} y={pos.y + j.y} trail={trail} />
      )}
    </Stage>
  );
};
