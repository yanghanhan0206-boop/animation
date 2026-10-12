/**
 * 镜头 8 ~ 9：牛顿摆。祖辈、你的父母从上方依次降下，与家长的摆锤横向排成牛顿摆；
 * 下方出现最小的一颗——孩子。每次碰撞都有金色冲击波纹。
 */
import React from 'react';
import {CRADLE, PENDULUM, S8, S9} from '../timeline';
import {COLORS} from '../theme';
import {easeInOutCubic, easeInOutSine, easeOutCubic, lerp, pulse, ramp} from '../lib/math';
import {CRADLE_PIVOTS, EVENTS, childStillAt, childTheta, cradleCollisions, cradleTheta, mainBob} from '../sim/physics';
import {Bob} from '../components/Bob';
import {GoldText} from '../components/GoldText';
import {PendulumRig, Trail} from './MainPendulum';

const L = PENDULUM.length;
const r = CRADLE.ballRadius;
const LABEL = {fill: '#EDE3CB', size: 36, weight: 500};

const Leader: React.FC<{x1: number; y1: number; x2: number; y2: number; opacity: number}> = ({x1, y1, x2, y2, opacity}) => (
  <g opacity={opacity}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.gold0} strokeOpacity={0.55} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    <circle cx={x1} cy={y1} r={2.2} fill={COLORS.gold1} opacity={0.8} />
  </g>
);

const Ripples: React.FC<{t: number}> = ({t}) => (
  <g>
    {cradleCollisions.map((c, i) => {
      if (c.speed < 50 || c.kind === 'absorb' || t < c.t || t > c.t + 1.3) return null;
      const u = ramp(t, c.t, c.t + 1.2, easeOutCubic);
      const toYou = c.to === 2 && c.t > S8.childAppear[0] + 0.4;
      return (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={60} fill="url(#haloSoft)" opacity={pulse(t - c.t, 0.02, 0.35) * 1.2} />
          <circle
            cx={c.x}
            cy={c.y}
            r={14 + u * 150}
            fill="none"
            stroke={COLORS.gold1}
            strokeWidth={0.5 + 2.6 * (1 - u)}
            vectorEffect="non-scaling-stroke"
            opacity={0.9 * Math.pow(1 - u, 1.3)}
          />
          <circle
            cx={c.x}
            cy={c.y}
            r={8 + u * 90}
            fill="none"
            stroke={COLORS.gold0}
            strokeWidth={0.5 + 1.4 * (1 - u)}
            vectorEffect="non-scaling-stroke"
            opacity={0.6 * Math.pow(1 - u, 1.6)}
          />
          {toYou ? (
            // 冲击继续往下，传向孩子
            <circle
              cx={c.x + r}
              cy={c.y}
              r={30 + ramp(t, c.t + 0.05, c.t + 0.75, easeOutCubic) * 220}
              fill="none"
              stroke={COLORS.gold1}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
              opacity={0.45 * (1 - ramp(t, c.t + 0.05, c.t + 0.9))}
            />
          ) : null}
        </g>
      );
    })}
  </g>
);

/** 家长把冲击吸收进来：一圈强烈金光先荡开，再收回到摆球里 */
const AbsorbRing: React.FC<{t: number}> = ({t}) => {
  const a = EVENTS.absorb;
  if (a < 0 || t < a || t > a + 2.4) return null;
  const c = mainBob(t);
  const out = ramp(t, a, a + 0.22, easeOutCubic);
  const back = ramp(t, a + 0.22, a + 1.5, easeInOutCubic);
  const R0 = lerp(r + 4, 128, out);
  const R1 = lerp(R0, r + 6, back);
  const op = 1 - ramp(t, a + 1.2, a + 2.2);
  const inward = [0.18, 0.4, 0.62].map((d, i) => {
    const u = ramp(t, a + d, a + d + 0.9, easeInOutSine);
    if (u <= 0 || u >= 1) return null;
    return (
      <circle
        key={i}
        cx={c.x}
        cy={c.y}
        r={lerp(230 - i * 35, r + 4, u)}
        fill="none"
        stroke={COLORS.gold1}
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
        opacity={0.55 * Math.sin(Math.PI * u)}
      />
    );
  });
  return (
    <g>
      <circle cx={c.x} cy={c.y} r={R1 * 1.9} fill="url(#haloSoft)" opacity={op * 0.9} />
      <circle cx={c.x} cy={c.y} r={R1} fill="none" stroke="#FFF1C2" strokeWidth={4.5} vectorEffect="non-scaling-stroke" opacity={op} />
      <circle cx={c.x} cy={c.y} r={R1} fill="none" stroke={COLORS.gold1} strokeWidth={12} vectorEffect="non-scaling-stroke" opacity={op * 0.35} filter="url(#blur8)" />
      {inward}
    </g>
  );
};

