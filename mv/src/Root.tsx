import React from 'react';
import {Composition} from 'remotion';
import {FRAME_SCENES, Frames, SCENE_LEN} from './Frames';
import {MV} from './mv/MV';
import {DURATION} from './mv/timeline';
import {PREVIEW_SCENES, Preview} from './Preview';
import {FPS, H, W} from './theme';

const last = PREVIEW_SCENES[PREVIEW_SCENES.length - 1];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MV" component={MV} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="Frames" component={Frames} durationInFrames={FRAME_SCENES.length * SCENE_LEN * FPS} fps={FPS} width={W} height={H} />
    <Composition id="Preview" component={Preview} durationInFrames={Math.round((last.from + last.dur) * FPS)} fps={FPS} width={W} height={H} />
  </>
);
