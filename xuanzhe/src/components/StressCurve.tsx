/**
 * 倒 U 曲线（镜头6、7，镜头16 的缩小版共用）：
 * 横轴「被电的可能性」0% / 50% / 100%，纵轴「压力」，曲线在 50% 处隆起成山峰。
 */
import React from 'react';
import {COLORS} from '../config/theme';
import {LABELS} from '../config/timeline';
import {GoldText} from './Elements';

export const CURVE = {
  origin: {x: 560, y: 700},
  xEnd: 1390,
  yTop: 228,
  /** p=0 与 p=1 在横轴上的位置 */
  px0: 620,
  px1: 1300,
  base: 690,
  height: 380,
};

/** 倒 U 形：0→1 的可能性对应的压力（0–1） */
export const stressF = (p: number) => 0.07 + 0.93 * Math.exp(-0.5 * ((p - 0.5) / 0.19) ** 2);
const f = stressF;

export const curvePoint = (p: number) => ({
  x: CURVE.px0 + (CURVE.px1 - CURVE.px0) * p,
  y: CURVE.base - CURVE.height * f(p),
});

/** 曲线折线和累计弧长，用于按弧长「生长」 */
const SAMPLES = (() => {
  const pts = Array.from({length: 241}, (_, i) => curvePoint(i / 240));
  const len = [0];
  for (let i = 1; i < pts.length; i++) {
    len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = len[len.length - 1];
  return {pts, frac: len.map((l) => l / total)};
})();

/** 生长到弧长比例 g 时的折线与笔尖位置 */
export const curveUpTo = (g: number) => {
  const {pts, frac} = SAMPLES;
  const out: {x: number; y: number}[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (frac[i] <= g) {
      out.push(pts[i]);
    } else {
      const k = (g - frac[i - 1]) / (frac[i] - frac[i - 1]);
      out.push({x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k});
      break;
    }
  }
  return out;
};

export const PEAK = curvePoint(0.5);

/** 峰顶小光点的呼吸亮度，按完整版绝对时间算，镜头6、7 之间不会跳 */
export const peakHold = (gt: number) => 0.8 + 0.2 * Math.sin(gt * 2.2);

export const StressCurve: React.FC<{
  /** 坐标轴画出 0→1 */
  axes: number;
  /** 刻度与文字 0→1 */
  labels: number;
  /** 曲线按弧长生长 0→1 */
  growth: number;
  /** 整体亮度（镜头7 压暗） */
  dim?: number;
  /** 从峰顶落到 50% 的虚线：画出进度与不透明度 */
  dropLine?: number;
  dropOpacity?: number;
}> = ({axes, labels, growth, dim = 1, dropLine = 0, dropOpacity = 1}) => {
  const {origin, xEnd, yTop} = CURVE;
  const pts = growth > 0 ? curveUpTo(growth) : [];
  const tip = pts[pts.length - 1];
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const xAxisEnd = origin.x + (xEnd - origin.x) * axes;
  const yAxisEnd = origin.y - (origin.y - yTop) * axes;
  return (
    <g opacity={dim}>
      {/* 坐标轴 */}
      {axes > 0 && (
        <g stroke="url(#gold-stroke)" strokeWidth={1.6} fill="none" opacity={0.8}>
          <line x1={origin.x} y1={origin.y} x2={xAxisEnd} y2={origin.y} />
          <line x1={origin.x} y1={origin.y} x2={origin.x} y2={yAxisEnd} />
          {axes > 0.98 && (
            <>
              <path d={`M ${xEnd - 12} ${origin.y - 6} L ${xEnd} ${origin.y} L ${xEnd - 12} ${origin.y + 6}`} />
              <path d={`M ${origin.x - 6} ${yTop + 12} L ${origin.x} ${yTop} L ${origin.x + 6} ${yTop + 12}`} />
            </>
          )}
        </g>
      )}
      {/* 刻度与轴标题 */}
      <g opacity={labels}>
        {[0, 0.5, 1].map((p, i) => {
          const x = curvePoint(p).x;
          return (
            <g key={p}>
              <line x1={x} y1={origin.y} x2={x} y2={origin.y + 10} stroke="url(#gold-stroke)" strokeWidth={1.6} />
              <GoldText x={x} y={origin.y + 38} size={26} opacity={0.85}>
                {LABELS.axisTicks[i]}
              </GoldText>
            </g>
          );
        })}
        <GoldText x={xEnd + 22} y={origin.y} size={28} anchor="start" spacing="0.08em">
          {LABELS.axisX}
        </GoldText>
        <GoldText x={origin.x} y={yTop - 34} size={28} spacing="0.12em">
          {LABELS.axisY}
        </GoldText>
      </g>
      {/* 峰顶到 50% 的虚线 */}
      {dropLine > 0 && (
        <line
          x1={PEAK.x}
          y1={PEAK.y + 14}
          x2={PEAK.x}
          y2={PEAK.y + 14 + (origin.y - PEAK.y - 14) * dropLine}
          stroke={COLORS.gold1}
          strokeWidth={1.4}
          strokeDasharray="5 7"
          opacity={0.7 * dropOpacity}
        />
      )}
      {/* 曲线 */}
      {pts.length > 1 && (
        <>
          <path d={d} fill="none" stroke={COLORS.gold1} strokeWidth={3} opacity={0.35} filter="url(#glow)" />
          <path d={d} fill="none" stroke="url(#gold-stroke)" strokeWidth={2.6} strokeLinecap="round" />
          {growth < 1 && <circle cx={tip.x} cy={tip.y} r={4} fill="#FFF6D8" filter="url(#glow)" />}
        </>
      )}
    </g>
  );
};

/** 峰顶闪光：中心光斑 + 四芒星 */
export const PeakFlash: React.FC<{x: number; y: number; k: number; hold?: number}> = ({x, y, k, hold = 0}) => {
  // k: 0→1 一次闪光；hold: 闪光后留下的小光点亮度
  const burst = Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
  const size = 40 + 120 * k;
  return (
    <g>
      {hold > 0 && <circle cx={x} cy={y} r={22} fill="url(#ball-glow)" opacity={hold} />}
      {hold > 0 && <circle cx={x} cy={y} r={4.5} fill="#FFF6D8" opacity={hold} />}
      {burst > 0.01 && (
        <g opacity={burst}>
          <circle cx={x} cy={y} r={size * 0.9} fill="url(#flash)" opacity={0.7} />
          <g transform={`translate(${x} ${y}) rotate(${15 * k})`} filter="url(#glow-soft)">
            <path
              d={`M 0 ${-size} Q 4 -4 ${size} 0 Q 4 4 0 ${size} Q -4 4 ${-size} 0 Q -4 -4 0 ${-size} Z`}
              fill="#FFF6D8"
              opacity={0.9}
            />
          </g>
        </g>
      )}
    </g>
  );
};

/** 线条小图标：瞳孔放大的眼睛 */
export const EyeIcon: React.FC<{x: number; y: number; pupil: number; opacity: number}> = ({x, y, pupil, opacity}) => (
  <g opacity={opacity} fill="none" stroke="url(#gold-stroke)" strokeWidth={2} strokeLinecap="round">
    <path d={`M ${x - 62} ${y} Q ${x} ${y - 46} ${x + 62} ${y} Q ${x} ${y + 46} ${x - 62} ${y} Z`} />
    <circle cx={x} cy={y} r={21} />
    <circle cx={x} cy={y} r={pupil} fill={COLORS.gold0} fillOpacity={0.85} stroke="none" />
    <circle cx={x - 6} cy={y - 7} r={3} fill="#FFF6D8" stroke="none" />
    {[-1, 0, 1].map((k) => (
      <line key={k} x1={x + k * 30} y1={y - 40 + Math.abs(k) * 6} x2={x + k * 36} y2={y - 54 + Math.abs(k) * 8} />
    ))}
  </g>
);

/** 线条小图标：一滴汗 */
export const DropIcon: React.FC<{x: number; y: number; opacity: number}> = ({x, y, opacity}) => (
  <g opacity={opacity} fill="none" stroke="url(#gold-stroke)" strokeWidth={2} strokeLinecap="round">
    <path d={`M ${x} ${y - 46} C ${x + 8} ${y - 26} ${x + 30} ${y - 4} ${x + 30} ${y + 16} A 30 30 0 0 1 ${x - 30} ${y + 16} C ${x - 30} ${y - 4} ${x - 8} ${y - 26} ${x} ${y - 46} Z`} />
    <path d={`M ${x - 14} ${y + 12} Q ${x - 14} ${y + 28} ${x} ${y + 32}`} opacity={0.7} />
  </g>
);

/** 缩小版倒 U 曲线（镜头16、17 画面一角），marker 为标记点所在的可能性 0→1 */
export const MiniCurve: React.FC<{x: number; y: number; w: number; h: number; marker: number; opacity: number}> = ({
  x,
  y,
  w,
  h,
  marker,
  opacity,
}) => {
  if (opacity <= 0.001) {
    return null;
  }
  const pt = (p: number) => ({x: x + w * (0.06 + 0.88 * p), y: y - h * 0.92 * stressF(p)});
  const d = Array.from({length: 61}, (_, i) => {
    const q = pt(i / 60);
    return `${i === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }).join(' ');
  const m = pt(marker);
  return (
    <g opacity={opacity}>
      <g stroke="url(#gold-stroke)" strokeWidth={1.2} fill="none" opacity={0.6}>
        <line x1={x} y1={y} x2={x + w} y2={y} />
        <line x1={x} y1={y} x2={x} y2={y - h} />
      </g>
      <path d={d} fill="none" stroke="url(#gold-stroke)" strokeWidth={1.8} />
      <circle cx={m.x} cy={m.y} r={12} fill="url(#ball-glow)" />
      <circle cx={m.x} cy={m.y} r={4.5} fill="#FFF3C8" />
    </g>
  );
};
