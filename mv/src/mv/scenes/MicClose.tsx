import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {clamp, easeInOutSine, easeOutCubic, lerp, noise1, prog} from '../../lib/anim';
import {useCanvas} from '../../lib/canvas';
import {H, W} from '../../theme';
import {BEAT} from '../timeline';

// 「握紧我的话筒」 / 「让我 mic check one 算了 突然嗓子有点痛」: the microphone's grille fills
// the frame. In 'check' rings of sound pulse out on the beat, then the voice breaks: the
// rings shake apart and the light drops.

const G = {x: 1210, y: 520, r: 360};

export const MicClose: React.FC<{t: number; dur: number; v?: string}> = ({t, dur, v = 'grip'}) => {
  const f = useCurrentFrame();
  const check = v === 'check';
  const breakAt = 1.32;
  const broken = check ? prog(t, breakAt, breakAt + 0.4, easeOutCubic) : 0;
  const lightSway = Math.sin(t * 0.8) * 0.08;
  const ref = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#040303';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const key = ctx.createRadialGradient(1700, 80, 0, 1700, 80, 1300);
      key.addColorStop(0, `rgba(255,214,150,${0.3 * (1 - broken * 0.5)})`);
      key.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = key;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      // Handle: a dark tapered cylinder leaving the frame at the bottom right.
      ctx.save();
      ctx.translate(G.x, G.y);
      ctx.rotate(0.62);
      const hg = ctx.createLinearGradient(0, -150, 0, 150);
      hg.addColorStop(0, '#6B5838');
      hg.addColorStop(0.12, '#1A1510');
      hg.addColorStop(0.6, '#080706');
      hg.addColorStop(1, '#020202');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(G.r * 0.75, -150);
      ctx.lineTo(G.r * 3, -105);
      ctx.lineTo(G.r * 3, 105);
      ctx.lineTo(G.r * 0.75, 150);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Grille: woven mesh, shaded as a sphere, with a moving specular and a rim of light.
      ctx.save();
      ctx.beginPath();
      ctx.arc(G.x, G.y, G.r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#0A0908';
      ctx.fillRect(G.x - G.r, G.y - G.r, G.r * 2, G.r * 2);
      ctx.strokeStyle = 'rgba(120,98,66,0.55)';
      ctx.lineWidth = 2;
      for (let k = -60; k <= 60; k++) {
        const o = k * 12;
        ctx.beginPath();
        ctx.moveTo(G.x + o - G.r, G.y - G.r);
        ctx.lineTo(G.x + o + G.r, G.y + G.r);
        ctx.moveTo(G.x + o + G.r, G.y - G.r);
        ctx.lineTo(G.x + o - G.r, G.y + G.r);
        ctx.stroke();
      }
      const sph = ctx.createRadialGradient(G.x - G.r * 0.2, G.y - G.r * 0.25, G.r * 0.2, G.x, G.y, G.r);
      sph.addColorStop(0, 'rgba(0,0,0,0)');
      sph.addColorStop(0.7, 'rgba(0,0,0,0.35)');
      sph.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = sph;
      ctx.fillRect(G.x - G.r, G.y - G.r, G.r * 2, G.r * 2);
      ctx.globalCompositeOperation = 'lighter';
      const sx = G.x + G.r * (0.38 + lightSway);
      const sy = G.y - G.r * (0.42 - lightSway * 0.5);
      const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, G.r * 0.55);
      spec.addColorStop(0, `rgba(255,236,196,${0.75 * (1 - broken * 0.6)})`);
      spec.addColorStop(0.25, `rgba(230,180,110,${0.3 * (1 - broken * 0.6)})`);
      spec.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(G.x - G.r, G.y - G.r, G.r * 2, G.r * 2);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,226,170,${0.8 * (1 - broken * 0.5)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(G.x, G.y, G.r - 1.5, -1.9, -0.1);
      ctx.stroke();
      // Sound: a ring on every beat, until the voice gives out.
      if (check) {
        for (let k = 0; k < 6; k++) {
          const born = k * BEAT * 0.5;
          if (born > breakAt + 0.05) break;
          const age = t - born;
          if (age < 0 || age > 1.6) continue;
          const p = age / 1.6;
          const rr = G.r * (1.05 + p * 1.6);
          ctx.strokeStyle = `rgba(232,196,128,${0.55 * (1 - p)})`;
          ctx.lineWidth = 3 * (1 - p) + 1;
          ctx.beginPath();
          // After the break the rings judder: a wobbling, broken outline.
          const shakeAmt = broken * 26;
          for (let a = 0; a <= 64; a++) {
            const ang = (a / 64) * Math.PI * 2;
            const wob = shakeAmt * noise1(a * 0.9 + t * 30 + k * 7);
            const x = G.x + Math.cos(ang) * (rr + wob);
            const y = G.y + Math.sin(ang) * (rr + wob);
            if (broken > 0.3 && a % 9 === 4) ctx.moveTo(x, y);
            else if (a) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (broken > 0) {
        ctx.fillStyle = `rgba(0,0,0,${0.35 * broken})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
    [f, broken],
  );
  const push = lerp(1, check ? 1.04 : 1.1, prog(t, 0, dur, easeInOutSine));
  const jolt = check && t > breakAt && t < breakAt + 0.25 ? noise1(t * 60) * 8 : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${jolt}px, ${jolt * 0.5}px) scale(${push})`, transformOrigin: `${G.x}px ${G.y}px`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed={`mic-${v}`} count={120} focus={0.35} drift={[-5, 8]} intensity={0.9 * clamp(1 - broken * 0.5)} />
    </AbsoluteFill>
  );
};
