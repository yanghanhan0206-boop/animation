import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AMBER, Tile} from '../../frames/Departure';
import {Bokeh} from '../../fx/Bokeh';
import {easeInOutSine, lerp, prog} from '../../lib/anim';
import {SERIF_CN, SERIF_EN} from '../../theme';

// 「快四年半了」: a split-flap counter rolls up to 1642 days, digit by digit.

const TARGET = '1642';
const SCALE = 4.4;

export const Days: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const zoom = lerp(1, 1.05, prog(t, 0, dur, easeInOutSine));
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #10141E 0%, #05070B 70%)', transform: `scale(${zoom})`}}>
      <Bokeh seed="days" count={60} focus={0.15} drift={[4, -2]} intensity={0.45} sizeScale={1.4} />
      <div style={{position: 'absolute', left: 960, top: 470, transform: 'translate(-50%, -50%)', display: 'flex', gap: 24, alignItems: 'center'}}>
        {[...TARGET].map((d, i) => {
          const settle = 0.35 + i * 0.22;
          const spinning = t < settle;
          const step = Math.floor(t * 18);
          const shown = spinning ? String((Number(d) + step + i * 3) % 10) : d;
          return (
            <div key={i} style={{width: 42 * SCALE, height: 60 * SCALE, position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'drop-shadow(0 0 6px rgba(255,150,50,0.35))'}}>
                <Tile ch={shown} color={AMBER} flip={spinning ? (t * 18) % 1 : 0} />
              </div>
            </div>
          );
        })}
        <div style={{marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, opacity: prog(t, 1.0, 1.5)}}>
          <span style={{fontFamily: SERIF_CN, fontWeight: 500, fontSize: 92, color: AMBER, textShadow: '0 0 24px rgba(255,160,60,0.45)'}}>天</span>
          <span style={{fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 30, letterSpacing: '0.2em', color: 'rgba(240,220,190,0.7)'}}>days</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
