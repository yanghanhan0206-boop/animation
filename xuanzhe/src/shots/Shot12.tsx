/**
 * 镜头12（126–142s）重点镜头：画面中间出现一条竖向金色细线，分成左右两半。
 * 左：冰壳中的静止小球，所在道路尽头浮现淡淡的人影轮廓，标注「爸妈的期待」，上方金字「早闭」。
 * 右：一颗仍在颤动的小球，面前四条路都在发光，上方金字「延缓」。
 * 左半就是镜头11 结束时的画面，平移到左边，镜头之间不切。
 */
import React from 'react';
import {GoldText, Roads, Silhouette} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {LABELS} from '../config/timeline';
import {fade, jitter, keys, lerp, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {FALL_GEOM, FrozenScene, LANDED} from './Shot11';

/** 冻住的小球平移到左半的这个位置 */
const FROZEN_TARGET = {x: 500, y: 330};
export const SHIFT = {x: FROZEN_TARGET.x - LANDED.x, y: FROZEN_TARGET.y - LANDED.y};
/** 人影头部中心：在那条路的尽头 */
export const PERSON = {x: FALL_GEOM.p3.x + SHIFT.x, y: FALL_GEOM.p3.y + SHIFT.y + 62};
export const RIGHT_BALL = {x: 1440, y: 360};
export const RIGHT_ROADS = {spread: 255, length: 250};
const TITLE_Y = 190;
export const SHOT12_RIGHT_GLOW = 1.2;

/** 右半四条路的光（按绝对时间算，镜头13 接着用） */
export const rightRoadGlow = (gt: number, boost: number) =>
  LABELS.roads.map((_, i) => 0.55 + 0.45 * boost * (0.6 + 0.4 * Math.sin(gt * 2.4 + i * 1.3)));

export const Shot12: React.FC = () => {
  const {t, gt} = useShot();
  const pan = tween(t, 0.2, 1.9);
  const line = tween(t, 0.8, 2.0);
  const leftTitle = fade(t, 1.6, 2.6);
  const person = fade(t, 2.2, 3.8) * 0.42;
  const personLabel = fade(t, 2.8, 3.9);
  const right = fade(t, 1.2, 2.4);
  const roads = LABELS.roads.map((_, i) => tween(t, 1.6 + i * 0.15, 3.1 + i * 0.15));
  // 第二段字幕（「延缓」）出来时右半更亮，左半退暗
  const rightBoost = tween(t, 9.8, 11.0);
  const rightTitle = fade(t, 9.9, 11.0);
  const leftDim = keys(t, [9.8, 11.0], [1, 0.7]);
  const j = jitter(gt, 1.0);

  return (
    <Stage>
      {/* 中线 */}
      <line x1={960} y1={120} x2={960} y2={120 + 680 * line} stroke="url(#gold-stroke)" strokeWidth={1.4} opacity={0.8 * Math.min(1, line * 4)} />

      {/* 左半：早闭 */}
      <g opacity={leftDim}>
        <g transform={`translate(${lerp(0, SHIFT.x, pan)} ${lerp(0, SHIFT.y, pan)})`}>
          <FrozenScene upper={0} lower={0.4} ice={1} cold={1} />
        </g>
        <GoldText x={520} y={TITLE_Y} size={64} weight={600} spacing="0.4em" opacity={leftTitle}>
          {LABELS.foreclosure}
        </GoldText>
        <Silhouette cx={PERSON.x} cy={PERSON.y} scale={0.85} opacity={person} />
        <GoldText x={PERSON.x} y={PERSON.y + 150} size={28} spacing="0.12em" opacity={personLabel * 0.75}>
          {LABELS.parents}
        </GoldText>
      </g>

      {/* 右半：延缓 */}
      <g opacity={right}>
        <GoldText x={RIGHT_BALL.x} y={TITLE_Y} size={64} weight={600} spacing="0.4em" opacity={rightTitle}>
          {LABELS.moratorium}
        </GoldText>
        <Roads
          origin={{x: RIGHT_BALL.x, y: RIGHT_BALL.y + 44}}
          spread={RIGHT_ROADS.spread}
          length={RIGHT_ROADS.length}
          draw={roads}
          lit={rightRoadGlow(gt, rightBoost)}
          base={0.6}
          labels={LABELS.roads}
          labelSize={26}
        />
        <GoldBall x={RIGHT_BALL.x + j.x} y={RIGHT_BALL.y + j.y} glow={1 + (SHOT12_RIGHT_GLOW - 1) * rightBoost} />
      </g>
    </Stage>
  );
};
