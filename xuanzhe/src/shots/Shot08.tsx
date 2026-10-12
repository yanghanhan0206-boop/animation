/**
 * 镜头8（70–82s）镜头推进小球内部。内部有一支金色箭头。
 * 先演示一次「确定」：箭头稳稳射向一个点。
 * 再演示「悬着」：箭头分裂成二十多条细线四处乱指，同时一圈圈金色警报波纹向外扩散。
 */
import React from 'react';
import {BallZoom, MIND, MindLines, Ripples, rimFlashAt} from '../components/Mind';
import {Stage} from '../components/Stage';
import {PEAK} from '../components/StressCurve';
import {BALL, COLORS} from '../config/theme';
import {EASE, clamp, fade, jitter, keys, lerp, sampleTrail, tween, type Point} from '../lib/anim';
import {useShot} from '../lib/shot-context';

/** 小球从峰顶的光点长出来、移到视野中心，再推进到球里 */
const EMERGE = [0, 1.4];
const PUSH = [1.4, 2.9];

const ballPath = (t: number): Point => {
  const k = EASE(clamp((t - 0.2) / (EMERGE[1] - 0.2)));
  return {x: lerp(PEAK.x, MIND.cx, k), y: lerp(PEAK.y, MIND.cy, k)};
};

/** 球在画面上的半径：先从光点长到正常大小，再按指数推进到视野半径 */
export const ballRadius = (t: number) => {
  if (t < PUSH[0]) {
    return keys(t, [EMERGE[0], EMERGE[1]], [5, BALL.radius]);
  }
  const k = EASE(clamp((t - PUSH[0]) / (PUSH[1] - PUSH[0])));
  return BALL.radius * Math.pow(MIND.R / BALL.radius, k);
};

export const insideOf = (r: number) => clamp((r - 60) / 220);

const Arrow: React.FC<{tail: Point; tip: Point; opacity: number; head?: number}> = ({tail, tip, opacity, head = 1}) => {
  if (opacity <= 0.001) {
    return null;
  }
  const a = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const h = 22;
  const l = {x: tip.x - h * Math.cos(a - 0.42), y: tip.y - h * Math.sin(a - 0.42)};
  const r = {x: tip.x - h * Math.cos(a + 0.42), y: tip.y - h * Math.sin(a + 0.42)};
  return (
    <g opacity={opacity} filter="url(#glow-soft)" stroke={COLORS.gold1} strokeWidth={2.4} strokeLinecap="round" fill="none">
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} />
      <path d={`M ${l.x} ${l.y} L ${tip.x} ${tip.y} L ${r.x} ${r.y}`} strokeLinejoin="round" opacity={head} />
    </g>
  );
};

export const Shot08: React.FC = () => {
  const {t, gt} = useShot();
  const r = ballRadius(t);
  const inside = insideOf(r);
  const pos = ballPath(t);
  const j = jitter(gt, 0.8);
  const solid = 1 - inside;
  const trail = t < PUSH[0] ? sampleTrail(ballPath, t) : undefined;

  // 「确定」：箭头稳稳射向一个点
  const target = {x: 1215, y: MIND.cy};
  const sure = fade(t, 3.0, 3.5, 5.8, 6.3);
  const shoot = tween(t, 3.8, 4.7);
  const tipX = lerp(800, target.x - 16, shoot);
  const hit = tween(t, 4.7, 5.6);

  // 「悬着」：箭头回到中心，然后分裂
  const center = fade(t, 6.2, 6.6) * (1 - tween(t, 6.8, 7.4));
  const cj = jitter(gt, 1.4, 'arrow');

  return (
    <Stage>
      {trail && <GoldTrailOnly path={ballPath} t={t} r={r} trail={trail} />}
      <BallZoom x={pos.x + j.x * solid} y={pos.y + j.y * solid} r={r} inside={inside} rimFlash={rimFlashAt(gt)} />

      {/* 确定 */}
      <g opacity={sure}>
        <circle cx={target.x} cy={target.y} r={13} fill="none" stroke={COLORS.gold1} strokeWidth={1.6} opacity={0.85} />
        <circle cx={target.x} cy={target.y} r={3.5} fill={COLORS.gold1} />
        {hit > 0 && hit < 1 && (
          <circle
            cx={target.x}
            cy={target.y}
            r={13 + 50 * hit}
            fill="none"
            stroke={COLORS.gold1}
            strokeWidth={1.4}
            opacity={1 - hit}
          />
        )}
        {hit > 0 && <circle cx={target.x} cy={target.y} r={26} fill="url(#ball-glow)" opacity={Math.sin(Math.PI * hit) * 0.9} />}
      </g>
      <Arrow tail={{x: tipX - 150, y: target.y}} tip={{x: tipX, y: target.y}} opacity={sure} />

      {/* 悬着 */}
      <Arrow
        tail={{x: MIND.cx + cj.x * 0.6, y: MIND.cy + cj.y * 0.6}}
        tip={{x: MIND.cx + 160 + cj.x, y: MIND.cy + cj.y}}
        opacity={center}
        head={1 - tween(t, 6.8, 7.1)}
      />
      <Ripples gt={gt} />
      <MindLines gt={gt} opacity={inside} />
    </Stage>
  );
};

/** 推进前小球移动时的残影（本体由 BallZoom 画） */
const GoldTrailOnly: React.FC<{path: (t: number) => Point; t: number; r: number; trail: Point[]}> = ({t, r, trail, path}) => {
  const p = path(t);
  return (
    <g>
      {trail
        .map((q, i) => {
          const k = i + 1;
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          const vis = clamp((d - 2) / (r * 0.5));
          if (vis <= 0) {
            return null;
          }
          return (
            <circle key={k} cx={q.x} cy={q.y} r={r * (1 - 0.035 * k)} fill="url(#ball-body)" opacity={0.32 * Math.pow(1 - k / 9, 1.35) * vis} />
          );
        })
        .reverse()}
    </g>
  );
};
