import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {ANNUAL_SALES, BREAKTHROUGH, CAP, FPS, SCENES} from '../data';
import {Bar, Baseline, DustBurst, GoldLine, Num} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {clamp01, COLORS, FONTS, LAYOUT, tween, valueToY} from '../theme';
import {BAR_WIDTH, barX, S3_END_ZOOM, S3_MOTE_OFFSET, YearLabel} from './Scene3Bars';

/** 第四场 冲线：节拍（本场秒数） */
export const S4 = {
  shiftTo: 0.8,
  calIn: 0.5,
  growFrom: 1.0,
  /** 日历翻到 11月8日，画面静止一秒 */
  touchAt: 8.3,
  breakAt: 9.3,
  /** 金线碎裂（玻璃碎裂音） */
  shatterAt: 9.44,
  endAt: 13.2,
  yoyAt: 15.0,
  overAt: 19.0,
  dimFrom: 22.5,
};

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const dayOfYear = (month: number, day: number) =>
  MONTH_DAYS.slice(0, month - 1).reduce((a, b) => a + b, 0) + day;
const TOUCH_DOY = dayOfYear(BREAKTHROUGH.month, BREAKTHROUGH.day);
const dateOf = (doy: number) => {
  let d = Math.max(1, Math.min(365, Math.floor(doy)));
  let m = 0;
  while (d > MONTH_DAYS[m]) {
    d -= MONTH_DAYS[m];
    m++;
  }
  return {month: m + 1, day: d};
};

const TOUCH_V = parseFloat(BREAKTHROUGH.value);
const FINAL_V = parseFloat(BREAKTHROUGH.yearTotal);

/** 第四根柱子在某一帧的状态：日期、数值、显示字符串 */
const barState = (frame: number) => {
  const f = frame / FPS;
  if (f < S4.growFrom) {
    return {doy: 1, v: 0, text: '0.00'};
  }
  if (f < S4.touchAt) {
    const t = Easing.out(Easing.quad)((f - S4.growFrom) / (S4.touchAt - S4.growFrom));
    const doy = 1 + (TOUCH_DOY - 1) * t;
    const v = TOUCH_V * Math.pow((doy - 1) / (TOUCH_DOY - 1), 1.15);
    return {doy, v, text: v.toFixed(2)};
  }
  if (f < S4.shatterAt) {
    return {doy: TOUCH_DOY, v: TOUCH_V, text: BREAKTHROUGH.value};
  }
  if (f < S4.endAt) {
    const t = Easing.out(Easing.cubic)((f - S4.shatterAt) / (S4.endAt - S4.shatterAt));
    const doy = TOUCH_DOY + (365 - TOUCH_DOY) * t;
    const v = TOUCH_V + (FINAL_V - TOUCH_V) * t;
    return {doy, v, text: v.toFixed(2)};
  }
  return {doy: 365, v: FINAL_V, text: BREAKTHROUGH.yearTotal};
};

