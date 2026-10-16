import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './data';
import {Film} from './Film';
import {validateData} from './validate';

const problems = validateData();
if (problems.length > 0) {
  throw new Error(`data.ts 检查未通过：\n${problems.join('\n')}`);
}

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="BrakeFilm"
      component={Film}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{}}
    />
  </>
);
