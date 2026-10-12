/**
 * 镜头9（82–98s）时钟重新出现（全局层）。小球内部的细线开始绕圈，依次掠过「考研」「工作」「出国」「保研」，
 * 形成越转越快的金色漩涡，始终落不到任何一个词上。
 */
import React from 'react';
import {BallZoom, MIND, MindLines, Ripples, rimFlashAt} from '../components/Mind';
import {Stage} from '../components/Stage';
import {useShot} from '../lib/shot-context';

export const Shot09: React.FC = () => {
  const {gt} = useShot();
  return (
    <Stage>
      <BallZoom x={MIND.cx} y={MIND.cy} r={MIND.R} inside={1} rimFlash={rimFlashAt(gt)} />
      <Ripples gt={gt} />
      <MindLines gt={gt} />
    </Stage>
  );
};
