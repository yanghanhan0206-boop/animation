import {getBoundingBox, getLength, getPointAtLength} from '@remotion/paths';
import React from 'react';
import {clamp, easeInOutSine, lerp, noise1, prog, rnd, rndRange} from '../lib/anim';
import {GOLD} from '../theme';
import type {Drawing} from './drawings';

interface Sample {
  x: number;
  y: number;
  /** Position of the sample along the whole drawing, 0..1 (draw order). */
  s: number;
}

interface Prepared {
  lengths: number[];
  starts: number[];
  total: number;
  samples: Sample[];
  box: {x1: number; y1: number; x2: number; y2: number};
}

const cache = new Map<string, Prepared>();

const prepare = (d: Drawing): Prepared => {
  const hit = cache.get(d.id);
  if (hit) return hit;
  const lengths = d.strokes.map((p) => getLength(p));
  const starts: number[] = [];
  let acc = 0;
  for (const l of lengths) {
    starts.push(acc);
    acc += l;
  }
  const samples: Sample[] = [];
  const box = {x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity};
  d.strokes.forEach((p, i) => {
    const b = getBoundingBox(p);
    box.x1 = Math.min(box.x1, b.x1);
    box.y1 = Math.min(box.y1, b.y1);
    box.x2 = Math.max(box.x2, b.x2);
    box.y2 = Math.max(box.y2, b.y2);
    for (let l = 0; l < lengths[i]; l += 9) {
      const pt = getPointAtLength(p, l);
      if (pt) samples.push({x: pt.x, y: pt.y, s: (starts[i] + l) / acc});
    }
  });
  const prepared = {lengths, starts, total: acc, samples, box};
  cache.set(d.id, prepared);
  return prepared;
};

const penAt = (d: Drawing, P: Prepared, along: number): {x: number; y: number} => {
  let i = d.strokes.findIndex((_, k) => along < P.starts[k] + P.lengths[k]);
  if (i < 0) i = d.strokes.length - 1;
  return getPointAtLength(d.strokes[i], Math.min(P.lengths[i], Math.max(0, along - P.starts[i]))) ?? {x: 500, y: 500};
};

export interface LineArtProps {
  drawing: Drawing;
  /** Centre of the 1000-unit box on screen, and its size in px. */
  cx: number;
  cy: number;
  size: number;
  /** Seconds since the pen touched down. */
  t: number;
  /** Seconds to draw every stroke. */
  draw: number;
  /** Seconds (since touch-down) when the drawing starts turning to dust; omit to keep it. */
  dissolve?: number;
  dissolveDur?: number;
  /** Stroke width in screen px. */
  width?: number;
  opacity?: number;
}

/**
 * Gold line art drawn by a glowing pen at constant speed, shedding a few sparks;
 * later it can dissolve left to right into drifting gold dust.
 */
