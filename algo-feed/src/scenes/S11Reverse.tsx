import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon} from '../components/Icons';
import {PHONE_INSET, Phone} from '../components/Phone';
import {Reticle} from '../components/Reticle';
import {easeOutCubic, lerp, prog, shake, spr} from '../lib/anim';
import {useBare} from '../lib/context';
import {CUT, REVERSE_LOCK} from '../lib/transitions';
import {cue} from '../timeline';
import {C, accentA} from '../theme';

const PH = {cx: 540, cy: 780, w: 380, h: 780};
const SCREEN = {x: PH.cx - PH.w / 2 + PHONE_INSET, y: PH.cy - PH.h / 2 + PHONE_INSET, w: PH.w - 2 * PHONE_INSET, h: PH.h - 2 * PHONE_INSET};
const CARD_H = 300;
const GAP = 18;

/** 47.2–49.5s: "你刷视频" – an all-cat feed scrolls; "它在刷你" – the phone turns around and locks on. */
export const S11Reverse: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  const c27 = cue(27);
  const c28 = cue(28);

  const enter = spr(f, c27.start - 4, {damping: 14, stiffness: 140});
  const flip = prog(f, c28.start, c28.start + 12);
  const flipX = Math.abs(Math.cos(Math.PI * flip));
  const turned = flip >= 0.5;
  const lock = spr(f, REVERSE_LOCK, {damping: 10, stiffness: 240});
  const s = shake(f, REVERSE_LOCK, 12, 14);
  const release = prog(f, CUT.s11 - 2, CUT.s11 + 12, easeOutCubic);
  const scroll = (f - c27.start) * 9;
  const t = f - c28.start;

  return (
    <AbsoluteFill
      style={{
        opacity: prog(f, c27.start - 6, c27.start) * (1 - release),
        transform: `translate(${s.x}px, ${s.y + (1 - enter) * 260}px)`,
      }}
    >
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(${PH.cx} 0) scale(${flipX} 1) translate(${-PH.cx} 0)`}>
          <Phone id="s11" cx={PH.cx} cy={PH.cy} w={PH.w} h={PH.h} stroke={turned ? C.accent : undefined}>
            {!turned &&
              Array.from({length: 6}, (_, k) => {
                const period = CARD_H + GAP;
                const y = SCREEN.y + 14 + ((k * period - scroll) % (period * 4) + period * 4) % (period * 4) - period;
                return (
                  <g key={k}>
                    <rect x={SCREEN.x + 14} y={y} width={SCREEN.w - 28} height={CARD_H} rx={24} fill={C.card} />
                    <Icon kind="cat" x={PH.cx} y={y + CARD_H / 2 - 16} size={132} color={C.accent} cut={C.card} />
                    <rect x={SCREEN.x + 34} y={y + CARD_H - 34} width={SCREEN.w - 68} height={6} rx={3} fill={C.track} />
                    <rect x={SCREEN.x + 34} y={y + CARD_H - 34} width={(SCREEN.w - 68) * ((k * 0.37) % 1)} height={6} rx={3} fill={C.accent} />
                  </g>
                );
              })}
            {turned && (
              <g>
                <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} fill="#0F1712" />
                {[0, 1, 2, 3].map((k) => {
                  const w = ((t * 1.2 + k * 25) % 100) / 100;
                  return <circle key={k} cx={PH.cx} cy={PH.cy} r={40 + w * 260} fill="none" stroke={C.accent} strokeWidth={3} opacity={0.6 * (1 - w)} />;
                })}
                <circle cx={PH.cx} cy={PH.cy} r={34 + 4 * Math.sin(f / 3)} fill={C.white} opacity={0.18} />
                <circle cx={PH.cx} cy={PH.cy} r={20} fill={C.white} />
              </g>
            )}
          </Phone>
        </g>
        {!bare && turned && <circle cx={PH.cx} cy={PH.cy} r={lerp(300, 450, release)} fill="none" stroke={accentA(0.25)} strokeWidth={2} />}
        {f >= REVERSE_LOCK - 4 && (
          <Reticle
            cx={PH.cx}
            cy={PH.cy}
            r={lerp(270, 196, lock) + release * 300}
            rot={(f - REVERSE_LOCK) * 0.8}
            inner={-f * 2.4}
            bracket={lerp(1.5, 1.18, lock)}
            opacity={prog(f, REVERSE_LOCK - 4, REVERSE_LOCK)}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
