import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../fx/Bokeh';
import {clamp, easeInOutSine, easeOutCubic, prog, rnd, rndRange} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {H, SERIF_EN, W} from '../theme';
import {GoldText, fromLeft} from '../type/GoldText';

// 「It's a love song, tough song / 这是流着泪的情歌 / 握紧我的话筒」: an empty stage, one
// spotlight, a microphone on its stand. Gold dust hangs in the beam; a few drops fall
// through it like tears.

const SRC = {x: 1700, y: -260};
const MIC = {x: 1390, y: 470, rot: 32};
const coneWeight = (x: number, y: number) => {
  // Inside the beam the dust is lit, outside it nearly vanishes.
  const dy = y - SRC.y;
  if (dy <= 0) return 0.05;
  const axisX = SRC.x + (MIC.x - SRC.x) * (dy / (MIC.y + 260 - SRC.y));
  const half = 60 + dy * 0.36;
  return clamp(1 - Math.abs(x - axisX) / half) * 1 + 0.04;
};

const LeafLine: React.FC<{text: string; left: number; top: number; size: number; spacing: string; opacity?: number; blur?: number}> = ({text, left, top, size, spacing, opacity = 1, blur = 0}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      fontFamily: SERIF_EN,
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: spacing,
      color: 'transparent',
      backgroundImage: 'linear-gradient(180deg, #FFF1CC 0%, #E8C886 30%, #C29A55 55%, #86622C 80%, #C9A260 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      filter: `drop-shadow(0 0 18px rgba(214,178,110,0.35))${blur > 0.05 ? ` blur(${blur}px)` : ''}`,
      opacity,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

export type LoveSongVariant = 'frame' | 'intro' | 'drop';

/** Reveal for a line of the big title: opacity and blur from a start time. */
const rev = (t: number, at: number, dur: number) => {
  const p = prog(t, at, at + dur, easeOutCubic);
  return {opacity: p, blur: (1 - p) * 14};
};

export const LoveSong: React.FC<{t: number; v?: LoveSongVariant}> = ({t, v = 'frame'}) => {
  const f = useCurrentFrame();
  // Light level, title timing and camera for each use of the shot.
  const light = v === 'intro' ? prog(t, 0.8, 2.2, easeInOutSine) : 1;
  const typeOut = v === 'intro' ? prog(t, 4.4, 5.2, easeInOutSine) : 0;
  const push = v === 'intro' ? prog(t, 4.6, 7.6, easeInOutSine) : v === 'drop' ? prog(t, 0, 2.9, easeInOutSine) * 0.15 : 0;
  const zoom = 1 + push * (v === 'intro' ? 0.55 : 0.4);
  const T =
    v === 'intro'
      ? {a: rev(t, 1.45, 0.9), l1: rev(t, 1.6, 1.1), l2: rev(t, 2.9, 1.1), zh: rev(t, 3.4, 1.2)}
      : v === 'drop'
        ? {a: rev(t, 0, 0.25), l1: rev(t, 0, 0.3), l2: rev(t, 1.35, 0.3), zh: rev(t, 1.7, 0.5)}
        : {a: rev(1, 0, 0.1), l1: rev(1, 0, 0.1), l2: rev(1, 0, 0.1), zh: rev(1, 0, 0.1)};
  const beam = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#040303';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = light;
      // The cone: a soft-edged wedge from the lamp down past the microphone.
      ctx.filter = 'blur(12px)';
      const end = {x: MIC.x - 40, y: H + 200};
      const len = Math.hypot(end.x - SRC.x, end.y - SRC.y);
      const ux = (end.x - SRC.x) / len;
      const uy = (end.y - SRC.y) / len;
      const nx = -uy;
      const ny = ux;
      for (const [spread, alpha] of [
        [0.2, 0.08],
        [0.14, 0.11],
        [0.07, 0.12],
      ] as const) {
        const g = ctx.createLinearGradient(SRC.x, SRC.y, end.x, end.y);
        g.addColorStop(0, `rgba(255,236,200,${alpha * 1.6})`);
        g.addColorStop(0.55, `rgba(240,200,140,${alpha})`);
        g.addColorStop(1, 'rgba(200,150,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(SRC.x + nx * 30, SRC.y + ny * 30);
        ctx.lineTo(SRC.x - nx * 30, SRC.y - ny * 30);
        ctx.lineTo(end.x - nx * len * spread, end.y - ny * len * spread);
        ctx.lineTo(end.x + nx * len * spread, end.y + ny * len * spread);
        ctx.closePath();
        ctx.fill();
      }
      ctx.filter = 'none';
      // A pool of light on the floor below the stand.
      ctx.save();
      ctx.translate(MIC.x + 40, 930);
      ctx.scale(1, 0.16);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 520);
      pool.addColorStop(0, 'rgba(255,214,150,0.22)');
      pool.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(-520, -520, 1040, 1040);
      ctx.restore();
      // Drops falling through the light.
      ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const x = rndRange(`dx${i}`, 1080, 1520);
        const y = ((rnd(`dy${i}`) * 1200 + t * rndRange(`dv${i}`, 380, 620)) % 1200) - 100;
        const w = coneWeight(x, y);
        ctx.strokeStyle = `rgba(255,226,170,${0.5 * w})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y - 26);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },
    [f, light],
  );

  const g = 'url(#mic-grille)';
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${MIC.x - 20}px ${MIC.y - 10}px`}}>
      <canvas ref={beam} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed="stage" count={220} focus={0.5} drift={[-4, 10]} intensity={1.1 * light} weight={coneWeight} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="mic-mesh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#0B0A09" />
            <rect width="6" height="1.2" fill="#4A3E30" />
            <rect width="1.2" height="6" fill="#4A3E30" />
          </pattern>
          <radialGradient id="mic-sphere" cx="0.42" cy="0.38" r="0.62">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="mic-grille" cx="0.68" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#FFF0CF" stopOpacity="0.9" />
            <stop offset="0.25" stopColor="#C9A060" stopOpacity="0.45" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mic-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E9CF98" />
            <stop offset="0.12" stopColor="#5A4A35" />
            <stop offset="0.5" stopColor="#151210" />
            <stop offset="1" stopColor="#050404" />
          </linearGradient>
          <linearGradient id="stand" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#050404" />
            <stop offset="0.7" stopColor="#2A241C" />
            <stop offset="0.85" stopColor="#E3C58E" />
            <stop offset="1" stopColor="#3A3024" />
          </linearGradient>
        </defs>
        {/* Stand: pole from the floor up to the clip. */}
        <rect x={MIC.x + 152} y={560} width={12} height={420} fill="url(#stand)" />
        <ellipse cx={MIC.x + 158} cy={958} rx={120} ry={16} fill="#0A0807" stroke="#5A4A35" strokeWidth={2} />
        <g transform={`translate(${MIC.x} ${MIC.y}) rotate(${MIC.rot})`}>
          {/* Clip and handle. */}
          <rect x={150} y={-30} width={46} height={60} rx={8} fill="#0E0C0A" stroke="#6B5838" strokeWidth={2} />
          <path d="M44 -36 L292 -24 Q300 0 292 24 L44 36 Z" fill="url(#mic-body)" />
          <path d="M44 -36 L292 -24" stroke="#F3DDA8" strokeWidth={2.4} opacity={0.85} />
          <rect x={30} y={-42} width={26} height={84} rx={6} fill="url(#mic-body)" />
          <path d="M30 -40 L56 -40" stroke="#F3DDA8" strokeWidth={2.4} />
          {/* Grille. */}
          <circle cx={0} cy={0} r={58} fill="url(#mic-mesh)" />
          <circle cx={0} cy={0} r={58} fill="url(#mic-sphere)" />
          <circle cx={0} cy={0} r={58} fill={g} />
          <path d="M-40 -42 A58 58 0 0 1 46 -36" fill="none" stroke="#FFF2D2" strokeWidth={3} opacity={0.9} />
          <circle cx={0} cy={0} r={58} fill="none" stroke="#2A2219" strokeWidth={2} />
        </g>
      </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 206, top: 318, fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 40, letterSpacing: '0.24em', color: 'rgba(233,214,180,0.7)', opacity: T.a.opacity * (1 - typeOut), filter: `blur(${T.a.blur + typeOut * 10}px)`}}>
        it's a
      </div>
      <LeafLine text="LOVE SONG" left={196} top={370} size={128} spacing="0.1em" opacity={T.l1.opacity * (1 - typeOut)} blur={T.l1.blur + typeOut * 12} />
      <LeafLine text="TOUGH SONG" left={196} top={506} size={128} spacing="0.1em" opacity={0.92 * T.l2.opacity * (1 - typeOut)} blur={T.l2.blur + typeOut * 12} />
      {v !== 'drop' && T.zh.opacity > 0 && (
        <GoldText text="这是流着泪的情歌" x={fromLeft('这是流着泪的情歌', 206, 52, 0.3)} y={716} size={52} weight={300} spacing={0.3} t={v === 'intro' ? t - 3.4 : t} stagger={0.08} reveal={1} blur={10} glow={0.3} flat="#EFE6D6" opacity={1 - typeOut} />
      )}
    </AbsoluteFill>
  );
};
