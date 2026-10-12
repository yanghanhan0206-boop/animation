/**
 * 镜头：连续长镜头的推拉摇移 + 震屏
 */
import {CAMERA, FPS, S1, S3} from '../timeline';
import {easeInOutSine, hash01, lerp} from '../lib/math';
import {EVENTS} from './physics';

export type Cam = {zoom: number; px: number; py: number};

/** 时刻 t 的镜头：世界点 (x,y) → 屏幕 (px + x·zoom, py + y·zoom) */
export const cameraAt = (t: number): Cam => {
  const keys = CAMERA;
  let k0 = keys[0];
  let k1 = keys[0];
  let u = 0;
  if (t >= keys[keys.length - 1].t) {
    k0 = k1 = keys[keys.length - 1];
  } else if (t > keys[0].t) {
    for (let i = 0; i < keys.length - 1; i++) {
      if (t <= keys[i + 1].t) {
        k0 = keys[i];
        k1 = keys[i + 1];
        u = easeInOutSine((t - k0.t) / (k1.t - k0.t));
        break;
      }
    }
  }
  const zoom = Math.exp(lerp(Math.log(k0.zoom), Math.log(k1.zoom), u));
  const fx = lerp(k0.focus[0], k1.focus[0], u);
  const fy = lerp(k0.focus[1], k1.focus[1], u);
  const ax = lerp(k0.at[0], k1.at[0], u);
  const ay = lerp(k0.at[1], k1.at[1], u);
  return {zoom, px: ax - fx * zoom, py: ay - fy * zoom};
};

export const toScreen = (cam: Cam, x: number, y: number) => ({x: cam.px + x * cam.zoom, y: cam.py + y * cam.zoom});

/** 震屏事件：摆球到达左端、“吼”浮现的那一刻 */
const SHAKES = [
  {t: EVENTS.roar1, px: S1.shake.px, frames: S1.shake.frames, seed: 11},
  {t: EVENTS.roar3, px: S3.shake.px, frames: S3.shake.frames, seed: 23},
];

export const shakeAt = (t: number) => {
  let x = 0;
  let y = 0;
  for (const s of SHAKES) {
    const f = (t - s.t) * FPS;
    if (f < 0 || f >= s.frames) continue;
    const env = Math.pow(1 - f / s.frames, 1.3);
    const ang = (hash01(s.seed) - 0.5) * 0.9; // 以水平方向为主（摆球从左端撞回来的方向）
    const osc = Math.cos(Math.PI * 0.92 * f);
    const jitter = (hash01(s.seed * 97 + Math.floor(f)) - 0.5) * 0.5;
    x += s.px * env * (osc * Math.cos(ang) + jitter * 0.3);
    y += s.px * env * (osc * Math.sin(ang) + jitter);
  }
  return {x, y};
};
