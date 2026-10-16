import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {FPS, SCENES} from './data';
import {AudioTracks} from './audio/AudioTracks';
import {Atmosphere} from './components/Atmosphere';
import {COLORS} from './theme';
import {Scene1Line} from './scenes/Scene1Line';
import {Scene2Speed} from './scenes/Scene2Speed';
import {Scene3Bars} from './scenes/Scene3Bars';
import {Scene4Break} from './scenes/Scene4Break';
import {Scene5Ring} from './scenes/Scene5Ring';
import {Scene6Money} from './scenes/Scene6Money';
import {Scene7Accel} from './scenes/Scene7Accel';
import {Scene8Zhengzhou} from './scenes/Scene8Zhengzhou';

/** 片尾黑场：最后一条字幕消失后转为纯黑并保持到结束 */
const EndBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const last = SCENES[SCENES.length - 1];
  const lastSub = last.subtitles[last.subtitles.length - 1];
  const from = (last.start + lastSub.to) * FPS;
  const opacity = interpolate(frame, [from - 6, from], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return opacity > 0 ? <AbsoluteFill style={{background: '#000', opacity}} /> : null;
};

const SCENE_COMPONENTS: Record<string, React.FC> = {
  s1: Scene1Line,
  s2: Scene2Speed,
  s3: Scene3Bars,
  s4: Scene4Break,
  s5: Scene5Ring,
  s6: Scene6Money,
  s7: Scene7Accel,
  s8: Scene8Zhengzhou,
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.bg}}>
    {SCENES.map((s) => {
      const Comp = SCENE_COMPONENTS[s.id];
      const from = Math.round(s.start * FPS);
      return (
        <Sequence
          key={s.id}
          from={from}
          durationInFrames={Math.round(s.end * FPS) - from}
          name={`第${s.index}场 ${s.title}`}
        >
          <Comp />
        </Sequence>
      );
    })}
    <Atmosphere />
    <EndBlack />
    <AudioTracks />
  </AbsoluteFill>
);
