import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon, type IconKind} from '../components/Icons';
import {easeInCubic, easeInOutCubic, easeOutCubic, lerp, prog, spr} from '../lib/anim';
import {CUT} from '../lib/transitions';
import {cue} from '../timeline';
import {C, FONT_MONO, accentA} from '../theme';

const CARD_W = 170;
const CARD_H = 226;
const CARD_Y = 600;
const PERIOD = 196;
const SPEED = 6;
const PICK = 4;
const DOT = {x: 540, y: 960};
const STREAM: IconKind[] = ['note', 'bowl', 'gamepad', 'mountain', 'cat', 'ball', 'book', 'dumbbell', 'note', 'bowl', 'mountain', 'gamepad', 'ball'];

const NODE_Y = 760;
const NODE_R = 84;
const NODE_X = [218, 433, 647, 862];
const NODE_ICONS: IconKind[] = ['notebook', 'funnel', 'bars', 'loop'];

const Card: React.FC<{x: number; y: number; kind: IconKind; scale?: number; opacity?: number; hot?: boolean}> = ({
  x,
  y,
  kind,
  scale = 1,
  opacity = 1,
  hot = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <rect
      x={-CARD_W / 2}
      y={-CARD_H / 2}
      width={CARD_W}
      height={CARD_H}
      rx={22}
      fill={C.card}
      stroke={hot ? C.accent : C.cardBorder}
      strokeWidth={hot ? 5 : 3}
    />
    <Icon kind={kind} x={0} y={-18} size={96} color={kind === 'cat' ? C.accent : C.grayLight} cut={C.card} />
    <rect x={-CARD_W / 2 + 22} y={CARD_H / 2 - 52} width={92} height={12} rx={6} fill={C.grayDark} />
    <rect x={-CARD_W / 2 + 22} y={CARD_H / 2 - 32} width={60} height={12} rx={6} fill={C.grayDark} />
  </g>
);

/** 3–6.7s: a content stream; one card gets picked for "you". Then the four-step roadmap. */
export const S02Bridge: React.FC = () => {
  const f = useCurrentFrame();
  const t0 = CUT.s01;
  const pickAt = t0 + 14;
  const dropAt = pickAt + 10;
  const phaseB = cue(4).start;

  const enter = prog(f, t0 + 2, t0 + 16, easeOutCubic);
  const enterScale = lerp(1.25, 1, enter);
  const streamOut = prog(f, phaseB, phaseB + 12, easeInCubic);

  const sel = spr(f, pickAt, {damping: 11, stiffness: 220});
  const drop = prog(f, dropAt, dropAt + 20, easeInOutCubic);
  const absorbed = f >= dropAt + 20;
  const dotPulse = prog(f, dropAt + 18, dropAt + 36);

  const line = prog(f, phaseB + 7, phaseB + 35, easeInOutCubic);
  const zoom = prog(f, CUT.s02 - 10, CUT.s02 + 4, easeInCubic);
  const fadeOut = 1 - prog(f, CUT.s02 - 2, CUT.s02 + 6);
  const zx = lerp(0, 540 - NODE_X[0], zoom);
  const zy = lerp(0, 640 - NODE_Y, zoom);

  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <AbsoluteFill
        style={{
          transform: `translate(${zx}px, ${zy}px) scale(${1 + zoom * 5})`,
          transformOrigin: `${NODE_X[0]}px ${NODE_Y}px`,
        }}
      >
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          {streamOut < 1 && (
            <g
              opacity={1 - streamOut}
              transform={`translate(0 ${-50 * streamOut}) translate(540 ${CARD_Y}) scale(${enterScale}) translate(-540 ${-CARD_Y})`}
            >
              {STREAM.map((kind, i) => {
                if (i === PICK) return null;
                const x = -160 + PERIOD * i - SPEED * (f - t0);
                if (x < -150 || x > 1230) return null;
                return <Card key={i} x={x} y={CARD_Y} kind={kind} opacity={f >= pickAt ? lerp(1, 0.45, sel) : 1} />;
              })}
              {!absorbed && (() => {
                const free = -160 + PERIOD * PICK - SPEED * (f - t0);
                const x = f < pickAt ? free : 540;
                const y = lerp(CARD_Y - 22 * sel, DOT.y, drop);
                return (
                  <>
                    <Card
                      x={x}
                      y={y}
                      kind="cat"
                      hot={f >= pickAt}
                      scale={lerp(1 + 0.1 * sel, 0.16, drop)}
                      opacity={1 - prog(f, dropAt + 14, dropAt + 20)}
                    />
                    {f >= pickAt && drop < 0.3 &&
                      [
                        [-1, -1],
                        [1, -1],
                        [1, 1],
                        [-1, 1],
                      ].map(([sx, sy]) => {
                        const m = lerp(46, 16, sel);
                        const bx = x + sx * (CARD_W / 2 + m) * (1 + 0.1 * sel);
                        const by = CARD_Y - 22 * sel + sy * (CARD_H / 2 + m) * (1 + 0.1 * sel);
                        return (
                          <path
                            key={`${sx}${sy}`}
                            d={`M${bx} ${by - sy * 34} L${bx} ${by} L${bx - sx * 34} ${by}`}
                            stroke={C.accent}
                            strokeWidth={7}
                            fill="none"
                            opacity={sel * (1 - drop / 0.3)}
                          />
                        );
                      })}
                  </>
                );
              })()}
              <circle cx={DOT.x} cy={DOT.y} r={20 + 70 * dotPulse} fill="none" stroke={C.accent} strokeWidth={5} opacity={dotPulse > 0 ? 0.8 * (1 - dotPulse) : 0} />
              <circle cx={DOT.x} cy={DOT.y} r={30 + 5 * Math.sin(f / 4)} fill={C.white} opacity={0.14} />
              <circle cx={DOT.x} cy={DOT.y} r={16} fill={absorbed && dotPulse < 1 ? C.accent : C.white} />
            </g>
          )}

          {f >= phaseB && (
            <g>
              <line x1={NODE_X[0]} y1={NODE_Y} x2={NODE_X[3]} y2={NODE_Y} stroke={C.track} strokeWidth={6} />
              <line
                x1={NODE_X[0]}
                y1={NODE_Y}
                x2={lerp(NODE_X[0], NODE_X[3], line)}
                y2={NODE_Y}
                stroke={C.accent}
                strokeWidth={6}
              />
              {line >= 1 && (
                <circle
                  cx={lerp(NODE_X[0], NODE_X[3], ((f - phaseB) % 24) / 24)}
                  cy={NODE_Y}
                  r={9}
                  fill={C.white}
                />
              )}
              {NODE_X.map((x, k) => {
                const pop = spr(f, phaseB + 7 + k * 6, {damping: 10, stiffness: 200});
                const lit = line >= k / 3 - 0.001;
                const bob = Math.sin((f - phaseB) / 7 + k) * 6;
                return (
                  <g key={k} transform={`translate(${x} ${NODE_Y + bob}) scale(${pop})`}>
                    {lit && <circle r={NODE_R + 14} fill={accentA(0.12)} />}
                    <circle r={NODE_R} fill={C.card} stroke={lit ? C.accent : C.grayDark} strokeWidth={5} />
                    <Icon kind={NODE_ICONS[k]} x={0} y={0} size={80} color={lit ? C.accent : C.gray} cut={C.card} />
                    <text
                      y={NODE_R + 46}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily={FONT_MONO}
                      fontWeight={800}
                      fontSize={36}
                      fill={lit ? C.accent : C.gray}
                    >
                      {`0${k + 1}`}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
