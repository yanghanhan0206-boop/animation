import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {SCENES} from '../data';
import {GoldLine} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {COLORS, LAYOUT, tween} from '../theme';

/** 第一场 一条线：节拍（本场秒数） */
export const S1 = {
  sparkAt: 0.8,
  drawFrom: 1.3,
  drawTo: 3.4,
  labelFrom: 3.4,
  labelTo: 4.8,
};

export const Scene1Line: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[0];

  // 起笔的那一点金光
  const spark = tween(frame, [S1.sparkAt, S1.sparkAt + 0.35], [0, 1], Easing.out(Easing.cubic));
  const sparkPulse = 1 + 0.25 * Math.sin(frame * 0.35);
  const draw = tween(frame, [S1.drawFrom, S1.drawTo], [0, 1], Easing.inOut(Easing.cubic));
  const label = tween(frame, [S1.labelFrom, S1.labelFrom + 0.8], [0, 1], Easing.out(Easing.cubic));
  const labelRoll = tween(frame, [S1.labelFrom, S1.labelTo], [0, 1], Easing.out(Easing.cubic));

  // 镜头缓慢推近
  const zoom = tween(frame, [0, 12], [1, 1.14], Easing.inOut(Easing.sin));

  return (
    <SceneShell
      scene={scene}
      chapterAt={4.4}
      sourceAt={5}
      camera={{transform: `scale(${zoom})`, transformOrigin: `1720px ${LAYOUT.lineY}px`}}
    >
      <Motes frame={frame} seed="s1" opacity={tween(frame, [2, 5], [0, 1])} />
      {draw <= 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <radialGradient id="s1spark">
              <stop offset="0" stopColor="#FFF6DD" />
              <stop offset="0.25" stopColor={COLORS.bright} stopOpacity={0.9} />
              <stop offset="1" stopColor={COLORS.gold} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={LAYOUT.lineLeft}
            cy={LAYOUT.lineY}
            r={42 * spark * sparkPulse}
            fill="url(#s1spark)"
            opacity={spark}
          />
        </svg>
      ) : null}
      <GoldLine progress={draw} label={label} labelRoll={labelRoll} spark glowStrength={1.2} />
    </SceneShell>
  );
};
