import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LineArt} from '../art/LineArt';
import {CHANDELIER, DRESS} from '../art/drawings';
import {Bokeh} from '../fx/Bokeh';
import {Reflect} from '../fx/Reflect';
import {easeInOutSine, lerp, prog} from '../lib/anim';

const FLOOR = 838;

/** Her past drawn in gold by a single pen over a black mirror floor, each piece turning to dust. */
export const Memory: React.FC<{t: number}> = ({t}) => {
  const zoom = lerp(1.0, 1.05, prog(t, 0, 16, easeInOutSine));
  const pan = lerp(30, -30, prog(t, 0, 16, easeInOutSine));
  const art = (
    <>
      <LineArt drawing={DRESS} cx={700} cy={498} size={680} t={t} draw={5.6} dissolve={6.6} dissolveDur={3.4} width={2.4} />
      <LineArt drawing={CHANDELIER} cx={1250} cy={452} size={720} t={t - 6.8} draw={6.4} width={2.4} />
    </>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${pan}px) scale(${zoom})`, transformOrigin: '960px 540px'}}>
        <Bokeh seed="mem" count={110} focus={0.7} drift={[16, -6]} intensity={0.7} cam={{x: pan * 1.5, y: 0, zoom}} />
        <div
          style={{
            position: 'absolute',
            left: 160,
            top: FLOOR - 70,
            width: 1600,
            height: 240,
            background: 'radial-gradient(ellipse 50% 40% at 50% 35%, rgba(200,160,96,0.09), rgba(0,0,0,0) 75%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: FLOOR,
            width: 1920,
            height: 1,
            background: 'linear-gradient(90deg, rgba(222,186,122,0), rgba(222,186,122,0.16) 30%, rgba(222,186,122,0.16) 70%, rgba(222,186,122,0))',
          }}
        />
        {art}
        <Reflect floor={FLOOR}>{art}</Reflect>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
