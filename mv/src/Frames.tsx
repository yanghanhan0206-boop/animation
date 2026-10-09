import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import {AutumnWind} from './frames/AutumnWind';
import {Departure} from './frames/Departure';
import {Fork} from './frames/Fork';
import {Lethe} from './frames/Lethe';
import {LoveSong} from './frames/LoveSong';
import {Opening} from './scenes/Opening';
import {NineAM} from './frames/NineAM';
import {FPS} from './theme';

// Style frames: one scene per lyric moment, 8 s each. Rendered clean (no grain, no bars);
// scripts/post.py adds the film finish and the letterbox.

export const SCENE_LEN = 8;

export const FRAME_SCENES: {id: string; title: string; Comp: React.FC<{t: number}>; grade: string; key: number}[] = [
  {id: 'love-song', title: '情歌', Comp: LoveSong, grade: 'gold', key: 4.5},
  {id: 'fork', title: '分叉口', Comp: Fork, grade: 'night', key: 4.5},
  {id: 'departure', title: '纽约的班机', Comp: Departure, grade: 'night', key: 4.5},
  {id: 'nine-am', title: '早上九点钟', Comp: NineAM, grade: 'dawn', key: 4.5},
  {id: 'title', title: '我们都是林宛瑜', Comp: Opening, grade: 'gold', key: 7.9},
  {id: 'autumn-wind', title: '秋风再起', Comp: AutumnWind, grade: 'autumn', key: 3.95},
  {id: 'lethe', title: '忘川', Comp: Lethe, grade: 'lantern', key: 4.5},
];

export const Frames: React.FC = () => {
  loadFonts();
  const t = useCurrentFrame() / FPS;
  const i = Math.min(FRAME_SCENES.length - 1, Math.floor(t / SCENE_LEN));
  const S = FRAME_SCENES[i];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <S.Comp t={t - i * SCENE_LEN} />
    </AbsoluteFill>
  );
};
