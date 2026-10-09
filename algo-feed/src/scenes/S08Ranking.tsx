import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icon, type IconKind} from '../components/Icons';
import {Phone, PHONE_INSET} from '../components/Phone';
import {easeInCubic, easeInOutCubic, easeOutCubic, lerp, prog, spr} from '../lib/anim';
import {useBare} from '../lib/context';
import {cue} from '../timeline';
import {C, FONT_MONO, accentA} from '../theme';
import {WIN_PHONE} from './S08Ranking.layout';

const CARDS: {icon: IconKind; score: number}[] = [
  {icon: 'cat', score: 92},
  {icon: 'note', score: 41},
  {icon: 'cat', score: 78},
  {icon: 'bowl', score: 23},
  {icon: 'gamepad', score: 65},
];
const ORDER = CARDS.map((_, i) => i).sort((a, b) => CARDS[b].score - CARDS[a].score);
const RANK = CARDS.map((_, i) => ORDER.indexOf(i));
const WINNER = ORDER[0];

const CARD = {x: 210, w: 740, h: 124};
const BAR = {x: 132, w: 400};
const slotY = (k: number) => 432 + k * 150;
const SCAN = {y0: 380, y1: 1120};
const VIDEO_BG = '#14201A';

const c16 = cue(16);
const c17 = cue(17);
const c18 = cue(18);
const c19 = cue(19);
const c20 = cue(20);
const T = {
  enter: c16.start - 6,
  scan0: c17.start + 2,
  scan1: c17.start + 36,
  emph: c18.start,
  sort: c19.start + 3,
  ranks: c19.start + 20,
  win: c20.start + 3,
  phone: c20.start + 24,
};

const scoreStart = (i: number) => T.scan0 + ((slotY(i) - SCAN.y0) / (SCAN.y1 - SCAN.y0)) * (T.scan1 - T.scan0);

