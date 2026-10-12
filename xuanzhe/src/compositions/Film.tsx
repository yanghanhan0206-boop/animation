/**
 * 一集影片的总装：按排期把镜头、字幕、角标、时钟、暗角、颗粒叠在一起。
 * Full / Part1 / Part2 都是它，只是传入的配置不同。
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {GoldDefs} from '../components/GoldDefs';
import {Citation, Clock, FilmGrain, SubtitleSegment, Vignette} from '../components/Overlays';
import {COLORS} from '../config/theme';
import {FPS, FULL, PART1, PART2, type PartConfig, type ShotConfig} from '../config/timeline';
import {EASE_SOFT, tween} from '../lib/anim';
import {useFontsReady} from '../lib/fonts';
import {buildPlan} from '../lib/plan';
import {ShotProvider} from '../lib/shot-context';
import {SHOT_COMPONENTS} from '../shots';

export type PartName = 'full' | 'part1' | 'part2';

export const PARTS: Record<PartName, PartConfig> = {full: FULL, part1: PART1, part2: PART2};

/** 下集引子：重放某个镜头的最后几秒作为背景，从黑场淡入 */
const IntroBackdrop: React.FC<{shot: ShotConfig; frames: number}> = ({shot, frames}) => {
  const frame = useCurrentFrame();
  const Comp = SHOT_COMPONENTS[shot.id];
  const a = tween(frame, 0, 1.4 * FPS, 0, 1, EASE_SOFT);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <ShotProvider shot={shot} timeOffset={shot.end - shot.start - frames / FPS}>
        <Comp />
      </ShotProvider>
    </AbsoluteFill>
  );
};

/** 上集片尾：画面渐暗，只留「下集」字幕 */
const OutroDim: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: COLORS.bg, opacity: tween(frame, 0, 1.6 * FPS, 0, 0.85, EASE_SOFT)}} />;
};

export const Film: React.FC<{part: PartName}> = ({part}) => {
  useFontsReady();
  const plan = useMemo(() => buildPlan(PARTS[part]), [part]);
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <GoldDefs />

      {plan.intro && (
        <Sequence name="引子画面" durationInFrames={plan.intro.frames}>
          <IntroBackdrop shot={plan.intro.backdrop} frames={plan.intro.frames} />
        </Sequence>
      )}

      {plan.shots.map((ps) => {
        const Comp = SHOT_COMPONENTS[ps.shot.id];
        return (
          <Sequence
            key={ps.shot.id}
            name={`镜头${ps.shot.id} ${ps.shot.name}`}
            from={ps.seqFrom}
            durationInFrames={ps.seqDuration}
          >
            <ShotProvider shot={ps.shot} timeOffset={ps.timeOffset}>
              <Comp />
            </ShotProvider>
          </Sequence>
        );
      })}

      {plan.outro && (
        <Sequence name="片尾渐暗" from={plan.outro.fromFrame} durationInFrames={plan.outro.frames}>
          <OutroDim />
        </Sequence>
      )}

      <Vignette />

      {plan.subtitles.map((seg) => (
        <Sequence
          key={seg.key}
          name={`字幕 ${seg.text}`}
          from={seg.fromFrame}
          durationInFrames={Math.max(1, seg.toFrame - seg.fromFrame)}
        >
          <SubtitleSegment seg={seg} />
        </Sequence>
      ))}

      {plan.citations.map((c) => (
        <Sequence key={c.key} name={`角标 ${c.text}`} from={c.fromFrame} durationInFrames={c.toFrame - c.fromFrame}>
          <Citation text={c.text} durationInFrames={c.toFrame - c.fromFrame} />
        </Sequence>
      ))}

      <Clock windows={plan.clocks} />
      <FilmGrain />
    </AbsoluteFill>
  );
};
