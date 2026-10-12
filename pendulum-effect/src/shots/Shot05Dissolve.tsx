/** 镜头 5（38–50 秒）：“吼”碎成金色粒子聚合成“恐惧”，“补偿”聚合成“愧疚”（标题在开头溶解） */
import React from 'react';
import {S5} from '../timeline';
import {PoleWords} from '../scenes/PoleWords';
import {TitleScene} from '../scenes/Title';
import {ParticleMorph} from '../scenes/ParticleMorph';
import type {ShotProps} from './types';

export const Shot05Dissolve: React.FC<ShotProps> = ({t, cam, layer}) => {
  if (layer === 'worldBack') return <PoleWords t={t} />;
  if (layer === 'screenFront') return <TitleScene t={t} />;
  if (layer === 'overlay') return <ParticleMorph t={t} cam={cam} />;
  return null;
};
export const SHOT05 = {def: S5, Component: Shot05Dissolve};
