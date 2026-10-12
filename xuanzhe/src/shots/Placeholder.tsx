/**
 * 第一步（定风格）阶段尚未制作的镜头先用这个占位：小球悬在原位颤动，保证整片可以连续预览。
 * 确认风格后逐个替换成正式镜头。
 */
import React from 'react';
import {GoldBall} from '../components/GoldBall';
import {Stage} from '../components/Stage';
import {HOME} from '../config/theme';
import {jitter} from '../lib/anim';
import {useShot} from '../lib/shot-context';

export const placeholder = (tension: number, pos: {x: number; y: number} = HOME): React.FC => {
  const Shot: React.FC = () => {
    const {gt} = useShot();
    const j = jitter(gt, tension);
    return (
      <Stage>
        <GoldBall x={pos.x + j.x} y={pos.y + j.y} />
      </Stage>
    );
  };
  return Shot;
};
