/** 镜头 4：画面中上方的金色大字“摆锤效应”，出现时一道金色光泽从左到右扫过 */
import React from 'react';
import {S4, WIDTH} from '../timeline';
import {FONT_FAMILY} from '../theme';
import {easeInOutSine, easeOutCubic, pulse, ramp} from '../lib/math';

const TITLE = '摆锤效应';
const SPACING = 0.32; // em

export const TitleScene: React.FC<{t: number}> = ({t}) => {
  const out = ramp(t, S4.titleOut[0], S4.titleOut[1], easeInOutSine);
  if (t < S4.titleAt - 0.05 || out >= 1) return null;
  const size = S4.titleFontSize;
  const adv = size * (1 + SPACING);
  const total = TITLE.length * adv - size * SPACING;
  const x0 = WIDTH / 2 - total / 2 + size / 2;
  const y = S4.titleY;
  const sweep = ramp(t, S4.sheenAt, S4.sheenAt + S4.sheenDuration, easeInOutSine);
  const bandX = WIDTH / 2 - total / 2 - 260 + sweep * (total + 520);
  const sheenOn = t >= S4.sheenAt - 0.05 && t <= S4.sheenAt + S4.sheenDuration + 0.05;
  const shine = pulse(t - (S4.sheenAt + S4.sheenDuration * 0.5), 0.5, 0.9);
  const line = ramp(t, S4.titleAt + 0.6, S4.titleAt + 2.0, easeInOutSine);

  const chars = [...TITLE].map((c, i) => {
    const t0 = S4.titleAt + i * 0.16;
    const u = ramp(t, t0, t0 + S4.titleFadeIn, easeOutCubic);
    return {c, x: x0 + i * adv, u};
  });
  const text = (fill: string, extra: React.SVGProps<SVGTextElement> = {}) =>
    chars.map(({c, x, u}, i) => (
      <text
        key={i}
        x={x}
        y={y + (1 - u) * 16}
        fontFamily={FONT_FAMILY}
        fontWeight={700}
        fontSize={size}
        textAnchor="middle"
        dominantBaseline="central"
        fill={fill}
        opacity={u}
        filter={u < 0.97 ? `url(#tblur${Math.max(1, Math.round((1 - u) * 14))})` : undefined}
        {...extra}
      >
        {c}
      </text>
    ));

  return (
    <g opacity={1 - out} filter={out > 0.02 ? `url(#tblur${Math.max(1, Math.round(out * 10))})` : undefined}>
      <defs>
        <linearGradient
          id="sheen"
          gradientUnits="userSpaceOnUse"
          x1={bandX - 210}
          y1={y + 95}
          x2={bandX + 210}
          y2={y - 95}
        >
          <stop offset="0" stopColor="#FFF6DA" stopOpacity="0" />
          <stop offset="0.3" stopColor="#FFF3D0" stopOpacity="0.12" />
          <stop offset="0.45" stopColor="#FFF8E6" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.55" stopColor="#FFF8E6" stopOpacity="0.75" />
          <stop offset="0.7" stopColor="#FFF3D0" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FFF6DA" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="titleRule" gradientUnits="userSpaceOnUse" x1={WIDTH / 2 - 240} y1="0" x2={WIDTH / 2 + 240} y2="0">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="0.5" stopColor="#F5D76E" stopOpacity="0.9" />
          <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g opacity={0.32 + shine * 0.35} filter="url(#blur24)">
        {text('#F5D76E')}
      </g>
      {text('url(#goldText)')}
      {sheenOn ? text('url(#sheen)') : null}
      <line
        x1={WIDTH / 2 - 240 * line}
        x2={WIDTH / 2 + 240 * line}
        y1={y + size * 0.78}
        y2={y + size * 0.78}
        stroke="url(#titleRule)"
        strokeWidth={1.2}
        opacity={line}
      />
    </g>
  );
};
