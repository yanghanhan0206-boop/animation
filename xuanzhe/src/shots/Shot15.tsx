/**
 * 镜头15（164–176s）星空中零星十几颗小球停止颤动，光芒变暗；仍在颤动的小球亮度提升，形成对比。
 */
import React from 'react';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {BALL} from '../config/theme';
import {jitter, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {HERO_SCALE, SKY_CENTER, STARS, STOPPERS, StarDot, ZOOM0, type Star} from './Shot14';

/** t15 = 距镜头15 开始的秒数；镜头16 也用它接着画 */
export const skyState = (star: Star, t15: number) => {
  if (star.stops) {
    const t0 = 1.2 + 0.32 * STOPPERS.indexOf(star);
    return {stillness: tween(t15, t0, t0 + 1.6), boost: 0};
  }
  return {stillness: 0, boost: tween(t15, 3.0, 6.5)};
};

/** 星空里的主角（拉远后的大小） */
export const HERO_SKY_SCALE = HERO_SCALE / ZOOM0;
export const heroGlow = (t15: number) => 1 + 0.25 * tween(t15, 3.0, 6.5);

export const Shot15: React.FC = () => {
  const {t, gt} = useShot();
  const j = jitter(gt, 0.9);
  return (
    <Stage>
      {STARS.map((s) => {
        const st = skyState(s, t);
        return <StarDot key={s.i} star={s} gt={gt} zoom={1} on={1} stillness={st.stillness} boost={st.boost} />;
      })}
      <GoldBall
        x={SKY_CENTER.x + j.x * HERO_SKY_SCALE}
        y={SKY_CENTER.y + j.y * HERO_SKY_SCALE}
        r={BALL.radius * HERO_SKY_SCALE}
        glow={heroGlow(t)}
      />
    </Stage>
  );
};
