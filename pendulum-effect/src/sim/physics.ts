/**
 * 摆锤物理
 * ------------------------------------------------------------------
 * 主摆锤用真实单摆模型：θ(t) = A(t)·sin φ(t)
 *   - 相位 φ 按角频率 ω(A) 连续积分，ω 随摆幅按完全椭圆积分修正（摆幅越大周期越长），
 *     所以到端点自然减速、过中点自然加速；
 *   - 摆幅只通过「平滑推力」或「缓入缓出的伺服」改变，绝不突变；
 *   - 推力在相平面里施加（给速度加一个升余弦形状的冲量），等价于真实的外力推了一把。
 * 牛顿摆阶段改为逐步积分非线性单摆方程 θ'' = -ω0² sin θ - cθ'，球与球之间做弹性碰撞。
 * 所有结果在模块加载时一次性算好（确定性），每一帧只做查表插值。
 */
import {CRADLE, DURATION, FPS, PENDULUM, S1, S2, S3, S6, S7, S8, S9} from '../timeline';
import {TAU, clamp, easeInOutCubic, easeInOutSine, invLerp, lerp, mod, rad, ramp} from '../lib/math';

export const SIM_START = -3; // 提前开始模拟，保证第 0 帧就有完整拖尾
export const SIM_END = DURATION + 1.5;
const SUB = 8; // 每帧 8 个子步
export const DT = 1 / (FPS * SUB);
const N = Math.ceil((SIM_END - SIM_START) / DT) + 2;
const idxOf = (t: number) => (t - SIM_START) / DT;

const W0 = TAU / PENDULUM.period;

/** 真实单摆：T(A) / T0 = 2K(k)/π，k = sin(A/2) 的级数展开 */
export const periodFactor = (A: number) => {
  const k2 = Math.sin(A / 2) ** 2;
  return 1 + k2 / 4 + (9 * k2 * k2) / 64 + (25 * k2 ** 3) / 256 + (1225 * k2 ** 4) / 16384;
};
const omegaOf = (A: number, w0 = W0) => w0 / periodFactor(A);

const sample = (arr: Float64Array, t: number) => {
  const f = clamp(idxOf(t), 0, N - 1.000001);
  const i = Math.floor(f);
  return lerp(arr[i], arr[i + 1], f - i);
};

/* ------------------------------------------------------------------ */
/* 社会的大摆锤（镜头 7）：恒定摆幅，周期约为小摆锤 3 倍                         */
/* ------------------------------------------------------------------ */
const BIG_A = rad(S7.big.amplitude);
const BIG_W = omegaOf(BIG_A, W0 / S7.big.periodRatio);
export const bigPhase = (t: number) => -Math.PI / 2 + BIG_W * (t - S7.big.leftExtremeAt);
export const bigTheta = (t: number) => BIG_A * Math.sin(bigPhase(t));
export const BIG_AMPLITUDE = BIG_A;
/** 大摆锤到达端点的时刻（side: -1 左 / +1 右） */
export const bigExtremes = (() => {
  const out: {t: number; side: -1 | 1}[] = [];
  const half = Math.PI / BIG_W;
  for (let k = -6; k <= 12; k++) {
    const t = S7.big.leftExtremeAt + k * half;
    out.push({t, side: k % 2 === 0 ? -1 : 1});
  }
  return out;
})();

/* ------------------------------------------------------------------ */
/* 主摆锤（镜头 1 ~ 8 前半）                                              */
/* ------------------------------------------------------------------ */
type Trigger = {
  id: string;
  notBefore: number;
  phase: number; // 接触时的相位（mod 2π）
  pushDir: -1 | 1; // 推完后的运动方向
  toAmp: number; // 推完后的摆幅（弧度）
  dur: number;
  lead: number; // 推力在接触前多久开始（center=true 时以接触为中心）
  center: boolean;
  done?: boolean;
};

export type Kick = {
  id: string;
  start: number;
  dur: number;
  contact: number;
  phase: number;
  pushDir: -1 | 1;
  toAmp: number;
  dY: number; // 在推力开始的那一刻按当时的摆幅算出，保证多次推力叠加时每一级摆幅都准确
};
export type Extreme = {t: number; side: -1 | 1; amp: number};

