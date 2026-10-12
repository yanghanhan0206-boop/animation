/**
 * 家长的摆锤（全片持续存在）：支架、细线、摆球、10 个逐渐淡出缩小的金色残影。
 * 拖尾在镜头 2 变得柔和偏暖，在镜头 6 随着每一只手变长变亮。
 */
import React from 'react';
import {FPS, PENDULUM, S2, S6, S7, S9} from '../timeline';
import {COLORS, mixColor} from '../theme';
import {envelope, pulse, ramp} from '../lib/math';
import {EVENTS, cradleCollisions, mainBob} from '../sim/physics';
import {Cam} from '../sim/camera';
import {Bob} from '../components/Bob';

/** 镜头 6 中“已经推过的手”的数量（平滑） */
export const handPressure = (t: number) =>
  EVENTS.hands.reduce((a, h) => a + ramp(t, h, h + 0.8), 0) * (1 - ramp(t, S7.handsOut[0], S7.amplitude.end));

export const trailParams = (t: number) => {
  const warm = envelope(t, S2.warm[0], S2.warm[1], S2.warm[2], S2.warm[3]);
  const p = handPressure(t) / S6.hands.length; // 0..1
  return {
    warm,
    spacing: (1.15 + warm * 0.35 + p * 1.25) / FPS, // 相邻残影的时间间隔
    opacity: 0.42 - warm * 0.08 + p * 0.3,
    blur: warm * 5,
    glow: 1 + p * 0.6,
  };
};

export const PendulumRig: React.FC<{
  pivot: {x: number; y: number};
  bob: {x: number; y: number};
  r: number;
  zoom: number;
  opacity?: number;
  mount?: boolean;
  stringColor?: string;
}> = ({pivot, bob, r, zoom, opacity = 1, mount = true, stringColor = '#E2C25A'}) => (
  <g opacity={opacity}>
    {mount ? (
      <g transform={`translate(${pivot.x} ${pivot.y})`}>
        <line x1={-60} x2={60} y1={-9} y2={-9} stroke="url(#barFade)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        <line x1={0} x2={0} y1={-9} y2={-4} stroke={COLORS.gold0} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </g>
    ) : null}
    <line
      x1={pivot.x}
      y1={pivot.y}
      x2={bob.x}
      y2={bob.y}
      stroke={stringColor}
      strokeOpacity={0.85}
      strokeWidth={1.1 + 0.7 * Math.min(1, zoom)}
      vectorEffect="non-scaling-stroke"
    />
    <circle
      cx={pivot.x}
      cy={pivot.y}
      r={4.2 / Math.max(zoom, 0.35)}
      fill={COLORS.bg}
      stroke={COLORS.gold1}
      strokeWidth={1.3}
      vectorEffect="non-scaling-stroke"
    />
    <circle cx={pivot.x} cy={pivot.y} r={1.4 / Math.max(zoom, 0.35)} fill={COLORS.gold1} />
    <circle cx={bob.x} cy={bob.y - r} r={1.6 / Math.max(zoom, 0.35)} fill={stringColor} opacity={0.9} />
  </g>
);

/** 拖尾：count 个残影，越旧越小越淡 */
export const Trail: React.FC<{
  pos: (t: number) => {x: number; y: number};
  t: number;
  r: number;
  count: number;
  spacing: number;
  opacity: number;
  warm?: number;
  blur?: number;
  dark?: boolean;
}> = ({pos, t, r, count, spacing, opacity, warm = 0, blur = 0, dark = false}) => {
  const ghosts = [];
  for (let k = count; k >= 1; k--) {
    const p = pos(t - k * spacing);
    const f = 1 - k / (count + 1);
    const col = dark ? mixColor('#6E5822', '#9A7D35', f) : mixColor(mixColor(COLORS.gold0, COLORS.warm0, warm), mixColor(COLORS.gold1, COLORS.warm1, warm), f);
    ghosts.push(<circle key={k} cx={p.x} cy={p.y} r={r * (1 - 0.055 * k)} fill={col} opacity={opacity * Math.pow(f, 1.5)} />);
  }
  return (
    <g>
      {blur > 0.2 ? (
        <defs>
          <filter id="trailSoft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
      ) : null}
      <g filter={blur > 0.2 ? 'url(#trailSoft)' : undefined}>{ghosts}</g>
    </g>
  );
};

export const MainPendulum: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const fade = 1 - ramp(t, S9.finalFade[0], S9.finalFade[1]);
  if (fade <= 0) return null;
  const R = PENDULUM.bobRadius;
  const bob = mainBob(t);
  const tp = trailParams(t);

  // 牛顿摆阶段：被撞的瞬间亮一下；被吸收时亮起一圈强烈金光
  let flash = 0;
  for (const c of cradleCollisions) {
    if ((c.a === 2 || c.b === 2) && c.speed > 50) flash = Math.max(flash, pulse(t - c.t, 0.04, 0.45) * (c.kind === 'absorb' ? 0 : 0.8));
  }
  const absorb = EVENTS.absorb >= 0 ? pulse(t - EVENTS.absorb, 0.05, 1.6) : 0;

  return (
    <g opacity={fade}>
      <Trail
        pos={(tt) => mainBob(tt)}
        t={t}
        r={R}
        count={PENDULUM.trailCount}
        spacing={tp.spacing}
        opacity={tp.opacity}
        warm={tp.warm}
        blur={tp.blur}
      />
      <PendulumRig pivot={{x: 0, y: 0}} bob={bob} r={R} zoom={cam.zoom} />
      <Bob x={bob.x} y={bob.y} r={R} glow={tp.glow + flash * 1.4 + absorb * 2.2} inner={1 + flash + absorb * 1.5} warm={tp.warm > 0.5} />
    </g>
  );
};
