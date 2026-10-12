/**
 * 全片共用的 SVG 渐变与滤镜。Film 根部渲染一次，所有镜头的 SVG 用 url(#id) 引用。
 * 注意：水平/竖直的直线包围盒高度为 0，objectBoundingBox 渐变和滤镜会失效，
 * 所以线条用 userSpaceOnUse 的 gold-stroke 和 glow 滤镜。滤镜区域取画面的 3 倍，
 * 因为元素放在 translate / 摄影机变换里时，区域是按元素自己的坐标系算的。
 */
import React from 'react';
import {COLORS} from '../config/theme';
import {HEIGHT, WIDTH} from '../config/timeline';

export const GoldDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      {/* 主体金色线性渐变 #D4AF37 → #F5D76E */}
      <linearGradient id="gold" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor={COLORS.gold0} />
        <stop offset="1" stopColor={COLORS.gold1} />
      </linearGradient>
      {/* 文字用：横向 */}
      <linearGradient id="gold-h" x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0" stopColor={COLORS.gold0} />
        <stop offset="0.55" stopColor={COLORS.gold1} />
        <stop offset="1" stopColor={COLORS.gold0} />
      </linearGradient>
      {/* 线条用：以画面坐标为准，往复渐变 */}
      <linearGradient
        id="gold-stroke"
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="0"
        x2="520"
        y2="300"
        spreadMethod="reflect"
      >
        <stop offset="0" stopColor={COLORS.gold0} />
        <stop offset="1" stopColor={COLORS.gold1} />
      </linearGradient>

      {/* 小球本体 */}
      <linearGradient id="ball-body" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
        <stop offset="0" stopColor={COLORS.gold1} />
        <stop offset="1" stopColor={COLORS.gold0} />
      </linearGradient>
      <linearGradient id="ball-body-cold" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
        <stop offset="0" stopColor={COLORS.cold1} />
        <stop offset="1" stopColor={COLORS.cold0} />
      </linearGradient>
      {/* 内发光：边缘向内的一圈亮光 */}
      <radialGradient id="ball-inner" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.5" stopColor="#FFF6D8" stopOpacity="0" />
        <stop offset="0.86" stopColor="#FFF6D8" stopOpacity="0.28" />
        <stop offset="1" stopColor="#FFFBEA" stopOpacity="0.75" />
      </radialGradient>
      {/* 中心偏左上的柔和高光 */}
      <radialGradient id="ball-spec" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
      {/* 外部柔光：近处 */}
      <radialGradient id="ball-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={COLORS.gold1} stopOpacity="0.72" />
        <stop offset="0.45" stopColor={COLORS.gold0} stopOpacity="0.26" />
        <stop offset="1" stopColor={COLORS.gold0} stopOpacity="0" />
      </radialGradient>
      {/* 外部柔光：远处光晕 */}
      <radialGradient id="ball-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={COLORS.gold1} stopOpacity="0.2" />
        <stop offset="0.4" stopColor={COLORS.gold0} stopOpacity="0.08" />
        <stop offset="1" stopColor={COLORS.gold0} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ball-glow-cold" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={COLORS.cold1} stopOpacity="0.35" />
        <stop offset="0.45" stopColor={COLORS.cold0} stopOpacity="0.1" />
        <stop offset="1" stopColor={COLORS.cold0} stopOpacity="0" />
      </radialGradient>
      {/* 冰壳 */}
      <radialGradient id="ice" cx="0.42" cy="0.38" r="0.62">
        <stop offset="0" stopColor={COLORS.ice} stopOpacity="0.05" />
        <stop offset="0.7" stopColor={COLORS.ice} stopOpacity="0.16" />
        <stop offset="1" stopColor={COLORS.ice} stopOpacity="0.38" />
      </radialGradient>
      {/* 闪光 */}
      <radialGradient id="flash" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFF8E0" stopOpacity="1" />
        <stop offset="0.25" stopColor={COLORS.gold1} stopOpacity="0.55" />
        <stop offset="1" stopColor={COLORS.gold0} stopOpacity="0" />
      </radialGradient>

      {/* 线条发光 */}
      <filter id="glow" filterUnits="userSpaceOnUse" x={-WIDTH} y={-HEIGHT} width={WIDTH * 3} height={HEIGHT * 3}>
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b2" />
        <feMerge>
          <feMergeNode in="b2" />
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-soft" filterUnits="userSpaceOnUse" x={-WIDTH} y={-HEIGHT} width={WIDTH * 3} height={HEIGHT * 3}>
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b1" />
        <feMerge>
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);
