import React from 'react';
import {rnd} from '../lib/anim';
import {C, FONT_CN, accentA} from '../theme';

export interface Seg {
  text: string;
  emph: boolean;
}

/** Splits "你在「3秒」" into plain and emphasised runs. */
export const parseLine = (s: string): Seg[] => {
  const out: Seg[] = [];
  const re = /「([^」]*)」/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({text: s.slice(last, m.index), emph: false});
    out.push({text: m[1], emph: true});
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({text: s.slice(last), emph: false});
  return out;
};

export const EMPH_SCALE = 1.12;
const SPACE_EM = 0.35;

const charUnits = (ch: string) => {
  if (ch === ' ') return SPACE_EM;
  return /[⺀-鿿　-〿＀-￯]/.test(ch) ? 1 : 0.6;
};

/** Width of a line in em (CJK and full-width punctuation are 1em, Latin/digits ~0.6em). */
export const lineUnits = (segs: Seg[]) =>
  segs.reduce((a, s) => a + [...s.text].reduce((b, ch) => b + charUnits(ch), 0) * (s.emph ? EMPH_SCALE : 1), 0);

/**
 * Breaks a subtitle into lines and picks a font size that fits `maxWidth`.
 * '/' forces a break; otherwise a line that is too wide breaks at the breath space
 * closest to its middle, and only then does the font shrink.
 */
export const layoutText = (text: string, baseSize: number, maxWidth: number) => {
  let lines = text.split('/');
  if (lines.length === 1 && lineUnits(parseLine(text)) * baseSize > maxWidth && text.includes(' ')) {
    const chars = [...text];
    const mid = chars.length / 2;
    const spaces = chars.map((c, i) => (c === ' ' ? i : -1)).filter((i) => i >= 0);
    const at = spaces.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    lines = [chars.slice(0, at).join(''), chars.slice(at + 1).join('')];
  }
  const parsed = lines.map((l) => parseLine(l.trim()));
  const maxUnits = Math.max(...parsed.map(lineUnits));
  const size = Math.min(baseSize, Math.floor(maxWidth / maxUnits));
  return {lines: parsed, size};
};

/** Renders spaces as fixed-width gaps so flex layout cannot collapse them. */
const withGaps = (text: string, keyBase: string) =>
  text.split(' ').flatMap((part, i) => [
    ...(i > 0 ? [<span key={`${keyBase}g${i}`} style={{display: 'inline-block', width: `${SPACE_EM}em`}} />] : []),
    ...(part ? [<span key={`${keyBase}t${i}`}>{part}</span>] : []),
  ]);

interface GlitchProps {
  text: string;
  style: React.CSSProperties;
  f: number;
  /** 0 = clean, 1 = full glitch. */
  amount: number;
  seed: string;
}

/** Green/white split copies and horizontally displaced slices; deterministic per frame. */
export const GlitchText: React.FC<GlitchProps> = ({text, style, f, amount, seed}) => {
  const base = <span style={{...style, whiteSpace: 'nowrap'}}>{text}</span>;
  if (amount <= 0.01) return base;
  const k = Math.floor(f);
  const layer = (extra: React.CSSProperties, key: string) => (
    <span key={key} aria-hidden style={{...style, position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', ...extra}}>
      {text}
    </span>
  );
  const slices = [0, 1, 2].map((i) => {
    const top = rnd(`${seed}t${k}-${i}`) * 78;
    const h = 7 + rnd(`${seed}h${k}-${i}`) * 20;
    const dx = (rnd(`${seed}x${k}-${i}`) * 2 - 1) * 46 * amount;
    return layer(
      {
        transform: `translateX(${dx}px)`,
        color: i % 2 ? C.white : C.accent,
        clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`,
        textShadow: 'none',
      },
      `s${i}`,
    );
  });
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      {base}
      {layer({transform: `translateX(${-10 * amount}px)`, color: C.accent, opacity: 0.6 * amount, textShadow: 'none'}, 'a')}
      {layer({transform: `translateX(${10 * amount}px)`, color: C.white, opacity: 0.45 * amount, textShadow: 'none'}, 'b')}
      {slices}
    </span>
  );
};

interface RichLineProps {
  segs: Seg[];
  size: number;
  color?: string;
  /** 0→1 progress of the highlighter bar under emphasised words. */
  marker?: number;
  /** Extra scale on emphasised words (for a pop). */
  emphPop?: number;
  glitch?: {f: number; amount: number; seed: string};
}

const SHADOW = '0 6px 22px rgba(0,0,0,0.75)';
export const ACCENT_GLOW = `0 0 26px ${accentA(0.45)}, 0 6px 22px rgba(0,0,0,0.6)`;

/** One subtitle line; emphasised runs are green, larger and underlined by a marker bar. */
export const RichLine: React.FC<RichLineProps> = ({segs, size, color = C.white, marker = 1, emphPop = 1, glitch}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'baseline',
      whiteSpace: 'nowrap',
      fontFamily: FONT_CN,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.25,
      color,
      textShadow: SHADOW,
    }}
  >
    {segs.map((s, i) =>
      s.emph ? (
        <span
          key={i}
          style={{
            position: 'relative',
            display: 'inline-block',
            isolation: 'isolate',
            fontSize: size * EMPH_SCALE,
            color: C.accent,
            textShadow: ACCENT_GLOW,
            transform: `scale(${emphPop})`,
            transformOrigin: '50% 70%',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '-0.06em',
              right: '-0.06em',
              bottom: '0.1em',
              height: '0.3em',
              background: accentA(0.22),
              borderRadius: '0.08em',
              transform: `scaleX(${marker})`,
              transformOrigin: 'left center',
              zIndex: -1,
            }}
          />
          {glitch ? (
            <GlitchText text={s.text} style={{}} f={glitch.f} amount={glitch.amount} seed={`${glitch.seed}${i}`} />
          ) : (
            withGaps(s.text, `e${i}`)
          )}
        </span>
      ) : (
        <span key={i} style={{display: 'inline-flex', alignItems: 'baseline'}}>
          {withGaps(s.text, `p${i}`)}
        </span>
      ),
    )}
  </div>
);
