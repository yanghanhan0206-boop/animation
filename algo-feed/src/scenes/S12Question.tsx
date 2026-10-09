import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon} from '../components/Icons';
import {lerp, prog, spr} from '../lib/anim';
import {cue} from '../timeline';
import {C, FONT_MONO, accentA} from '../theme';

const RING = {x: 540, y: 690, r: 168, n: 13};
const STRANGER = {x: 850, y: 452, r: 46};
const BUBBLE = {x: 540, y: 1010, w: 176, h: 112};

/** 49.5–52.2s: your all-cat bubble, one unknown "?" drifting outside it, and a comment prompt. */
export const S12Question: React.FC = () => {
  const f = useCurrentFrame();
  const c = cue(29);
  const t = f - c.start;
  const ringIn = spr(f, c.start - 4, {damping: 13, stiffness: 140});
  const strangerIn = spr(f, c.start + 8, {damping: 11, stiffness: 160});
  const bubbleIn = spr(f, c.start + 16, {damping: 9, stiffness: 220});
  const bob = Math.sin(t / 7) * 9;
  const sx = STRANGER.x;
  const sy = STRANGER.y + bob;
  const dirX = sx - RING.x;
  const dirY = sy - RING.y;
  const len = Math.hypot(dirX, dirY);
  const from = {x: RING.x + (dirX / len) * (RING.r + 40), y: RING.y + (dirY / len) * (RING.r + 40)};
  const to = {x: sx - (dirX / len) * (STRANGER.r + 12), y: sy - (dirY / len) * (STRANGER.r + 12)};

  return (
    <AbsoluteFill style={{opacity: prog(f, c.start - 2, c.start + 6)}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(${RING.x} ${RING.y}) scale(${lerp(0.5, 1, ringIn)}) translate(${-RING.x} ${-RING.y})`}>
          <circle cx={RING.x} cy={RING.y} r={RING.r} fill="none" stroke={accentA(0.2)} strokeWidth={2} />
          {Array.from({length: RING.n}, (_, i) => {
            const a = ((t * 0.8 + (i * 360) / RING.n - 90) * Math.PI) / 180;
            return <Icon key={i} kind="cat" x={RING.x + RING.r * Math.cos(a)} y={RING.y + RING.r * Math.sin(a)} size={56} color={C.accent} />;
          })}
          <circle cx={RING.x} cy={RING.y} r={34 + 4 * Math.sin(f / 4)} fill={accentA(0.22)} />
          <circle cx={RING.x} cy={RING.y} r={20} fill={C.white} />
        </g>

        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={C.grayLight} strokeWidth={3} strokeDasharray="4 14" strokeDashoffset={-t * 1.5} strokeLinecap="round" opacity={0.45 * strangerIn} />
        <g transform={`translate(${sx} ${sy}) scale(${strangerIn})`} opacity={0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t / 6))}>
          <circle r={STRANGER.r} fill={C.bg} stroke={C.grayLight} strokeWidth={4} strokeDasharray="10 9" transform={`rotate(${t * 2})`} />
          <text y={3} textAnchor="middle" dominantBaseline="central" fontFamily={FONT_MONO} fontWeight={800} fontSize={56} fill={C.grayLight}>
            ?
          </text>
        </g>

        <g transform={`translate(${BUBBLE.x} ${BUBBLE.y}) scale(${bubbleIn})`}>
          <path
            d={`M${-BUBBLE.w / 2 + 26} ${-BUBBLE.h / 2} H${BUBBLE.w / 2 - 26} Q${BUBBLE.w / 2} ${-BUBBLE.h / 2} ${BUBBLE.w / 2} ${-BUBBLE.h / 2 + 26} V${BUBBLE.h / 2 - 26} Q${BUBBLE.w / 2} ${BUBBLE.h / 2} ${BUBBLE.w / 2 - 26} ${BUBBLE.h / 2} H${-BUBBLE.w / 2 + 64} L${-BUBBLE.w / 2 + 30} ${BUBBLE.h / 2 + 30} V${BUBBLE.h / 2} H${-BUBBLE.w / 2 + 26} Q${-BUBBLE.w / 2} ${BUBBLE.h / 2} ${-BUBBLE.w / 2} ${BUBBLE.h / 2 - 26} V${-BUBBLE.h / 2 + 26} Q${-BUBBLE.w / 2} ${-BUBBLE.h / 2} ${-BUBBLE.w / 2 + 26} ${-BUBBLE.h / 2} Z`}
            fill={C.card}
            stroke={C.accent}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          {[-44, 0, 44].map((x, k) => (
            <circle key={k} cx={x} cy={-12 * Math.max(0, Math.sin(t / 4 - k * 0.9))} r={11} fill={C.accent} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
