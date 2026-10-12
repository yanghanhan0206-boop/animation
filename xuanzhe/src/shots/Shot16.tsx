/**
 * 镜头16（176–186s）镜头推回主角小球，星空淡出。小球分裂成十几颗小光点，一颗接一颗轻轻落地，
 * 每落一颗，前方亮起一小段金色路面，路一节一节向前延伸。
 * 画面一角浮现缩小版的倒 U 曲线，标记点随着光点落地逐步从峰顶向下滑。
 */
import React from 'react';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {MiniCurve} from '../components/StressCurve';
import {BALL, COLORS} from '../config/theme';
import {at} from '../config/timeline';
import {EASE, clamp, fade, jitter, keys, lerp, randRange, sampleTrail, tween, type Point} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {SKY_CENTER, STARS, StarDot} from './Shot14';
import {HERO_SKY_SCALE, heroGlow, skyState} from './Shot15';

export const DOT_COUNT = 14;
export const DOT_R = 7;
const CLUSTER: Point = {x: 520, y: 400};
export const ROAD_Y = 650;
const ROAD_X0 = 440;
const SEG = 74;
/** 推回主角：摄影机放大到主角恢复正常大小 */
const PUSH = [0, 2.2];
const PUSH_ZOOM = 1 / HERO_SKY_SCALE;
const MOVE = [1.8, 3.2];
const SPLIT = [3.2, 3.9];
const DROP0 = 3.95;
const DROP_GAP = 0.38;
const DROP_DUR = 0.72;

export const MINI = {x: 1520, y: 262, w: 290, h: 140};

/** 第 m 颗落下的光点：在小球周围的位置、落点、起落时刻 */
export const DOTS = (() => {
  const ring = Array.from({length: DOT_COUNT}, (_, k) => {
    const a = (2 * Math.PI * k) / DOT_COUNT + randRange(`da${k}`, -0.15, 0.15);
    const r = 46 + randRange(`dr${k}`, -8, 8);
    return {x: Math.cos(a) * r, y: Math.sin(a) * r};
  });
  // 从右边（靠近路的方向）开始一颗一颗落
  const order = ring.map((_, k) => k).sort((a, b) => ring[b].x - ring[a].x);
  return order.map((k, m) => ({
    m,
    offset: ring[k],
    land: {x: ROAD_X0 + SEG * m, y: ROAD_Y - DOT_R - 2},
    drop: DROP0 + DROP_GAP * m,
    landed: DROP0 + DROP_GAP * m + DROP_DUR,
  }));
})();
export const LAST_DOT = DOTS[DOTS.length - 1];

/** 已落地光点数（平滑），用于倒 U 曲线标记点下滑 */
export const landedSmooth = (t: number) => DOTS.reduce((s, d) => s + tween(t, d.landed, d.landed + 0.6), 0);
export const markerAt = (t: number) => 0.5 - 0.44 * (landedSmooth(t) / DOT_COUNT);

/** 第 m 颗光点在 t 时刻的位置（不含颤动） */
export const dotPos = (d: (typeof DOTS)[number], t: number): Point => {
  const home = {x: CLUSTER.x + d.offset.x * EASE(clamp((t - SPLIT[0]) / (SPLIT[1] - SPLIT[0]))), y: CLUSTER.y + d.offset.y * EASE(clamp((t - SPLIT[0]) / (SPLIT[1] - SPLIT[0])))};
  const k = clamp((t - d.drop) / DROP_DUR);
  if (k <= 0) {
    return home;
  }
  const e = EASE(k);
  return {x: lerp(home.x, d.land.x, e), y: lerp(home.y, d.land.y, e) - 46 * Math.sin(Math.PI * e)};
};

/** 路面：第 m 颗落地后，前方亮起一段（最后一颗落在路的前端，不再往前亮） */
export const RoadSegments: React.FC<{t: number; opacity?: number}> = ({t, opacity = 1}) => (
  <g opacity={opacity}>
    {DOTS.slice(0, -1).map((d) => {
      const k = tween(t, d.landed, d.landed + 0.35);
      if (k <= 0) {
        return null;
      }
      const x0 = d.land.x;
      return (
        <g key={d.m}>
          <line x1={x0} y1={ROAD_Y} x2={x0 + SEG * k} y2={ROAD_Y} stroke={COLORS.gold1} strokeWidth={2.4} opacity={0.35} filter="url(#glow)" />
          <line x1={x0} y1={ROAD_Y} x2={x0 + SEG * k} y2={ROAD_Y} stroke="url(#gold-stroke)" strokeWidth={2.4} />
        </g>
      );
    })}
    {DOTS.map((d) => {
      const u = t - d.landed;
      if (u < 0 || u > 0.9) {
        return null;
      }
      // 落地时地面的一圈轻微涟漪
      const k = u / 0.9;
      return (
        <ellipse key={`r${d.m}`} cx={d.land.x} cy={ROAD_Y} rx={8 + 30 * EASE(k)} ry={3 + 8 * EASE(k)} fill="none" stroke={COLORS.gold1} strokeWidth={1.2} opacity={0.7 * (1 - k)} />
      );
    })}
  </g>
);

