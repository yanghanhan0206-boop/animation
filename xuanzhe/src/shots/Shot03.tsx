/**
 * 镜头3（16–23s）道路光芒渐暗，只剩小球在颤。
 */
import React from 'react';
import {Roads} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {HOME} from '../config/theme';
import {LABELS} from '../config/timeline';
import {jitter, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {ROAD_LENGTH, ROAD_ORIGIN, ROAD_SPREAD, SHOT2_END_TENSION} from './Shot02';

export const SHOT3_END_TENSION = 1.15;

export const Shot03: React.FC = () => {
  const {t, gt, dur} = useShot();
  const base = keys(t, [0, 3.8], [0.55, 0]);
  const labelOpacity = 1 - tween(t, 0.4, 3.4);
  const tension = keys(t, [0, dur], [SHOT2_END_TENSION, SHOT3_END_TENSION]);
  const j = jitter(gt, tension);
  return (
    <Stage>
      {base > 0.001 && (
        <Roads
          origin={ROAD_ORIGIN}
          spread={ROAD_SPREAD}
          length={ROAD_LENGTH}
          base={base}
          labels={LABELS.roads}
          labelOpacity={labelOpacity}
        />
      )}
      <GoldBall x={HOME.x + j.x} y={HOME.y + j.y} />
    </Stage>
  );
};