/** 右上角日历 */
const Calendar: React.FC<{frame: number; opacity: number; tension: number}> = ({frame, opacity, tension}) => {
  const {doy} = barState(frame);
  const {month, day} = dateOf(doy);
  // 换月时新的一页从上往下翻落
  let since = 99;
  for (let k = 1; k <= 7; k++) {
    if (dateOf(barState(frame - k).doy).month !== month) {
      since = k - 1;
      break;
    }
  }
  const flip = interpolate(since, [0, 6], [-88, 0], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1600,
        top: 64,
        width: 236,
        opacity,
        perspective: 700,
        filter: tension > 0 ? `drop-shadow(0 0 ${18 * tension}px ${COLORS.bright}88)` : undefined,
      }}
    >
      <div
        style={{
          height: 42,
          background: COLORS.gold,
          color: COLORS.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span style={{fontFamily: FONTS.num, fontWeight: 500, fontSize: 26}}>{BREAKTHROUGH.year}</span>
        <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 18}}>年</span>
      </div>
      <div
        style={{
          height: 128,
          background: '#141210',
          border: `1px solid ${COLORS.gold}66`,
          borderTop: 'none',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          paddingTop: 22,
          transformOrigin: 'top center',
          transform: `rotateX(${flip}deg)`,
          color: tension > 0.5 ? COLORS.bright : COLORS.text,
        }}
      >
        <span style={{fontFamily: FONTS.num, fontWeight: 500, fontSize: 70, lineHeight: 1}}>{month}</span>
        <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 28, margin: '0 6px 0 4px'}}>月</span>
        <span style={{fontFamily: FONTS.num, fontWeight: 500, fontSize: 70, lineHeight: 1}}>{day}</span>
        <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 28, marginLeft: 4}}>日</span>
      </div>
      {/* 装订环 */}
      {[60, 176].map((x) => (
        <div
          key={x}
          style={{
            position: 'absolute',
            left: x - 6,
            top: -10,
            width: 12,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${COLORS.gray}`,
            background: COLORS.bg,
          }}
        />
      ))}
    </div>
  );
};

/** 碎裂的金线：一段段红色碎片四散下坠 */
const Shards: React.FC<{t: number; impactX: number}> = ({t, impactX}) => {
  if (t < 0 || t > 70) {
    return null;
  }
  const pieces = [];
  let x = LAYOUT.lineLeft;
  let i = 0;
  while (x < LAYOUT.lineRight) {
    const len = 18 + random(`shard-len-${i}`) * 58;
    const cx = x + len / 2;
    const r = (k: string) => random(`shard-${i}-${k}`);
    const d = cx - impactX;
    const near = Math.exp(-Math.abs(d) / 650);
    const vx = Math.sign(d || 1) * (2 + 16 * r('vx')) * (0.35 + near) + (r('jx') - 0.5) * 3;
    const vy = -(1.5 + 13 * r('vy')) * (0.3 + near) + (r('jy') - 0.5) * 3;
    const drag = Math.pow(0.95, t);
    const dist = (1 - drag) / (1 - 0.95);
    const px = cx + vx * dist;
    const py = LAYOUT.lineY + vy * dist + 0.38 * t * t * 0.5;
    const rot = (r('rot') - 0.5) * 26 * t;
    const life = 34 + r('life') * 30;
    const op = interpolate(t, [0, life * 0.5, life], [1, 0.85, 0], clamp01);
    if (op > 0) {
      pieces.push(
        <line
          key={i}
          x1={-len / 2}
          x2={len / 2}
          y1={0}
          y2={0}
          stroke={COLORS.red}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={op}
          transform={`translate(${px} ${py}) rotate(${rot})`}
        />,
      );
    }
    x += len + 2;
    i++;
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g style={{filter: `drop-shadow(0 0 6px ${COLORS.red})`}}>{pieces}</g>
    </svg>
  );
};

export const Scene4Break: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[3];
  const f = frame / FPS;

  const shift = tween(frame, [0, S4.shiftTo], [0, 1], Easing.inOut(Easing.cubic));
  const xs = [0, 1, 2].map((i) => barX(i, 3) + (barX(i, 4) - barX(i, 3)) * shift);
  const x4 = barX(3, 4);

  const st = barState(frame);
  const frozen = f >= S4.touchAt && f < S4.breakAt;
  const tension = f >= S4.touchAt && f < S4.shatterAt ? 1 : 0;
  const shatterT = frame - S4.shatterAt * FPS;
  const hot =
    f < S4.touchAt
      ? interpolate(st.v, [170, TOUCH_V], [0, 0.6], clamp01)
      : interpolate(f, [S4.shatterAt, S4.endAt, S4.endAt + 1.2], [1, 0.55, 0], clamp01);

  // 冲破后的震动
  const shakeAmp = shatterT >= 0 ? interpolate(shatterT, [0, 20], [12, 0], clamp01) : 0;
  const sx = (random(`s4x${frame}`) - 0.5) * 2 * shakeAmp;
  const sy = (random(`s4y${frame}`) - 0.5) * 2 * shakeAmp;

  const calIn = tween(frame, [S4.calIn, S4.calIn + 0.5], [0, 1]);
  const calOut = tween(frame, [S4.endAt + 0.6, S4.endAt + 1.4], [1, 0]);

  // 金线：冲破前金色；顶住的一瞬变红并被顶弯；随后碎裂
  const tremble = interpolate(f, [S4.breakAt, S4.shatterAt], [1.5, 4], clamp01);

  const yoyIn = tween(frame, [S4.yoyAt, S4.yoyAt + 0.5], [0, 1], Easing.out(Easing.cubic));
  const yoyRoll = tween(frame, [S4.yoyAt, S4.yoyAt + 1.3], [0, 1], Easing.out(Easing.cubic));
  const overIn = tween(frame, [S4.overAt, S4.overAt + 0.6], [0, 1], Easing.out(Easing.cubic));
  const overRoll = tween(frame, [S4.overAt + 0.2, S4.overAt + 1.3], [0, 1], Easing.out(Easing.cubic));
  const dim = tween(frame, [S4.dimFrom, S4.dimFrom + 0.8], [1, 0.38]);
  const top4 = valueToY(FINAL_V);

  // 静止的一秒里，漂浮的金尘也停住
  const moteFrame = frozen ? S4.touchAt * FPS : frame;

  // 被顶住的金线：变红、绷紧、颤动
  const linePath = () => {
    const pts = [];
    for (let x = LAYOUT.lineLeft; x <= LAYOUT.lineRight; x += 10) {
      const k = Math.exp(-Math.pow((x - x4) / 420, 2));
      const wave = Math.sin(x * 0.045 + frame * 2.1) * tremble * k * (frame % 2 === 0 ? 1 : -1);
      pts.push(`${x},${(LAYOUT.lineY + wave).toFixed(2)}`);
    }
    return `M ${pts.join(' L ')}`;
  };

  return (
    <SceneShell
      scene={scene}
      camera={{
        transform: `translate(${sx}px, ${sy}px) scale(${1 + (S3_END_ZOOM - 1) * (1 - shift)})`,
        transformOrigin: `960px ${LAYOUT.baseY}px`,
      }}
    >
      <Motes frame={moteFrame + S3_MOTE_OFFSET + (SCENES[2].end - SCENES[2].start) * FPS} seed="s3" />
      <Baseline x1={300} x2={1620} />
      {/* 金线 */}
      {f < S4.breakAt ? <GoldLine glowStrength={1 + tension * 0.8} /> : null}
      {f >= S4.breakAt && f < S4.shatterAt ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <path
            d={linePath()}
            fill="none"
            stroke={COLORS.red}
            strokeWidth={2.8}
            style={{filter: `drop-shadow(0 0 8px ${COLORS.red})`}}
          />
        </svg>
      ) : null}
      {f >= S4.breakAt && f < S4.shatterAt ? (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.lineRight - 300,
            width: 300,
            top: LAYOUT.lineY - 62,
            textAlign: 'right',
          }}
        >
          <Num value={CAP.value} unit={CAP.unit} size={40} color={COLORS.red} />
        </div>
      ) : null}
      <Shards t={shatterT} impactX={x4} />
      {/* 「200亿」标签随碎片下坠 */}
      {shatterT >= 0 && shatterT < 50 ? (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.lineRight - 300,
            width: 300,
            top: LAYOUT.lineY - 62 + 0.25 * shatterT * shatterT,
            textAlign: 'right',
            opacity: interpolate(shatterT, [0, 40], [1, 0], clamp01),
            transform: `rotate(${shatterT * 0.9}deg)`,
            transformOrigin: 'right center',
          }}
        >
          <Num value={CAP.value} unit={CAP.unit} size={40} color={COLORS.red} />
        </div>
      ) : null}

      {/* 第五步：比上限多出多少（灰色虚线标出原来的位置） */}
      {overIn > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: overIn * dim}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <line
              x1={LAYOUT.lineLeft}
              x2={LAYOUT.lineRight}
              y1={LAYOUT.lineY}
              y2={LAYOUT.lineY}
              stroke={COLORS.gray}
              strokeWidth={2}
              strokeDasharray="10 10"
            />
            <g stroke={COLORS.bright} strokeWidth={2}>
              <line x1={x4 + 108} x2={x4 + 108} y1={LAYOUT.lineY - 3} y2={top4 + 3} strokeDasharray="5 6" />
              <line x1={x4 + 98} x2={x4 + 118} y1={LAYOUT.lineY - 3} y2={LAYOUT.lineY - 3} />
              <line x1={x4 + 98} x2={x4 + 118} y1={top4 + 3} y2={top4 + 3} />
            </g>
          </svg>
          <div style={{position: 'absolute', left: LAYOUT.lineRight - 300, width: 300, top: LAYOUT.lineY + 14, textAlign: 'right'}}>
            <Num value={CAP.value} unit={CAP.unit} size={30} color={COLORS.gray} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: x4 + 132,
              top: (LAYOUT.lineY + top4) / 2 - 28,
              filter: `drop-shadow(0 0 12px ${COLORS.bright}66)`,
            }}
          >
            <Num value={BREAKTHROUGH.overCap} progress={overRoll} sign="+" unit="亿" size={50} color={COLORS.bright} />
          </div>
        </div>
      ) : null}

      {/* 柱子 */}
      {xs.map((x, i) => (
        <React.Fragment key={i}>
          <Bar x={x} width={BAR_WIDTH} value={parseFloat(ANNUAL_SALES[i].value)} opacity={dim}>
            <Num value={ANNUAL_SALES[i].value} prefix={ANNUAL_SALES[i].prefix} unit="亿" size={46} />
          </Bar>
          <YearLabel x={x} text={ANNUAL_SALES[i].year} active={dim} />
        </React.Fragment>
      ))}
      {st.v > 0 ? (
        <Bar x={x4} width={BAR_WIDTH} value={st.v} hot={hot} fill={1.5}>
          <Num value={BREAKTHROUGH.yearTotal} display={st.text} unit="亿" size={46} color={hot > 0.5 ? '#FFF1C9' : COLORS.gold} />
        </Bar>
      ) : null}
      <YearLabel x={x4} text={ANNUAL_SALES[3].year} active={f >= S4.growFrom ? 1 : 0} />

      {/* 冲破的闪光与红色火星 */}
      {shatterT >= 0 && shatterT < 16 ? (
        <div
          style={{
            position: 'absolute',
            left: x4 - 260,
            top: LAYOUT.lineY - 260,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: `radial-gradient(circle, #FFF6DDEE 0%, ${COLORS.bright}66 22%, ${COLORS.bright}00 62%)`,
            opacity: interpolate(shatterT, [0, 16], [1, 0], clamp01),
          }}
        />
      ) : null}
      <DustBurst
        frame={frame}
        start={S4.shatterAt * FPS}
        x={x4}
        y={LAYOUT.lineY}
        seed="s4spark"
        count={40}
        angle={[-180, 0]}
        speed={[6, 20]}
        colors={[COLORS.red, '#FF6B5E']}
        spreadX={BAR_WIDTH}
        life={30}
      />
      <DustBurst
        frame={frame}
        start={S4.endAt * FPS}
        x={x4}
        y={top4}
        seed="s4land"
        spreadX={BAR_WIDTH}
      />

      {/* 同比 */}
      {yoyIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: x4 + 104,
            top: LAYOUT.lineY + 64,
            opacity: yoyIn * dim,
            transform: `translateY(${(1 - yoyIn) * 16}px)`,
          }}
        >
          <div style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 24, color: COLORS.text, opacity: 0.7}}>
            同比
          </div>
          <Num value={BREAKTHROUGH.yoy} progress={yoyRoll} sign="+" unit="%" size={58} color={COLORS.gold} />
        </div>
      ) : null}

      <Calendar frame={frame} opacity={calIn * calOut} tension={tension} />
    </SceneShell>
  );
};
