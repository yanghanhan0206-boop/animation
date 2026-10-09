import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';
import {Video, type VideoProps} from './Video';

const defaults: VideoProps = {debug: false, bare: false};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AlgoFeed"
    component={Video}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={defaults}
  />
);
