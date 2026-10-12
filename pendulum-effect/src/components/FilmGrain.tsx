/**
 * 细腻的胶片颗粒：每帧用确定性的随机种子生成一张全分辨率噪点，overlay 叠加。
 * （同一帧无论渲染几次结果都一样）
 */
import React, {useLayoutEffect, useRef} from 'react';
import {HEIGHT, WIDTH} from '../timeline';

export const FilmGrain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.13}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(WIDTH, HEIGHT);
    const d = img.data;
    let s = (Math.imul(frame + 1, 2654435761) ^ 0x5bd1e995) >>> 0;
    for (let i = 0; i < d.length; i += 4) {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      // 两个均匀分布相加 → 三角分布，颗粒更柔和
      const v = 128 + ((s & 255) + ((s >>> 8) & 255) - 255) * 0.5;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [frame]);
  return (
    <canvas
      ref={ref}
      width={WIDTH}
      height={HEIGHT}
      style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}
    />
  );
};
