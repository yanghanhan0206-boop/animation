import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon, type IconKind} from '../components/Icons';
import {PHONE_INSET, Phone} from '../components/Phone';
import {easeInCubic, easeInOutCubic, easeOutCubic, lerp, prog, quad, rnd, rndRange, spr} from '../lib/anim';
import {useBare} from '../lib/context';
import {cue} from '../timeline';
import {C, FONT_MONO, accentA} from '../theme';

const PHONE = {cx: 295, cy: 765, w: 350, h: 720};
const SCREEN = {
  x: PHONE.cx - PHONE.w / 2 + PHONE_INSET,
  y: PHONE.cy - PHONE.h / 2 + PHONE_INSET,
  w: PHONE.w - 2 * PHONE_INSET,
  h: PHONE.h - 2 * PHONE_INSET,
};
const NOTE = {x: 520, y: 425, w: 440, h: 680};
const ROW = {cx: 740, w: 384, h: 84, ys: [565, 675, 785, 895]};
const CLIP = {x: NOTE.x + 4, y: NOTE.y + 92, w: NOTE.w - 8, h: NOTE.h - 98};
const FLY = 18;
const VIDEO_BG = '#14201A';

interface Signal {
  icon: IconKind;
  label: string;
  color: string;
  from: [number, number];
  ctrl: [number, number];
  start: number;
}

const Pill: React.FC<{
  x: number;
  y: number;
  icon: IconKind;
  label: string;
  color: string;
  w?: number;
  h?: number;
  scale?: number;
  opacity?: number;
}> = ({x, y, icon, label, color, w = ROW.w, h = ROW.h, scale = 1, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={C.card} stroke={color} strokeOpacity={0.75} strokeWidth={3} />
    <circle cx={-w / 2 + h / 2} cy={0} r={h / 2 - 9} fill={color} fillOpacity={0.16} />
    <Icon kind={icon} x={-w / 2 + h / 2} y={0} size={h * 0.5} color={color} cut={C.card} />
    <text
      x={-w / 2 + h + 16}
      y={2}
      dominantBaseline="central"
      fontFamily={FONT_MONO}
      fontWeight={800}
      fontSize={h * 0.46}
      fill={color === C.gray ? C.gray : C.white}
    >
      {label}
    </text>
  </g>
);

const VideoPage: React.FC<{top: number; kind: IconKind; progress: number; f: number; like?: number}> = ({
  top,
  kind,
  progress,
  f,
  like = -1,
}) => {
  const cx = SCREEN.x + SCREEN.w / 2;
  const cat = kind === 'cat';
  const liked = like >= 0 && f >= like;
  const pop = liked ? lerp(1.6, 1, spr(f, like, {damping: 8, stiffness: 260})) : 1;
  const heart = {x: SCREEN.x + SCREEN.w - 38, y: top + 380};
  return (
    <g>
      <rect x={SCREEN.x} y={top} width={SCREEN.w} height={SCREEN.h} fill={cat ? VIDEO_BG : '#151917'} />
      <circle cx={cx} cy={top + 300} r={140} fill={accentA(cat ? 0.09 : 0.02)} />
      <Icon kind={kind} x={cx} y={top + 300 + Math.sin(f / 8) * 9} size={190} color={cat ? C.accent : C.gray} cut={cat ? VIDEO_BG : '#151917'} rotate={Math.sin(f / 13) * 4} />
      <rect x={SCREEN.x + 24} y={top + SCREEN.h - 120} width={170} height={14} rx={7} fill={C.grayDark} />
      <rect x={SCREEN.x + 24} y={top + SCREEN.h - 94} width={118} height={14} rx={7} fill={C.grayDark} />
      <Icon kind="heart" x={heart.x} y={heart.y} size={48 * pop} color={liked ? C.accent : C.grayLight} cut={VIDEO_BG} />
      <Icon kind="bubble" x={heart.x} y={top + 456} size={42} color={C.grayLight} cut={VIDEO_BG} />
      <Icon kind="arrowUp" x={heart.x} y={top + 528} size={40} color={C.grayLight} rotate={45} />
      <rect x={SCREEN.x + 18} y={top + SCREEN.h - 34} width={SCREEN.w - 36} height={7} rx={3.5} fill={C.track} />
      <rect x={SCREEN.x + 18} y={top + SCREEN.h - 34} width={(SCREEN.w - 36) * progress} height={7} rx={3.5} fill={C.accent} />
      {liked &&
        Array.from({length: 10}, (_, i) => {
          const p = prog(f, like, like + 16, easeOutCubic);
          const ang = (i / 10) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={heart.x + Math.cos(ang) * 64 * p}
              cy={heart.y + Math.sin(ang) * 64 * p}
              r={6 * (1 - p)}
              fill={C.accent}
            />
          );
        })}
      {liked && (
        <Icon
          kind="heart"
          x={cx}
          y={top + 300}
          size={240 * spr(f, like, {damping: 9, stiffness: 180})}
          color={C.accent}
          opacity={0.9 * (1 - prog(f, like + 12, like + 24))}
        />
      )}
    </g>
  );
};

