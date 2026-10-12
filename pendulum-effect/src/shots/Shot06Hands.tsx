/** 镜头 6（50–65 秒）重点：镜头缓慢拉远，四只手依次伸入轻推摆球，摆幅一级比一级大，画面越来越拥挤 */
import React from 'react';
import {S6} from '../timeline';
import {PoleWords} from '../scenes/PoleWords';
import {HandsScene} from '../scenes/Hands';
import type {ShotProps} from './types';

export const Shot06Hands: React.FC<ShotProps> = ({t, layer}) => {
  if (layer === 'worldBack') return <PoleWords t={t} />;
  if (layer === 'worldFront') return <HandsScene t={t} />;
  return null;
};
export const SHOT06 = {def: S6, Component: Shot06Hands};
