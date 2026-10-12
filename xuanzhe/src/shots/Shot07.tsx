/**
 * 镜头7（64–70s）峰顶浮现金色大字「不确定性」（约 110px），出现时有一道光泽从左向右扫过。
 */
import React from 'react';
import {GoldText} from '../components/Elements';
import {Stage} from '../components/Stage';
import {DropIcon, EyeIcon, PEAK, PeakFlash, StressCurve} from '../components/StressCurve';
import {LABELS} from '../config/timeline';
import {fade, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';
import {ICON_POS} from './Shot06';

const WORD_Y = PEAK.y - 112;

export const Shot07: React.FC = () => {
  const {t} = useShot();
  const word = fade(t, 0.3, 1.4);
  const rise = (1 - word) * 18;
  // 光泽：一条亮带从左扫到右
  const sweep = keys(t, [0.9, 2.3], [-0.25, 1.25]);
  const bandX = 960 - 300 + 600 * sweep;
  const icons = 1 - tween(t, 0, 1.2);
  const dim = keys(t, [0, 1.5], [1, 0.55]);
  return (
    <Stage>
      <defs>
        <linearGradient id="sheen-7" gradientUnits="userSpaceOnUse" x1={bandX - 110} y1="0" x2={bandX + 110} y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFDF2" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <StressCurve axes={1} labels={keys(t, [0, 1.2], [1, 0.45])} growth={1} dim={dim} />
      <PeakFlash x={PEAK.x} y={PEAK.y} k={0} hold={0.85 + 0.15 * Math.sin(t * 2.2)} />
      <EyeIcon x={ICON_POS.eye.x} y={ICON_POS.eye.y} pupil={17} opacity={icons} />
      <DropIcon x={ICON_POS.drop.x} y={ICON_POS.drop.y} opacity={icons} />
      <g transform={`translate(0 ${rise})`} opacity={word}>
        <g filter="url(#glow-soft)">
          <GoldText x={960} y={WORD_Y} size={110} weight={600} spacing="0.14em">
            {LABELS.uncertainty}
          </GoldText>
        </g>
        {sweep > -0.2 && sweep < 1.2 && (
          <GoldText x={960} y={WORD_Y} size={110} weight={600} spacing="0.14em" fill="url(#sheen-7)">
            {LABELS.uncertainty}
          </GoldText>
        )}
      </g>
    </Stage>
  );
};
