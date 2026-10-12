/**
 * 镜头5（36–50s）画面换成三排金色线条勾勒的石头。石头逐块被掀开：
 * 有的下面空着，有的下面盘着一条金色线条小蛇，掀开瞬间闪过一道电光并伴随轻微画面抖动。
 */
import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage} from '../components/Stage';
import {Lightning, STONES, Stone, stoneByKey} from '../components/Stones';
import {fade, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';

const FLIP_DUR = 0.75;
/** 掀开顺序和时间（秒，相对本镜头） */
export const FLIPS: {key: string; at: number}[] = [
  {key: 'r1c1', at: 2.3},
  {key: 'r0c4', at: 3.4},
  {key: 'r2c1', at: 4.5},
  {key: 'r1c4', at: 5.9},
  {key: 'r0c1', at: 6.9},
  {key: 'r2c3', at: 7.9},
  {key: 'r1c3', at: 9.0},
  {key: 'r0c3', at: 10.3},
  {key: 'r2c4', at: 11.2},
  {key: 'r1c5', at: 12.2},
];

/** 蛇被掀开后多久电一下 */
const SHOCK_DELAY = 0.42;

export const Shot05: React.FC = () => {
  const {t, dur} = useShot();

  const shocks = FLIPS.filter((f) => stoneByKey(f.key).snake).map((f) => f.at + SHOCK_DELAY);
  // 最近一次电击带来的闪光和抖动，按指数衰减
  let flash = 0;
  let shake = 0;
  let shockSeed = 0;
  let flashAt = {x: 960, y: 540};
  FLIPS.filter((f) => stoneByKey(f.key).snake).forEach((f, k) => {
    const u = t - shocks[k];
    if (u >= 0 && u < 1.2) {
      flash = Math.max(flash, Math.exp(-u * 10));
      shake = Math.max(shake, Math.exp(-u * 6));
      shockSeed = shocks[k];
      const s = stoneByKey(f.key);
      flashAt = {x: s.x, y: s.y - 120};
    }
  });
  const shakeOffset = {
    x: noise2D('shake-x', t * 30, shockSeed) * 9 * shake,
    y: noise2D('shake-y', t * 30, shockSeed) * 7 * shake,
  };
  const exit = 1 - tween(t, dur - 0.2, dur + 1.1);

  return (
    <>
      <Stage shake={shakeOffset} opacity={exit}>
        {STONES.map((s, i) => {
          const flip = FLIPS.find((f) => f.key === s.key);
          const flipP = flip ? tween(t, flip.at, flip.at + FLIP_DUR, 0, 1) : 0;
          const appear = tween(t, 0.2 + (i % 6) * 0.12 + Math.floor(i / 6) * 0.25, 1.6 + (i % 6) * 0.12 + Math.floor(i / 6) * 0.25);
          const tongue = flip ? keys(t - flip.at, [0.5, 0.65, 0.8, 1.1, 1.25, 1.4], [0, 1, 0, 0, 1, 0]) : 0;
          return <Stone key={s.key} s={s} appear={appear} flip={flipP} tongue={tongue} />;
        })}
        {FLIPS.filter((f) => stoneByKey(f.key).snake).map((f) => {
          const s = stoneByKey(f.key);
          const u = t - f.at - SHOCK_DELAY;
          // 两下闪烁
          const a = keys(u, [0, 0.03, 0.1, 0.14, 0.2, 0.32], [0, 1, 0.25, 0.9, 0.5, 0]);
          return <Lightning key={f.key} x={s.x - 10} y0={s.y - 330} y1={s.y - 8} seed={f.key} opacity={a} />;
        })}
      </Stage>
      {flash > 0.01 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle 620px at ${flashAt.x}px ${flashAt.y}px, rgba(255,236,170,0.42), rgba(212,175,55,0.1) 40%, rgba(0,0,0,0) 100%)`,
            opacity: flash * fade(t, 0, 0.1),
          }}
        />
      )}
    </>
  );
};
