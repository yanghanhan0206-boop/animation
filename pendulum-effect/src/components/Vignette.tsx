/** 极轻微的暗角；strength 越大，四周越暗、范围越往里收 */
import React from 'react';

export const Vignette: React.FC<{strength: number}> = ({strength}) => {
  const inner = 58 - strength * 16;
  return (
    <div
      style={{
        position: 'absolute',
        inset: -30,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse 72% 68% at 50% 47%, rgba(0,0,0,0) ${inner}%, rgba(0,0,0,${0.35 + strength * 0.45}) 100%)`,
      }}
    />
  );
};
