/**
 * 摆锤两端的词：左“吼”→“恐惧”，右“补偿”→“愧疚”。
 * 摆球每次到达某一端，那一端的词亮起一次金色光晕。
 */
import React from 'react';
import {PENDULUM, S3, S5, S6, S7} from '../timeline';
import {easeOutCubic, pulse, ramp} from '../lib/math';
import {EVENTS, mainAmpSmooth, mainExtremes} from '../sim/physics';
import {GoldText} from '../components/GoldText';

export type Side = 'left' | 'right';
const SIGN: Record<Side, -1 | 1> = {left: -1, right: 1};

export const WORD_STYLE: Record<string, {size: number; weight: number}> = {
  吼: {size: 136, weight: 900},
  补偿: {size: 100, weight: 700},
  恐惧: {size: 100, weight: 700},
  愧疚: {size: 100, weight: 700},
};
const LETTER_SPACING = 0.06;

/** 词的中心位置（世界坐标）：贴在摆动端点外侧，随摆幅平滑外移 */
export const poleWordPos = (side: Side, t: number, text: string) => {
  const s = SIGN[side];
  const A = mainAmpSmooth(t);
  const {size} = WORD_STYLE[text];
  const w = [...text].length * size * (1 + LETTER_SPACING);
  return {
    x: s * (PENDULUM.length * Math.sin(A) + PENDULUM.bobRadius + 46 + w / 2),
    y: PENDULUM.length * Math.cos(A) - 18,
  };
};

const morphOf = (side: Side) => S5.morphs.find((m) => m.side === side)!;

/** 到达端点时的光晕 */
const arrivalGlow = (side: Side, t: number, since: number) => {
  let g = 0;
  for (const e of mainExtremes) {
    if (e.side !== SIGN[side] || e.t < since - 0.05 || e.t > t + 0.6) continue;
    g = Math.max(g, pulse(t - e.t, 0.14, 0.8));
  }
  return g;
};

const Word: React.FC<{side: Side; text: string; t: number; opacity: number; scale?: number; blur?: number; glow: number}> = ({
  side,
  text,
  t,
  opacity,
  scale = 1,
  blur = 0,
  glow,
}) => {
  const p = poleWordPos(side, t, text);
  const st = WORD_STYLE[text];
  return (
    <GoldText
      x={p.x}
      y={p.y}
      text={text}
      size={st.size}
      weight={st.weight}
      opacity={opacity}
      scale={scale}
      blur={blur}
      glow={glow}
      letterSpacing={LETTER_SPACING}
    />
  );
};

export const PoleWords: React.FC<{t: number}> = ({t}) => {
  const out7 = 1 - ramp(t, S7.wordsOut[0], S7.wordsOut[1]);
  if (out7 <= 0) return null;

  // —— 左：吼 ——
  const r1 = EVENTS.roar1;
  const r3 = EVENTS.roar3;
  const mL = morphOf('left');
  const appearL = ramp(t, r1 - 0.04, r1 + 0.45, easeOutCubic);
  const brighter = 1 + (S3.roarBrightness - 1) * ramp(t, r3 - 0.15, r3 + 0.4);
  const roarBurst = pulse(t - r1, 0.04, 0.9) * 1.2 + pulse(t - r3, 0.04, 1.1) * 1.8;
  const glowL = (0.22 + arrivalGlow('left', t, r1) * 1.1) * brighter + roarBurst;
  const roarVisible = appearL * (1 - ramp(t, mL.start, mL.start + 0.35));
  const scaleL = 1 + 0.25 * (1 - ramp(t, r1 - 0.04, r1 + 0.6, easeOutCubic)) + 0.06 * pulse(t - r3, 0.05, 0.5);
  const blurL = 12 * (1 - ramp(t, r1 - 0.04, r1 + 0.5, easeOutCubic));

  const fearIn = ramp(t, mL.start + mL.duration - 0.5, mL.start + mL.duration);
  const glowFear = 0.22 + arrivalGlow('left', t, mL.start + mL.duration) * 1.1;

  // —— 右：补偿 ——
  const c = EVENTS.compensate;
  const mR = morphOf('right');
  const appearR = ramp(t, c - 0.1, c + 0.7, easeOutCubic);
  const compVisible = appearR * (1 - ramp(t, mR.start, mR.start + 0.35));
  const scaleR = 1 + 0.12 * (1 - ramp(t, c - 0.1, c + 0.8, easeOutCubic));
  const blurR = 10 * (1 - ramp(t, c - 0.1, c + 0.6, easeOutCubic));
  const glowR = 0.22 + arrivalGlow('right', t, c) * 1.1 + pulse(t - c, 0.08, 0.9) * 0.8;

  const guiltIn = ramp(t, mR.start + mR.duration - 0.5, mR.start + mR.duration) * (1 - ramp(t, S6.rightWordOut[0], S6.rightWordOut[1]));
  const glowGuilt = 0.22 + arrivalGlow('right', t, mR.start + mR.duration) * 1.1;

  return (
    <g opacity={out7}>
      <Word side="left" text="吼" t={t} opacity={roarVisible * Math.min(1, 0.85 * brighter)} scale={scaleL} blur={blurL} glow={glowL} />
      <Word side="left" text="恐惧" t={t} opacity={fearIn} glow={glowFear} />
      <Word side="right" text="补偿" t={t} opacity={compVisible} scale={scaleR} blur={blurR} glow={glowR} />
      <Word side="right" text="愧疚" t={t} opacity={guiltIn} glow={glowGuilt} />
    </g>
  );
};
