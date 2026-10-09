import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {easeInOutSine, lerp, prog} from '../../lib/anim';
import {GOLD, SERIF_CN, SERIF_EN} from '../../theme';

// 「最终还是决定把你写进 New Boombap 里」: a record turning under a low light; the label
// reads NEW BOOMBAP and her name. The reflections stay put while the grooves spin.

const R = {x: 1180, y: 600, r: 470, tilt: 0.42};

export const Vinyl: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const spin = t * 200;
  const zoom = lerp(1.0, 1.06, prog(t, 0, dur, easeInOutSine));
  const arm = lerp(-2, 0, prog(t, 0, 0.8, easeInOutSine));
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 60% at 62% 40%, #17120C 0%, #050404 70%)', transform: `scale(${zoom})`, transformOrigin: `${R.x}px ${R.y}px`}}>
      <Bokeh seed="vinyl" count={90} focus={0.55} drift={[-6, -8]} intensity={0.7} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="vy-label" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#F6E2B0" />
            <stop offset="0.45" stopColor="#C9A05A" />
            <stop offset="1" stopColor="#6E5022" />
          </radialGradient>
          <linearGradient id="vy-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFE8C0" stopOpacity="0.22" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="vy-disc">
            <circle cx={0} cy={0} r={R.r} />
          </clipPath>
        </defs>
        {/* Platter shadow and rim. */}
        <ellipse cx={R.x} cy={R.y + 26} rx={R.r * 1.04} ry={R.r * R.tilt * 1.04} fill="#000" opacity={0.7} />
        <g transform={`translate(${R.x} ${R.y}) scale(1 ${R.tilt})`}>
          <circle r={R.r} fill="#070707" stroke="#2A2116" strokeWidth={4} />
          <g clipPath="url(#vy-disc)">
            <g transform={`rotate(${spin})`}>
              {Array.from({length: 70}, (_, k) => (
                <circle key={k} r={R.r * 0.36 + k * ((R.r * 0.62) / 70)} fill="none" stroke={k % 3 ? '#121212' : '#1C1A17'} strokeWidth={2.2} />
              ))}
              <path d={`M0 0 L${R.r} -6 L${R.r} 6 Z`} fill="#1E1B16" opacity={0.5} />
            </g>
            {/* Reflections are fixed to the light, not to the record. */}
            <g transform="rotate(-28)">
              <rect x={-R.r} y={-60} width={R.r * 2} height={120} fill="url(#vy-sheen)" />
            </g>
            <g transform="rotate(152)">
              <rect x={-R.r} y={-40} width={R.r * 2} height={80} fill="url(#vy-sheen)" />
            </g>
          </g>
          <g transform={`rotate(${spin})`}>
            <circle r={R.r * 0.33} fill="url(#vy-label)" />
            <circle r={R.r * 0.31} fill="none" stroke="#5A4120" strokeWidth={2} />
            <text y={-R.r * 0.13} textAnchor="middle" fontFamily={SERIF_EN} fontWeight={500} fontSize={40} letterSpacing={6} fill="#2A1C0A">
              NEW BOOMBAP
            </text>
            <text y={R.r * 0.06} textAnchor="middle" fontFamily={SERIF_CN} fontWeight={700} fontSize={50} fill="#2A1C0A">
              林宛瑜
            </text>
            <text y={R.r * 0.2} textAnchor="middle" fontFamily={SERIF_EN} fontStyle="italic" fontSize={24} letterSpacing={4} fill="#3A2810">
              Rapeter · side A
            </text>
          </g>
          <circle r={10} fill="#C9A05A" />
        </g>
        {/* Tonearm resting on the outer grooves. */}
        <g transform={`rotate(${arm} 1700 210)`}>
          <circle cx={1700} cy={210} r={46} fill="#0C0B09" stroke={GOLD.dark} strokeWidth={3} />
          <path d="M1700 210 L1520 420 L1430 520" stroke="#B9B2A4" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M1700 210 L1520 420 L1430 520" stroke="#FFF4DA" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
          <rect x={1398} y={506} width={64} height={30} rx={6} fill={GOLD.mid} transform="rotate(-42 1430 520)" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
