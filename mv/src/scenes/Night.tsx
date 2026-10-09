import React from 'react';
import {AbsoluteFill} from 'remotion';
import {City, HORIZON, WINDOW} from '../art/City';
import {Bokeh} from '../fx/Bokeh';
import {Rain} from '../fx/Rain';
import {easeInOutSine, lerp, prog} from '../lib/anim';
import {DustText} from '../type/DustText';
import {GOLD, SERIF_EN} from '../theme';

/** The city asleep in the rain; one window still lit, far away. The hook's lines live here. */
export const Night: React.FC<{t: number; windowOn?: number}> = ({t, windowOn = 1}) => {
  const zoom = lerp(1.0, 1.07, prog(t, 0, 20, easeInOutSine));
  const win = {x: WINDOW.x + WINDOW.w / 2, y: WINDOW.y + WINDOW.h / 2};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${win.x}px ${win.y}px`}}>
        <City t={t} windowOn={windowOn} />
        <Bokeh seed="night" count={34} focus={0.12} drift={[-6, 4]} intensity={0.4} sizeScale={1.3} />
      </AbsoluteFill>
      <Rain seed="rain" count={520} glow={{x: 960 + (win.x - 960) * zoom, y: 540 + (win.y - 540) * zoom, r: 280}} ground={HORIZON + 20} />
      <DustText text="林宛瑜" x={560} y={500} size={112} weight={500} spacing={0.5} t={t - 1.0} stagger={0.45} reveal={1.8} blur={20} sweep={prog(t, 4.5, 7.5)} dissolve={7.6} dissolveDur={2.2} glow={0.6} seed="night-title" />
      <div
        style={{
          position: 'absolute',
          left: 260,
          top: 596,
          width: 600,
          textAlign: 'center',
          fontFamily: SERIF_EN,
          fontStyle: 'italic',
          fontSize: 30,
          letterSpacing: '0.32em',
          color: GOLD.champagne,
          opacity: 0.7 * prog(t, 3, 5, easeInOutSine) * (1 - prog(t, 8.2, 9.4, easeInOutSine)),
        }}
      >
        Rapeter
      </div>
    </AbsoluteFill>
  );
};
