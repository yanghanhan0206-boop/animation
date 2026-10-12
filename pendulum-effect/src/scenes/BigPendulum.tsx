/**
 * 镜头 7：画面背后浮现的巨大暗金色摆锤（透明度约 25%，几乎占满画面高度），
 * 两端写着“鸡娃”和“快乐教育”，摆得缓慢沉重，周期约是小摆锤的 3 倍。
 */
import React from 'react';
import {S7, S8} from '../timeline';
import {envelope, pulse} from '../lib/math';
import {BIG_AMPLITUDE, bigExtremes, bigTheta} from '../sim/physics';
import {Bob} from '../components/Bob';
import {GoldText} from '../components/GoldText';
import {Trail} from './MainPendulum';

const B = S7.big;

export const BigPendulumScene: React.FC<{t: number}> = ({t}) => {
  const vis = envelope(t, B.fadeIn[0], B.fadeIn[1], S8.bigOut[0], S8.bigOut[1]);
  if (vis <= 0) return null;
  const [px, py] = B.pivot;
  const pos = (tt: number) => {
    const th = bigTheta(tt);
    return {x: px + B.length * Math.sin(th), y: py + B.length * Math.cos(th)};
  };
  const bob = pos(t);
  const A = BIG_AMPLITUDE;
  const glow = (side: -1 | 1) =>
    bigExtremes.reduce((g, e) => (e.side === side ? Math.max(g, pulse(t - e.t, 0.35, 1.6)) : g), 0);
  const ex = B.length * Math.sin(A);
  const ey = py + B.length * Math.cos(A);
  const size = 84;
  const wl = [...B.leftWord].length * size * 1.08;
  const wr = [...B.rightWord].length * size * 1.08;
  const gap = B.bobRadius + 36;
  return (
    <g>
      <g opacity={vis * B.opacity}>
        <Trail pos={pos} t={t} r={B.bobRadius} count={6} spacing={0.08} opacity={0.45} />
        <line x1={px} y1={py} x2={bob.x} y2={bob.y} stroke="#E0B53A" strokeWidth={3.5} />
        <Bob x={bob.x} y={bob.y} r={B.bobRadius} variant="big" glow={0.9} inner={0.5} spec={false} />
      </g>
      <GoldText
        x={px - ex - gap - wl / 2}
        y={ey - 40}
        text={B.leftWord}
        size={size}
        weight={700}
        fill="url(#goldDarkText)"
        glowColor="#C9A445"
        glow={0.25 + glow(-1) * 0.9}
        opacity={vis * (0.62 + glow(-1) * 0.3)}
        letterSpacing={0.08}
      />
      <GoldText
        x={px + ex + gap + wr / 2}
        y={ey - 40}
        text={B.rightWord}
        size={size}
        weight={700}
        fill="url(#goldDarkText)"
        glowColor="#C9A445"
        glow={0.25 + glow(1) * 0.9}
        opacity={vis * (0.62 + glow(1) * 0.3)}
        letterSpacing={0.08}
      />
    </g>
  );
};
