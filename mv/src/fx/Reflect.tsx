import React from 'react';
import {AbsoluteFill} from 'remotion';

/** Mirrors its children in a glossy black floor at `floor`, fading with depth. */
export const Reflect: React.FC<{floor: number; depth?: number; strength?: number; blur?: number; children: React.ReactNode}> = ({
  floor,
  depth = 260,
  strength = 0.3,
  blur = 1.8,
  children,
}) => {
  const mask = `linear-gradient(to bottom, transparent ${floor}px, rgba(0,0,0,${strength}) ${floor}px, transparent ${floor + depth}px)`;
  return (
    <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>
      <AbsoluteFill style={{transform: `matrix(1, 0, 0, -1, 0, ${2 * floor})`, transformOrigin: '0 0', filter: `blur(${blur}px)`}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
