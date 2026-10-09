import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BAR, INK} from '../theme';

/** Soft vignette pulling the edges into black. */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** 2.39:1 bars; children render inside the bottom bar (lyrics live there). */
export const Letterbox: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: BAR, background: INK.bar}} />
    <div style={{position: 'absolute', left: 0, bottom: 0, right: 0, height: BAR, background: INK.bar}}>{children}</div>
  </AbsoluteFill>
);

/** A warm light leak drifting along one edge. */
export const LightLeak: React.FC<{x: number; y: number; r: number; opacity: number}> = ({x, y, r, opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      opacity,
      mixBlendMode: 'screen',
      background: 'radial-gradient(circle, rgba(214,160,84,0.5) 0%, rgba(160,104,40,0.18) 35%, rgba(120,70,20,0) 70%)',
    }}
  />
);
