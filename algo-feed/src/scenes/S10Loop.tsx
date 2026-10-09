import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon, type IconKind} from '../components/Icons';
import {clamp, easeInCubic, easeInOutCubic, easeOutCubic, keys, lerp, prog, spr} from '../lib/anim';
import {useBare} from '../lib/context';
import {CUT} from '../lib/transitions';
import {cue} from '../timeline';
import {C, accentA} from '../theme';

const CX = 540;
const CY = 770;
const SLOTS = 20;
const OTHERS: IconKind[] = ['note', 'bowl', 'mountain', 'ball', 'book', 'gamepad', 'dumbbell'];
const START_CATS = [0, 7, 14];
const INITIAL: IconKind[] = Array.from({length: SLOTS}, (_, i) => (START_CATS.includes(i) ? 'cat' : OTHERS[(i * 3) % OTHERS.length]));
const EJECT = [2, 6, 9, 13, 16, 18];
const KEEP = Array.from({length: SLOTS}, (_, i) => i).filter((i) => !EJECT.includes(i));

const c22 = cue(22);
const c23 = cue(23);
const c24 = cue(24);
const c25 = cue(25);
const c26 = cue(26);
const LAP = [c22.end - 4, c23.end - 4, c24.start + 28, c24.end - 4];
const FLIPS: [number[], number][] = [
  [[3, 10, 17, 5], LAP[0]],
  [[12, 19, 1, 8], LAP[1]],
  [[15, 4, 11], LAP[3]],
];
const flipAt = (i: number) => FLIPS.find(([ids]) => ids.includes(i))?.[1] ?? Infinity;
const RESPACE = [c25.start + 18, c25.start + 34];
const COLLAPSE = [CUT.s10 - 7, CUT.s10 + 2];

const deg = (a: number) => (a * Math.PI) / 180;
const arc = (r: number, a0: number, a1: number) => {
  const p0 = [CX + r * Math.cos(deg(a0)), CY + r * Math.sin(deg(a0))];
  const p1 = [CX + r * Math.cos(deg(a1)), CY + r * Math.sin(deg(a1))];
  return `M${p0[0]} ${p0[1]} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]}`;
};

