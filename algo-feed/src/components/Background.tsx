import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBare} from '../lib/context';
import {C, accentA} from '../theme';

const STEP = 54;

/** Near-black ground, a dot grid that keeps drifting, two slow glows and a vignette. */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  if (bare) return <AbsoluteFill style={{background: '#000'}} />;

  const dy = (f * 0.7) % STEP;
  const dx = Math.sin(f / 70) * 8;
  const g1 = {x: 540 + Math.sin(f / 80) * 260, y: 760 + Math.cos(f / 95) * 280};
  const g2 = {x: 540 + Math.cos(f / 110) * 300, y: 1300 + Math.sin(f / 70) * 220};

  return (
    <AbsoluteFill style={{background: C.bg}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <pattern
            id="bg-dots"
            width={STEP}
            height={STEP}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${dx} ${-dy})`}
          >
            <circle cx={STEP / 2} cy={STEP / 2} r={2.3} fill={C.gridDot} />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#bg-dots)" />
      </svg>
      {[
        {g: g1, a: 0.075, s: 1100},
        {g: g2, a: 0.05, s: 900},
      ].map(({g, a, s}, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: g.x - s / 2,
            top: g.y - s / 2,
            width: s,
            height: s,
            background: `radial-gradient(circle, ${accentA(a)} 0%, ${accentA(0)} 65%)`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)'}}
      />
    </AbsoluteFill>
  );
};
