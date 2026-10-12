/**
 * 小球内部（镜头8、9、10 共用）：推进到球里之后的圆形视野、二十多条细线、警报波纹、
 * 四个词、漩涡、神经网络。
 * 细线的状态全部按「完整版绝对时间 gt」计算，三个镜头接缝处天然连续。
 */
import {noise2D} from '@remotion/noise';
import React from 'react';
import {COLORS} from '../config/theme';
import {LABELS, at} from '../config/timeline';
import {EASE, clamp, keys, lerp, tween, type Point} from '../lib/anim';
import {GoldText} from './Elements';
import {GoldBall} from './GoldBall';

/** 球内视野：圆心与半径 */
export const MIND = {cx: 960, cy: 455, R: 340};
const C = {x: MIND.cx, y: MIND.cy};

const N = 24;

/* ------------------------------ 时间点 ------------------------------ */

/** 全部是完整版绝对秒，由镜头起点推出来，改镜头时间时会跟着走 */
export const MIND_TIME = {
  /** 镜头8：箭头分裂成细线 */
  split: at(8, 6.8),
  /** 镜头9：细线聚成一束开始绕圈 */
  gather: [at(9, 0.4), at(9, 3.2)] as const,
  spinStart: at(9, 0.4),
  /** 镜头10：漩涡减速、细线变成神经网络、逐点点亮、镜头拉出球外 */
  decel: [at(10, 0), at(10, 3.4)] as const,
  morph: [at(10, 2.4), at(10, 5.0)] as const,
  light: at(10, 4.9),
  pull: [at(10, 7.0), at(10, 8.6)] as const,
};

/** 角速度（弧度/秒）：镜头9 越转越快，镜头10 减速停下 */
const omega = (gt: number) => {
  const T = MIND_TIME;
  if (gt < T.spinStart) {
    return 0;
  }
  if (gt < T.decel[0]) {
    const k = (gt - T.spinStart) / (T.decel[0] - T.spinStart);
    return 0.5 + 8.5 * k * k;
  }
  if (gt < T.decel[1]) {
    return 9 * (1 - EASE((gt - T.decel[0]) / (T.decel[1] - T.decel[0])));
  }
  return 0;
};

/** 扇面中心的方向：从「考研」之前一点开始，顺时针扫过 考研 → 工作 → 出国 → 保研 */
const PHI0 = -Math.PI / 2 - 0.9;
const phi = (gt: number) => {
  const dt = 1 / 120;
  let p = PHI0;
  for (let s = MIND_TIME.spinStart; s < gt; s += dt) {
    p += omega(Math.min(s + dt / 2, gt)) * Math.min(dt, gt - s);
  }
  return p;
};

const chaosAngle = (i: number, gt: number) =>
  (2 * Math.PI * i) / N + 0.45 * noise2D(`ma${i}`, gt * 0.7, 0) + 0.18 * noise2D(`mb${i}`, gt * 3.1, 1);
const chaosLen = (i: number, gt: number) => 150 + 120 * (0.5 + 0.5 * noise2D(`ml${i}`, gt * 0.8, 2));
/** 分裂时每条线以「向右」为起点，往最近的方向展开 */
const splitWrap = (i: number) => 2 * Math.PI * Math.round(chaosAngle(i, MIND_TIME.split) / (2 * Math.PI));
const fanOff = (i: number) => (i / (N - 1) - 0.5) * 1.5;
const fanWrap = (i: number) => {
  const a = chaosAngle(i, MIND_TIME.gather[0]) - splitWrap(i);
  return 2 * Math.PI * Math.round((a - (PHI0 + fanOff(i))) / (2 * Math.PI));
};

/* ---------------------------- 神经网络 ---------------------------- */

const LAYER_X = [-180, -60, 60, 180];
const LAYER_Y = [[-120, 0, 120], [-180, -60, 60, 180], [-180, -60, 60, 180], [-120, 0, 120]];
export const NODES: Point[][] = LAYER_X.map((x, l) => LAYER_Y[l].map((y) => ({x: C.x + x, y: C.y + y})));
const EDGES: {a: Point; b: Point; la: number; lb: number}[] = [];
NODES.forEach((layer, l) => {
  if (l === NODES.length - 1) {
    return;
  }
  layer.forEach((a, ia) =>
    NODES[l + 1].forEach((b, ib) => EDGES.push({a, b, la: nodeIndex(l, ia), lb: nodeIndex(l + 1, ib)})),
  );
});
function nodeIndex(layer: number, i: number) {
  let k = 0;
  for (let l = 0; l < layer; l++) {
    k += LAYER_Y[l].length;
  }
  return k + i;
}
/** 24 条细线各自变成哪条边 */
const LINE_EDGE = Array.from({length: N}, (_, i) => Math.round((i * (EDGES.length - 1)) / (N - 1)));
const NODE_COUNT = LAYER_Y.reduce((s, l) => s + l.length, 0);
/** 第 k 个节点点亮的时刻 */
const nodeLitAt = (k: number) => MIND_TIME.light + 0.2 * k;

