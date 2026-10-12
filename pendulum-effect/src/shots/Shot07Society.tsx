/** 镜头 7（65–75 秒）重点：继续拉远，手淡出；背后浮现社会的大摆锤，家长的小摆锤逐渐与它同步 */
import React from 'react';
import {S7} from '../timeline';
import {PoleWords} from '../scenes/PoleWords';
import {HandsScene} from '../scenes/Hands';
import {BigPendulumScene} from '../scenes/BigPendulum';
import type {ShotProps} from './types';

export const Shot07Society: React.FC<ShotProps> = ({t, layer}) => {
  if (layer === 'screenBack') return <BigPendulumScene t={t} />;
  if (layer === 'worldBack') return <PoleWords t={t} />;
  if (layer === 'worldFront') return <HandsScene t={t} />;
  return null;
};
export const SHOT07 = {def: S7, Component: Shot07Society};
