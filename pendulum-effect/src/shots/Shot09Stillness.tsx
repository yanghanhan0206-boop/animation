/**
 * 镜头 9（88–100 秒）：上方的冲击再次传来，边缘的手也短暂地推了一下；
 * 家长的摆球亮起一圈强烈金光把冲击吸收进来，自己剧烈晃动；孩子只轻轻动了一下便安静停住，
 * 发出柔和的呼吸光圈。最后 3 秒只留下孩子和光。
 */
import React from 'react';
import {S9} from '../timeline';
import {EVENTS} from '../sim/physics';
import {ChildPendulum, CradleScene} from '../scenes/Cradle';
import {PlannedHand, brieflyHands} from '../scenes/Hands';
import type {ShotProps} from './types';

const PLANS = EVENTS.absorb >= 0 ? brieflyHands(EVENTS.absorb, S9.handsLead, S9.handsStay, S9.handsAngles, S9.handsStandoff) : [];

export const Shot09Stillness: React.FC<ShotProps> = ({t, cam, layer}) => {
  if (layer === 'worldBack')
    return (
      <>
        <CradleScene t={t} cam={cam} />
        <ChildPendulum t={t} cam={cam} />
      </>
    );
  if (layer === 'worldFront')
    return (
      <>
        {PLANS.map((p, i) => (
          <PlannedHand key={i} plan={p} t={t} />
        ))}
      </>
    );
  return null;
};
export const SHOT09 = {def: S9, Component: Shot09Stillness};