/** 8.5–16.8s: every little thing you do on the phone flies into "the notebook". */
export const S04Signals: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  const c6 = cue(6);
  const c7 = cue(7);
  const c8 = cue(8);
  const c9 = cue(9);

  const T = {
    enter: c6.start - 5,
    timerStart: c6.start + 5,
    timerEnd: c6.start + 59,
    complete: c7.start + 10,
    like: c7.start + 28,
    swipe1: c8.start + 5,
    swipe2: c8.start + 20,
    burst: c9.start,
  };

  const SIGNALS: Signal[] = [
    {icon: 'timer', label: '3.0s', color: C.accent, from: [SCREEN.x + SCREEN.w / 2, SCREEN.y + 70], ctrl: [520, 330], start: c6.start + 65},
    {icon: 'play', label: '100%', color: C.accent, from: [SCREEN.x + SCREEN.w - 60, SCREEN.y + SCREEN.h - 31], ctrl: [600, 1010], start: T.complete + 2},
    {icon: 'heart', label: '+1', color: C.accent, from: [SCREEN.x + SCREEN.w - 38, SCREEN.y + 380], ctrl: [600, 640], start: T.like + 4},
    {icon: 'arrowUp', label: '0.4s', color: C.gray, from: [SCREEN.x + SCREEN.w / 2, SCREEN.y + 180], ctrl: [560, 470], start: T.swipe2 + 7},
  ];

  const phoneIn = spr(f, T.enter, {damping: 15, stiffness: 120});
  const noteIn = spr(f, T.enter + 5, {damping: 15, stiffness: 120});

  // Feed: cat video → next video (swiped in) → flicked away after 0.4s → another cat.
  const sw1 = prog(f, T.swipe1, T.swipe1 + 10, easeInOutCubic);
  const sw2 = prog(f, T.swipe2, T.swipe2 + 7, easeInCubic);
  const feedOffset = -(sw1 + sw2) * SCREEN.h;
  const pages: {kind: IconKind; progress: number; like?: number}[] = [
    {kind: 'cat', progress: prog(f, T.enter + 4, T.complete), like: T.like},
    {kind: 'dumbbell', progress: 0.12 * prog(f, T.swipe1 + 10, T.swipe2)},
    {kind: 'cat', progress: 0.7 * prog(f, T.swipe2 + 7, T.burst + 70)},
  ];

  const timerVal = 3 * prog(f, T.timerStart, T.timerEnd);
  const timerPop = f >= T.timerEnd ? lerp(1.18, 1, spr(f, T.timerEnd, {damping: 8, stiffness: 300})) : 1;
  const timerVisible = f >= T.timerStart - 3 && f < SIGNALS[0].start;

  const scroll = 600 * easeInOutCubic(prog(f, T.burst + 6, T.burst + 52));
  const glow = f >= T.burst ? 0.35 + 0.35 * Math.sin((f - T.burst) / 3) : 0;
  const scan = ((f - T.enter) % 50) / 50;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <clipPath id="s04-log">
            <rect x={CLIP.x} y={CLIP.y} width={CLIP.w} height={CLIP.h} rx={20} />
          </clipPath>
        </defs>

        {/* phone */}
        <g transform={`translate(${(1 - phoneIn) * -560} 0)`}>
          <Phone id="s04" cx={PHONE.cx} cy={PHONE.cy} w={PHONE.w} h={PHONE.h}>
            {pages.map((p, k) => (
              <VideoPage key={k} top={SCREEN.y + k * SCREEN.h + feedOffset} kind={p.kind} progress={p.progress} f={f} like={p.like} />
            ))}
            {!bare && (
              <rect x={SCREEN.x} y={SCREEN.y + scan * SCREEN.h} width={SCREEN.w} height={3} fill={accentA(0.35)} />
            )}
            {timerVisible && (
              <g transform={`translate(${SCREEN.x + SCREEN.w / 2} ${SCREEN.y + 70}) scale(${timerPop * spr(f, T.timerStart - 3, {damping: 12, stiffness: 220})})`}>
                <rect x={-104} y={-33} width={208} height={66} rx={33} fill="rgba(11,15,13,0.9)" stroke={C.accent} strokeWidth={3} />
                <Icon kind="timer" x={-64} y={0} size={44} color={C.accent} hand={timerVal * 120} />
                <text x={-32} y={2} dominantBaseline="central" fontFamily={FONT_MONO} fontWeight={800} fontSize={38} fill={C.white}>
                  {`${timerVal.toFixed(1)}s`}
                </text>
              </g>
            )}
          </Phone>
        </g>

        {/* notebook */}
        <g transform={`translate(${(1 - noteIn) * 600} 0)`}>
          <rect
            x={NOTE.x}
            y={NOTE.y}
            width={NOTE.w}
            height={NOTE.h}
            rx={30}
            fill="#101512"
            stroke={glow > 0 ? accentA(glow) : C.cardBorder}
            strokeWidth={glow > 0 ? 5 : 3}
          />
          {Array.from({length: 8}, (_, k) => (
            <circle key={k} cx={NOTE.x + 46 + k * 50} cy={NOTE.y} r={11} fill={C.bg} stroke={C.grayLight} strokeWidth={3} />
          ))}
          <Icon kind="notebook" x={NOTE.x + 50} y={NOTE.y + 52} size={46} color={C.accent} cut="#101512" />
          <circle cx={NOTE.x + NOTE.w - 42} cy={NOTE.y + 52} r={10} fill={C.accent} opacity={Math.sin(f / 5) > 0 ? 1 : 0.25} />
          <line x1={NOTE.x + 24} y1={NOTE.y + 90} x2={NOTE.x + NOTE.w - 24} y2={NOTE.y + 90} stroke={C.cardBorder} strokeWidth={2} />
          <g clipPath="url(#s04-log)">
            {Array.from({length: 11}, (_, j) => (
              <line
                key={j}
                x1={NOTE.x + 28}
                x2={NOTE.x + NOTE.w - 28}
                y1={NOTE.y + 140 + j * 55}
                y2={NOTE.y + 140 + j * 55}
                stroke="#1A231F"
                strokeWidth={2}
              />
            ))}
            {SIGNALS.map((s, k) => {
              const land = s.start + FLY;
              if (f < land) return null;
              const b = spr(f, land, {damping: 9, stiffness: 260});
              return <Pill key={k} x={ROW.cx} y={ROW.ys[k] - scroll} icon={s.icon} label={s.label} color={s.color} scale={lerp(1.15, 1, b)} />;
            })}
            {Array.from({length: 13}, (_, j) => {
              const icons: IconKind[] = ['timer', 'play', 'heart', 'arrowUp'];
              const icon = icons[Math.floor(rnd(`ci${j}`) * 4)];
              const gray = icon === 'arrowUp';
              const label =
                icon === 'timer' ? `${rndRange(`cv${j}`, 0.3, 9).toFixed(1)}s` : icon === 'play' ? `${Math.round(rndRange(`cv${j}`, 12, 100))}%` : icon === 'heart' ? '+1' : `${rndRange(`cv${j}`, 0.2, 1.2).toFixed(1)}s`;
              return (
                <Pill key={j} x={ROW.cx} y={1130 + j * 64 - scroll} icon={icon} label={label} color={gray ? C.gray : C.accent} h={52} />
              );
            })}
          </g>
          {SIGNALS.map((s, k) => {
            const land = s.start + FLY;
            const r = prog(f, land, land + 14, easeOutCubic);
            if (r <= 0 || r >= 1) return null;
            return <circle key={k} cx={ROW.cx - ROW.w / 2 + ROW.h / 2} cy={ROW.ys[k]} r={30 + 60 * r} fill="none" stroke={s.color} strokeWidth={4} opacity={1 - r} />;
          })}
        </g>

        {/* signals in flight */}
        {SIGNALS.map((s, k) => {
          if (f < s.start || f >= s.start + FLY) return null;
          const p = easeInOutCubic(prog(f, s.start, s.start + FLY));
          const to: [number, number] = [ROW.cx, ROW.ys[k]];
          const [x, y] = quad(s.from, s.ctrl, to, p);
          return (
            <g key={k}>
              {[1, 2, 3, 4, 5].map((i) => {
                const [tx, ty] = quad(s.from, s.ctrl, to, Math.max(0, p - i * 0.045));
                return <circle key={i} cx={tx} cy={ty} r={9 - i * 1.3} fill={s.color} opacity={0.5 - i * 0.08} />;
              })}
              <Pill x={x} y={y} icon={s.icon} label={s.label} color={s.color} scale={lerp(0.7, 1, p)} />
            </g>
          );
        })}

        {/* "it remembers everything": a burst of data points */}
        {Array.from({length: 42}, (_, j) => {
          const start = T.burst + j * 1.2;
          const p = prog(f, start, start + 16, easeInOutCubic);
          if (p <= 0 || p >= 1) return null;
          const from: [number, number] = [rndRange(`dx${j}`, 170, 420), rndRange(`dy${j}`, 520, 1000)];
          const to: [number, number] = [rndRange(`tx${j}`, 580, 900), rndRange(`ty${j}`, 860, 1060)];
          const ctrl: [number, number] = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - rndRange(`cy${j}`, 80, 260)];
          const [x, y] = quad(from, ctrl, to, p);
          const size = rndRange(`ds${j}`, 9, 16);
          const gray = rnd(`dg${j}`) < 0.2;
          return (
            <rect
              key={j}
              x={x - size / 2}
              y={y - size / 2}
              width={size}
              height={size}
              rx={rnd(`dr${j}`) < 0.5 ? size / 2 : 3}
              fill={gray ? C.gray : C.accent}
              opacity={Math.min(1, (1 - p) * 4)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
