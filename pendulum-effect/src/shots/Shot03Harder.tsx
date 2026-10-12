/** 镜头 3（20–28 秒）：摆幅更大地荡回左端，“吼”更亮，震动更强 */
import React from 'react';
import {S3} from '../timeline';
import {EVENTS} from '../sim/physics';
import {PoleWords} from '../scenes/PoleWords';
import {RoarBurst} from '../scenes/Bursts';
import type {ShotProps} from './types';

export const Shot03Harder: React.FC<ShotProps> = ({t, layer}) => {
  if (layer === 'worldBack') return <PoleWords t={t} />;
  if (layer === 'worldFront') return <RoarBurst t={t} at={EVENTS.roar3} strength={1.7} />;
  return null;
};
export const SHOT03 = {def: S3, Component: Shot03Harder};
