import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {ANNUAL_SALES, FPS, GAP_TO_CAP_2024, SCENES} from '../data';
import {Bar, Baseline, DustBurst, GoldLine, Num} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {clamp01, COLORS, FONTS, LAYOUT, tween, valueToY} from '../theme';

/** 第三场 一路狂奔：节拍（本场秒数） */
export const S3 = {
  bars: [
    {from: 4.5, land: 5.9},
    {from: 8.1, land: 9.6},
    {from: 11.7, land: 13.3},
  ],
  gapAt: 15.5,
};

export const BAR_WIDTH = 170;
/** 第三场结束时的镜头推近倍数，第四场从这里接着拉回 */
export const S3_END_ZOOM = 1.04;
/** 第三场漂浮金尘的帧偏移，第四场接着用 */
export const S3_MOTE_OFFSET = 800;
export const BAR_STEP = 280;
/** n 根柱子居中排布时第 i 根的横坐标 */
export const barX = (i: number, n: number) => 960 + (i - (n - 1) / 2) * BAR_STEP;

const riseEase = Easing.bezier(0.25, 0.75, 0.3, 1);

/** 年份标签 */
export const YearLabel: React.FC<{x: number; text: string; active: number; color?: string}> = ({
  x,
  text,
  active,
  color = COLORS.gold,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 120,
      width: 240,
      top: LAYOUT.baseY + 18,
      textAlign: 'center',
      fontFamily: FONTS.num,
      fontWeight: 500,
      fontSize: 32,
      letterSpacing: '0.06em',
      color: active > 0.5 ? color : COLORS.gray,
      opacity: 0.5 + 0.5 * active,
    }}
  >
    {text}
  </div>
);

export const Scene3Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[2];
  const n = 3;

  let bump = 0;
  const bars = S3.bars.map((b, i) => {
    const data = ANNUAL_SALES[i];
    const target = parseFloat(data.value);
    const p = interpolate(frame, [b.from * FPS, b.land * FPS], [0, 1], {...clamp01, easing: riseEase});
    const since = frame - b.land * FPS;
    if (since >= 0 && since < 8) {
      bump += (8 - since) / 8;
    }
    const flash = since >= 0 ? interpolate(since, [0, 18], [1, 0], clamp01) : 0;
    return {i, data, target, p, flash, x: barX(i, n), b};
  });

  const shake = bump * 2.5;
  const sx = (random(`s3x${frame}`) - 0.5) * shake;
  const sy = (random(`s3y${frame}`) - 0.5) * shake;
  const zoom = tween(frame, [0, 21], [1, S3_END_ZOOM]);

  // 离线还剩多少
  // 场尾收起标注，与第四场无缝衔接
  const gapIn =
    tween(frame, [S3.gapAt, S3.gapAt + 0.6], [0, 1], Easing.out(Easing.cubic)) * tween(frame, [20.2, 20.9], [1, 0]);
  const gapRoll = tween(frame, [S3.gapAt + 0.2, S3.gapAt + 1.4], [0, 1], Easing.out(Easing.cubic));
  const x3 = barX(2, n);
  const top3 = valueToY(parseFloat(ANNUAL_SALES[2].value));
  const pulse = 0.5 + 0.5 * Math.sin((frame - S3.gapAt * FPS) * 0.18);

  return (
    <SceneShell
      scene={scene}
      camera={{
        transform: `translate(${sx}px, ${sy}px) scale(${zoom})`,
        transformOrigin: `960px ${LAYOUT.baseY}px`,
      }}
    >
      <Motes frame={frame + S3_MOTE_OFFSET} seed="s3" />
      <Baseline x1={300} x2={1620} opacity={tween(frame, [0, 0.8], [0, 1])} />
      <GoldLine glowStrength={1 + gapIn * pulse * 0.8} />
      {bars.map(({i, data, target, p, flash, x}) => (
        <React.Fragment key={i}>
          {p > 0 ? (
            <Bar x={x} width={BAR_WIDTH} value={target * p} hot={flash * 0.8}>
              <Num value={data.value} progress={p} prefix={data.prefix} unit="亿" size={46} />
            </Bar>
          ) : null}
          <YearLabel x={x} text={data.year} active={p} />
        </React.Fragment>
      ))}
      {bars.map(({i, x, target, b}) => (
        <DustBurst
          key={`d${i}`}
          frame={frame}
          start={b.land * FPS}
          x={x}
          y={valueToY(target)}
          seed={`s3bar${i}`}
          spreadX={BAR_WIDTH}
        />
      ))}
      {gapIn > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: gapIn}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <g stroke={COLORS.bright} strokeWidth={2} opacity={0.6 + 0.4 * pulse}>
              <line x1={x3 + 98} x2={x3 + 98} y1={LAYOUT.lineY + 4} y2={top3 - 4} strokeDasharray="5 6" />
              <line x1={x3 + 88} x2={x3 + 108} y1={LAYOUT.lineY + 4} y2={LAYOUT.lineY + 4} />
              <line x1={x3 + 88} x2={x3 + 108} y1={top3 - 4} y2={top3 - 4} />
            </g>
          </svg>
          <div
            style={{
              position: 'absolute',
              left: x3 + 124,
              top: (LAYOUT.lineY + top3) / 2 - 26,
              filter: `drop-shadow(0 0 12px ${COLORS.bright}66)`,
            }}
          >
            <Num value={GAP_TO_CAP_2024} progress={gapRoll} unit="亿" size={48} color={COLORS.bright} />
          </div>
          {/* 柱顶与线之间的空隙微微发亮 */}
          <div
            style={{
              position: 'absolute',
              left: x3 - BAR_WIDTH / 2,
              width: BAR_WIDTH,
              top: LAYOUT.lineY,
              height: top3 - LAYOUT.lineY,
              background: `linear-gradient(0deg, ${COLORS.bright}33, ${COLORS.bright}00)`,
              opacity: 0.4 + 0.6 * pulse,
            }}
          />
        </div>
      ) : null}
    </SceneShell>
  );
};
