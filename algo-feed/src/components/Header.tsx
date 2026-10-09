import React from 'react';
import {useCurrentFrame} from 'remotion';
import {prog} from '../lib/anim';
import {collapseEnd, collapseStart} from '../lib/transitions';
import {STEPS} from '../timeline';
import {C, FONT_MONO, L, accentA} from '../theme';

export const HEADER_NUM_SIZE = 44;
/** Centre of the step number, where a title card's big digits land. */
export const HEADER_NUM_CENTER = {x: L.safeLeft + HEADER_NUM_SIZE * 0.6, y: L.headerY};

const SEG_X0 = 250;
const SEG_W = 168;
const SEG_GAP = 16;

/** "01 /04" plus four progress segments; appears once the first title card folds into it. */
export const Header: React.FC = () => {
  const f = useCurrentFrame();
  const first = collapseEnd(STEPS[0]);
  const last = STEPS[STEPS.length - 1].to;
  const opacity = prog(f, first - 6, first + 4) * (1 - prog(f, last - 6, last + 8));
  if (opacity <= 0) return null;

  // The number shown is the last step whose digits have landed; it fades while the next one flies in.
  const landed = STEPS.filter((s) => f >= collapseEnd(s));
  const current = landed[landed.length - 1] ?? STEPS[0];
  const next = STEPS.find((s) => f >= collapseStart(s) && f < collapseEnd(s));
  const numOpacity = next && next !== current ? 1 - prog(f, collapseStart(next), collapseStart(next) + 6) : 1;

  return (
    <svg width={L.W} height={L.H} style={{position: 'absolute', opacity}}>
      <text
        x={L.safeLeft}
        y={L.headerY}
        dominantBaseline="central"
        fontFamily={FONT_MONO}
        fontWeight={800}
        fontSize={HEADER_NUM_SIZE}
        fill={C.accent}
        opacity={numOpacity}
      >
        {current.num}
      </text>
      <text
        x={L.safeLeft + HEADER_NUM_SIZE * 1.25}
        y={L.headerY + 4}
        dominantBaseline="central"
        fontFamily={FONT_MONO}
        fontWeight={800}
        fontSize={26}
        fill={C.gray}
      >
        /04
      </text>
      {STEPS.map((s, i) => {
        const x = SEG_X0 + i * (SEG_W + SEG_GAP);
        const fill = prog(f, s.from, s.to);
        const active = f >= s.from && f < s.to;
        return (
          <g key={s.n}>
            <rect x={x} y={L.headerY - 5} width={SEG_W} height={10} rx={5} fill={C.track} />
            {active && <rect x={x - 3} y={L.headerY - 8} width={SEG_W * fill + 6} height={16} rx={8} fill={accentA(0.22)} />}
            <rect
              x={x}
              y={L.headerY - 5}
              width={SEG_W * fill}
              height={10}
              rx={5}
              fill={C.accent}
              opacity={active ? 1 : 0.55}
            />
          </g>
        );
      })}
    </svg>
  );
};
