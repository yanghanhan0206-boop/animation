/** 镜头 1（0–10 秒）：摆锤开场就在摆动，荡到左端浮现金字“吼”，到顶瞬间画面轻震 */
import React from 'react';
import {S1} from '../timeline';
import {EVENTS} from '../sim/physics';
import {PoleWords} from '../scenes/PoleWords';
import {RoarBurst} from '../scenes/Bursts';
import type {ShotProps} from './types';

export const Shot01Roar: React.FC<ShotProps> = ({t, layer}) => {
  if (layer === 'worldBack') return <PoleWords t={t} />;
  if (layer === 'worldFront') return <RoarBurst t={t} at={EVENTS.roar1} strength={1} />;
  return null;
};
export const SHOT01 = {def: S1, Component: Shot01Roar};
