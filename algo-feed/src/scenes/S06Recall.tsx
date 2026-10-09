import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon, type IconKind} from '../components/Icons';
import {easeInCubic, easeInOutCubic, easeOutCubic, easeOutExpo, lerp, prog, quad, rnd, rndRange, spr, wobble} from '../lib/anim';
import {useBare} from '../lib/context';
import {cue} from '../timeline';
import {C, FONT_MONO, accentA} from '../theme';

const COLS = 16;
const ROWS = 15;
const FIELD = {x0: 150, x1: 930, y0: 572, y1: 1140};
const CLOUD = {x0: 190, x1: 890, y0: 560, y1: 680};
const FUNNEL = {rimY: 712, rimL: 150, rimR: 930, neckY: 966, neckL: 490, neckR: 590, spoutY: 1032};
const PILE_Y = 1138;
const PILE_ROWS = [9, 8, 7, 6, 5, 4];
const COUNTER_Y = 446;

type Shape = 'circle' | 'square' | 'tri' | IconKind;

interface Particle {
  i: number;
  hx: number;
  hy: number;
  shape: Shape;
  match: boolean;
  size: number;
  shade: string;
  appear: number;
  gather: number;
  cloud: [number, number];
  pour: number;
  rim: [number, number];
  bounce: [number, number];
  slot: [number, number];
  slotIndex: number;
}

const c11 = cue(11);
const c12 = cue(12);
const c13 = cue(13);
const c14 = cue(14);
const T = {
  appear: c11.start - 4,
  count0: c11.start + 2,
  count1: c11.start + 52,
  check0: c12.start + 4,
  funnel: c13.start + 1,
  gather: c13.start + 5,
  pour0: c13.start + 21,
  pourSpan: 30,
  swap: c13.start + 38,
  glow: c14.start,
};

const SHADES = ['#3E4A44', '#4C5852', '#5C6862'];
const DECOYS: Shape[] = ['circle', 'square', 'tri', 'circle', 'square', 'gamepad', 'ball', 'mountain', 'dumbbell'];

const PARTICLES: Particle[] = (() => {
  const list: Particle[] = [];
  let slotIndex = 0;
  const slots: [number, number][] = [];
  PILE_ROWS.forEach((cap, r) => {
    for (let c = 0; c < cap; c++) slots.push([540 + (c - (cap - 1) / 2) * 34, PILE_Y - r * 30]);
  });
  const order = Array.from({length: COLS * ROWS}, (_, i) => i).sort((a, b) => rnd(`po${a}`) - rnd(`po${b}`));
  const pourRank = new Map(order.map((i, k) => [i, k]));
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const match = rnd(`m${i}`) < 0.12;
    const rank = pourRank.get(i) ?? 0;
    const cloud: [number, number] = [rndRange(`cx${i}`, CLOUD.x0, CLOUD.x1), rndRange(`cy${i}`, CLOUD.y0, CLOUD.y1)];
    const rimX = Math.min(FUNNEL.rimR - 50, Math.max(FUNNEL.rimL + 50, cloud[0] + rndRange(`rx${i}`, -30, 30)));
    const dir = rimX < 540 ? -1 : 1;
    list.push({
      i,
      hx: lerp(FIELD.x0, FIELD.x1, (col + 0.5) / COLS) + rndRange(`jx${i}`, -14, 14),
      hy: lerp(FIELD.y0, FIELD.y1, (row + 0.5) / ROWS) + rndRange(`jy${i}`, -12, 12),
      shape: match ? (rnd(`k${i}`) < 0.75 ? 'cat' : rnd(`k2${i}`) < 0.5 ? 'note' : 'bowl') : DECOYS[Math.floor(rnd(`d${i}`) * DECOYS.length)],
      match,
      size: match ? 30 : rndRange(`s${i}`, 12, 20),
      shade: SHADES[Math.floor(rnd(`sh${i}`) * SHADES.length)],
      appear: T.appear + rnd(`a${i}`) * 26,
      gather: T.gather + rnd(`g${i}`) * 5,
      cloud,
      pour: T.pour0 + (rank / (COLS * ROWS)) * T.pourSpan,
      rim: [rimX, FUNNEL.rimY - 4],
      bounce: [rimX + dir * rndRange(`bx${i}`, 70, 200), rndRange(`by${i}`, 560, 660)],
      slot: match ? slots[slotIndex % slots.length] : [0, 0],
      slotIndex: match ? slotIndex++ : -1,
    });
  }
  return list;
})();

