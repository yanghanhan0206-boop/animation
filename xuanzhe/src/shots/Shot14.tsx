/**
 * 镜头14（152–164s）重点镜头：镜头从小球开始缓慢拉远，黑暗中一颗接一颗亮起同样颤动的金色小球，
 * 大小和亮度各不相同，数量逐渐增加到数百颗，铺满画面，像一片轻轻闪烁的星空。
 */
import {noise2D} from '@remotion/noise';
import React from 'react';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {BALL} from '../config/theme';
import {HEIGHT, WIDTH} from '../config/timeline';
import {fade, jitter, keys, rand, randRange} from '../lib/anim';
import {useShot} from '../lib/shot-context';

/** 星空中心（主角小球所在） */
export const SKY_CENTER = {x: 960, y: 460};
/** 镜头13 结束时主角的放大倍数 */
export const HERO_SCALE = 1.5;
const STAR_COUNT = 380;
const STOP_COUNT = 14;
/** 拉远：摄影机缩放从 ZOOM0 到 1 */
const ZOOM0 = 3.5;
const PULL = [0, 8.5];

export interface Star {
  i: number;
  x: number;
  y: number;
  r: number;
  b: number;
  appear: number;
  /** 镜头15：这颗会停下、变暗 */
  stops: boolean;
}

/** 确定性的星星分布：拒绝采样保证不挤在一起，离中心越近越早亮 */
export const STARS: Star[] = (() => {
  const stars: Omit<Star, 'appear' | 'stops'>[] = [];
  let tries = 0;
  while (stars.length < STAR_COUNT && tries < 20000) {
    tries++;
    const x = randRange(`sx${tries}`, 30, WIDTH - 30);
    const y = randRange(`sy${tries}`, 30, HEIGHT - 30);
    if (Math.hypot(x - SKY_CENTER.x, y - SKY_CENTER.y) < 70) {
      continue;
    }
    if (stars.some((s) => Math.hypot(s.x - x, s.y - y) < 34)) {
      continue;
    }
    const kind = rand(`sk${tries}`);
    const r = kind < 0.7 ? randRange(`sr${tries}`, 2, 4.2) : kind < 0.95 ? randRange(`sr${tries}`, 4.2, 7.5) : randRange(`sr${tries}`, 7.5, 12);
    stars.push({i: stars.length, x, y, r, b: randRange(`sb${tries}`, 0.35, 1)});
  }
  const maxD = Math.hypot(WIDTH / 2, HEIGHT / 2);
  const ranked = stars
    .map((s) => ({s, key: Math.hypot(s.x - SKY_CENTER.x, s.y - SKY_CENTER.y) / maxD + randRange(`sa${s.i}`, 0, 0.35)}))
    .sort((a, b) => a.key - b.key);
  // 镜头15 里停下来的「零星十几颗」：挑中等以上大小、不在字幕和时钟区域的星星
  const stoppers = new Set(
    stars
      .filter((s) => s.r > 3.4 && s.y < 800 && !(s.x < 320 && s.y < 160))
      .sort((a, b) => rand(`stop${a.i}`) - rand(`stop${b.i}`))
      .slice(0, STOP_COUNT)
      .map((s) => s.i),
  );
  return ranked.map(({s}, rank) => ({
    ...s,
    appear: 0.6 + 7.2 * Math.pow(rank / STAR_COUNT, 0.62),
    stops: stoppers.has(s.i),
  }));
})();

/** 停下的星星在 STOPPERS 里的序号（决定它停下的先后） */
export const STOPPERS = STARS.filter((s) => s.stops).sort((a, b) => a.x - b.x);

export const zoomAt = (t: number) => keys(t, PULL, [ZOOM0, 1]);
export {ZOOM0};

/** 一颗星在画面上的样子；镜头15 也用 */
export const StarDot: React.FC<{star: Star; gt: number; zoom: number; on: number; stillness?: number; boost?: number}> = ({
  star,
  gt,
  zoom,
  on,
  stillness = 0,
  boost = 0,
}) => {
  const x0 = SKY_CENTER.x + (star.x - SKY_CENTER.x) * zoom;
  const y0 = SKY_CENTER.y + (star.y - SKY_CENTER.y) * zoom;
  const r = star.r * zoom;
  if (x0 < -40 || x0 > WIDTH + 40 || y0 < -40 || y0 > HEIGHT + 40) {
    return null;
  }
  const j = jitter(gt, 0.7, `star${star.i}`);
  const amp = (0.35 + (0.65 * star.r) / 12) * (1 - stillness);
  const twinkle = 0.8 + 0.2 * noise2D(`tw${star.i}`, gt * 0.6, 0);
  // 字幕和时钟区域的星星压暗，保证文字清楚
  const subDx = Math.max(0, Math.abs(x0 - WIDTH / 2) - 560);
  const subDy = Math.max(0, 870 - y0);
  const subtitleZone = Math.min(1, Math.hypot(subDx, subDy) / 90);
  const zoneDim = (0.18 + 0.82 * subtitleZone) * (x0 < 300 && y0 < 140 ? 0.45 : 1);
  const b = Math.min(1, star.b * twinkle * (1 - 0.65 * stillness) + boost * 0.35) * zoneDim;
  return (
    <GoldBall x={x0 + j.x * amp} y={y0 + j.y * amp} r={r} opacity={on * b} glow={0.9} lite />
  );
};

export const Shot14: React.FC = () => {
  const {t, gt} = useShot();
  const zoom = zoomAt(t);
  const heroScale = (HERO_SCALE * zoom) / ZOOM0;
  const j = jitter(gt, 0.9);
  return (
    <Stage>
      {STARS.map((s) => (
        <StarDot key={s.i} star={s} gt={gt} zoom={zoom} on={fade(t, s.appear, s.appear + 0.6)} />
      ))}
      <GoldBall x={SKY_CENTER.x + j.x * heroScale} y={SKY_CENTER.y + j.y * heroScale} r={BALL.radius * heroScale} />
    </Stage>
  );
};
