import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LineArt} from '../../art/LineArt';
import {CUPS} from '../../art/drawings';
import {Bokeh} from '../../fx/Bokeh';
import {Reflect} from '../../fx/Reflect';
import {easeInOutSine, lerp, prog} from '../../lib/anim';

// 「教给我的成长 我全部发自内心感激」: two cups drawn in gold on a black mirror; the steam
// from each finds the other.

const FLOOR = 712;

export const Gratitude: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const zoom = lerp(1.0, 1.06, prog(t, 0, dur, easeInOutSine));
  const art = <LineArt drawing={CUPS} cx={1150} cy={470} size={760} t={t} draw={2.1} width={2.6} />;
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '1150px 560px'}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 45% 40% at 60% 52%, rgba(200,150,80,0.13), rgba(0,0,0,0) 70%)'}} />
      <Bokeh seed="grat" count={120} focus={0.6} drift={[8, -10]} intensity={0.8} />
      <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR, height: 1, background: 'linear-gradient(90deg, rgba(222,186,122,0), rgba(222,186,122,0.18) 40%, rgba(222,186,122,0.18) 80%, rgba(222,186,122,0))'}} />
      {art}
      <Reflect floor={FLOOR} depth={200} strength={0.28}>
        {art}
      </Reflect>
    </AbsoluteFill>
  );
};
