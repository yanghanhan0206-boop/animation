/**
 * 镜头13（142–152s）左半淡出，中线消失。右半的颤动小球移到画面中央并放大。
 */
import React from 'react';
import {GoldText, Roads, Silhouette} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {BALL} from '../config/theme';
import {FrozenScene} from './Shot11';
import {PERSON, RIGHT_BALL, RIGHT_ROADS, SHIFT, SHOT12_RIGHT_GLOW, rightRoadGlow} from './Shot12';
import {HERO_SCALE, SKY_CENTER} from './Shot14';
import {LABELS} from '../config/timeline';
import {EASE, clamp, jitter, keys, lerp, sampleTrail, tween, type Point} from '../lib/anim';
import {useShot} from '../lib/shot-context';

const MOVE = [1.0, 4.0];
const ballPath = (t: number): Point => {
  const k = EASE(clamp((t - MOVE[0]) / (MOVE[1] - MOVE[0])));
  return {x: lerp(RIGHT_BALL.x, SKY_CENTER.x, k), y: lerp(RIGHT_BALL.y, SKY_CENTER.y, k) - 40 * Math.sin(Math.PI * k)};
};

export const Shot13: React.FC = () => {
  const {t, gt, dur} = useShot();
  const left = 0.7 * (1 - tween(t, 0, 1.6));
  const lineK = tween(t, 0.3, 1.6);
  const titles = 1 - tween(t, 0, 1.2);
  const roads = 1 - tween(t, 0.4, 2.0);
  const scale = keys(t, [1.6, 4.6], [1, HERO_SCALE]);
  const glow = keys(t, [1.0, 3.0], [SHOT12_RIGHT_GLOW, 1]);
  const tension = keys(t, [0, dur], [1.0, 0.9]);
  const j = jitter(gt, tension);
  const pos = ballPath(t);
  const trail = sampleTrail(ballPath, t);

  return (
    <Stage>
      {lineK < 1 && (
        <line
          x1={960}
          y1={lerp(120, 460, EASE(lineK))}
          x2={960}
          y2={lerp(800, 460, EASE(lineK))}
          stroke="url(#gold-stroke)"
          strokeWidth={1.4}
          opacity={0.8 * (1 - lineK)}
        />
      )}
      {left > 0.001 && (
        <g opacity={left}>
          <g transform={`translate(${SHIFT.x} ${SHIFT.y})`}>
            <FrozenScene upper={0} lower={0.4} ice={1} cold={1} />
          </g>
          <GoldText x={520} y={190} size={64} weight={600} spacing="0.4em" opacity={titles}>
            {LABELS.foreclosure}
          </GoldText>
          <Silhouette cx={PERSON.x} cy={PERSON.y} scale={0.85} opacity={0.42} />
          <GoldText x={PERSON.x} y={PERSON.y + 150} size={28} spacing="0.12em" opacity={0.75}>
            {LABELS.parents}
          </GoldText>
        </g>
      )}
      <GoldText x={RIGHT_BALL.x} y={190} size={64} weight={600} spacing="0.4em" opacity={titles}>
        {LABELS.moratorium}
      </GoldText>
      {roads > 0.001 && (
        <Roads
          origin={{x: RIGHT_BALL.x, y: RIGHT_BALL.y + 44}}
          spread={RIGHT_ROADS.spread}
          length={RIGHT_ROADS.length}
          lit={rightRoadGlow(gt, 1).map((l) => l * roads)}
          base={0.6 * roads}
          labels={LABELS.roads}
          labelSize={26}
          labelOpacity={roads}
        />
      )}
      <GoldBall
        x={pos.x + j.x * scale}
        y={pos.y + j.y * scale}
        r={BALL.radius * scale}
        glow={glow}
        trail={trail}
      />
    </Stage>
  );
};