interface State {
  x: number;
  y: number;
  opacity: number;
  lit: boolean;
  scale: number;
}

const particleState = (p: Particle, f: number): State => {
  const drift = (s: number) => [wobble(f / 25, p.i + s) * 9, wobble(f / 29, p.i + 99 + s) * 9];
  const [dx, dy] = drift(0);
  const scale = spr(f, p.appear, {damping: 12, stiffness: 200});
  const g = prog(f, p.gather, p.gather + 12, easeInOutCubic);
  let x = lerp(p.hx + dx, p.cloud[0] + dx * 0.5, g);
  let y = lerp(p.hy + dy, p.cloud[1] + dy * 0.5, g);
  if (f < p.pour) return {x, y, opacity: 1, lit: false, scale};

  const fall = prog(f, p.pour, p.pour + 8, easeInCubic);
  x = lerp(x, p.rim[0], fall);
  y = lerp(y, p.rim[1], fall);
  if (fall < 1) return {x, y, opacity: 1, lit: false, scale};

  if (p.match) {
    const down = prog(f, p.pour + 8, p.pour + 16, easeInCubic);
    const neck: [number, number] = [540 + (p.rim[0] - 540) * 0.08, FUNNEL.neckY - 10];
    x = lerp(p.rim[0], neck[0], down);
    y = lerp(p.rim[1], neck[1], down);
    if (down < 1) return {x, y, opacity: 1, lit: false, scale};
    const out = prog(f, p.pour + 16, p.pour + 27, easeOutCubic);
    [x, y] = quad(neck, [540, FUNNEL.spoutY + 20], p.slot, out);
    return {x, y, opacity: 1, lit: true, scale};
  }

  const b = prog(f, p.pour + 8, p.pour + 22, easeOutCubic);
  const [ddx, ddy] = drift(7);
  x = lerp(p.rim[0], p.bounce[0] + ddx, b);
  y = lerp(p.rim[1], p.bounce[1] + ddy, b);
  return {x, y, opacity: lerp(1, 0.16, b), lit: false, scale};
};

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const Counter: React.FC<{text: string; size: number; color: string; opacity: number; scale: number; y: number}> = ({
  text,
  size,
  color,
  opacity,
  scale,
  y,
}) => {
  const textW = text.length * 0.6 * size;
  const tile = size * 0.9;
  const total = tile + 18 + textW;
  const x0 = 540 - total / 2;
  return (
    <g opacity={opacity} transform={`translate(540 ${y}) scale(${scale}) translate(-540 ${-y})`}>
      <rect x={x0} y={y - tile / 2} width={tile} height={tile} rx={tile * 0.24} fill="none" stroke={color} strokeWidth={4} />
      <Icon kind="play" x={x0 + tile / 2 + 3} y={y} size={tile * 0.5} color={color} />
      <text x={x0 + tile + 18} y={y + 3} dominantBaseline="central" fontFamily={FONT_MONO} fontWeight={800} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** 18.7–26.3s: a sea of 100M videos, a hopelessly slow one-by-one check, then the funnel. */
export const S06Recall: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();

  const count = 1e8 * easeOutExpo(prog(f, T.count0, T.count1));
  const bigText = f >= T.count1 ? '100,000,000+' : fmt(count);
  const swap = prog(f, T.swap, T.swap + 8);
  const smallIn = spr(f, T.swap + 4, {damping: 10, stiffness: 200});

  const hops = 7;
  const hopIdx = Math.min(hops - 1, Math.max(0, Math.floor((f - T.check0) / 7)));
  const checking = f >= T.check0 - 2 && f < T.funnel + 2;
  const checkTarget = (k: number) => PARTICLES[COLS * 1 + 3 + k];
  const curr = particleState(checkTarget(hopIdx), f);
  const prev = particleState(checkTarget(Math.max(0, hopIdx - 1)), f);
  const hopT = prog(f, T.check0 + hopIdx * 7, T.check0 + hopIdx * 7 + 4, easeInOutCubic);
  const box = {x: lerp(prev.x, curr.x, hopIdx === 0 ? 1 : hopT), y: lerp(prev.y, curr.y, hopIdx === 0 ? 1 : hopT)};

  const funnelS = spr(f, T.funnel, {damping: 10, stiffness: 120});
  const funnelY = (1 - funnelS) * -220;
  const funnelO = prog(f, T.funnel, T.funnel + 5);
  const glowT = f - T.glow;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {f >= T.appear && (
          <>
            <Counter text={bigText} size={72} color={C.accent} opacity={prog(f, T.count0 - 2, T.count0 + 4) * (1 - swap)} scale={1 - 0.2 * swap} y={COUNTER_Y - 30 * swap} />
            {f >= T.swap && <Counter text="~3,000" size={86} color={C.accent} opacity={prog(f, T.swap + 4, T.swap + 8)} scale={lerp(1.5, 1, smallIn)} y={COUNTER_Y} />}
          </>
        )}

        {checking && (
          <g opacity={prog(f, T.check0 - 2, T.check0 + 2) * (1 - prog(f, T.funnel - 4, T.funnel + 2))}>
            <g transform={`rotate(${f * 12} 386 ${COUNTER_Y + 66})`}>
              <circle cx={386} cy={COUNTER_Y + 66} r={17} fill="none" stroke={C.gray} strokeWidth={5} strokeDasharray="54 60" />
            </g>
            <text x={418} y={COUNTER_Y + 68} dominantBaseline="central" fontFamily={FONT_MONO} fontWeight={800} fontSize={40} fill={C.grayLight}>
              {`0.00000${hopIdx + 1}%`}
            </text>
          </g>
        )}

        {PARTICLES.map((p) => {
          if (f < p.appear) return null;
          const s = particleState(p, f);
          const checked = checking && p.i >= COLS + 3 && p.i <= COLS + 3 + hopIdx;
          const color = s.lit ? C.accent : checked ? C.white : p.match ? C.grayLight : p.shade;
          let size = p.size * s.scale;
          if (s.lit && f >= T.glow) size *= 1 + 0.2 * Math.max(0, Math.sin(glowT / 4 - p.slotIndex * 0.35));
          if (p.shape === 'circle') return <circle key={p.i} cx={s.x} cy={s.y} r={size / 2} fill={color} opacity={s.opacity} />;
          if (p.shape === 'square')
            return <rect key={p.i} x={s.x - size / 2} y={s.y - size / 2} width={size} height={size} rx={2} fill={color} opacity={s.opacity} />;
          if (p.shape === 'tri')
            return (
              <path
                key={p.i}
                d={`M${s.x} ${s.y - size / 2} L${s.x + size / 2} ${s.y + size / 2} L${s.x - size / 2} ${s.y + size / 2} Z`}
                fill={color}
                opacity={s.opacity}
              />
            );
          return <Icon key={p.i} kind={p.shape} x={s.x} y={s.y} size={size} color={color} cut={C.bg} opacity={s.opacity} />;
        })}

        {checking && (
          <rect x={box.x - 28} y={box.y - 28} width={56} height={56} rx={8} fill={accentA(0.12)} stroke={C.accent} strokeWidth={5} opacity={1 - prog(f, T.funnel - 4, T.funnel)} />
        )}

        {f >= T.funnel && (
          <g transform={`translate(0 ${funnelY})`} opacity={funnelO}>
            {!bare && f >= T.glow && (
              <ellipse cx={540} cy={PILE_Y - 40} rx={200} ry={90} fill={accentA(0.1 + 0.05 * Math.sin(glowT / 5))} />
            )}
            <path
              d={`M${FUNNEL.rimL} ${FUNNEL.rimY} L${FUNNEL.rimR} ${FUNNEL.rimY} L${FUNNEL.neckR} ${FUNNEL.neckY} L${FUNNEL.neckR} ${FUNNEL.spoutY} L${FUNNEL.neckL} ${FUNNEL.spoutY} L${FUNNEL.neckL} ${FUNNEL.neckY} Z`}
              fill={accentA(0.07)}
              stroke={C.accent}
              strokeWidth={6}
              strokeLinejoin="round"
            />
            <line
              x1={FUNNEL.rimL + 60}
              x2={FUNNEL.rimR - 60}
              y1={FUNNEL.rimY + 44}
              y2={FUNNEL.rimY + 44}
              stroke={accentA(0.5)}
              strokeWidth={4}
              strokeDasharray="14 12"
              strokeDashoffset={-f * 2}
            />
            <rect x={FUNNEL.rimL - 12} y={FUNNEL.rimY - 10} width={FUNNEL.rimR - FUNNEL.rimL + 24} height={20} rx={10} fill={C.accent} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
