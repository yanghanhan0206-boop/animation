/**
 * 镜头1（0–7s）全黑，时钟出现（时钟由全局层负责）。中央小球悬空颤动。
 */
import React from 'react';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {BALL, HOME} from '../config/theme';
import {jitter, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';

/** 镜头1 结束时小球的颤动强度，镜头2 从这里接着往上加 */
export const SHOT1_END_TENSION = 0.45;

export const Shot01: React.FC = () => {
  const {t, gt, dur} = useShot();
  const appear = tween(t, 0.5, 2.6);
  const tension = keys(t, [0, dur], [0.2, SHOT1_END_TENSION]);
  const j = jitter(gt, tension);
  return (
    <Stage>
      <GoldBall
        x={HOME.x + j.x}
        y={HOME.y + j.y}
        r={BALL.radius * (0.8 + 0.2 * appear)}
        opacity={appear}
        glow={appear}
      />
    </Stage>
  );
};
