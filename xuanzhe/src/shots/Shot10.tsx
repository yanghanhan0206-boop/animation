/**
 * 镜头10（98–112s）漩涡逐渐减速平息，细线重新排列成有序的金色神经网络并逐点点亮。
 * 石头再次出现，小球移到两块石头前，提前避开了下面有蛇的那块，那块石头闪一下暗红色光后熄灭。
 */
import React from 'react';
import {BallZoom, MIND, MIND_TIME, MindLines} from '../components/Mind';
import {Stage} from '../components/Stage';
import {STONES, Stone, stoneByKey} from '../components/Stones';
import {BALL} from '../config/theme';
import {EASE, clamp, fade, jitter, keys, sampleTrail, type Point} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {insideOf} from './Shot08';

/** 两块主角石头：左边下面有蛇，右边安全 */
export const SNAKE_STONE = stoneByKey('r2c1');
export const SAFE_STONE = stoneByKey('r2c2');

const C = {x: MIND.cx, y: MIND.cy};
const MID = {x: (SNAKE_STONE.x + SAFE_STONE.x) / 2, y: SAFE_STONE.y - 108};
const NEAR_SNAKE = {x: SNAKE_STONE.x + 46, y: SNAKE_STONE.y - 96};
/** 镜头10 结束时小球的位置（镜头11 从这里接） */
export const SHOT10_END: Point = {x: SAFE_STONE.x, y: SAFE_STONE.y - 94};

const ballPath = (t: number): Point => ({
  x: keys(t, [8.8, 9.8, 10.7, 11.1, 12.3], [C.x, MID.x, NEAR_SNAKE.x, NEAR_SNAKE.x, SHOT10_END.x]),
  y: keys(t, [8.8, 9.8, 10.7, 11.1, 12.3], [C.y, MID.y, NEAR_SNAKE.y, NEAR_SNAKE.y, SHOT10_END.y]),
});

export const Shot10: React.FC = () => {
  const {t, gt} = useShot();
  const pullK = EASE(clamp((gt - MIND_TIME.pull[0]) / (MIND_TIME.pull[1] - MIND_TIME.pull[0])));
  const r = MIND.R * Math.pow(BALL.radius / MIND.R, pullK);
  const inside = insideOf(r);
  const solid = 1 - inside;

  const pos = ballPath(t);
  const tension = keys(t, [8.6, 9.8, 10.7, 11.1, 12.3], [0.8, 0.9, 1.6, 1.7, 0.6]);
  const j = jitter(gt, tension);
  const trail = t > 8.6 ? sampleTrail(ballPath, t) : undefined;

  const stonesOn = fade(t, 8.0, 9.2);
  const danger = keys(t, [10.8, 11.05, 11.8], [0, 1, 0]);
  const snakeOut = keys(t, [11.3, 12.2], [1, 0.12]);

  return (
    <Stage>
      {stonesOn > 0 &&
        STONES.map((s) => {
          const main = s.key === SNAKE_STONE.key || s.key === SAFE_STONE.key;
          const op = main ? (s.key === SNAKE_STONE.key ? snakeOut : 1) : 0.16;
          return (
            <Stone
              key={s.key}
              s={s}
              appear={stonesOn}
              opacity={op * stonesOn}
              danger={s.key === SNAKE_STONE.key ? danger : 0}
            />
          );
        })}
      {trail && (
        <g>
          {trail
            .map((q, i) => {
              const d = Math.hypot(q.x - pos.x, q.y - pos.y);
              const vis = clamp((d - 2) / 14);
              return vis > 0 ? (
                <circle key={i} cx={q.x} cy={q.y} r={BALL.radius * (1 - 0.035 * (i + 1))} fill="url(#ball-body)" opacity={0.32 * Math.pow(1 - (i + 1) / 9, 1.35) * vis} />
              ) : null;
            })
            .reverse()}
        </g>
      )}
      <BallZoom x={pos.x + j.x * solid} y={pos.y + j.y * solid} r={r} inside={inside} />
      <MindLines gt={gt} scale={r / MIND.R} opacity={inside} />
    </Stage>
  );
};