/**
 * 求推力大小：推力持续 dur 秒，期间状态在相平面里以 ω 旋转。
 * 记 z = Y + iX = A·e^{iφ}，推力 ΔY 在 τ 时刻施加、到 dur 时刻会转过 ω(dur-τ)，
 * 于是 z(dur) = z0·e^{iω·dur} + ΔY·G，G = ∫ g(τ)·e^{iω(dur-τ)} dτ（g 为归一化的升余弦）。
 * 令 |z(dur)| = 目标摆幅，解一元二次方程，取与推的方向同号的根。
 */
const solveKick = (A: number, phi: number, w: number, k: Kick) => {
  const T = k.dur;
  let gr = 0;
  let gi = 0;
  const n = 64;
  for (let j = 0; j < n; j++) {
    const tau = ((j + 0.5) / n) * T;
    const g = (1 - Math.cos((TAU * tau) / T)) / n;
    gr += g * Math.cos(w * (T - tau));
    gi += g * Math.sin(w * (T - tau));
  }
  const wr = A * Math.cos(phi + w * T);
  const wi = A * Math.sin(phi + w * T);
  const a = gr * gr + gi * gi;
  const b = wr * gr + wi * gi;
  const c = A * A - k.toAmp * k.toAmp;
  const disc = Math.sqrt(Math.max(b * b - a * c, 0));
  const r1 = (-b + disc) / a;
  const r2 = (-b - disc) / a;
  return Math.sign(r1) === k.pushDir ? r1 : r2;
};

const sync = (t: number) =>
  ramp(t, S7.sync.start, S7.sync.end, easeInOutSine) * (1 - ramp(t, S8.unsync.start, S8.unsync.end, easeInOutSine));

const simulateMain = () => {
  const theta = new Float64Array(N);
  const amp = new Float64Array(N);
  const ampSmooth = new Float64Array(N);
  const extremes: Extreme[] = [];
  const kicks: Kick[] = [];

  const triggers: Trigger[] = [
    {
      id: 's2',
      notBefore: S2.kick.notBefore,
      phase: 0,
      pushDir: 1,
      toAmp: rad(S2.kick.toAmplitude),
      dur: S2.kick.duration,
      lead: 0,
      center: true,
    },
    {
      id: 's3',
      notBefore: S3.kick.notBefore,
      phase: Math.PI,
      pushDir: -1,
      toAmp: rad(S3.kick.toAmplitude),
      dur: S3.kick.duration,
      lead: 0,
      center: true,
    },
    ...S6.hands.map((h, i) => ({
      id: `hand${i}`,
      notBefore: h.at,
      phase: Math.PI - Math.asin(clamp(h.contact, -1, 1)),
      pushDir: -1 as const,
      toAmp: rad(h.toAmplitude),
      dur: S6.pushDuration,
      lead: h.contact >= 0.98 ? 0 : 0.05,
      center: false,
    })),
  ];

  const servos = [
    {start: S7.amplitude.start, end: S7.amplitude.end, to: rad(S7.amplitude.to), from: NaN},
    {start: S8.settle.start, end: S8.settle.end, to: rad(S8.settle.to), from: NaN},
  ];

  let A = rad(PENDULUM.startAmplitude);
  let phi = -Math.PI / 2 - omegaOf(A) * (PENDULUM.leftExtremeAt - SIM_START);
  let As = A;
  let prevC = Math.cos(phi);

  for (let i = 0; i < N; i++) {
    const t = SIM_START + i * DT;
    const s = sync(t);
    const wFree = omegaOf(A);

    // 1) 到点的触发器 → 预测接触时刻并安排一段平滑推力
    for (const tr of triggers) {
      if (tr.done || t < tr.notBefore) continue;
      tr.done = true;
      let d = mod(tr.phase - phi, TAU);
      if (d < 1e-4) d += TAU;
      const tc = t + d / wFree;
      const start = tr.center ? tc - tr.dur / 2 : tc - tr.lead;
      kicks.push({
        id: tr.id,
        start: Math.max(start, t),
        dur: tr.dur,
        contact: tc,
        phase: tr.phase,
        pushDir: tr.pushDir,
        toAmp: tr.toAmp,
        dY: NaN,
      });
    }

    // 2) 推力：在相平面 (X, Y) = (A sinφ, A cosφ) 中给“速度”分量加冲量
    let f = 0;
    for (const k of kicks) {
      if (t >= k.start && t < k.start + k.dur) {
        if (Number.isNaN(k.dY)) k.dY = solveKick(A, phi, wFree, k);
        const u = (t - k.start) / k.dur;
        f += (k.dY / k.dur) * (1 - Math.cos(TAU * u));
      }
    }
    if (f !== 0) {
      const X = A * Math.sin(phi);
      const Y = A * Math.cos(phi) + f * DT;
      A = Math.hypot(X, Y);
      const np = Math.atan2(X, Y);
      phi = np + TAU * Math.round((phi - np) / TAU);
    }

    // 3) 伺服：在给定窗口内把摆幅缓入缓出地调到目标值
    for (const sv of servos) {
      if (t >= sv.start && t <= sv.end) {
        if (Number.isNaN(sv.from)) sv.from = A;
        A = lerp(sv.from, sv.to, easeInOutCubic(invLerp(sv.start, sv.end, t)));
      }
    }

    // 4) 记录
    theta[i] = A * Math.sin(phi);
    amp[i] = A;
    As += (A - As) * (DT / 0.7);
    ampSmooth[i] = As;

    const c = Math.cos(phi);
    if (i > 0 && Math.sign(c) !== Math.sign(prevC)) {
      const side: -1 | 1 = Math.sin(phi) > 0 ? 1 : -1;
      const frac = prevC / (prevC - c);
      extremes.push({t: t - DT + frac * DT, side, amp: A});
    }
    prevC = c;

    // 5) 推进相位；镜头 7 中逐渐锁定到大摆锤的相位（被它带着走）
    let w = wFree;
    if (s > 0) {
      w = (1 - s) * wFree + s * BIG_W + s * 0.9 * Math.sin(bigPhase(t) - phi);
      w = Math.max(w, 0.3 * BIG_W);
    }
    phi += w * DT;
  }

  return {theta, amp, ampSmooth, extremes, kicks};
};