/** 28.2–36.7s: each card gets a "will you finish it?" score, they re-queue, #1 goes to your phone. */
export const S08Ranking: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();

  const scanP = prog(f, T.scan0, T.scan1);
  const scanY = lerp(SCAN.y0, SCAN.y1, scanP);
  const phoneS = spr(f, T.phone, {damping: 12, stiffness: 150});
  const phoneO = prog(f, T.phone, T.phone + 6);
  const pulse = 0.5 + 0.5 * Math.sin((f - T.emph) / 3.5);

  const cards = CARDS.map((card, i) => {
    const rank = RANK[i];
    const isWin = i === WINNER;
    const enter = spr(f, T.enter + i * 4, {damping: 14, stiffness: 140});
    const move = spr(f, T.sort + rank * 2, {damping: 14, stiffness: 120});
    const rawMove = prog(f, T.sort + rank * 2, T.sort + rank * 2 + 18);
    let y = lerp(slotY(i), slotY(rank), move);
    let x = CARD.x + (1 - enter) * 700 + Math.sin(Math.PI * rawMove) * (rank < i ? -30 : rank > i ? 30 : 0);
    let scale = 1 + 0.04 * Math.sin(Math.PI * rawMove);
    let opacity = Math.min(1, enter * 1.5);
    if (isWin) {
      // The others clear out first, then #1 travels down into the phone.
      const go = prog(f, T.win + 8, T.win + 22, easeInOutCubic);
      y = lerp(y, WIN_PHONE.cy, go);
      x = lerp(x, 540 - CARD.w / 2, go);
      scale *= lerp(1, 1.06, go) * lerp(1, 0.45, prog(f, T.phone, T.phone + 10, easeInCubic));
      opacity *= 1 - prog(f, T.phone + 2, T.phone + 10);
    } else {
      const out = prog(f, T.win + rank * 1.5, T.win + rank * 1.5 + 10, easeInCubic);
      x += out * 820;
      opacity *= 1 - out;
    }
    const sp = easeOutCubic(prog(f, scoreStart(i), scoreStart(i) + 14));
    const scored = f >= scoreStart(i);
    const hot = card.score >= 70;
    const top = isWin && f >= T.emph;
    return {card, i, rank, x, y, scale, opacity, sp, scored, hot, top, moving: rawMove > 0 && rawMove < 1};
  });
  // Cards moving up are drawn on top while the queue re-sorts.
  const drawOrder = [...cards].sort((a, b) => Number(a.moving && a.rank < a.i) - Number(b.moving && b.rank < b.i));

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {drawOrder.map(({card, i, x, y, scale, opacity, sp, scored, hot, top}) => {
          if (opacity <= 0.01) return null;
          const cy = CARD.h / 2;
          return (
            <g key={i} transform={`translate(${x + CARD.w / 2} ${y}) scale(${scale}) translate(${-CARD.w / 2} 0)`} opacity={opacity}>
              {top && !bare && <rect x={-10} y={-cy - 10} width={CARD.w + 20} height={CARD.h + 20} rx={34} fill={accentA(0.1 + 0.12 * pulse)} />}
              <rect x={0} y={-cy} width={CARD.w} height={CARD.h} rx={26} fill={C.card} stroke={top ? C.accent : C.cardBorder} strokeWidth={top ? 5 : 3} />
              <rect x={16} y={-46} width={92} height={92} rx={20} fill={C.cardDeep} />
              <Icon kind={card.icon} x={62} y={0} size={64} color={card.icon === 'cat' ? C.accent : C.grayLight} cut={C.cardDeep} />
              <rect x={BAR.x} y={-8} width={BAR.w} height={16} rx={8} fill={C.track} />
              <rect x={BAR.x} y={-8} width={BAR.w * (card.score / 100) * sp} height={16} rx={8} fill={hot ? C.accent : C.grayLight} />
              <text
                x={CARD.w - 28}
                y={3}
                textAnchor="end"
                dominantBaseline="central"
                fontFamily={FONT_MONO}
                fontWeight={800}
                fontSize={50}
                fill={scored ? (hot ? C.accent : C.white) : C.gray}
                opacity={scored ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(f / 5 + i))}
              >
                {scored ? `${Math.round(card.score * sp)}%` : '?'}
              </text>
            </g>
          );
        })}

        {scanP > 0 && f < T.scan1 + 5 && (
          <g opacity={1 - prog(f, T.scan1, T.scan1 + 5)}>
            {!bare && <rect x={180} y={scanY - 26} width={800} height={52} fill={accentA(0.1)} />}
            <rect x={180} y={scanY - 3} width={800} height={6} rx={3} fill={C.accent} />
          </g>
        )}

        {ORDER.map((_, r) => {
          const pop = spr(f, T.ranks + r * 3, {damping: 9, stiffness: 240});
          const out = prog(f, T.win, T.win + 10);
          if (f < T.ranks + r * 3) return null;
          return (
            <text
              key={r}
              x={150}
              y={slotY(r) + 3}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={FONT_MONO}
              fontWeight={800}
              fontSize={58}
              fill={r === 0 ? C.accent : C.gray}
              opacity={1 - out}
              transform={`translate(150 ${slotY(r)}) scale(${pop}) translate(-150 ${-slotY(r)})`}
            >
              {r + 1}
            </text>
          );
        })}

        {f >= T.phone && (
          <g opacity={phoneO} transform={`translate(${WIN_PHONE.cx} ${WIN_PHONE.cy}) scale(${lerp(0.55, 1, phoneS)}) translate(${-WIN_PHONE.cx} ${-WIN_PHONE.cy})`}>
            {!bare &&
              Array.from({length: 14}, (_, k) => {
                const p = prog(f, T.phone + 4, T.phone + 26, easeOutCubic);
                const a = (k / 14) * Math.PI * 2;
                const d = 250 + 190 * p;
                return (
                  <rect
                    key={k}
                    x={WIN_PHONE.cx + Math.cos(a) * d - 6}
                    y={WIN_PHONE.cy + Math.sin(a) * d * 1.3 - 6}
                    width={12}
                    height={12}
                    fill={C.accent}
                    opacity={p > 0 ? 1 - p : 0}
                  />
                );
              })}
            <Phone id="s08" cx={WIN_PHONE.cx} cy={WIN_PHONE.cy} w={WIN_PHONE.w} h={WIN_PHONE.h} stroke={C.accent}>
              <rect x={WIN_PHONE.cx - WIN_PHONE.w / 2} y={WIN_PHONE.cy - WIN_PHONE.h / 2} width={WIN_PHONE.w} height={WIN_PHONE.h} fill={VIDEO_BG} />
              <circle cx={WIN_PHONE.cx} cy={WIN_PHONE.cy - 40} r={150} fill={accentA(0.1)} />
              <Icon kind="cat" x={WIN_PHONE.cx} y={WIN_PHONE.cy - 40 + Math.sin(f / 8) * 9} size={210} color={C.accent} cut={VIDEO_BG} rotate={Math.sin(f / 13) * 4} />
              <rect x={WIN_PHONE.cx - WIN_PHONE.w / 2 + PHONE_INSET + 18} y={WIN_PHONE.cy + WIN_PHONE.h / 2 - PHONE_INSET - 34} width={WIN_PHONE.w - 2 * PHONE_INSET - 36} height={7} rx={3.5} fill={C.track} />
              <rect
                x={WIN_PHONE.cx - WIN_PHONE.w / 2 + PHONE_INSET + 18}
                y={WIN_PHONE.cy + WIN_PHONE.h / 2 - PHONE_INSET - 34}
                width={(WIN_PHONE.w - 2 * PHONE_INSET - 36) * prog(f, T.phone, T.phone + 120)}
                height={7}
                rx={3.5}
                fill={C.accent}
              />
            </Phone>
            <g transform={`translate(${WIN_PHONE.cx + WIN_PHONE.w / 2 - 18} ${WIN_PHONE.cy - WIN_PHONE.h / 2 + 30}) scale(${spr(f, T.phone + 8, {damping: 8, stiffness: 260})})`}>
              <circle r={42} fill={C.accent} />
              <text y={3} textAnchor="middle" dominantBaseline="central" fontFamily={FONT_MONO} fontWeight={800} fontSize={50} fill={C.bg}>
                1
              </text>
            </g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
