import React from 'react';
import {useCurrentFrame} from 'remotion';
import {rnd} from '../lib/anim';
import {sprite, useCanvas} from '../lib/canvas';
import {H, W} from '../theme';

const TW = 960;
const TH = 540;
const VARIANTS = 8;

const tile = (k: number) =>
  sprite(`grain-${k}`, TW, TH, (ctx) => {
    const img = ctx.createImageData(TW, TH);
    let s = (k + 1) * 2654435761;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const v = s >>> 24;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });

const GrainLayer: React.FC<{blend: 'overlay' | 'screen'; opacity: number; salt: string}> = ({blend, opacity, salt}) => {
  const f = useCurrentFrame();
  const ref = useCanvas(
    (ctx) => {
      const t = tile(Math.floor(rnd(`${salt}k${f}`) * VARIANTS));
      const ox = Math.floor(rnd(`${salt}x${f}`) * TW);
      const oy = Math.floor(rnd(`${salt}y${f}`) * TH);
      ctx.imageSmoothingEnabled = true;
      // Tile the noise at 2x so the grain is soft like film, offset every frame.
      for (const dx of [0, 1, 2]) {
        for (const dy of [0, 1, 2]) {
          ctx.drawImage(t, (dx * TW - ox) * 2, (dy * TH - oy) * 2, TW * 2, TH * 2);
        }
      }
    },
    [f],
  );
  return (
    <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: blend, opacity}} />
  );
};

/** Film grain: texture in the image plus a faint lift in the blacks. */
export const Grain: React.FC<{amount?: number}> = ({amount = 1}) => (
  <>
    <GrainLayer blend="overlay" opacity={0.14 * amount} salt="o" />
    <GrainLayer blend="screen" opacity={0.035 * amount} salt="s" />
  </>
);
