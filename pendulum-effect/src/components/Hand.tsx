/**
 * 金色线条勾勒的手（只画轮廓）：食指前伸、其余手指轻轻收拢。
 * 局部坐标：食指指尖在原点，手指指向 +x，前臂一直延伸到 -x 方向的画面外。
 */
import React from 'react';

// 原始草图坐标（手腕在 x=0，食指指尖在 (155,-10)），绘制时整体平移让指尖落在原点
const TIP_X = 155;
const TIP_Y = -10;
const ARM = 2600; // 前臂长度，保证伸出画面边缘

const PATHS = [
  // 前臂上缘 → 手背 → 食指
  `M ${-ARM} -31 C -900 -31 -50 -26.5 0 -24 C 22 -27 46 -31 70 -31 C 92 -31 116 -26 138 -20 C 147 -17.5 152 -15.5 154 -12.5 C 156 -9 152 -6.5 147 -7 C 132 -8.5 116 -9.5 102 -8`,
  // 拇指
  `M 30 -27.5 C 44 -40 62 -45 80 -44 C 90 -43.5 96 -41 95.5 -37.5 C 95 -34 89 -33.5 84 -33.2`,
  // 中指
  `M 104 -6.5 C 118 -5 130 -2 136 3 C 140 6.5 139.5 12 134.5 12.5 C 128 13 122 9 114 6.5 C 108 5 100 5 94 6`,
  // 无名指
  `M 98 7 C 110 9 118 13 121 18 C 123.5 22 121 26 116.5 25.5 C 111 25 106 21 98 19 C 92 18 86 18.5 82 19.5`,
  // 小指 → 掌缘 → 前臂下缘
  `M 86 20 C 96 22.5 101 26 102.5 30 C 104 34 100.5 36.5 96.5 35.5 C 92 34.5 86 31 79 29.5 C 72 28 64 27 56 26.5 C 38 26 18 24 0 22 C -18 20 -60 24.5 -300 29 C -900 31 ${-ARM} 31 ${-ARM} 31`,
];
const KNUCKLE = 'M 66 -22 C 74 -21 82 -19.5 88 -17.5';

export const Hand: React.FC<{
  x: number; // 指尖位置（世界坐标）
  y: number;
  angle: number; // 手指指向（弧度）
  scale?: number;
  opacity?: number;
  strokeWidth?: number; // 屏幕像素
  glow?: number;
}> = ({x, y, angle, scale = 1.35, opacity = 1, strokeWidth = 1.8, glow = 0.6}) => {
  if (opacity <= 0.001) return null;
  const tf = `translate(${x} ${y}) rotate(${(angle * 180) / Math.PI}) scale(${scale}) translate(${-TIP_X} ${-TIP_Y})`;
  const stroke = {
    fill: 'none',
    stroke: 'url(#handStroke)',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };
  return (
    <g opacity={opacity}>
      {glow > 0 ? (
        <g transform={tf} opacity={0.5 * glow} filter="url(#handGlow)">
          {PATHS.map((d, i) => (
            <path key={i} d={d} {...stroke} strokeWidth={strokeWidth * 2.2} />
          ))}
        </g>
      ) : null}
      <g transform={tf}>
        {PATHS.map((d, i) => (
          <path key={i} d={d} {...stroke} strokeWidth={strokeWidth} />
        ))}
        <path d={KNUCKLE} {...stroke} strokeWidth={strokeWidth * 0.8} strokeOpacity={0.45} />
      </g>
    </g>
  );
};

/** 手的描边渐变：前臂往画面外逐渐变暗 */
export const HandDefs: React.FC = () => (
  <defs>
    <linearGradient id="handStroke" gradientUnits="userSpaceOnUse" x1="-700" y1="0" x2="160" y2="0">
      <stop offset="0" stopColor="#8E7330" stopOpacity="0.25" />
      <stop offset="0.55" stopColor="#D4AF37" stopOpacity="0.85" />
      <stop offset="1" stopColor="#F5D76E" stopOpacity="1" />
    </linearGradient>
    <filter id="handGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" />
    </filter>
  </defs>
);