/** 孩子的摆锤与呼吸光圈 */
export const ChildPendulum: React.FC<{t: number; cam: {zoom: number}}> = ({t, cam}) => {
  const w0 = S8.childAppear[0];
  const w1 = S8.childAppear[1];
  if (t < w0) return null;
  const fadeRest = 1 - ramp(t, S9.finalFade[0], S9.finalFade[1]);
  const lower = ramp(t, w0, w1, easeInOutCubic);
  const appear = ramp(t, w0, w0 + 0.6);
  const pin = {x: 0, y: CRADLE.childPin};
  const len = CRADLE.childLength * lower;
  const th = childTheta(t);
  const bob = {x: pin.x + len * Math.sin(th), y: pin.y + len * Math.cos(th)};
  const cr = CRADLE.childRadius;
  // 呼吸光圈：安静下来之后，以约 3 秒为周期缓慢放大缩小
  const breathOn = ramp(t, childStillAt, childStillAt + 1.2, easeInOutSine);
  const b = 0.5 - 0.5 * Math.cos((2 * Math.PI * (t - childStillAt)) / S9.breathPeriod);
  const label = ramp(t, w1 - 0.2, w1 + 0.6) * fadeRest;
  return (
    <g opacity={appear}>
      <PendulumRig pivot={pin} bob={bob} r={cr} zoom={cam.zoom} opacity={fadeRest} />
      {breathOn > 0 ? (
        <g opacity={breathOn}>
          <circle cx={bob.x} cy={bob.y} r={cr * (7 + 3 * b)} fill="url(#haloSoft)" opacity={0.7 + 0.3 * b} />
          <circle
            cx={bob.x}
            cy={bob.y}
            r={cr * (2.3 + 1.3 * b)}
            fill="none"
            stroke="#FFF1C2"
            strokeWidth={1.1}
            vectorEffect="non-scaling-stroke"
            opacity={0.18 + 0.32 * (1 - b)}
          />
        </g>
      ) : null}
      <Bob x={bob.x} y={bob.y} r={cr} variant="child" glow={0.8 + breathOn * (0.4 + 0.5 * b)} />
      <Leader x1={bob.x + cr + 6} y1={bob.y + 6} x2={bob.x + cr + 62} y2={bob.y + 38} opacity={label} />
      <GoldText
        x={bob.x + cr + 72}
        y={bob.y + 38}
        text="孩子"
        size={LABEL.size}
        weight={LABEL.weight}
        fill={LABEL.fill}
        anchor="start"
        letterSpacing={0.12}
        opacity={label}
      />
    </g>
  );
};

export const CradleScene: React.FC<{t: number; cam: {zoom: number}}> = ({t, cam}) => {
  if (t < S8.beamDraw[0] - 0.1) return null;
  const fade = 1 - ramp(t, S9.finalFade[0], S9.finalFade[1]);
  const bd = ramp(t, S8.beamDraw[0], S8.beamDraw[1], easeInOutCubic);
  const left = CRADLE_PIVOTS[0] - 80;
  const right = 80;
  const balls = [
    {b: 0, win: S8.grandAppear, variant: 'darker' as const, label: '祖辈', drop: 92},
    {b: 1, win: S8.parentAppear, variant: 'dark' as const, label: '你的父母', drop: 168},
  ];
  return (
    <g opacity={fade}>
      <defs>
        <linearGradient id="beamFade" gradientUnits="userSpaceOnUse" x1={left} y1="0" x2={right} y2="0">
          <stop offset="0" stopColor={COLORS.gold0} stopOpacity="0" />
          <stop offset="0.12" stopColor={COLORS.gold0} stopOpacity="0.85" />
          <stop offset="0.88" stopColor={COLORS.gold1} stopOpacity="0.85" />
          <stop offset="1" stopColor={COLORS.gold1} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={lerp(0, left, bd)}
        x2={lerp(0, right, bd)}
        y1={-9}
        y2={-9}
        stroke="url(#beamFade)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />
      {balls.map(({b, win, variant, label, drop}) => {
        if (t < win[0]) return null;
        const op = ramp(t, win[0], win[0] + 0.5);
        const px = CRADLE_PIVOTS[b];
        const pos = (tt: number) => {
          const th = cradleTheta(b, tt);
          const len = L * ramp(tt, win[0], win[1], easeInOutCubic);
          return {x: px + len * Math.sin(th), y: len * Math.cos(th)};
        };
        const bob = pos(t);
        let flash = 0;
        for (const c of cradleCollisions) if ((c.a === b || c.b === b) && c.speed > 50) flash = Math.max(flash, pulse(t - c.t, 0.03, 0.4));
        const lab = ramp(t, win[1] - 0.1, win[1] + 0.7);
        const ly = L + r + drop;
        return (
          <g key={b} opacity={op}>
            <Trail pos={pos} t={t} r={r} count={PENDULUM.trailCount} spacing={1.15 / 30} opacity={0.3} dark />
            <PendulumRig pivot={{x: px, y: 0}} bob={bob} r={r} zoom={cam.zoom} mount={false} stringColor="#B8994A" />
            <Bob x={bob.x} y={bob.y} r={r} variant={variant} glow={0.3 + flash * 1.4} inner={1 + flash * 2} />
            <Leader x1={px} y1={L + r + 10} x2={px - 76 - (b === 1 ? 14 : 0)} y2={ly} opacity={lab} />
            <GoldText
              x={px - 88 - (b === 1 ? 14 : 0)}
              y={ly}
              text={label}
              size={LABEL.size}
              weight={LABEL.weight}
              fill={LABEL.fill}
              anchor="end"
              letterSpacing={0.12}
              opacity={lab}
            />
          </g>
        );
      })}
      <Ripples t={t} />
      <AbsorbRing t={t} />
    </g>
  );
};
