import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Grain} from './fx/Grain';
import {Letterbox, Vignette} from './fx/Frame';
import {loadFonts} from './fonts';
import {Memory} from './scenes/Memory';
import {Night} from './scenes/Night';
import {Opening} from './scenes/Opening';
import {FPS, INK} from './theme';

/** Look-development reel: the three style scenes back to back (not the final edit). */
export const PREVIEW_SCENES = [
  {name: 'opening', from: 0, dur: 12},
  {name: 'memory', from: 12, dur: 14},
  {name: 'night', from: 26, dur: 12},
];

export const Preview: React.FC = () => {
  loadFonts();
  const t = useCurrentFrame() / FPS;
  const scene = PREVIEW_SCENES.find((s) => t >= s.from && t < s.from + s.dur) ?? PREVIEW_SCENES[0];
  const lt = t - scene.from;
  return (
    <AbsoluteFill style={{background: INK.black}}>
      {scene.name === 'opening' && <Opening t={lt} />}
      {scene.name === 'memory' && <Memory t={lt} />}
      {scene.name === 'night' && <Night t={lt} />}
      <Vignette />
      <Grain />
      <Letterbox />
    </AbsoluteFill>
  );
};
