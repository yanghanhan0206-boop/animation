import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {ACCELERATING, ANNUAL_SALES, FPS, SCENES} from '../data';
import {Bar, Baseline, GoldLine, Num} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {clamp01, COLORS, FONTS, LAYOUT, tween, valueToY} from '../theme';

/** 第七场 还在加速：节拍（本场秒数） */
export const S7 = {
  lineFrom: 0.2,
  lineTo: 1.4,
  riseFrom: 1.0,
  riseTo: 2.3,
  yoyAt: 4.3,
  studyAt: 8.0,
  listIn: 3.6,
  scrollFrom: 4.3,
  /** 排行榜停住（重拍） */
  stopAt: 11.8,
};

const CHART = {x1: 120, x2: 1170};
const XS = [250, 445, 640, 835, 1035];
const W = 118;
const LIST = {x: 1316, w: 500, top: 150, rowH: 66, viewTop: 226, viewH: 528};

const Ranking: React.FC<{frame: number}> = ({frame}) => {
  const {rank, rows, name, title} = ACCELERATING.ranking;
  const inK = tween(frame, [S7.listIn, S7.listIn + 0.6], [0, 1], Easing.out(Easing.cubic));
  // 从榜单靠后的位置一路滚上来，减速停在目标名次
  const pos = tween(frame, [S7.scrollFrom, S7.stopAt], [rows, rank], Easing.bezier(0.5, 0, 0.12, 1));
  const stopped = frame >= S7.stopAt * FPS;
  const hl = stopped ? interpolate(frame - S7.stopAt * FPS, [0, 6], [0, 1], clamp01) : 0;
  const centerY = LIST.viewTop + LIST.viewH / 2;
  const items = [];
  for (let n = 1; n <= rows; n++) {
    const y = centerY + (n - pos) * LIST.rowH;
    if (y < LIST.viewTop - LIST.rowH || y > LIST.viewTop + LIST.viewH + LIST.rowH) {
      continue;
    }
    const edge = Math.min(y - LIST.viewTop, LIST.viewTop + LIST.viewH - y);
    const op = interpolate(edge, [0, 90], [0, 1], clamp01);
    const isTarget = n === rank;
    const w = 110 + random(`rank-w-${n}`) * 150;
    items.push(
      <div
        key={n}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: y - LIST.rowH / 2,
          height: LIST.rowH,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          paddingLeft: 26,
          opacity: op,
          borderBottom: `1px solid ${COLORS.gray}44`,
        }}
      >
        <span
          style={{
            width: 54,
            textAlign: 'right',
            fontFamily: FONTS.num,
            fontWeight: 500,
            fontSize: isTarget ? 40 + hl * 8 : 32,
            color: isTarget ? (hl > 0 ? COLORS.bright : COLORS.gold) : COLORS.gray,
          }}
        >
          {n}
        </span>
        {isTarget ? (
          <span
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 500,
              fontSize: 34 + hl * 4,
              letterSpacing: '0.1em',
              color: hl > 0 ? COLORS.bright : COLORS.gold,
              filter: hl > 0 ? `drop-shadow(0 0 ${12 * hl}px ${COLORS.bright}AA)` : undefined,
            }}
          >
            {name}
          </span>
        ) : (
          <span style={{width: w, height: 14, borderRadius: 7, background: COLORS.gray, opacity: 0.35}} />
        )}
      </div>,
    );
  }
  return (
    <div style={{position: 'absolute', left: LIST.x, top: 0, width: LIST.w, height: 1080, opacity: inK}}>
      <div
        style={{
          position: 'absolute',
          top: LIST.top,
          left: 26,
          fontFamily: FONTS.title,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: '0.14em',
          color: COLORS.text,
        }}
      >
        {title}
      </div>
      <div style={{position: 'absolute', top: LIST.top + 54, left: 26, width: 60, height: 2, background: COLORS.gold}} />
      {/* 高亮框 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: centerY - LIST.rowH / 2,
          height: LIST.rowH,
          border: `1px solid ${COLORS.gold}${hl > 0 ? 'FF' : '55'}`,
          background: `${COLORS.gold}${hl > 0 ? '22' : '0A'}`,
          boxShadow: hl > 0 ? `0 0 ${30 * hl}px ${COLORS.bright}55` : undefined,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}}>{items}</div>
    </div>
  );
};

export const Scene7Accel: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[6];
  const f = frame / FPS;

  const line = tween(frame, [S7.lineFrom, S7.lineTo], [0, 1], Easing.inOut(Easing.cubic));
  const lineLabel = tween(frame, [S7.lineTo - 0.2, S7.lineTo + 0.4], [0, 1]);
  const ghosts = tween(frame, [0, 0.8], [0, 1]);
  const target = parseFloat(ACCELERATING.value);
  const p = tween(frame, [S7.riseFrom, S7.riseTo], [0, 1], Easing.out(Easing.cubic));
  const top5 = valueToY(target);
  const x5 = XS[4];

  // 仍在往上冒：柱顶上方一截虚影不断向上涌，配上升腾的金粉
  const surge = f > S7.riseTo ? (frame - S7.riseTo * FPS) % 36 : -1;
  const surgeK = surge >= 0 ? surge / 36 : 0;
  const risers = [];
  if (f > S7.riseTo - 0.2) {
    for (let i = 0; i < 26; i++) {
      const r = (k: string) => random(`s7r-${i}-${k}`);
      const period = 34 + r('p') * 30;
      const age = (frame + r('o') * period) % period;
      const x = x5 + (r('x') - 0.5) * W;
      const y = top5 - age * (1.4 + r('v') * 1.6);
      risers.push(
        <circle key={i} cx={x} cy={y} r={1.2 + r('s') * 2.2} fill={r('c') > 0.5 ? COLORS.bright : COLORS.gold} opacity={(1 - age / period) * 0.9} />,
      );
    }
  }

  const yoyIn = tween(frame, [S7.yoyAt, S7.yoyAt + 0.5], [0, 1], Easing.out(Easing.cubic));
  const yoyRoll = tween(frame, [S7.yoyAt, S7.yoyAt + 1.2], [0, 1], Easing.out(Easing.cubic));
  const studyIn = tween(frame, [S7.studyAt, S7.studyAt + 0.5], [0, 1], Easing.out(Easing.cubic));
  const studyRoll = tween(frame, [S7.studyAt, S7.studyAt + 1.4], [0, 1], Easing.out(Easing.cubic));

  return (
    <SceneShell scene={scene}>
      <Motes frame={frame + 3800} seed="s7" />
      <Baseline x1={CHART.x1 + 40} x2={CHART.x2} opacity={ghosts} />
      <GoldLine progress={line} label={lineLabel} x1={CHART.x1} x2={CHART.x2} />

      {/* 前四年的柱子退成灰色背景 */}
      {ANNUAL_SALES.map((d, i) => (
        <React.Fragment key={d.year}>
          <Bar x={XS[i]} width={W} value={parseFloat(d.value)} color={COLORS.gray} opacity={ghosts * 0.75} />
          <div
            style={{
              position: 'absolute',
              left: XS[i] - 80,
              width: 160,
              top: LAYOUT.baseY + 16,
              textAlign: 'center',
              fontFamily: FONTS.num,
              fontWeight: 500,
              fontSize: 28,
              color: COLORS.gray,
              opacity: ghosts,
            }}
          >
            {d.year}
          </div>
        </React.Fragment>
      ))}

      {/* 第五根柱子 */}
      {surge >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: x5 - W / 2,
            width: W,
            top: top5 - 70 - surgeK * 40,
            height: 70,
            background: `linear-gradient(0deg, ${COLORS.gold}55, ${COLORS.gold}00)`,
            opacity: 1 - surgeK,
            borderLeft: `1px dashed ${COLORS.gold}66`,
            borderRight: `1px dashed ${COLORS.gold}66`,
          }}
        />
      ) : null}
      {p > 0 ? (
        <Bar x={x5} width={W} value={target * p} hot={f > S7.riseTo ? 0.35 + 0.25 * Math.sin(frame * 0.25) : 0} fill={1.5}>
          <Num value={ACCELERATING.value} progress={p} prefix={ACCELERATING.prefix} unit="亿" size={40} color={COLORS.gold} />
        </Bar>
      ) : null}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g style={{filter: `drop-shadow(0 0 4px ${COLORS.bright})`}}>{risers}</g>
        {surge >= 0
          ? [0, 1].map((k) => {
              const kk = ((surge + k * 18) % 36) / 36;
              const y = top5 - 30 - kk * 90;
              return (
                <polyline
                  key={k}
                  points={`${x5 - 16},${y + 10} ${x5},${y} ${x5 + 16},${y + 10}`}
                  fill="none"
                  stroke={COLORS.bright}
                  strokeWidth={2.4}
                  opacity={Math.sin(kk * Math.PI) * 0.9}
                />
              );
            })
          : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x5 - 100,
          width: 200,
          top: LAYOUT.baseY + 12,
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontWeight: 500,
          fontSize: 24,
          lineHeight: 1.3,
          color: COLORS.gold,
          opacity: tween(frame, [S7.riseFrom, S7.riseFrom + 0.5], [0, 1]),
        }}
      >
        {ACCELERATING.barLabel}
      </div>

      {/* 同比 */}
      {yoyIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: x5 + W / 2 + 20,
            top: top5 + 10,
            opacity: yoyIn,
            transform: `translateY(${(1 - yoyIn) * 14}px)`,
          }}
        >
          <div style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 22, color: COLORS.text, opacity: 0.7}}>同比</div>
          <Num value={ACCELERATING.yoy} progress={yoyRoll} sign="+" unit="%" size={50} color={COLORS.gold} />
        </div>
      ) : null}

      {/* 研学人次 */}
      {studyIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: CHART.x1 + 40,
            top: 150,
            opacity: studyIn,
            transform: `translateY(${(1 - studyIn) * 14}px)`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
          }}
        >
          <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 26, color: COLORS.text, opacity: 0.75}}>
            {ACCELERATING.studyTours.label}
          </span>
          <Num
            value={ACCELERATING.studyTours.value}
            progress={studyRoll}
            prefix={ACCELERATING.studyTours.prefix}
            unit={ACCELERATING.studyTours.unit}
            size={64}
            color={COLORS.gold}
          />
        </div>
      ) : null}

      <Ranking frame={frame} />
    </SceneShell>
  );
};
