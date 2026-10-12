/**
 * 全片主角：金色小球。直径约 56px，内发光 + 外部柔光，可带 8 个渐隐残影。
 * 颤动由调用方用 jitter() 算好后加到 x / y 上；残影用 sampleTrail() 沿「不含颤动」的轨迹采样。
 */
import React from 'react';
import {BALL} from '../config/theme';
import type {Point} from '../lib/anim';

export const GoldBall: React.FC<{
  x: number;
  y: number;
  r?: number;
  opacity?: number;
  /** 外部柔光强度 */
  glow?: number;
  /** 0 = 暖金，1 = 冷光（镜头11 冰冻） */
  cold?: number;
  /** 残影位置（最近的在前），通常由 sampleTrail() 得到 */
  trail?: Point[];
  /** 精简模式：只画本体和近处柔光（星空里几百颗用） */
  lite?: boolean;
}> = ({x, y, r = BALL.radius, opacity = 1, glow = 1, cold = 0, trail, lite = false}) => {
  const n = trail?.length ?? 0;
  return (
    <g opacity={opacity}>
      {trail
        ?.map((p, i) => {
          const k = i + 1;
          const dist = Math.hypot(p.x - x, p.y - y);
          // 静止时残影与本体重合，不画
          const visible = Math.min(1, Math.max(0, (dist - 2) / (r * 0.5)));
          if (visible <= 0) {
            return null;
          }
          const a = 0.42 * Math.pow(1 - k / (n + 1), 1.35) * visible;
          const rr = r * (1 - 0.035 * k);
          return (
            <g key={k} opacity={a}>
              <circle cx={p.x} cy={p.y} r={rr * 1.7} fill="url(#ball-glow)" />
              <circle cx={p.x} cy={p.y} r={rr} fill="url(#ball-body)" opacity={0.75} />
            </g>
          );
        })
        .reverse()}
      {!lite && (
        <circle cx={x} cy={y} r={r * 4.4} fill="url(#ball-halo)" opacity={glow * (1 - cold * 0.7)} />
      )}
      <circle cx={x} cy={y} r={r * 1.95} fill="url(#ball-glow)" opacity={glow * (1 - cold)} />
      {cold > 0 && <circle cx={x} cy={y} r={r * 1.8} fill="url(#ball-glow-cold)" opacity={glow * cold} />}
      <circle cx={x} cy={y} r={r} fill="url(#ball-body)" />
      {cold > 0 && <circle cx={x} cy={y} r={r} fill="url(#ball-body-cold)" opacity={cold} />}
      <circle cx={x} cy={y} r={r} fill="url(#ball-inner)" />
      {!lite && (
        <ellipse
          cx={x - r * 0.3}
          cy={y - r * 0.34}
          rx={r * 0.42}
          ry={r * 0.3}
          fill="url(#ball-spec)"
          opacity={0.55}
        />
      )}
    </g>
  );
};
