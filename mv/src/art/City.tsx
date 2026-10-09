import React from 'react';
import {lerp, noise1, rnd, rndRange} from '../lib/anim';
import {W} from '../theme';

// A sleeping city in three depths. One window on a mid-ground tower is still lit gold;
// the wet street below stretches its reflection into a shimmering column.

interface Tower {
  x: number;
  w: number;
  h: number;
  windows: {x: number; y: number; w: number; h: number; a: number}[];
}

const towers = (seed: string, n: number, x0: number, x1: number, hMin: number, hMax: number, wMin: number, wMax: number, lit: number): Tower[] => {
  const out: Tower[] = [];
  let x = x0;
  let i = 0;
  while (x < x1 && i < n * 3) {
    const w = rndRange(`${seed}w${i}`, wMin, wMax);
    const h = rndRange(`${seed}h${i}`, hMin, hMax);
    const windows: Tower['windows'] = [];
    const cols = Math.max(2, Math.floor(w / 26));
    const rows = Math.floor(h / 34);
    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rnd(`${seed}lit${i}-${r}-${c}`) < lit) {
          windows.push({x: (c + 0.5) * (w / cols) - 5, y: r * 34, w: 10, h: 15, a: rndRange(`${seed}a${i}-${r}-${c}`, 0.25, 0.7)});
        }
      }
    }
    out.push({x, w, h, windows});
    x += w + rndRange(`${seed}g${i}`, -6, 18);
    i++;
  }
  return out;
};

export const HORIZON = 742;
export const WINDOW = {x: 1352, y: 404, w: 30, h: 44};

const FAR = towers('far', 40, -60, W + 60, 110, 330, 46, 120, 0.02);
const MID = towers('mid', 16, -80, W + 80, 190, 520, 110, 230, 0.012);
// The tower carrying the lit window, placed by hand.
const KEY: Tower = {x: WINDOW.x - 96, w: 210, h: HORIZON - 250, windows: []};

const Skyline: React.FC<{list: Tower[]; fill: string; windowColor: string; t: number}> = ({list, fill, windowColor, t}) => (
  <g>
    {list.map((b, i) => (
      <g key={i}>
        <rect x={b.x} y={HORIZON - b.h} width={b.w} height={b.h + 2} fill={fill} />
        {i % 5 === 2 && <rect x={b.x + b.w * 0.45} y={HORIZON - b.h - 34} width={3} height={34} fill={fill} />}
        {b.windows.map((wd, j) => (
          <rect
            key={j}
            x={b.x + wd.x}
            y={HORIZON - b.h + wd.y}
            width={wd.w}
            height={wd.h}
            fill={windowColor}
            opacity={wd.a * (0.85 + 0.15 * noise1(t * 0.3 + i * 7 + j))}
          />
        ))}
      </g>
    ))}
  </g>
);

export interface CityProps {
  /** Seconds, for the shimmer and the window's flicker. */
  t: number;
  /** 0..1 brightness of the gold window (fade it to 0 to switch the light off). */
  windowOn?: number;
}

export const City: React.FC<CityProps> = ({t, windowOn = 1}) => {
  const flick = 0.94 + 0.06 * noise1(t * 2.3);
  const glowA = windowOn * flick;
  const wcx = WINDOW.x + WINDOW.w / 2;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#020202" />
          <stop offset="0.42" stopColor="#060504" />
          <stop offset="0.62" stopColor="#140F09" />
          <stop offset="0.687" stopColor="#2A1F10" />
          <stop offset="0.69" stopColor="#0E0B07" />
          <stop offset="1" stopColor="#030303" />
        </linearGradient>
        <linearGradient id="city-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22190D" stopOpacity="0" />
          <stop offset="1" stopColor="#22190D" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="city-win-glow">
          <stop offset="0" stopColor="#F2D08E" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#C89A52" stopOpacity="0.14" />
          <stop offset="1" stopColor="#C89A52" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="city-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9B8" />
          <stop offset="1" stopColor="#D9A458" />
        </linearGradient>
        <linearGradient id="city-street" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A140B" />
          <stop offset="0.25" stopColor="#0A0806" />
          <stop offset="1" stopColor="#030303" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#city-sky)" />
      <Skyline list={FAR} fill="#0F0D0A" windowColor="#7A5C30" t={t} />
      <rect x={0} y={HORIZON - 220} width={1920} height={222} fill="url(#city-haze)" opacity={0.75} />
      <Skyline list={MID} fill="#050404" windowColor="#8C6A38" t={t} />
      <rect x={KEY.x} y={HORIZON - KEY.h} width={KEY.w} height={KEY.h + 2} fill="#060505" />
      <rect x={KEY.x + KEY.w * 0.5 - 2} y={HORIZON - KEY.h - 60} width={4} height={60} fill="#060505" />

      <ellipse cx={wcx} cy={WINDOW.y + WINDOW.h / 2} rx={260} ry={260} fill="url(#city-win-glow)" opacity={glowA} />
      <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} fill="url(#city-win)" opacity={glowA} />
      <rect x={WINDOW.x + WINDOW.w * 0.62} y={WINDOW.y} width={WINDOW.w * 0.38} height={WINDOW.h} fill="#B98A45" opacity={0.55 * glowA} />

      <rect x={0} y={HORIZON} width={1920} height={1080 - HORIZON} fill="url(#city-street)" />
      {/* Reflection: the window stretched into a broken, shimmering column on the wet street. */}
      {Array.from({length: 34}, (_, i) => {
        const y = HORIZON + 8 + i * 6.2;
        const fall = 1 - i / 34;
        const wob = noise1(t * 1.7 + i * 0.6) * lerp(3, 16, i / 34);
        const w = WINDOW.w * lerp(0.9, 1.6, i / 34) * (0.7 + 0.3 * noise1(t * 2.2 + i));
        return (
          <rect
            key={i}
            x={wcx - w / 2 + wob}
            y={y}
            width={w}
            height={3.2}
            rx={1.6}
            fill="#E8C27A"
            opacity={0.42 * fall * fall * glowA * (0.7 + 0.3 * noise1(t * 3 + i * 1.9))}
          />
        );
      })}
      <ellipse cx={wcx} cy={HORIZON + 60} rx={200} ry={46} fill="url(#city-win-glow)" opacity={0.35 * glowA} />
      <rect x={0} y={HORIZON - 2} width={1920} height={2} fill="#1C160E" opacity={0.8} />
    </svg>
  );
};
