/**
 * 镜头 5：文字溶解变形。“吼”碎成金色粒子，沿弧线飘散后聚合成“恐惧”；“补偿”→“愧疚”同理。
 * 粒子位置在浏览器里用 Canvas 对真实字形取样（字体已由 Film 预先加载），用固定种子保证每帧可复现。
 */
import React, {useLayoutEffect, useRef} from 'react';
import {HEIGHT, S5, WIDTH} from '../timeline';
import {clamp, easeInOutCubic, easeInOutSine, ramp, rng} from '../lib/math';
import {Cam, toScreen} from '../sim/camera';
import {WORD_STYLE, poleWordPos} from './PoleWords';

type Pt = {x: number; y: number};

const glyphCache = new Map<string, Pt[]>();
const sampleGlyph = (text: string, n: number, seed: number): Pt[] => {
  const key = `${text}|${n}|${seed}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const {size, weight} = WORD_STYLE[text];
  const cw = Math.ceil(size * [...text].length * 1.3 + 60);
  const ch = Math.ceil(size * 1.6);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d')!;
  ctx.font = `${weight} ${size}px "Noto Serif SC"`;
  (ctx as unknown as {letterSpacing: string}).letterSpacing = `${size * 0.06}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, cw / 2 + size * 0.03, ch / 2);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const all: Pt[] = [];
  for (let y = 0; y < ch; y += 2) {
    for (let x = 0; x < cw; x += 2) {
      if (data[(y * cw + x) * 4 + 3] > 140) all.push({x: x - cw / 2, y: y - ch / 2});
    }
  }
  const r = rng(seed);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) out.push(all[i % Math.max(1, all.length)] ?? {x: 0, y: 0});
  glyphCache.set(key, out);
  return out;
};

type Particle = {
  s: Pt; // 相对源词中心
  d: Pt; // 相对目标词中心
  v1: Pt; // 离开时的弧线控制量
  v2: Pt; // 抵达时的弧线控制量
  delay: number;
  dur: number;
  size: number;
  col: string;
  wob: number;
  wobF: number;
};

const COLS = ['#F5D76E', '#E9C55A', '#D4AF37', '#FFF1C2', '#F0CF66'];
const sysCache = new Map<number, Particle[]>();

const buildSystem = (mi: number): Particle[] => {
  const hit = sysCache.get(mi);
  if (hit) return hit;
  const m = S5.morphs[mi];
  const n = S5.particleCount;
  const sideSign = m.side === 'left' ? -1 : 1;
  const src = sampleGlyph(m.from, n, 101 + mi).slice();
  const dst = sampleGlyph(m.to, n, 202 + mi).slice();
  // 按横向位置配对：字的左半边飞向新字的左半边，形变更连贯
  const r = rng(303 + mi);
  const key = (p: Pt) => p.x + p.y * 0.25 + (r() - 0.5) * 40;
  const sk = src.map((p) => ({p, k: key(p)})).sort((a, b) => a.k - b.k);
  const dk = dst.map((p) => ({p, k: key(p)})).sort((a, b) => a.k - b.k);
  const xs = sk.map((e) => e.p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const parts: Particle[] = sk.map((e, i) => {
    const xn = (e.p.x - minX) / Math.max(1, maxX - minX);
    // 从靠近摆锤的一侧开始碎裂
    const delay = (sideSign < 0 ? xn : 1 - xn) * 0.55 + r() * 0.22;
    const dur = m.duration - 1.05 - delay * 0.6 + (r() - 0.5) * 0.25;
    const up = -Math.PI / 2 + sideSign * 0.35 + (r() - 0.5) * 1.7;
    const m1 = 150 + r() * 230;
    const back = Math.PI / 2 - sideSign * 0.25 + (r() - 0.5) * 1.9;
    const m2 = 110 + r() * 200;
    return {
      s: e.p,
      d: dk[i].p,
      v1: {x: Math.cos(up) * m1, y: Math.sin(up) * m1},
      v2: {x: Math.cos(back) * m2, y: Math.sin(back) * m2},
      delay,
      dur,
      size: 1.0 + r() * 1.1,
      col: COLS[Math.floor(r() * COLS.length)],
      wob: 6 + r() * 16,
      wobF: 1 + r() * 2.2,
    };
  });
  sysCache.set(mi, parts);
  return parts;
};

const bez = (a: number, b: number, c: number, d: number, u: number) => {
  const v = 1 - u;
  return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
};

export const ParticleMorph: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const active = S5.morphs.some((m) => t >= m.start - 0.05 && t <= m.start + m.duration + 0.05);

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (!active) return;
    ctx.globalCompositeOperation = 'lighter';
    S5.morphs.forEach((m, mi) => {
      if (t < m.start - 0.05 || t > m.start + m.duration + 0.05) return;
      const parts = buildSystem(mi);
      const sc = poleWordPos(m.side, m.start, m.from);
      const dc = poleWordPos(m.side, t, m.to);
      const local = t - m.start;
      const appear = ramp(local, 0, 0.22, easeInOutSine);
      const settle = 1 - ramp(local, m.duration - 0.45, m.duration, easeInOutSine);
      for (const p of parts) {
        const raw = clamp((local - p.delay) / p.dur);
        const u = easeInOutCubic(raw);
        const P0 = {x: sc.x + p.s.x, y: sc.y + p.s.y};
        const P3 = {x: dc.x + p.d.x, y: dc.y + p.d.y};
        let x = bez(P0.x, P0.x + p.v1.x, P3.x + p.v2.x, P3.x, u);
        let y = bez(P0.y, P0.y + p.v1.y, P3.y + p.v2.y, P3.y, u);
        // 沿弦线法向的轻微摆动，让路径不只是一条弧
        const sw = Math.sin(Math.PI * u) * p.wob * Math.sin(u * Math.PI * p.wobF);
        const dx = P3.x - P0.x;
        const dy = P3.y - P0.y;
        const len = Math.hypot(dx, dy) || 1;
        x += (-dy / len) * sw;
        y += (dx / len) * sw;
        const sp = toScreen(cam, x, y);
        const flight = Math.sin(Math.PI * raw);
        if (flight > 0.08) {
          // 拖出一小段弧线，让飘散路径的弧度看得见
          const u0 = easeInOutCubic(clamp(raw - 0.035));
          const px0 = bez(P0.x, P0.x + p.v1.x, P3.x + p.v2.x, P3.x, u0);
          const py0 = bez(P0.y, P0.y + p.v1.y, P3.y + p.v2.y, P3.y, u0);
          const s0 = toScreen(cam, px0, py0);
          ctx.globalAlpha = 0.16 * flight * appear * settle;
          ctx.strokeStyle = p.col;
          ctx.lineWidth = p.size * cam.zoom * 0.9;
          ctx.beginPath();
          ctx.moveTo(s0.x, s0.y);
          ctx.lineTo(sp.x, sp.y);
          ctx.stroke();
        }
        const a = appear * settle * (0.78 + 0.22 * flight);
        const rr = p.size * cam.zoom * (1.15 + 0.6 * flight);
        if (flight > 0.05) {
          ctx.globalAlpha = 0.07 * a * flight;
          ctx.fillStyle = p.col;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, rr * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [t, cam, active]);

  return <canvas ref={ref} width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}} />;
};