const MAIN = simulateMain();

export const mainExtremes = MAIN.extremes;
export const mainKicks = MAIN.kicks;
export const kickById = (id: string) => MAIN.kicks.find((k) => k.id === id)!;
export const mainAmpSmooth = (t: number) => sample(MAIN.ampSmooth, t);
export const mainAmp = (t: number) => sample(MAIN.amp, t);

/** 第一个满足条件的端点到达 */
export const firstExtreme = (side: -1 | 1, notBefore: number) =>
  MAIN.extremes.find((e) => e.side === side && e.t >= notBefore)!;

/* ------------------------------------------------------------------ */
/* 牛顿摆（镜头 8 ~ 9）                                                    */
/* ------------------------------------------------------------------ */
export type Collision = {
  t: number;
  a: number; // 相撞的两颗球（a < b；0 祖辈 / 1 父母 / 2 你）
  b: number;
  to: number; // 这一下把冲量交给了谁
  x: number;
  y: number;
  kind: 'elastic' | 'absorb';
  speed: number;
};

const CR_START = S8.cradleStart;
const CR_N = Math.ceil((SIM_END - CR_START) / DT) + 2;
const L = PENDULUM.length;
/** 相邻两颗球支点的间距：球径 + 一点点缝隙（真正的牛顿摆，球与球几乎相贴） */
export const CRADLE_STEP = 2 * CRADLE.ballRadius + CRADLE.gap;
export const CRADLE_PIVOTS = [-2 * CRADLE_STEP, -CRADLE_STEP, 0];

/**
 * 牛顿摆：三颗等长等质量的球。撞击从一端“穿过”中间那颗静止的球传到另一端，
 * 中间留 CRADLE.transmitDelay 秒的“咔嗒”间隔，让「祖辈撞父母、父母撞你」看得清先后。
 */
