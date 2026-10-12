/** 全片共用的 SVG 渐变与滤镜 */
import React from 'react';
import {COLORS} from '../theme';

const blur = (id: string, sd: number) => (
  <filter id={id} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
    <feGaussianBlur stdDeviation={sd} />
  </filter>
);

export const Defs: React.FC = () => (
  <defs>
    {/* 金色线性渐变 #D4AF37 → #F5D76E */}
    <linearGradient id="gold" x1="0" y1="1" x2="0.9" y2="0">
      <stop offset="0" stopColor={COLORS.gold0} />
      <stop offset="1" stopColor={COLORS.gold1} />
    </linearGradient>
    <linearGradient id="goldText" x1="0" y1="1" x2="0.35" y2="0">
      <stop offset="0" stopColor={COLORS.gold0} />
      <stop offset="0.55" stopColor="#E7C553" />
      <stop offset="1" stopColor={COLORS.gold1} />
    </linearGradient>
    <linearGradient id="goldDarkText" x1="0" y1="1" x2="0.35" y2="0">
      <stop offset="0" stopColor={COLORS.darkGold0} />
      <stop offset="1" stopColor={COLORS.darkGold1} />
    </linearGradient>

    {/* 摆球：线性金 + 内发光 + 柔和高光 */}
    <linearGradient id="bobFill" x1="0.2" y1="0.05" x2="0.8" y2="1">
      <stop offset="0" stopColor={COLORS.gold1} />
      <stop offset="0.6" stopColor={COLORS.gold0} />
      <stop offset="1" stopColor={COLORS.goldDeep} />
    </linearGradient>
    <linearGradient id="bobFillDark" x1="0.2" y1="0.05" x2="0.8" y2="1">
      <stop offset="0" stopColor="#B48F3A" />
      <stop offset="0.6" stopColor="#7E6220" />
      <stop offset="1" stopColor="#45340D" />
    </linearGradient>
    <linearGradient id="bobFillDarker" x1="0.2" y1="0.05" x2="0.8" y2="1">
      <stop offset="0" stopColor="#8E6F2C" />
      <stop offset="0.6" stopColor="#5C4615" />
      <stop offset="1" stopColor="#30240A" />
    </linearGradient>
    <linearGradient id="bobFillBig" x1="0.2" y1="0.05" x2="0.8" y2="1">
      <stop offset="0" stopColor="#F2C440" />
      <stop offset="0.55" stopColor="#C28A16" />
      <stop offset="1" stopColor="#6E4B06" />
    </linearGradient>
    <linearGradient id="bobFillChild" x1="0.2" y1="0.05" x2="0.8" y2="1">
      <stop offset="0" stopColor="#FFF6DC" />
      <stop offset="0.55" stopColor="#F5DE94" />
      <stop offset="1" stopColor="#D9B656" />
    </linearGradient>
    <radialGradient id="bobInner" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={COLORS.goldHi} stopOpacity="0" />
      <stop offset="0.6" stopColor={COLORS.goldHi} stopOpacity="0" />
      <stop offset="0.88" stopColor={COLORS.goldHi} stopOpacity="0.5" />
      <stop offset="1" stopColor="#FFF8E4" stopOpacity="0.9" />
    </radialGradient>
    <radialGradient id="bobSpec" cx="0.36" cy="0.3" r="0.42">
      <stop offset="0" stopColor="#FFFBEA" stopOpacity="0.9" />
      <stop offset="1" stopColor="#FFFBEA" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={COLORS.gold1} stopOpacity="0.55" />
      <stop offset="0.3" stopColor={COLORS.gold0} stopOpacity="0.22" />
      <stop offset="0.65" stopColor={COLORS.gold0} stopOpacity="0.06" />
      <stop offset="1" stopColor={COLORS.gold0} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="haloWarm" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={COLORS.warm1} stopOpacity="0.6" />
      <stop offset="0.3" stopColor={COLORS.warm0} stopOpacity="0.25" />
      <stop offset="1" stopColor={COLORS.warm0} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="haloSoft" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFF3CF" stopOpacity="0.5" />
      <stop offset="0.25" stopColor={COLORS.gold1} stopOpacity="0.26" />
      <stop offset="0.6" stopColor={COLORS.gold0} stopOpacity="0.07" />
      <stop offset="1" stopColor={COLORS.gold0} stopOpacity="0" />
    </radialGradient>

    {/* 支架两端渐隐的细横梁 */}
    <linearGradient id="barFade" gradientUnits="userSpaceOnUse" x1="-60" y1="0" x2="60" y2="0">
      <stop offset="0" stopColor={COLORS.gold0} stopOpacity="0" />
      <stop offset="0.5" stopColor={COLORS.gold1} stopOpacity="0.9" />
      <stop offset="1" stopColor={COLORS.gold0} stopOpacity="0" />
    </linearGradient>

    {blur('blur2', 2)}
    {blur('blur4', 4)}
    {blur('blur8', 8)}
    {blur('blur14', 14)}
    {blur('blur24', 24)}
    {blur('blur40', 40)}
  </defs>
);
