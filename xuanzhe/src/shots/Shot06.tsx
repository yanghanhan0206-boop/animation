/**
 * 镜头6（50–64s）重点镜头：石头淡出，画出坐标轴。金色曲线从左向右生长，在 50% 处隆起成山峰，
 * 然后回落，形成倒 U 形。峰顶闪光。曲线右侧淡入两个线条小图标：瞳孔放大的眼睛、一滴汗。
 */
import React from 'react';
import {Stage} from '../components/Stage';
import {DropIcon, EyeIcon, PEAK, PeakFlash, StressCurve} from '../components/StressCurve';
import {EASE, fade, keys, tween} from '../lib/anim';
import {useShot} from '../lib/shot-context';

/** 时间点（秒，相对本镜头），镜头7 接着用 */
export const SHOT6 = {
  axes: [0.4, 1.6],
  labels: [1.2, 2.2],
  growth: [1.8, 6.4],
  icons: [6.0, 7.2],
  /** 第二段字幕出来时，峰顶再亮一次，并落下一条指向 50% 的虚线 */
  emphasis: 7.0,
};

export const ICON_POS = {eye: {x: 1650, y: 380}, drop: {x: 1650, y: 545}};

export const Shot06: React.FC = () => {
  const {t} = useShot();
  const growth = tween(t, SHOT6.growth[0], SHOT6.growth[1], 0, 1, EASE);
  // 弧长对称，峰顶正好在生长到一半时
  const peakT = (SHOT6.growth[0] + SHOT6.growth[1]) / 2;
  const flash = tween(t, peakT - 0.05, peakT + 1.0, 0, 1);
  const flash2 = tween(t, SHOT6.emphasis, SHOT6.emphasis + 1.1, 0, 1);
  const hold = Math.max(tween(t, peakT, peakT + 0.6), 0) * (0.75 + 0.25 * Math.sin(t * 2.2));
  const eye = fade(t, SHOT6.icons[0], SHOT6.icons[1]);
  const drop = fade(t, SHOT6.icons[0] + 0.4, SHOT6.icons[1] + 0.4);
  const pupil = keys(t, [SHOT6.icons[0] + 0.4, SHOT6.icons[1] + 1.2], [9, 17]);
  return (
    <Stage>
      <StressCurve
        axes={tween(t, SHOT6.axes[0], SHOT6.axes[1])}
        labels={fade(t, SHOT6.labels[0], SHOT6.labels[1])}
        growth={growth}
        dropLine={tween(t, SHOT6.emphasis + 0.2, SHOT6.emphasis + 1.2)}
      />
      <PeakFlash x={PEAK.x} y={PEAK.y} k={flash < 1 ? flash : flash2} hold={hold} />
      <g transform={`translate(0 ${(1 - eye) * 12})`}>
        <EyeIcon x={ICON_POS.eye.x} y={ICON_POS.eye.y} pupil={pupil} opacity={eye} />
      </g>
      <g transform={`translate(0 ${(1 - drop) * 12})`}>
        <DropIcon x={ICON_POS.drop.x} y={ICON_POS.drop.y} opacity={drop} />
      </g>
    </Stage>
  );
};