const simulateCradle = () => {
  const th = [new Float64Array(CR_N), new Float64Array(CR_N), new Float64Array(CR_N)];
  const collisions: Collision[] = [];
  const t0 = CR_START;
  const yTheta = sample(MAIN.theta, t0);
  const yOmega = (sample(MAIN.theta, t0 + DT) - sample(MAIN.theta, t0 - DT)) / (2 * DT);
  const s = [0, 0, yTheta];
  const w = [0, 0, yOmega];
  const r = CRADLE.ballRadius;
  const kickDv = -2 * W0 * Math.sin(rad(S8.grandKick.toAmplitude) / 2);
  const posOf = (b: number) => ({x: CRADLE_PIVOTS[b] + L * Math.sin(s[b]), y: L * Math.cos(s[b])});
  const dist = (a: number, b: number) => {
    const pa = posOf(a);
    const pb = posOf(b);
    return Math.hypot(pb.x - pa.x, pb.y - pa.y);
  };
  const hit = (t: number, from: number, to: number, kind: Collision['kind'], speed: number) => {
    const pa = posOf(from);
    const pb = posOf(to);
    collisions.push({
      t,
      a: Math.min(from, to),
      b: Math.max(from, to),
      to,
      x: (pa.x + pb.x) / 2,
      y: (pa.y + pb.y) / 2,
      kind,
      speed,
    });
  };
  let pending: {via: number; to: number; w: number; at: number} | null = null;
  let absorbed = -1;

  for (let i = 0; i < CR_N; i++) {
    const t = t0 + i * DT;
    for (let b = 0; b < 3; b++) {
      if (pending && b === pending.via) {
        w[b] = 0;
        continue;
      }
      let acc = -W0 * W0 * Math.sin(s[b]) - CRADLE.airDamping * w[b];
      if (b === 0) {
        const u = (t - S8.grandKick.at) / S8.grandKick.duration;
        if (u >= 0 && u < 1) acc += (kickDv / S8.grandKick.duration) * (1 - Math.cos(TAU * u));
      }
      if (b === 2 && absorbed >= 0) {
        // 吸收之后：家长把冲击化成光和颤动，自己的摆动迅速收小
        acc -= 1.6 * (1 - ramp(t, absorbed + 1.5, absorbed + 4.0)) * w[b];
      }
      w[b] += acc * DT;
      s[b] += w[b] * DT;
    }

    // 冲击穿过中间那颗球，到达另一端
    if (pending && t >= pending.at) {
      const p = pending;
      pending = null;
      if (p.to === 2 && absorbed < 0 && t >= S9.absorbNotBefore) {
        absorbed = t;
        w[2] = w[2] * 0.2 + CRADLE.absorbTransfer * p.w;
        hit(t, p.via, p.to, 'absorb', Math.abs(p.w) * L);
      } else {
        w[p.to] = p.w;
        hit(t, p.via, p.to, 'elastic', Math.abs(p.w) * L);
      }
    }

    if (!pending) {
      for (let a = 0; a < 2; a++) {
        const b = a + 1;
        const va = L * Math.cos(s[a]) * w[a];
        const vb = L * Math.cos(s[b]) * w[b];
        if (dist(a, b) > 2 * r || va <= vb) continue;
        if (absorbed >= 0 && b === 2) {
          // 力量停在你这里：之后你回摆碰到父母，只会停下，不再往上传
          w[2] = Math.max(w[2], 0);
          w[1] = Math.min(w[1], 0);
          continue;
        }
        const striker = va > -vb ? a : b;
        const receiver = striker === a ? b : a;
        const next = striker === a ? b + 1 : a - 1;
        hit(t, striker, receiver, 'elastic', Math.abs(va - vb));
        if (next >= 0 && next <= 2 && dist(receiver, next) <= 2 * r + CRADLE.gap + 4) {
          pending = {via: receiver, to: next, w: w[striker], at: t + CRADLE.transmitDelay};
          w[striker] = 0;
          w[receiver] = 0;
        } else {
          const tmp = w[a];
          w[a] = w[b];
          w[b] = tmp;
        }
        break;
      }
    }
    th[0][i] = s[0];
    th[1][i] = s[1];
    th[2][i] = s[2];
  }
  return {th, collisions, absorbed};
};

const CR = simulateCradle();

const sampleCr = (arr: Float64Array, t: number) => {
  const f = clamp((t - CR_START) / DT, 0, CR_N - 1.000001);
  const i = Math.floor(f);
  return lerp(arr[i], arr[i + 1], f - i);
};

export const cradleCollisions = CR.collisions;
export const absorbTime = CR.absorbed;
/** 牛顿摆中第 b 颗球（0 祖辈 / 1 父母 / 2 你）的角度 */
export const cradleTheta = (b: number, t: number) => (t < CR_START ? (b === 2 ? sample(MAIN.theta, t) : 0) : sampleCr(CR.th[b], t));

