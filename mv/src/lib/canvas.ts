import {useLayoutEffect, useRef} from 'react';

/** A canvas redrawn synchronously on every render (so Remotion captures the new frame). */
export const useCanvas = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, c.width, c.height);
    draw(ctx, c.width, c.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
};

const sprites = new Map<string, HTMLCanvasElement>();

/** Pre-rendered sprite, painted once and cached for the lifetime of the page. */
export const sprite = (key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
  const hit = sprites.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) paint(ctx);
  sprites.set(key, c);
  return c;
};
