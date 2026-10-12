/**
 * 镜头12（126–142s）重点镜头：画面中间出现一条竖向金色细线，分成左右两半。
 * 左：冰壳中的静止小球，所在道路尽头浮现淡淡的人影轮廓，标注「爸妈的期待」，上方金字「早闭」。
 * 右：一颗仍在颤动的小球，面前四条路都在发光，上方金字「延缓」。
 */
import React from 'react';
import {GoldText, IceShell, Roads, Silhouette} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {LABELS} from '../config/timeline';
import {fade, jitter, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';

/** 左半：冻住的小球与它落下的那条路 */
export const FROZEN = {x: 540, y: 370};
const PERSON = {x: 430, y: 588};
const RIGHT_BALL = {x: 1440, y: 360};
const TITLE_Y = 190;

export const Shot12: React.FC = () => {
  const {t, gt} = useShot();
  const line = tween(t, 0, 1.2);
  const leftTitle = fade(t, 1.2, 2.3);
  const person = fade(t, 2.2, 3.8) * 0.42;
  const personLabel = fade(t, 2.8, 3.9);
  const right = fade(t, 0.8, 2.0);
  const roads = LABELS.roads.map((_, i) => tween(t, 1.5 + i * 0.15, 3.0 + i * 0.15));
  // 第二段字幕（「延缓」）出来时右半更亮
  const rightBoost = tween(t, 9.8, 11.0);
  const rightTitle = fade(t, 9.9, 11.0);
  const leftDim = keys(t, [9.8, 11.0], [1, 0.7]);
  const glowPulse = LABELS.roads.map((_, i) => 0.55 + 0.45 * rightBoost * (0.6 + 0.4 * Math.sin(t * 2.4 + i * 1.3)));
  const j = jitter(gt, 1.0, 'moratorium');

  const roadPath = `M ${FROZEN.x} ${FROZEN.y + 40} C ${FROZEN.x} ${FROZEN.y + 120} ${PERSON.x + 10} ${PERSON.y - 150} ${PERSON.x} ${PERSON.y - 56}`;

  return (
    <Stage>
      {/* 中线 */}
      <line
        x1={960}
        y1={120}
        x2={960}
        y2={120 + 680 * line}
        stroke="url(#gold-stroke)"
        strokeWidth={1.4}
        opacity={0.8}
      />

      {/* 左半：早闭 */}
      <g opacity={leftDim}>
        <GoldText x={480} y={TITLE_Y} size={64} weight={600} spacing="0.4em" opacity={leftTitle}>
          {LABELS.foreclosure}
        </GoldText>
        <path d={roadPath} fill="none" stroke="url(#gold-stroke)" strokeWidth={2} opacity={0.4} />
        <Silhouette cx={PERSON.x} cy={PERSON.y} scale={0.85} opacity={person} />
        <GoldText x={PERSON.x} y={PERSON.y + 152} size={28} spacing="0.12em" opacity={personLabel * 0.75}>
          {LABELS.parents}
        </GoldText>
        <GoldBall x={FROZEN.x} y={FROZEN.y} cold={1} glow={0.5} />
        <IceShell x={FROZEN.x} y={FROZEN.y} r={28} amount={1} />
      </g>

      {/* 右半：延缓 */}
      <g opacity={right}>
        <GoldText x={1440} y={TITLE_Y} size={64} weight={600} spacing="0.4em" opacity={rightTitle}>
          {LABELS.moratorium}
        </GoldText>
        <Roads
          origin={{x: RIGHT_BALL.x, y: RIGHT_BALL.y + 44}}
          spread={255}
          length={250}
          draw={roads}
          lit={glowPulse}
          base={0.6}
          labels={LABELS.roads}
          labelSize={26}
        />
        <GoldBall x={RIGHT_BALL.x + j.x} y={RIGHT_BALL.y + j.y} glow={1 + 0.2 * rightBoost} />
      </g>
    </Stage>
  );
};
