import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bokeh} from '../fx/Bokeh';
import {Flare} from '../fx/Flare';
import {LightLeak} from '../fx/Frame';
import {easeInOutSine, easeOutCubic, lerp, prog} from '../lib/anim';
import {GoldText} from '../type/GoldText';
import {GOLD, SERIF_EN} from '../theme';

const LIGHT = {x: 1484, y: 262};
const TITLE = {x: 1118, y: 540};

/** Black, a single distant light, gold dust drifting through it; the title writes itself in. */
export const Opening: React.FC<{t: number}> = ({t}) => {
  const zoom = lerp(1, 1.04, prog(t, 0, 14, easeInOutSine));
  const flare = prog(t, 1.0, 3.8, easeInOutSine) * (0.94 + 0.06 * Math.sin(t * 1.3));
  const line = prog(t, 2.6, 5.2, easeInOutSine);
  const credit = prog(t, 6.0, 8.4, easeOutCubic);
  const sweep = prog(t, 7.4, 10.2);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${TITLE.x}px ${TITLE.y}px`}}>
        <LightLeak x={-120} y={820} r={760} opacity={0.12 + 0.05 * Math.sin(t * 0.5)} />
        <Bokeh
          seed="open"
          count={170}
          focus={0.55}
          drift={[-11, -7]}
          intensity={prog(t, 0.3, 3.2, easeInOutSine)}
          weight={(x, y) => 0.35 + 0.65 * Math.max(0, 1 - Math.hypot(x - LIGHT.x, y - LIGHT.y) / 900)}
        />
        <Flare x={LIGHT.x} y={LIGHT.y} intensity={flare} size={1} streak={lerp(0.25, 1.15, prog(t, 1.0, 6.0, easeInOutSine))} />

        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="open-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={GOLD.champagne} stopOpacity="0" />
              <stop offset="0.25" stopColor={GOLD.light} stopOpacity="0.9" />
              <stop offset="0.75" stopColor={GOLD.champagne} stopOpacity="0.9" />
              <stop offset="1" stopColor={GOLD.dark} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={1012} y={318} width={1.4} height={430 * line} fill="url(#open-line)" />
        </svg>

        <GoldText text="林宛瑜" x={TITLE.x} y={TITLE.y} size={118} weight={500} spacing={0.46} vertical t={t - 3.4} stagger={0.55} reveal={1.7} blur={22} drift={28} sweep={sweep} glow={0.65} />

        <div
          style={{
            position: 'absolute',
            left: 972 - 300,
            top: 540 - 20,
            width: 600,
            height: 40,
            transform: 'rotate(90deg)',
            transformOrigin: '300px 20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: SERIF_EN,
            fontWeight: 500,
            fontSize: 25,
            letterSpacing: `${lerp(1.2, 0.72, credit)}em`,
            color: GOLD.champagne,
            opacity: 0.78 * credit,
            filter: `blur(${(1 - credit) * 6}px)`,
          }}
        >
          RAPETER
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
