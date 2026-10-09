import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GlitchText} from '../components/Text';
import {Reticle} from '../components/Reticle';
import {easeInCubic, easeOutBack, easeOutCubic, keys, lerp, prog, shake, spr} from '../lib/anim';
import {useBare} from '../lib/context';
import {CUT, LOCK_ON} from '../lib/transitions';
import {cue} from '../timeline';
import {C, FONT_CN, accentA} from '../theme';

const CX = 540;
const CY = 640;

/** 0–3s: a reticle hunts for the viewer's dot and locks on; "不是巧合" slams in. */
export const S01Hook: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  const lock = LOCK_ON;

  const a = prog(f, 0, lock, easeOutCubic);
  const locked = spr(f, lock, {damping: 10, stiffness: 260});
  const wx = (1 - a) * Math.sin(f / 5) * 120;
  const wy = (1 - a) * (Math.cos(f / 6.5) * 50 - 30);
  const r = f < lock ? lerp(235, 205, a) : lerp(205, 186, locked) * (1 + 0.012 * Math.sin((f - lock) / 3));
  const bracket = f < lock ? lerp(1.22, 1.38, a) : lerp(1.38, 1.12, locked);
  const rot = f < lock ? (1 - a) * 260 + f * 0.6 : 0.6 * lock + (f - lock) * 0.5;
  const sweep = f * 9;

  // Zoom-through into the dot at the cut.
  const zoom = prog(f, CUT.s01 - 6, CUT.s01 + 5, easeInCubic);
  const scale = 1 + zoom * 13;
  const textFade = 1 - prog(f, CUT.s01 - 6, CUT.s01);
  const s = shake(f, lock, 14, 18);

  const wave = prog(f, lock, lock + 18, easeOutCubic);
  const line1 = cue(1).plain;
  const slam = spr(f, lock, {damping: 15, stiffness: 300, mass: 0.7});
  const glitch = Math.max(
    keys(f, [lock, lock + 1, lock + 10], [0, 1, 0.12]),
    keys(f, [lock + 14, lock + 15, lock + 17], [0, 0.6, 0]),
    keys(f, [lock + 24, lock + 25, lock + 26], [0, 0.5, 0]),
    keys(f, [lock + 30, lock + 31, lock + 34], [0, 0.7, 0]),
  );

  return (
    <AbsoluteFill style={{transform: `translate(${s.x}px, ${s.y}px)`}}>
      <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: `${CX}px ${CY}px`}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          {!bare && (
            <g opacity={0.4}>
              {Array.from({length: 60}, (_, i) => {
                const ang = i * 6 - f * 0.4;
                const long = i % 5 === 0;
                return (
                  <line
                    key={i}
                    x1={CX}
                    y1={CY - 300}
                    x2={CX}
                    y2={CY - (long ? 276 : 288)}
                    stroke={C.accent}
                    strokeWidth={long ? 4 : 2}
                    transform={`rotate(${ang} ${CX} ${CY})`}
                  />
                );
              })}
            </g>
          )}
          {f < lock + 4 && (
            <line
              x1={CX + wx}
              y1={CY + wy}
              x2={CX + wx + r * 0.95}
              y2={CY + wy}
              stroke={accentA(0.5)}
              strokeWidth={3}
              transform={`rotate(${sweep} ${CX + wx} ${CY + wy})`}
              opacity={1 - prog(f, lock, lock + 4)}
            />
          )}
          {f >= lock && (
            <circle cx={CX} cy={CY} r={186 + 260 * wave} fill="none" stroke={C.accent} strokeWidth={6} opacity={0.75 * (1 - wave)} />
          )}
          <Reticle cx={CX + wx} cy={CY + wy} r={r} rot={rot} inner={-f * 2.2} bracket={bracket} />
          <circle cx={CX} cy={CY} r={26 + 6 * Math.sin(f / 4)} fill={C.white} opacity={0.14} />
          <circle cx={CX} cy={CY} r={14} fill={C.white} />
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 1030 - 62,
          height: 124,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: FONT_CN,
          fontWeight: 900,
          fontSize: 92,
          color: C.white,
          textShadow: '0 6px 22px rgba(0,0,0,0.75)',
          opacity: textFade * (f >= lock ? lerp(1, 0.82, prog(f, lock, lock + 8)) : 1),
          transform: `translateY(${f >= lock ? -10 * prog(f, lock, lock + 8) : 0}px)`,
        }}
      >
        {[...line1].map((ch, i) => {
          const p = prog(f, 1 + i * 3, 7 + i * 3);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: prog(f, 1 + i * 3, 4 + i * 3),
                transform: `scale(${lerp(1.7, 1, easeOutBack(p))})`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {f >= lock && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: 1080,
            top: 1205 - 130,
            height: 260,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: FONT_CN,
            fontWeight: 900,
            fontSize: 200,
            color: C.accent,
            opacity: prog(f, lock, lock + 3) * textFade,
            transform: `scale(${lerp(2.6, 1, slam) * (1 + 0.015 * Math.sin((f - lock) / 4))})`,
          }}
        >
          <GlitchText
            text={cue(2).plain}
            style={{textShadow: `0 0 40px ${accentA(0.45)}, 0 8px 28px rgba(0,0,0,0.6)`}}
            f={f}
            amount={glitch}
            seed="hook"
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
