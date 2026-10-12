/**
 * 镜头 6：四只金色线条的手依次从画面边缘伸入，在摆球经过时轻推一下，旁边浮现一个词。
 * 镜头 7 开头退出画面。镜头 9 里也用同样的手短暂地再推一次。
 */
import React from 'react';
import {PENDULUM, S6, S7} from '../timeline';
import {easeInCubic, easeInOutCubic, easeOutCubic, lerp, pulse, rad, ramp} from '../lib/math';
import {EVENTS, mainBob} from '../sim/physics';
import {Hand} from '../components/Hand';
import {GoldText} from '../components/GoldText';

export const HAND_SCALE = 1.9;
const HAND_LEN = 155 * HAND_SCALE; // 指尖到手腕
const LABEL_SIZE = 50;

export type HandPlan = {
  contact: number; // 接触时刻
  tip: {x: number; y: number}; // 接触时指尖位置（世界坐标）
  dir: {x: number; y: number}; // 手指指向（单位向量）
  enter: number; // 伸入用时
  push: number; // 推的距离
  rest: number; // 推完退到的位置（负数 = 往回收）
  exit: readonly [number, number];
};

/** 指尖沿 dir 方向的位移（0 = 正好碰到摆球） */
export const handOffset = (p: HandPlan, t: number) => {
  const far = -1500;
  const tc = p.contact;
  let s: number;
  if (t < tc - p.enter) s = far;
  else if (t < tc - 0.06) s = lerp(far, 0, easeOutCubic((t - (tc - p.enter)) / (p.enter - 0.06)));
  else if (t < tc + 0.34) s = lerp(0, p.push, easeOutCubic((t - (tc - 0.06)) / 0.4));
  else if (t < tc + 0.45) s = p.push;
  else s = lerp(p.push, p.rest, easeInOutCubic((t - (tc + 0.45)) / 1.3)) + 5 * Math.sin((t - tc) * 2.1) * ramp(t, tc + 1.2, tc + 2.5);
  s = lerp(s, far, easeInCubic(ramp(t, p.exit[0], p.exit[1], (x) => x)));
  return s;
};

export const handOpacity = (p: HandPlan, t: number) =>
  ramp(t, p.contact - p.enter, p.contact - p.enter + 0.5) * (1 - ramp(t, p.exit[0] + (p.exit[1] - p.exit[0]) * 0.4, p.exit[1]));

export const planFromAngle = (
  contact: number,
  approachDeg: number,
  enter: number,
  exit: readonly [number, number],
  push = 40,
  rest = -200,
  standoff = 0,
): HandPlan => {
  const a = rad(approachDeg);
  const dir = {x: -Math.cos(a), y: -Math.sin(a)};
  const c = mainBob(contact);
  const R = PENDULUM.bobRadius + 1.5 + standoff;
  return {contact, tip: {x: c.x - dir.x * R, y: c.y - dir.y * R}, dir, enter, push, rest, exit};
};

export const SHOT6_PLANS = S6.hands.map((h, i) => planFromAngle(EVENTS.hands[i], h.approach, S6.handEnter, S7.handsOut));

export const PlannedHand: React.FC<{plan: HandPlan; t: number; opacity?: number}> = ({plan, t, opacity = 1}) => {
  const s = handOffset(plan, t);
  const op = handOpacity(plan, t) * opacity;
  const touch = pulse(t - plan.contact, 0.06, 0.5);
  return (
    <>
      <Hand
        x={plan.tip.x + plan.dir.x * s}
        y={plan.tip.y + plan.dir.y * s}
        angle={Math.atan2(plan.dir.y, plan.dir.x)}
        scale={HAND_SCALE}
        opacity={op}
        glow={0.55 + touch}
      />
      {touch > 0.02 ? (
        <circle cx={plan.tip.x + plan.dir.x * s} cy={plan.tip.y + plan.dir.y * s} r={34} fill="url(#haloSoft)" opacity={touch * op} />
      ) : null}
    </>
  );
};

export const HandsScene: React.FC<{t: number}> = ({t}) => {
  if (t < S6.start - 1 || t > S7.handsOut[1] + 0.1) return null;
  return (
    <g>
      {SHOT6_PLANS.map((p, i) => {
        const h = S6.hands[i];
        const s = handOffset(p, t);
        const op = handOpacity(p, t);
        // 词：写在手腕旁、沿前臂往画面外的一侧（从下方伸来的手写在手臂上方，其余写在下方）
        const tipX = p.tip.x + p.dir.x * s;
        const tipY = p.tip.y + p.dir.y * s;
        const wristX = tipX - p.dir.x * HAND_LEN;
        const wristY = tipY - p.dir.y * HAND_LEN;
        const perp = {x: -p.dir.y * h.labelSide, y: p.dir.x * h.labelSide};
        const textW = [...h.label].length * LABEL_SIZE * 1.12;
        const off = 105 + Math.abs(perp.x) * textW * 0.5 + Math.abs(perp.y) * 6;
        const lx = wristX - p.dir.x * (70 + Math.abs(p.dir.x) * textW * 0.3) + perp.x * off;
        const ly = wristY - p.dir.y * 70 + perp.y * off;
        const word = ramp(t, p.contact - 0.5, p.contact + 0.5) * (1 - ramp(t, S7.handsOut[0], S7.handsOut[0] + 1.0));
        const flash = pulse(t - p.contact, 0.1, 1.2);
        return (
          <g key={i}>
            <PlannedHand plan={p} t={t} />
            <GoldText
              x={lx}
              y={ly}
              text={h.label}
              size={LABEL_SIZE}
              weight={500}
              letterSpacing={0.12}
              opacity={word * op}
              glow={0.25 + flash * 0.8}
              blur={(1 - word) * 8}
            />
          </g>
        );
      })}
    </g>
  );
};

/** 镜头 9：边缘的手短暂地重新出现推一下 */
export const brieflyHands = (contact: number, lead: number, stay: number, angles: readonly number[], standoff: number) =>
  angles.map((a) => planFromAngle(contact, a, lead, [contact + stay, contact + stay + 1.2] as const, 60, -80, standoff));
