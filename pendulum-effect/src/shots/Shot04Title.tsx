/** 镜头 4（28–38 秒）：镜头拉开下沉，画面中上方浮现“摆锤效应”，金色光泽从左到右扫过 */
import React from 'react';
import {S4} from '../timeline';
import {PoleWords} from '../scenes/PoleWords';
import {TitleScene} from '../scenes/Title';
import type {ShotProps} from './types';

export const Shot04Title: React.FC<ShotProps> = ({t, layer}) => {
  if (layer === 'worldBack') return <PoleWords t={t} />;
  if (layer === 'screenFront') return <TitleScene t={t} />;
  return null;
};
export const SHOT04 = {def: S4, Component: Shot04Title};
