/** 镜头 2（10–20 秒）：摆锤猛地荡向右端，浮现“补偿”；拖尾更柔和、金色偏暖（见 MainPendulum.trailParams） */
import React from 'react';
import {S2} from '../timeline';
import {PoleWords} from '../scenes/PoleWords';
import type {ShotProps} from './types';

export const Shot02Compensate: React.FC<ShotProps> = ({t, layer}) => {
  if (layer === 'worldBack') return <PoleWords t={t} />;
  return null;
};
export const SHOT02 = {def: S2, Component: Shot02Compensate};