/** 已落地的光点：除最后一颗外慢慢变暗 */
export const LandedDots: React.FC<{t: number; gt: number; opacity?: number; skipLast?: boolean}> = ({t, gt, opacity = 1, skipLast}) => (
  <g opacity={opacity}>
    {DOTS.map((d) => {
      if (t < d.landed || (skipLast && d === LAST_DOT)) {
        return null;
      }
      const isLast = d === LAST_DOT;
      const dim = isLast ? 1 : keys(t, [d.landed, d.landed + 1.2], [1, 0.5]);
      const j = jitter(gt, 0.3, `dot${d.m}`);
      const squash = keys(t - d.landed, [0, 0.08, 0.2], [0.82, 1.06, 1]);
      return (
        <g key={d.m} opacity={dim} transform={`translate(${d.land.x} ${d.land.y}) scale(${1 / squash} ${squash}) translate(${-d.land.x} ${-d.land.y})`}>
          <GoldBall x={d.land.x + j.x * 0.25} y={d.land.y + j.y * 0.25} r={DOT_R} />
        </g>
      );
    })}
  </g>
);

export const Shot16: React.FC = () => {
  const {t, gt} = useShot();
  const t15 = gt - at(15);
  const zoom = keys(t, PUSH, [1, PUSH_ZOOM]);
  const starsOn = 1 - tween(t, 0.4, 2.0);

  const heroScale = HERO_SKY_SCALE * zoom;
  const heroPath = (tt: number): Point => {
    const k = EASE(clamp((tt - MOVE[0]) / (MOVE[1] - MOVE[0])));
    return {x: lerp(SKY_CENTER.x, CLUSTER.x, k), y: lerp(SKY_CENTER.y, CLUSTER.y, k)};
  };
  const hero = heroPath(t);
  const heroOn = 1 - tween(t, SPLIT[0], SPLIT[1]);
  const heroShrink = keys(t, [SPLIT[0], SPLIT[1]], [1, 0.4]);
  const j = jitter(gt, 0.9);
  const trail = t > MOVE[0] && t < SPLIT[0] + 0.3 ? sampleTrail(heroPath, t) : undefined;
  const miniOn = fade(t, 3.0, 4.0);

  return (
    <Stage>
      {starsOn > 0.001 &&
        STARS.map((s) => {
          const st = skyState(s, t15);
          return <StarDot key={s.i} star={s} gt={gt} zoom={zoom} on={starsOn} stillness={st.stillness} boost={st.boost} />;
        })}

      <RoadSegments t={t} />
      <LandedDots t={t} gt={gt} />

      {/* 还悬在空中的光点 */}
      {t >= SPLIT[0] &&
        DOTS.map((d) => {
          if (t >= d.landed) {
            return null;
          }
          const p = dotPos(d, t);
          const jj = jitter(gt, 0.8, `dot${d.m}`);
          const falling = t > d.drop;
          const amp = falling ? 0.25 : 0.55;
          const grow = keys(t, [SPLIT[0], SPLIT[1]], [0.3, 1]);
          return (
            <GoldBall
              key={d.m}
              x={p.x + jj.x * amp}
              y={p.y + jj.y * amp}
              r={DOT_R * grow}
              trail={falling ? sampleTrail((tt) => dotPos(d, tt), t) : undefined}
            />
          );
        })}

      {heroOn > 0.001 && (
        <GoldBall
          x={hero.x + j.x * heroScale}
          y={hero.y + j.y * heroScale}
          r={BALL.radius * heroScale * heroShrink}
          glow={heroGlow(t15) - (heroGlow(t15) - 1) * tween(t, 0, 2.0)}
          opacity={heroOn}
          trail={trail}
        />
      )}

      <MiniCurve x={MINI.x} y={MINI.y} w={MINI.w} h={MINI.h} marker={markerAt(t)} opacity={miniOn} />
    </Stage>
  );
};