/** 38.8–47.2s: every lap of the loop tightens the ring and turns more of it into cats. */
export const S10Loop: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  const t = f - c22.start;

  const R = keys(
    f,
    [c22.start, LAP[0], LAP[0] + 10, LAP[1], LAP[1] + 10, LAP[3], LAP[3] + 10, RESPACE[0], RESPACE[1], c26.start + 4, c26.start + 26],
    [330, 330, 284, 284, 240, 240, 204, 204, 186, 186, 126],
  );
  const collapse = prog(f, COLLAPSE[0], COLLAPSE[1], easeInCubic);
  const ringR = R * (1 - collapse);
  const enter = spr(f, c22.start - 6, {damping: 13, stiffness: 120});
  const spin = t * 0.45;
  const iconSize = clamp(R * 0.23, 46, 76) * (1 - collapse);

  const psi = keys(
    f,
    [c22.start - 6, LAP[0], LAP[1], LAP[2], LAP[3], c25.end, c26.end],
    [-90, 270, 630, 990, 1350, 1350 + (c25.end - LAP[3]) * 14, 1350 + (c25.end - LAP[3]) * 14 + (c26.end - c25.end) * 16],
  );
  const A = ringR + 66;
  const lapsDone = LAP.filter((l) => f >= l).length;
  const respace = prog(f, RESPACE[0], RESPACE[1], easeInOutCubic);
  const wall = prog(f, c26.start + 4, c26.start + 24);

  const icons = Array.from({length: SLOTS}, (_, i) => {
    const ff = flipAt(i);
    const kind: IconKind = f >= ff + 4 ? 'cat' : INITIAL[i];
    const flipS = f >= ff && f < ff + 8 ? Math.abs(Math.cos(Math.PI * prog(f, ff, ff + 8))) : 1;
    const keepIdx = KEEP.indexOf(i);
    const a0 = spin + i * (360 / SLOTS) - 90;
    const a1 = keepIdx >= 0 ? spin + keepIdx * (360 / KEEP.length) - 90 : a0;
    let ang = lerp(a0, a1, respace);
    let r = ringR * enter;
    let opacity = prog(f, c22.start - 6 + i, c22.start + 2 + i);
    const ej = EJECT.indexOf(i);
    if (ej >= 0) {
      const e0 = c25.start + 3 + ej * 2;
      const e = prog(f, e0, e0 + 16, easeInCubic);
      r += 560 * e;
      ang += 40 * e;
      opacity *= 1 - prog(f, e0 + 4, e0 + 16);
    }
    return {i, kind, flipS, ang, r, opacity, cat: kind === 'cat'};
  });

  const head = {x: CX + A * Math.cos(deg(psi)), y: CY + A * Math.sin(deg(psi))};
  const tan = {x: -Math.sin(deg(psi)), y: Math.cos(deg(psi))};
  const nor = {x: Math.cos(deg(psi)), y: Math.sin(deg(psi))};
  const arrowO = (1 - prog(f, c26.start + 30, c26.start + 50)) * (1 - collapse);
  const exitO = 1 - prog(f, CUT.s10, CUT.s10 + 8);

  return (
    <AbsoluteFill style={{opacity: exitO}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {!bare && wall > 0 && (
          <g opacity={0.17 * wall * (1 - collapse)}>
            {Array.from({length: 11 * 18}, (_, k) => {
              const col = k % 11;
              const row = Math.floor(k / 11);
              const off = (f * 1.1) % 112;
              const x = -40 + col * 112 + (row % 2) * 56 + off * 0.5;
              const y = -60 + row * 112 - off;
              return <Icon key={k} kind="cat" x={x} y={y} size={46} color={C.accent} cut={C.bg} />;
            })}
          </g>
        )}

        <circle cx={CX} cy={CY} r={A} fill="none" stroke={accentA(0.18)} strokeWidth={3} strokeDasharray="6 14" opacity={arrowO} />
        {arrowO > 0 && (
          <g opacity={arrowO}>
            <path d={arc(A, psi - 75, psi)} stroke={C.accent} strokeWidth={9} fill="none" strokeLinecap="round" />
            <path
              d={`M${head.x + tan.x * 24} ${head.y + tan.y * 24} L${head.x - tan.x * 6 + nor.x * 17} ${head.y - tan.y * 6 + nor.y * 17} L${head.x - tan.x * 6 - nor.x * 17} ${head.y - tan.y * 6 - nor.y * 17} Z`}
              fill={C.accent}
            />
          </g>
        )}

        {icons
          .filter((ic) => ic.cat && ic.opacity > 0)
          .map((ic) => (
            <line
              key={`l${ic.i}`}
              x1={CX}
              y1={CY}
              x2={CX + ic.r * Math.cos(deg(ic.ang))}
              y2={CY + ic.r * Math.sin(deg(ic.ang))}
              stroke={accentA(0.16 + 0.04 * lapsDone)}
              strokeWidth={2}
            />
          ))}

        {LAP.map((l, k) => {
          const w = prog(f, l, l + 16, easeOutCubic);
          if (w <= 0 || w >= 1) return null;
          return <circle key={k} cx={CX} cy={CY} r={24 + 120 * w} fill="none" stroke={C.accent} strokeWidth={4} opacity={0.8 * (1 - w)} />;
        })}
        <circle cx={CX} cy={CY} r={(34 + 4 * Math.sin(f / 4)) * (1 - collapse * 0.5)} fill={accentA(0.12 + 0.1 * lapsDone)} />
        <circle cx={CX} cy={CY} r={20 * (1 + collapse * 0.6)} fill={C.white} />

        {icons.map((ic) =>
          ic.opacity <= 0.01 ? null : (
            <Icon
              key={ic.i}
              kind={ic.kind}
              x={CX + ic.r * Math.cos(deg(ic.ang))}
              y={CY + ic.r * Math.sin(deg(ic.ang))}
              size={iconSize * (ic.cat ? 1 : 0.9)}
              color={ic.cat ? C.accent : C.grayLight}
              scaleX={ic.flipS}
              opacity={ic.opacity}
            />
          ),
        )}
      </svg>
    </AbsoluteFill>
  );
};
