import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {BREAKDOWN, FPS, SCENES} from '../data';
import {Num} from '../components/Elements';
import {Motes} from '../components/Motes';
import {SceneShell} from '../components/SceneShell';
import {clamp01, COLORS, FONTS, tween} from '../theme';

/** 第五场 拆开这235亿：节拍（本场秒数） */
export const S5 = {
  explodeAt: 1.0,
  ringFrom: 1.7,
  ringTo: 2.8,
  /** 各段依次点亮（与 BREAKDOWN.segments 顺序一致，最后一个是「其他」） */
  lightAt: [3.3, 11.8, 12.8, 13.8, 16.0, 17.0, 18.0, 19.0],
  shareAt: 4.4,
  halfAt: 8.1,
  passFrom: 20.4,
  passTo: 22.6,
  buildFrom: 21.4,
  buildTo: 24.6,
  storeLabelAt: 24.0,
  storeRollFrom: 24.8,
};

export const RING = {cx: 960, cy: 455, rOut: 245, rIn: 172};

/** 圆环各段（含自动算出的「其他」） */
export const ringSegments = () => {
  const total = parseFloat(BREAKDOWN.total);
  const known = BREAKDOWN.segments.reduce((a, s) => a + parseFloat(s.value), 0);
  const other = Math.round((total - known) * 100) / 100;
  const list = [
    ...BREAKDOWN.segments.map((s) => ({name: s.name, value: s.value, v: parseFloat(s.value), other: false})),
    {name: BREAKDOWN.otherName, value: other.toFixed(2), v: other, other: true},
  ];
  let a = -90;
  return list.map((s) => {
    const sweep = (s.v / total) * 360;
    const seg = {...s, a0: a, a1: a + sweep, mid: a + sweep / 2};
    a += sweep;
    return seg;
  });
};
const SEGS = ringSegments();

const rad = (d: number) => (d * Math.PI) / 180;
const polar = (r: number, deg: number, cx = RING.cx, cy = RING.cy) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

