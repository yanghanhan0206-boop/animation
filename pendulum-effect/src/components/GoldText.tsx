/** SVG 金字：金色渐变填充 + 可调的金色光晕 */
import React from 'react';
import {FONT_FAMILY} from '../theme';

export const GoldText: React.FC<{
  x: number;
  y: number;
  text: string;
  size: number;
  weight?: number;
  glow?: number; // 0 = 无光晕，1 = 正常光晕，>1 更亮
  opacity?: number;
  scale?: number;
  blur?: number; // 整体模糊（浮现 / 溶解用）
  letterSpacing?: number; // em
  fill?: string;
  glowColor?: string;
  anchor?: 'start' | 'middle' | 'end';
}> = ({
  x,
  y,
  text,
  size,
  weight = 700,
  glow = 0,
  opacity = 1,
  scale = 1,
  blur = 0,
  letterSpacing = 0.06,
  fill = 'url(#goldText)',
  glowColor = '#F5D76E',
  anchor = 'middle',
}) => {
  if (opacity <= 0.001) return null;
  const common = {
    x: 0,
    y: 0,
    fontFamily: FONT_FAMILY,
    fontSize: size,
    fontWeight: weight,
    textAnchor: anchor,
    dominantBaseline: 'central' as const,
    letterSpacing: `${letterSpacing}em`,
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={Math.min(1, opacity)}>
      {glow > 0 ? (
        <>
          <text {...common} fill={glowColor} opacity={Math.min(1, 0.55 * glow)} filter="url(#blur24)">
            {text}
          </text>
          <text {...common} fill={glowColor} opacity={Math.min(1, 0.5 * glow)} filter="url(#blur8)">
            {text}
          </text>
        </>
      ) : null}
      <g filter={blur > 0.3 ? `url(#tblur${Math.round(Math.min(blur, 16))})` : undefined}>
        <text {...common} fill={fill}>
          {text}
        </text>
      </g>
    </g>
  );
};

/** 文字浮现 / 溶解时用的逐级模糊滤镜 */
export const TextBlurDefs: React.FC = () => (
  <defs>
    {Array.from({length: 16}, (_, i) => i + 1).map((sd) => (
      <filter key={sd} id={`tblur${sd}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={sd * 0.6} />
      </filter>
    ))}
  </defs>
);
