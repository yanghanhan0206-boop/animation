/** 镜头 8（75–88 秒）：大摆锤淡出，镜头推回家长的摆锤；祖辈、父母从上方降下排成牛顿摆，冲击一路传下来；孩子出现 */
import React from 'react';
import {S8} from '../timeline';
import {BigPendulumScene} from '../scenes/BigPendulum';
import {ChildPendulum, CradleScene} from '../scenes/Cradle';
import type {ShotProps} from './types';

export const Shot08Cradle: React.FC<ShotProps> = ({t, cam, layer}) => {
  if (layer === 'screenBack') return <BigPendulumScene t={t} />;
  if (layer === 'worldBack')
    return (
      <>
        <CradleScene t={t} cam={cam} />
        <ChildPendulum t={t} cam={cam} />
      </>
    );
  return null;
};
export const SHOT08 = {def: S8, Component: Shot08Cradle};
