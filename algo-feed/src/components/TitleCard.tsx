import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeInCubic, easeInOutCubic, easeOutCubic, lerp, prog, rnd, spr} from '../lib/anim';
import {useBare} from '../lib/context';
import {COLLAPSE_LEN, collapseStart} from '../lib/transitions';
import type {Step} from '../timeline';
import {C, FONT_CN, FONT_MONO, accentA} from '../theme';
import {HEADER_NUM_CENTER, HEADER_NUM_SIZE} from './Header';

const DIGIT_SIZE = 300;
const DIGIT_Y = 640;
const TITLE_Y = 880;
const CHIP_Y = 1032;

/**
 * Step title card: outlined number drawn in one stroke, the plain-language title, and a
 * sticker with the jargon. At the end the number flies into the step bar.
 */
export const TitleCard: React.FC<{step: Step; zoomIn?: boolean}> = ({step, zoomIn = false}) => {
  const f = useCurrentFrame();
  const bare = useBare();
  const t0 = step.from;
  const t = f - t0;
  const cs = collapseStart(step);

  const cp = prog(f, cs, cs + COLLAPSE_LEN, easeInOutCubic);
  const draw = prog(f, t0 - 4, t0 + 18, easeOutCubic);
  const enterScale = zoomIn ? lerp(1.8, 1, prog(f, t0 - 8, t0 + 8, easeOutCubic)) : 1;
  const enterOpacity = zoomIn ? prog(f, t0 - 8, t0 - 1) : 1;
  const float = Math.sin(t / 11) * 7 * (1 - cp);
  const dx = lerp(540, HEADER_NUM_CENTER.x, cp);
  const dy = lerp(DIGIT_Y, HEADER_NUM_CENTER.y, cp) + float;
  const ds = lerp(1, HEADER_NUM_SIZE / DIGIT_SIZE, cp) * enterScale;
  const fill = Math.max(0.1 * prog(f, t0 + 12, t0 + 24), cp);

  const titleIn = spr(f, t0 + 3, {damping: 13, stiffness: 170});
  const chipIn = spr(f, t0 + 9, {damping: 9, stiffness: 240});
  const out = prog(f, cs, cs + 9, easeInCubic);
  const deco = 1 - prog(f, cs, cs + 8);

  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {!bare && (
          <g opacity={deco * prog(f, t0 - 4, t0 + 10)}>
            <circle
              cx={540}
              cy={DIGIT_Y}
              r={262}
              fill="none"
              stroke={accentA(0.22)}
              strokeWidth={3}
              strokeDasharray="4 18"
              transform={`rotate(${t * 1.4} 540 ${DIGIT_Y})`}
            />
            <circle
              cx={540}
              cy={DIGIT_Y}
              r={222}
              fill="none"
              stroke={accentA(0.5)}
              strokeWidth={4}
              strokeDasharray="160 1235"
              strokeLinecap="round"
              transform={`rotate(${-t * 4.2} 540 ${DIGIT_Y})`}
            />
            {Array.from({length: 14}, (_, i) => {
              const life = ((t * (1.1 + rnd(`tp${i}`)) + rnd(`tq${i}`) * 90) % 90) / 90;
              const x = 200 + rnd(`tx${i}`) * 680;
              const y = 1120 - life * 700;
              const s = 6 + rnd(`ts${i}`) * 8;
              return (
                <rect key={i} x={x} y={y} width={s} height={s} fill={C.accent} opacity={0.35 * Math.sin(Math.PI * life)} />
              );
            })}
          </g>
        )}
        <g transform={`translate(${dx} ${dy}) scale(${ds})`} opacity={enterOpacity}>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT_MONO}
            fontWeight={800}
            fontSize={DIGIT_SIZE}
            fill="none"
            stroke={accentA(0.22 + 0.12 * Math.sin(t / 4))}
            strokeWidth={22}
            strokeDasharray="1500"
            strokeDashoffset={1500 * (1 - draw)}
            opacity={1 - cp}
          >
            {step.num}
          </text>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT_MONO}
            fontWeight={800}
            fontSize={DIGIT_SIZE}
            fill={accentA(fill)}
            stroke={C.accent}
            strokeWidth={7}
            strokeLinejoin="round"
            strokeDasharray="1500"
            strokeDashoffset={1500 * (1 - draw)}
          >
            {step.num}
          </text>
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: TITLE_Y - 90,
          height: 180,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: FONT_CN,
          fontWeight: 900,
          fontSize: 136,
          letterSpacing: 6,
          color: C.white,
          textShadow: '0 8px 30px rgba(0,0,0,0.7)',
          opacity: Math.min(1, titleIn * 1.4) * (1 - out),
          transform: `translateY(${(1 - titleIn) * 70 - out * 60}px) scale(${0.88 + 0.12 * titleIn})`,
        }}
      >
        {step.title}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: CHIP_Y - 40,
          height: 80,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 14,
          fontFamily: FONT_CN,
          fontWeight: 900,
          opacity: Math.min(1, chipIn * 2) * (1 - out),
          transform: `translateY(${-out * 50}px) rotate(${(1 - chipIn) * -12 + Math.sin(t / 9) * 1.4}deg) scale(${lerp(1.6, 1, chipIn)})`,
        }}
      >
        <span style={{background: C.accent, color: C.bg, fontSize: 40, padding: '6px 18px', borderRadius: 14}}>行话</span>
        <span
          style={{
            border: `4px solid ${C.accent}`,
            color: C.accent,
            fontSize: 48,
            padding: '0px 26px',
            borderRadius: 40,
            background: 'rgba(11,15,13,0.85)',
          }}
        >
          {step.jargon}
        </span>
      </div>
    </>
  );
};
