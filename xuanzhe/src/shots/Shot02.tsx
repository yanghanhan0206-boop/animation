/**
 * 镜头2（7–16s）小球下方从中心向下展开四条金色细线道路，末端写「考研」「保研」「工作」「出国」。
 * 四条路轮流亮起又暗下，小球颤动加剧。
 */
import React from 'react';
import {Roads} from '../components/Elements';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {HOME} from '../config/theme';
import {LABELS} from '../config/timeline';
import {jitter, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {SHOT1_END_TENSION} from './Shot01';

/** 四条路的统一几何，镜头2、3、11 共用 */
export const ROAD_ORIGIN = {x: HOME.x, y: HOME.y + 50};
export const ROAD_SPREAD = 450;
export const ROAD_LENGTH = 270;
export const SHOT2_END_TENSION = 1.0;

/** 第 i 条路在 t0 亮起：0.35s 亮、0.45s 停、0.6s 暗 */
const pulse = (t: number, t0: number) => keys(t, [t0, t0 + 0.35, t0 + 0.8, t0 + 1.4], [0, 1, 1, 0]);

/** 前四次按顺序轮流亮，之后越来越快（秒，相对镜头2 起点） */
const LIT_SCHEDULE = [2.0, 3.4, 4.8, 6.2, 7.2, 7.75, 8.2, 8.55];

/** 每条路的亮度。sinceShot2 = 距镜头2 开始的秒数，镜头3 也用它，保证亮着的路平滑暗下 */
export const roadLit = (sinceShot2: number) =>
  LABELS.roads.map((_, i) => Math.max(0, ...LIT_SCHEDULE.filter((_, k) => k % 4 === i).map((t0) => pulse(sinceShot2, t0))));

export const Shot02: React.FC = () => {
  const {t, gt, dur} = useShot();
  const draw = LABELS.roads.map((_, i) => tween(t, 0.2 + i * 0.18, 1.9 + i * 0.18));
  const lit = roadLit(t);
  const tension = keys(t, [0, 2, dur], [SHOT1_END_TENSION, 0.6, SHOT2_END_TENSION]);
  const j = jitter(gt, tension);
  return (
    <Stage>
      <Roads
        origin={ROAD_ORIGIN}
        spread={ROAD_SPREAD}
        length={ROAD_LENGTH}
        draw={draw}
        lit={lit}
        labels={LABELS.roads}
      />
      <GoldBall x={HOME.x + j.x} y={HOME.y + j.y} />
    </Stage>
  );
};