/** 家长吸收冲击后的颤动（视觉位移，世界 px） */
export const tremor = (t: number) => {
  if (absorbTime < 0 || t < absorbTime) return {x: 0, y: 0};
  const u = t - absorbTime;
  const env = Math.exp(-u / 0.85) * Math.min(1, u / 0.04);
  const a = 9 * env;
  return {
    x: a * (Math.sin(u * 71.0) * 0.7 + Math.sin(u * 43.0 + 1.3) * 0.3),
    y: a * 0.45 * (Math.sin(u * 59.0 + 0.4) * 0.6 + Math.sin(u * 97.0) * 0.4),
  };
};

/* ------------------------------------------------------------------ */
/* 主摆锤：对外统一接口                                                     */
/* ------------------------------------------------------------------ */
export const mainTheta = (t: number) => (t < CR_START ? sample(MAIN.theta, t) : sampleCr(CR.th[2], t));

/** 主摆球在世界坐标中的位置（支点为原点） */
export const mainBob = (t: number) => {
  const th = mainTheta(t);
  const tr = tremor(t);
  return {x: L * Math.sin(th) + tr.x, y: L * Math.cos(th) + tr.y, theta: th};
};

/* ------------------------------------------------------------------ */
/* 孩子的摆锤                                                            */
/* ------------------------------------------------------------------ */
const CH_START = S8.childAppear[0];
const CH_N = Math.ceil((SIM_END - CH_START) / DT) + 2;
const CH_W0 = W0 * Math.sqrt(L / CRADLE.childLength);

/** 冲击传到孩子那里的时刻（家长每次被撞后，波纹约 0.45 秒到达） */
export const childRipples = CR.collisions
  .filter((c) => c.to === 2 && c.kind === 'elastic' && c.speed > 50 && c.t > CH_START + 0.4)
  .map((c) => c.t + 0.45);

const simulateChild = () => {
  const th = new Float64Array(CH_N);
  const amp = new Float64Array(CH_N);
  type Step = {t0: number; t1: number; delta?: number; to?: number; from?: number};
  const steps: Step[] = [{t0: CH_START + 0.3, t1: CH_START + 2.6, delta: rad(S8.childStartSway)}];
  for (const tr of childRipples) steps.push({t0: tr, t1: tr + 0.7, delta: rad(S8.childRipplePush)});
  if (absorbTime >= 0) {
    steps.push({t0: absorbTime + 0.35, t1: absorbTime + 0.6, delta: rad(0.9)});
    steps.push({t0: absorbTime + 0.6, t1: absorbTime + 0.6 + S9.childSettle, to: 0});
  }
  let A = 0;
  let phi = 0;
  for (let i = 0; i < CH_N; i++) {
    const t = CH_START + i * DT;
    for (const st of steps) {
      if (t >= st.t0 && t <= st.t1) {
        if (st.from === undefined) st.from = A;
        const target = st.to !== undefined ? st.to : st.from + (st.delta ?? 0);
        A = lerp(st.from, target, easeInOutCubic(invLerp(st.t0, st.t1, t)));
      }
    }
    th[i] = A * Math.sin(phi);
    amp[i] = A;
    phi += (CH_W0 / periodFactor(A)) * DT;
  }
  return {th, amp};
};

const CH = simulateChild();
const sampleCh = (arr: Float64Array, t: number) => {
  const f = clamp((t - CH_START) / DT, 0, CH_N - 1.000001);
  const i = Math.floor(f);
  return lerp(arr[i], arr[i + 1], f - i);
};
export const childTheta = (t: number) => (t < CH_START ? 0 : sampleCh(CH.th, t));
/** 孩子安静停住的时刻 */
export const childStillAt = absorbTime >= 0 ? absorbTime + 0.6 + S9.childSettle : S9.end;

/* ------------------------------------------------------------------ */
/* 关键事件（供镜头组件使用）                                               */
/* ------------------------------------------------------------------ */
export const EVENTS = {
  roar1: firstExtreme(-1, S1.roarNotBefore).t, // “吼”浮现 + 震屏
  compensate: firstExtreme(1, S2.compensateNotBefore).t, // “补偿”浮现
  roar3: firstExtreme(-1, kickById('s3').contact).t, // 更亮的“吼” + 更强震屏
  hands: S6.hands.map((_, i) => kickById(`hand${i}`).contact),
  absorb: absorbTime,
};