/* ------------------------------ 渲染 ------------------------------ */

const polyline = (pts: Point[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** 球的样子：inside=0 是实心金球，inside=1 是「在球里面」看到的圆形视野 */
export const BallZoom: React.FC<{x: number; y: number; r: number; inside: number; rimFlash?: number}> = ({
  x,
  y,
  r,
  inside,
  rimFlash = 0,
}) => (
  <g>
    {inside < 1 && (
      <g opacity={1 - inside}>
        <GoldBall x={x} y={y} r={r} glow={1 - inside * 0.6} />
      </g>
    )}
    {inside > 0 && (
      <g opacity={inside}>
        <circle cx={x} cy={y} r={r * 1.18} fill="url(#ball-halo)" />
        <circle cx={x} cy={y} r={r} fill="url(#mind-fill)" />
        <circle
          cx={x}
          cy={y}
          r={r}
          fill="none"
          stroke={COLORS.gold1}
          strokeWidth={2}
          opacity={0.5 + 0.4 * rimFlash}
          filter="url(#glow-soft)"
        />
      </g>
    )}
  </g>
);

/** 警报波纹：从 split 开始每 0.85 秒一圈，到镜头9 开头停止 */
export const Ripples: React.FC<{gt: number; scale?: number}> = ({gt, scale = 1}) => {
  const rings: React.ReactNode[] = [];
  const life = 2.6;
  for (let k = 0; ; k++) {
    const e = MIND_TIME.split + 0.1 + 0.85 * k;
    if (e > at(9, 1.2)) {
      break;
    }
    const age = gt - e;
    if (age < 0 || age > life) {
      continue;
    }
    const u = age / life;
    const r = (30 + 500 * EASE(u)) * scale;
    rings.push(
      <circle
        key={k}
        cx={C.x}
        cy={C.y}
        r={r}
        fill="none"
        stroke={COLORS.gold1}
        strokeWidth={2.2 - 1.2 * u}
        opacity={0.6 * (1 - u) * Math.min(1, age * 6)}
      />,
    );
  }
  return <g filter="url(#glow-soft)">{rings}</g>;
};

/** 最近一圈波纹刚发出时，球壁跟着闪一下 */
export const rimFlashAt = (gt: number) => {
  let f = 0;
  for (let k = 0; ; k++) {
    const e = MIND_TIME.split + 0.1 + 0.85 * k;
    if (e > at(9, 1.2)) {
      break;
    }
    if (gt >= e) {
      f = Math.max(f, Math.exp(-(gt - e) * 4));
    }
  }
  return f;
};

/**
 * 二十多条细线 + 四个词 + 神经网络。
 * scale：镜头10 拉出球外时，整个内部跟着圆一起缩小。
 */
export const MindLines: React.FC<{gt: number; scale?: number; opacity?: number}> = ({gt, scale = 1, opacity = 1}) => {
  const T = MIND_TIME;
  if (gt < T.split || opacity <= 0.001) {
    return null;
  }
  const sigma = tween(gt, T.split, T.split + 1.0);
  const g = tween(gt, T.gather[0], T.gather[1]);
  const m = tween(gt, T.morph[0], T.morph[1]);
  const w = omega(gt);
  const p = phi(gt);
  const twist = -0.075 * w;
  const blur = clamp((w - 1) / 4);
  const S = (pt: Point): Point => ({x: C.x + (pt.x - C.x) * scale, y: C.y + (pt.y - C.y) * scale});

  const lineAt = (i: number, angleOffset: number) => {
    const chaos = chaosAngle(i, gt) - splitWrap(i);
    const a0 = lerp(0, chaos, sigma);
    const target = p + fanOff(i) + fanWrap(i);
    const a = lerp(a0, target, g) + angleOffset;
    const len0 = lerp(160, chaosLen(i, gt), sigma);
    const lenFan = 305 - 42 * Math.abs(fanOff(i)) / 0.75 + 16 * noise2D(`mf${i}`, gt * 0.9, 3);
    const rout = lerp(len0, lenFan, g);
    const rin = lerp(lerp(0, 18, sigma), 26, g);
    const e = EDGES[LINE_EDGE[i]];
    return Array.from({length: 13}, (_, s) => {
      const k = s / 12;
      const rr = rin + (rout - rin) * k;
      const ang = a + twist * k;
      const polar = {x: C.x + rr * Math.cos(ang), y: C.y + rr * Math.sin(ang)};
      const edge = {x: e.a.x + (e.b.x - e.a.x) * k, y: e.a.y + (e.b.y - e.a.y) * k};
      return S({x: lerp(polar.x, edge.x, m), y: lerp(polar.y, edge.y, m)});
    });
  };

  const words = [
    {text: LABELS.vortexOrder[0], ang: -Math.PI / 2},
    {text: LABELS.vortexOrder[1], ang: 0},
    {text: LABELS.vortexOrder[2], ang: Math.PI / 2},
    {text: LABELS.vortexOrder[3], ang: Math.PI},
  ];
  const wordsOn = Math.min(tween(gt, at(9, 0.8), at(9, 2.2)), 1 - tween(gt, at(10, 0.4), at(10, 2.6)));
  const angDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  const litNode = (k: number) => tween(gt, nodeLitAt(k), nodeLitAt(k) + 0.35);
  const networkOn = tween(gt, T.morph[1] - 0.6, T.morph[1] + 0.6);

  return (
    <g opacity={opacity}>
      {/* 镜头10：其余的边 */}
      {networkOn > 0 &&
        EDGES.map((e, j) => {
          if (LINE_EDGE.includes(j)) {
            return null;
          }
          const lit = Math.min(litNode(e.la), litNode(e.lb));
          const a = S(e.a);
          const b = S(e.b);
          return (
            <line
              key={`e${j}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#gold-stroke)"
              strokeWidth={1 + 0.5 * lit}
              opacity={networkOn * (0.28 + 0.5 * lit)}
            />
          );
        })}

      {/* 细线（转快了带两层残影） */}
      <g filter="url(#glow-soft)">
        {Array.from({length: N}, (_, i) => {
          const e = EDGES[LINE_EDGE[i]];
          const lit = m > 0 ? Math.min(litNode(e.la), litNode(e.lb)) : 0;
          return (
            <g key={i}>
              {blur > 0.01 &&
                [1, 2].map((k) => (
                  <path
                    key={k}
                    d={polyline(lineAt(i, -0.035 * w * k))}
                    fill="none"
                    stroke={COLORS.gold0}
                    strokeWidth={1.3}
                    opacity={blur * (k === 1 ? 0.35 : 0.15)}
                  />
                ))}
              <path
                d={polyline(lineAt(i, 0))}
                fill="none"
                stroke={COLORS.gold1}
                strokeWidth={1.5 + 0.4 * lit}
                strokeLinecap="round"
                opacity={0.85 - 0.25 * m + 0.4 * lit}
              />
            </g>
          );
        })}
      </g>

      {/* 节点 */}
      {networkOn > 0 &&
        NODES.flat().map((n, k) => {
          const lit = litNode(k);
          const q = S(n);
          return (
            <g key={`n${k}`} opacity={networkOn}>
              <circle cx={q.x} cy={q.y} r={(4 + 2 * lit) * Math.max(scale, 0.3)} fill={COLORS.bg} stroke={COLORS.gold0} strokeWidth={1.2} />
              {lit > 0 && (
                <circle cx={q.x} cy={q.y} r={(5.5 + 10 * lit) * Math.max(scale, 0.3)} fill="url(#ball-glow)" opacity={lit} />
              )}
              {lit > 0 && <circle cx={q.x} cy={q.y} r={4 * Math.max(scale, 0.3)} fill="#FFF3C8" opacity={lit} />}
            </g>
          );
        })}

      {/* 四个词：扇面扫过时亮一下，但从不停在任何一个词上 */}
      {wordsOn > 0 &&
        words.map((wd) => {
          const glow = Math.exp(-((angDiff(p, wd.ang) / 0.45) ** 2)) * keys(w, [0, 0.5], [0, 1]);
          const pos = S({x: C.x + 248 * Math.cos(wd.ang), y: C.y + 248 * Math.sin(wd.ang)});
          return (
            <g key={wd.text} opacity={wordsOn}>
              {glow > 0.02 && (
                <g filter="url(#glow)" opacity={glow}>
                  <GoldText x={pos.x} y={pos.y} size={40 * scale} spacing="0.12em" fill={COLORS.gold1}>
                    {wd.text}
                  </GoldText>
                </g>
              )}
              <GoldText x={pos.x} y={pos.y} size={40 * scale} spacing="0.12em" opacity={0.45 + 0.55 * glow}>
                {wd.text}
              </GoldText>
            </g>
          );
        })}
    </g>
  );
};

export const NODE_TOTAL = NODE_COUNT;