export const LineArt: React.FC<LineArtProps> = ({drawing, cx, cy, size, t, draw, dissolve = Infinity, dissolveDur = 3.2, width = 2.2, opacity = 1}) => {
  const P = prepare(drawing);
  const k = size / 1000;
  const toScreen = (x: number, y: number) => ({x: cx + (x - 500) * k, y: cy + (y - 500) * k});
  const along = easeInOutSine(prog(t, 0, draw)) * P.total;
  const drawing_ = t >= 0 && along < P.total;
  const id = `la-${drawing.id}`;

  // Dissolve front, left to right across the drawing's bounding box.
  const span = P.box.x2 - P.box.x1;
  const front = (t - dissolve) / (dissolveDur * 0.75);
  const frontX = P.box.x1 + front * span;
  const soft = span * 0.06;
  const dissolving = t >= dissolve;
  if (dissolving && front > 1.6) return null;

  const pen = drawing_ ? penAt(drawing, P, along) : null;
  const penS = pen ? toScreen(pen.x, pen.y) : null;

  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={4 / k} />
        </filter>
        <filter id={`${id}-tip`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        {dissolving && (
          <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1={P.box.x1 - 50} y1={0} x2={P.box.x2 + 50} y2={0}>
            <stop offset={clamp((frontX - soft - P.box.x1 + 50) / (span + 100))} stopColor="#000" />
            <stop offset={clamp((frontX + soft - P.box.x1 + 50) / (span + 100))} stopColor="#fff" />
          </linearGradient>
        )}
        {dissolving && (
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1400} height={1400}>
            <rect x={-200} y={-200} width={1400} height={1400} fill={`url(#${id}-fade)`} />
          </mask>
        )}
      </defs>

      <g transform={`translate(${cx - 500 * k} ${cy - 500 * k}) scale(${k})`} mask={dissolving ? `url(#${id}-mask)` : undefined}>
        {[
          {w: (width * 5) / k, color: GOLD.champagne, o: 0.22, filter: `url(#${id}-glow)`},
          {w: width / k, color: GOLD.light, o: 0.95, filter: undefined},
        ].map((layer, li) => (
          <g key={li} opacity={layer.o} filter={layer.filter}>
            {drawing.strokes.map((p, i) => {
              const vis = clamp(along - P.starts[i], 0, P.lengths[i]);
              if (vis <= 0) return null;
              const L = P.lengths[i];
              return (
                <path
                  key={i}
                  d={p}
                  fill="none"
                  stroke={layer.color}
                  strokeWidth={layer.w}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${L + 1} ${L + 1}`}
                  strokeDashoffset={L + 1 - vis}
                />
              );
            })}
          </g>
        ))}
      </g>

      {penS && (
        <g>
          {Array.from({length: 12}, (_, j) => {
            const dt = (j + 1) * 0.07;
            const tj = t - dt;
            if (tj <= 0) return null;
            const q = penAt(drawing, P, easeInOutSine(prog(tj, 0, draw)) * P.total);
            const pj = toScreen(q.x, q.y);
            const seed = `${drawing.id}sp${Math.floor(tj * 14)}-${j}`;
            const x = pj.x + rndRange(`${seed}x`, -10, 10) * dt * 6;
            const y = pj.y + 18 * dt + 40 * dt * dt * 6;
            return <circle key={j} cx={x} cy={y} r={lerp(1.8, 0.6, j / 12)} fill={GOLD.hi} opacity={0.75 * (1 - j / 12)} />;
          })}
          <circle cx={penS.x} cy={penS.y} r={16} fill={GOLD.light} opacity={0.55} filter={`url(#${id}-tip)`} />
          <circle cx={penS.x} cy={penS.y} r={3.2} fill="#FFF8E8" />
        </g>
      )}

      {dissolving && (
        <g>
          {P.samples.map((s, i) => {
            if (i % 2) return null;
            const q = (s.x - P.box.x1) / span;
            const born = dissolve + q * dissolveDur * 0.75 + rnd(`${drawing.id}b${i}`) * 0.25;
            const age = t - born;
            const life = rndRange(`${drawing.id}l${i}`, 1.6, 2.8);
            if (age < 0 || age > life) return null;
            const p = toScreen(s.x, s.y);
            const vx = rndRange(`${drawing.id}vx${i}`, 30, 110);
            const vy = rndRange(`${drawing.id}vy${i}`, -70, -12);
            const x = p.x + vx * age + noise1(age * 1.3 + i) * 14;
            const y = p.y + vy * age + noise1(age * 1.1 + i * 3.7) * 10;
            const heat = 1 - clamp(age / 0.5);
            const a = Math.pow(1 - age / life, 1.4);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={rndRange(`${drawing.id}r${i}`, 1, 2.4) * (1 + heat * 0.6)}
                fill={heat > 0.4 ? GOLD.hi : GOLD.light}
                opacity={0.9 * a}
              />
            );
          })}
        </g>
      )}
    </svg>
  );
};
