import React from 'react';
import {Composition, Folder} from 'remotion';
import {FPS, HEIGHT, WIDTH} from './config/timeline';
import {Film, PARTS} from './compositions/Film';
import {Cover} from './compositions/Cover';
import {CoverVertical} from './compositions/CoverVertical';
import {SHEET_HEIGHT, SHEET_WIDTH, TimingSheet} from './compositions/TimingSheet';
import {buildPlan} from './lib/plan';

export const RemotionRoot: React.FC = () => (
  <>
    {/* 完整版：镜头1–17 */}
    <Composition
      id="Full"
      component={Film}
      defaultProps={{part: 'full' as const}}
      durationInFrames={buildPlan(PARTS.full).durationInFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    {/* 上集：镜头1–10 + 3 秒「下集」字幕 */}
    <Composition
      id="Part1"
      component={Film}
      defaultProps={{part: 'part1' as const}}
      durationInFrames={buildPlan(PARTS.part1).durationInFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    {/* 下集：5 秒引子 + 镜头11–17 */}
    <Composition
      id="Part2"
      component={Film}
      defaultProps={{part: 'part2' as const}}
      durationInFrames={buildPlan(PARTS.part2).durationInFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Folder name="封面">
      <Composition id="Cover" component={Cover} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
      {/* 竖版：9:16 手机全屏，3:4 小红书 / 视频号信息流 */}
      <Composition id="CoverVertical" component={CoverVertical} durationInFrames={1} fps={FPS} width={1080} height={1920} />
      <Composition id="CoverVertical34" component={CoverVertical} durationInFrames={1} fps={FPS} width={1080} height={1440} />
    </Folder>
    <Folder name="工具">
      <Composition
        id="TimingSheet"
        component={TimingSheet}
        durationInFrames={1}
        fps={FPS}
        width={SHEET_WIDTH}
        height={SHEET_HEIGHT}
      />
    </Folder>
  </>
);
