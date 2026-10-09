import React from 'react';
import {useCurrentFrame} from 'remotion';
import {lerp, rnd} from '../lib/anim';
import {sprite, useCanvas} from '../lib/canvas';
import {FPS, H, W} from '../theme';

// Gold dust with depth of field: near motes are large soft discs, motes on the focal
// plane are crisp sparks, far ones are fine haze. Additive blending, like light.

const sharp = () =>
  sprite('mote-sharp', 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,248,230,1)');
    g.addColorStop(0.12, 'rgba(248,226,176,0.9)');
    g.addColorStop(0.32, 'rgba(222,186,122,0.22)');
    g.addColorStop(1, 'rgba(222,186,122,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

const soft = () =>
  sprite('mote-soft', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(232,198,136,0.55)');
    g.addColorStop(0.5, 'rgba(222,186,122,0.22)');
    g.addColorStop(1, 'rgba(222,186,122,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

const disc = () =>
  sprite('mote-disc', 128, 128, (ctx) => {
    const tmp = document.createElement('canvas');
    tmp.width = 128;
    tmp.height = 128;
    const t = tmp.getContext('2d');
    if (!t) return;
    const g = t.createRadialGradient(64, 64, 0, 64, 64, 52);
    g.addColorStop(0, 'rgba(222,186,122,0.30)');
    g.addColorStop(0.82, 'rgba(226,192,130,0.36)');
    g.addColorStop(0.95, 'rgba(236,206,148,0.44)');
    g.addColorStop(1, 'rgba(236,206,148,0)');
    t.fillStyle = g;
    t.beginPath();
    t.arc(64, 64, 52, 0, Math.PI * 2);
    t.fill();
    ctx.filter = 'blur(3px)';
    ctx.drawImage(tmp, 0, 0);
  });

export interface BokehProps {
  seed: string;
  count: number;
  /** Depth of the focal plane, 0 = nearest, 1 = farthest. */
  focus?: number;
  /** Drift in px/s at mid depth. */
  drift?: [number, number];
  intensity?: number;
  sizeScale?: number;
  /** Optional mask: mote brightness multiplied by this function of screen position. */
  weight?: (x: number, y: number) => number;
  /** Camera offset in px (applied with parallax) and zoom around the frame centre. */
  cam?: {x: number; y: number; zoom: number};
  /** Time offset in seconds (lets a scene start its dust mid-flight). */
  t0?: number;
}

export const Bokeh: React.FC<BokehProps> = ({
  seed,
  count,
  focus = 0.55,
  drift = [-14, -8],
  intensity = 1,
  sizeScale = 1,
  weight,
  cam = {x: 0, y: 0, zoom: 1},
  t0 = 0,
}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      const t = f / FPS + t0;
      ctx.globalCompositeOperation = 'lighter';
      const S = sharp();
      const So = soft();
      const D = disc();
      const span = {x: W + 400, y: H + 400};
      for (let i = 0; i < count; i++) {
        const z = Math.pow(rnd(`${seed}z${i}`), 0.55);
        const par = lerp(1.7, 0.3, z);
        const ph = rnd(`${seed}p${i}`) * Math.PI * 2;
        let x = rnd(`${seed}x${i}`) * span.x + drift[0] * t * par + Math.sin(t * 0.35 + ph) * 22 * par;
        let y = rnd(`${seed}y${i}`) * span.y + drift[1] * t * par + Math.cos(t * 0.29 + ph * 1.3) * 14 * par;
        x = (((x % span.x) + span.x) % span.x) - 200;
        y = (((y % span.y) + span.y) % span.y) - 200;
        x = W / 2 + (x - W / 2) * cam.zoom + cam.x * par;
        y = H / 2 + (y - H / 2) * cam.zoom + cam.y * par;
        const base = lerp(30, 3, z) * sizeScale * cam.zoom;
        const d = Math.abs(z - focus);
        const tw = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * (0.6 + rnd(`${seed}w${i}`) * 1.4) + ph));
        const wgt = weight ? weight(x, y) : 1;
        let img = S;
        let r = base * 0.9;
        let a = 0.85;
        if (d >= 0.35) {
          img = D;
          r = base * (1.2 + d * 5);
          a = 0.5 / (1 + d * 3);
        } else if (d >= 0.12) {
          img = So;
          r = base * (1.4 + d * 4);
          a = 0.6 / (1 + d * 6);
        }
        a *= tw * intensity * wgt;
        if (a < 0.004 || x < -r || x > W + r || y < -r || y > H + r) continue;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      }
    },
    [f, seed, count, focus, intensity, sizeScale, cam.x, cam.y, cam.zoom],
  );
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};
