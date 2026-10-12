/** 金色摆球（线性渐变 + 内发光 + 高光 + 外晕） */
import React from 'react';

export type BobVariant = 'gold' | 'dark' | 'darker' | 'child' | 'big';

const FILL: Record<BobVariant, string> = {
  gold: 'url(#bobFill)',
  dark: 'url(#bobFillDark)',
  darker: 'url(#bobFillDarker)',
  child: 'url(#bobFillChild)',
  big: 'url(#bobFillBig)',
};

export const Bob: React.FC<{
  x: number;
  y: number;
  r: number;
  variant?: BobVariant;
  glow?: number; // 外晕强度
  inner?: number; // 内发光强度
  opacity?: number;
  warm?: boolean;
  spec?: boolean; // 高光（大摆锤关掉，免得在低透明度下发灰）
}> = ({x, y, r, variant = 'gold', glow = 1, inner = 1, opacity = 1, warm = false, spec = true}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {glow > 0 ? (
      <circle r={r * 3.4} fill={warm ? 'url(#haloWarm)' : 'url(#halo)'} opacity={Math.min(1, 0.7 * glow)} />
    ) : null}
    <circle r={r} fill={FILL[variant]} />
    <circle r={r} fill="url(#bobInner)" opacity={inner * (variant === 'gold' || variant === 'child' ? 1 : 0.35)} />
    {variant === 'big' ? <circle r={r - 1} fill="none" stroke="#F5D76E" strokeWidth={2} strokeOpacity={0.8} /> : null}
    {spec ? <circle r={r} fill="url(#bobSpec)" opacity={variant === 'gold' || variant === 'child' ? 0.85 : 0.3} /> : null}
  </g>
);
