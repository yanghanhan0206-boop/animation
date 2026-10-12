import React from 'react';
import {Composition} from 'remotion';
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from './timeline';
import {Film} from './Film';

export const Root: React.FC = () => (
  <Composition id="PendulumEffect" component={Film} durationInFrames={DURATION_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
