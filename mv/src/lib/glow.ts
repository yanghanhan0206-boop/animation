import {sprite} from './canvas';

/** A soft round light sprite in the given rgb (white-hot core, coloured falloff). */
export const lightSprite = (rgb: [number, number, number], hot = 0.9) =>
  sprite(`light-${rgb.join('-')}-${hot}`, 128, 128, (ctx) => {
    const [r, g, b] = rgb;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(255,252,240,${hot})`);
    grad.addColorStop(0.08, `rgba(${r},${g},${b},0.95)`);
    grad.addColorStop(0.22, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(0.55, `rgba(${r},${g},${b},0.08)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  });

/** Draws a light sprite centred at (x, y) with radius r (additive when ctx is 'lighter'). */
export const drawLight = (ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, r: number, alpha: number) => {
  if (alpha <= 0.003 || r <= 0.2) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
};