export const arcPath = (rIn: number, rOut: number, a0: number, a1: number, cx = RING.cx, cy = RING.cy) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(rOut, a0, cx, cy);
  const [x1, y1] = polar(rOut, a1, cx, cy);
  const [x2, y2] = polar(rIn, a1, cx, cy);
  const [x3, y3] = polar(rIn, a0, cx, cy);
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3} Z`;
};

/** 左侧标签的纵向位置：按角度自然落点，再上下推开避免重叠 */
const leftLabelYs = () => {
  const items = SEGS.slice(1).map((s, k) => ({k: k + 1, y: polar(RING.rOut + 40, s.mid)[1]}));
  items.sort((a, b) => a.y - b.y);
  const gap = 66;
  for (let i = 1; i < items.length; i++) {
    items[i].y = Math.max(items[i].y, items[i - 1].y + gap);
  }
  const overflow = items[items.length - 1].y - 790;
  if (overflow > 0) {
    items.forEach((it) => (it.y -= overflow));
  }
  const out: Record<number, number> = {};
  items.forEach((it) => (out[it.k] = it.y));
  return out;
};
const LEFT_Y = leftLabelYs();

/* ---------------- 线框楼体：一个极简的 3D 投影 ---------------- */

type V3 = [number, number, number];
const boxEdges = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): [V3, V3][] => {
  const c: V3[] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
  ];
  const idx = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return idx.map(([a, b]) => [c[a], c[b]]);
};
const floorLines = (x0: number, x1: number, z0: number, z1: number, ys: number[]): [V3, V3][] =>
  ys.flatMap((y) => [
    [[x0, y, z0], [x1, y, z0]] as [V3, V3],
    [[x1, y, z0], [x1, y, z1]] as [V3, V3],
    [[x0, y, z0], [x0, y, z1]] as [V3, V3],
  ]);
const mullions = (x0: number, x1: number, y0: number, y1: number, z: number, n: number): [V3, V3][] =>
  Array.from({length: n - 1}, (_, i) => {
    const x = x0 + ((x1 - x0) * (i + 1)) / n;
    return [[x, y0, z], [x, y1, z]] as [V3, V3];
  });

const BUILDING: {edges: [V3, V3][]; weight: number}[] = [
  // 裙楼
  {edges: boxEdges(-4.2, 4.2, 0, 3, -2.4, 2.4), weight: 1},
  {edges: floorLines(-4.2, 4.2, -2.4, 2.4, [1, 2]), weight: 0.55},
  {edges: mullions(-4.2, 4.2, 0, 3, -2.4, 12), weight: 0.3},
  // 入口雨棚
  {edges: boxEdges(-1.4, 1.4, 0.9, 1.05, -3.1, -2.4), weight: 0.8},
  // 塔楼
  {edges: boxEdges(-2.3, 2.3, 3, 5.6, -1.5, 1.5), weight: 1},
  {edges: floorLines(-2.3, 2.3, -1.5, 1.5, [3.65, 4.3, 4.95]), weight: 0.5},
  {edges: mullions(-2.3, 2.3, 3, 5.6, -1.5, 8), weight: 0.28},
  // 楼顶招牌
  {edges: boxEdges(-1.5, 1.5, 5.6, 6.35, -1.5, -1.38), weight: 0.9},
];

const project = (p: V3, yaw: number, pitch: number, dist: number, scale: number, ox: number, oy: number) => {
  const [x, y, z] = p;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const y0 = y - 3;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y1 = y0 * cp - z1 * sp;
  const z2 = y0 * sp + z1 * cp;
  const k = dist / (dist + z2);
  return [ox + x1 * k * scale, oy - y1 * k * scale];
};

const BUILD_OY = 560;

const Building: React.FC<{frame: number; progress: number; opacity: number; scale: number}> = ({
  frame,
  progress,
  opacity,
  scale,
}) => {
  const yaw = rad(-28 + frame * 0.035);
  const pitch = rad(-14);
  const lines: React.ReactNode[] = [];
  let n = 0;
  BUILDING.forEach((group, gi) => {
    group.edges.forEach(([a, b], ei) => {
      // 从下往上「浮现」：越高的边越晚画出
      const h = (a[1] + b[1]) / 2 / 6.4;
      const local = interpolate(progress, [h * 0.6, h * 0.6 + 0.4], [0, 1], clamp01);
      if (local <= 0) {
        return;
      }
      const [x0, y0] = project(a, yaw, pitch, 22, 70 * scale, 960, BUILD_OY);
      const [x1, y1] = project(b, yaw, pitch, 22, 70 * scale, 960, BUILD_OY);
      lines.push(
        <line
          key={`${gi}-${ei}-${n++}`}
          x1={x0}
          y1={y0}
          x2={x0 + (x1 - x0) * local}
          y2={y0 + (y1 - y0) * local}
          stroke={COLORS.gold}
          strokeWidth={group.weight > 0.7 ? 2.4 : 1.4}
          opacity={group.weight}
        />,
      );
    });
  });
  // 地面网格
  const grid: React.ReactNode[] = [];
  const gk = interpolate(progress, [0, 0.3], [0, 1], clamp01);
  for (let i = -7; i <= 7; i++) {
    const g1 = project([i, 0, -7], yaw, pitch, 22, 70 * scale, 960, BUILD_OY);
    const g2 = project([i, 0, 7], yaw, pitch, 22, 70 * scale, 960, BUILD_OY);
    const g3 = project([-7, 0, i], yaw, pitch, 22, 70 * scale, 960, BUILD_OY);
    const g4 = project([7, 0, i], yaw, pitch, 22, 70 * scale, 960, BUILD_OY);
    const fade = 0.22 * (1 - Math.abs(i) / 8);
    grid.push(<line key={`ga${i}`} x1={g1[0]} y1={g1[1]} x2={g2[0]} y2={g2[1]} stroke={COLORS.gold} strokeWidth={1} opacity={fade * gk} />);
    grid.push(<line key={`gb${i}`} x1={g3[0]} y1={g3[1]} x2={g4[0]} y2={g4[1]} stroke={COLORS.gold} strokeWidth={1} opacity={fade * gk} />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <radialGradient id="groundFade" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.4" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id="groundMask">
          <rect x={0} y={0} width={1920} height={1080} fill="url(#groundFade)" />
        </mask>
      </defs>
      <g mask="url(#groundMask)">{grid}</g>
      <g style={{filter: `drop-shadow(0 0 6px ${COLORS.gold}99)`}}>{lines}</g>
    </svg>
  );
};

/* ---------------- 本场 ---------------- */

export const Scene5Ring: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[4];
  const f = frame / FPS;

  // 开场：235.31亿 → 炸开
  const numScale = f < S5.explodeAt ? tween(frame, [0, S5.explodeAt], [0.94, 1.06]) : tween(frame, [S5.explodeAt, S5.explodeAt + 0.3], [1.06, 1.7]);
  const numOp = tween(frame, [S5.explodeAt, S5.explodeAt + 0.25], [1, 0]);

  // 穿过圆环
  const pass = tween(frame, [S5.passFrom, S5.passTo], [0, 1], Easing.in(Easing.cubic));
  const ringScale = 1 + pass * 8;
  const ringOp = interpolate(pass, [0, 0.35, 0.8], [1, 1, 0], clamp01);
  const labelsOp = tween(frame, [S5.passFrom - 0.4, S5.passFrom + 0.2], [1, 0]);

  const sweep = tween(frame, [S5.ringFrom, S5.ringTo], [0, 1], Easing.inOut(Easing.cubic));
  const halfPulse = f >= S5.halfAt && f < S5.lightAt[1] ? 0.5 + 0.5 * Math.sin((frame - S5.halfAt * FPS) * 0.2) : 0;

  const segs = SEGS.map((s, i) => {
    const lit = tween(frame, [S5.lightAt[i], S5.lightAt[i] + 0.35], [0, 1], Easing.out(Easing.cubic));
    const roll = tween(frame, [S5.lightAt[i], S5.lightAt[i] + 1.1], [0, 1], Easing.out(Easing.cubic));
    const flash = interpolate(frame - S5.lightAt[i] * FPS, [0, 4, 20], [0, 1, 0], clamp01);
    return {...s, i, lit, roll, flash};
  });

  const superSeg = segs[0];
  // 超市一段始终最亮
  const superColor = COLORS.bright;
  const superOp = superSeg.lit;

  const shareIn = tween(frame, [S5.shareAt, S5.shareAt + 0.4], [0, 1]) * tween(frame, [S5.halfAt - 0.3, S5.halfAt + 0.1], [1, 0]);
  const shareRoll = tween(frame, [S5.shareAt, S5.shareAt + 1.2], [0, 1], Easing.out(Easing.cubic));
  const totalIn = tween(frame, [S5.halfAt, S5.halfAt + 0.5], [0, 1]);

  const build = tween(frame, [S5.buildFrom, S5.buildTo], [0, 1], Easing.inOut(Easing.cubic));
  const buildScale = tween(frame, [S5.buildFrom, S5.buildTo + 4], [0.78, 1.04], Easing.out(Easing.cubic));
  const storeIn = tween(frame, [S5.storeLabelAt, S5.storeLabelAt + 0.6], [0, 1], Easing.out(Easing.cubic));
  const storeRoll = tween(frame, [S5.storeRollFrom, S5.storeRollFrom + 1.5], [0, 1], Easing.out(Easing.cubic));

  // 炸开的金色粒子飞向圆环
  const particles = [];
  const pt = frame - S5.explodeAt * FPS;
  if (pt >= 0 && pt < 60) {
    for (let i = 0; i < 260; i++) {
      const r = (k: string) => random(`s5p-${i}-${k}`);
      const ang = r('a') * 360;
      const rr = RING.rIn + (RING.rOut - RING.rIn) * r('r');
      const [tx, ty] = polar(rr, ang);
      const k = Easing.out(Easing.back(1.6))(Math.min(1, pt / (24 + r('d') * 14)));
      const sx0 = RING.cx + (r('sx') - 0.5) * 220;
      const sy0 = RING.cy + (r('sy') - 0.5) * 70;
      const x = sx0 + (tx - sx0) * k;
      const y = sy0 + (ty - sy0) * k;
      const op = interpolate(pt, [0, 6, 34, 58], [0, 1, 0.9, 0], clamp01);
      particles.push(<circle key={i} cx={x} cy={y} r={1.2 + r('s') * 2.6} fill={r('c') > 0.6 ? COLORS.bright : COLORS.gold} opacity={op} />);
    }
  }

  return (
    <SceneShell scene={scene}>
      <Motes frame={frame + 2100} seed="s5" opacity={1 - pass} />

      {/* 圆环 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${ringScale})`,
          transformOrigin: `${RING.cx}px ${RING.cy}px`,
          opacity: ringOp,
        }}
      >
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <defs>
            <clipPath id="s5sweep">
              <path
                d={
                  sweep >= 1
                    ? `M 0 0 H 1920 V 1080 H 0 Z`
                    : sweep > 0
                      ? arcPath(0, 2000, -90, -90 + sweep * 359.9)
                      : 'M 0 0 Z'
                }
              />
            </clipPath>
          </defs>
          <g clipPath="url(#s5sweep)">
            {segs.map((s) => {
              const isSuper = s.i === 0;
              const baseColor = s.other ? COLORS.gray : isSuper ? superColor : COLORS.gold;
              const fillOp = s.other ? s.lit * 0.85 : isSuper ? superOp : s.lit * (0.42 + 0.3 * s.flash);
              const pad = 0.5;
              return (
                <g key={s.i}>
                  <path
                    d={arcPath(RING.rIn, RING.rOut, s.a0 + pad, s.a1 - pad)}
                    fill="none"
                    stroke={s.other ? COLORS.gray : COLORS.gold}
                    strokeWidth={1.2}
                    opacity={0.35 + (s.i > 0 && !s.other ? halfPulse * 0.45 : 0)}
                  />
                  <path
                    d={arcPath(RING.rIn, RING.rOut + s.flash * 10, s.a0 + pad, s.a1 - pad)}
                    fill={baseColor}
                    opacity={fillOp}
                    style={isSuper && superSeg.lit > 0 ? {filter: `drop-shadow(0 0 22px ${COLORS.bright}88)`} : undefined}
                  />
                </g>
              );
            })}
          </g>
          {particles}
        </svg>

        {/* 圆心 */}
        <div
          style={{
            position: 'absolute',
            left: RING.cx - 160,
            width: 320,
            top: RING.cy - 60,
            textAlign: 'center',
            opacity: shareIn,
          }}
        >
          <Num value={BREAKDOWN.supermarketShare} progress={shareRoll} unit="%" size={84} color={COLORS.bright} />
          <div style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 24, color: COLORS.text, opacity: 0.7, marginTop: 6}}>
            超市占比
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: RING.cx - 160,
            width: 320,
            top: RING.cy - 46,
            textAlign: 'center',
            opacity: totalIn * labelsOp,
          }}
        >
          <Num value={BREAKDOWN.total} unit="亿" size={62} color={COLORS.gold} />
          <div style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 22, color: COLORS.text, opacity: 0.6, marginTop: 6}}>
            全年
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div style={{position: 'absolute', inset: 0, opacity: labelsOp}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {segs.map((s) => {
            if (s.lit <= 0) {
              return null;
            }
            const [ax, ay] = polar(RING.rOut + 8, s.mid);
            if (s.i === 0) {
              const [bx, by] = polar(RING.rOut + 40, s.mid);
              return (
                <polyline
                  key={s.i}
                  points={`${ax},${ay} ${bx},${by} ${bx + 46},${by}`}
                  fill="none"
                  stroke={COLORS.bright}
                  strokeWidth={1.4}
                  opacity={s.lit}
                />
              );
            }
            const [bx, by] = polar(RING.rOut + 30, s.mid);
            const ly = LEFT_Y[s.i];
            const ex = RING.cx - RING.rOut - 92;
            return (
              <polyline
                key={s.i}
                points={`${ax},${ay} ${bx},${by} ${ex + 30},${ly} ${ex},${ly}`}
                fill="none"
                stroke={s.other ? COLORS.gray : COLORS.gold}
                strokeWidth={1.2}
                opacity={s.lit * 0.8}
              />
            );
          })}
        </svg>
        {segs.map((s) => {
          if (s.lit <= 0) {
            return null;
          }
          if (s.i === 0) {
            const [bx, by] = polar(RING.rOut + 40, s.mid);
            return (
              <div
                key={s.i}
                style={{
                  position: 'absolute',
                  left: bx + 58,
                  top: by - 40,
                  opacity: s.lit,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 14,
                  filter: `drop-shadow(0 0 14px ${COLORS.bright}55)`,
                }}
              >
                <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 36, color: COLORS.text}}>{s.name}</span>
                <Num value={s.value} progress={s.roll} unit="亿" size={64} color={COLORS.bright} />
              </div>
            );
          }
          const ly = LEFT_Y[s.i];
          const ex = RING.cx - RING.rOut - 92;
          return (
            <div
              key={s.i}
              style={{
                position: 'absolute',
                left: ex - 420,
                width: 408,
                top: ly - 24,
                opacity: s.lit,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'baseline',
                gap: 12,
                transform: `translateX(${(1 - s.lit) * 14}px)`,
              }}
            >
              {s.other ? (
                <>
                  <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 20, color: COLORS.gray}}>
                    {BREAKDOWN.otherNote}
                  </span>
                  <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 28, color: COLORS.gray}}>{s.name}</span>
                </>
              ) : (
                <>
                  <span style={{fontFamily: FONTS.sans, fontWeight: 500, fontSize: 28, color: COLORS.text, opacity: 0.85}}>
                    {s.name}
                  </span>
                  <Num value={s.value} progress={s.roll} unit="亿" size={42} color={COLORS.gold} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 「235.31亿」炸开 */}
      {numOp > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: RING.cy - 70,
            textAlign: 'center',
            opacity: numOp,
            transform: `scale(${numScale})`,
            transformOrigin: `960px 70px`,
            filter: `drop-shadow(0 0 24px ${COLORS.bright}88)`,
          }}
        >
          <Num value={BREAKDOWN.total} unit="亿" size={128} color={COLORS.bright} />
        </div>
      ) : null}
      {pt >= 0 && pt < 14 ? (
        <div
          style={{
            position: 'absolute',
            left: RING.cx - 320,
            top: RING.cy - 320,
            width: 640,
            height: 640,
            borderRadius: '50%',
            background: `radial-gradient(circle, #FFF6DDCC 0%, ${COLORS.bright}55 25%, ${COLORS.bright}00 65%)`,
            opacity: interpolate(pt, [0, 14], [1, 0], clamp01),
          }}
        />
      ) : null}

      {/* 穿过圆环后浮现的楼体 */}
      {build > 0 ? <Building frame={frame} progress={build} opacity={tween(frame, [S5.buildFrom, S5.buildFrom + 0.6], [0, 1])} scale={buildScale} /> : null}
      {storeIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 128,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            opacity: storeIn,
            transform: `translateY(${(1 - storeIn) * 12}px)`,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.title,
              fontWeight: 700,
              fontSize: 46,
              letterSpacing: '0.18em',
              color: COLORS.gold,
              filter: `drop-shadow(0 0 14px ${COLORS.gold}66)`,
            }}
          >
            {BREAKDOWN.store.name}
          </span>
          {f >= S5.storeRollFrom ? (
            <Num
              value={BREAKDOWN.store.sales}
              progress={storeRoll}
              prefix={BREAKDOWN.store.prefix}
              unit={BREAKDOWN.store.unit}
              size={60}
              color={COLORS.bright}
            />
          ) : null}
        </div>
      ) : null}
    </SceneShell>
  );
};
