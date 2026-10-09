import React from 'react';
import {easeInCubic, easeOutCubic, lerp, prog} from '../lib/anim';
import {SERIF_CN, SERIF_EN} from '../theme';
import {DustText} from '../type/DustText';
import {CUES, type Cue} from './timeline';

// The lyric track: lower left, the same place in every shot. A small English line in
// italics, then one or two lines of Chinese; the last line is gold leaf. Glyphs come in
// from soft focus at the pace the words are sung and leave together at the end.

export const LYRIC_X = 210;
const Y_EN = 752;
const Y_1 = 812;
const Y_2 = 892;
const SIZE = 64;
const SPACING = 0.18;

const LEAF = 'linear-gradient(180deg, #FFF1CC 0%, #E8C886 26%, #C29A55 52%, #86622C 78%, #C9A260 100%)';
const isCjk = (ch: string) => /[⺀-鿿　-〿＀-￯]/.test(ch);

interface LineProps {
  text: string;
  top: number;
  t: number;
  /** Seconds the whole line takes to come in. */
  span: number;
  out: number;
  gold: boolean;
  size?: number;
  /** Characters at the end left out (drawn elsewhere, e.g. as dust). */
  trim?: number;
}

/** One line of Chinese (Latin words allowed), glyph by glyph from blur to sharp. */
export const LyricLine: React.FC<LineProps> = ({text, top, t, span, out, gold, size = SIZE, trim = 0}) => {
  const chars = [...text];
  const shown = chars.slice(0, chars.length - trim);
  const n = Math.max(1, chars.length);
  const stagger = Math.min(0.07, span / n);
  const reveal = Math.min(0.55, Math.max(0.3, span * 0.6));
  return (
    <div
      style={{
        position: 'absolute',
        left: LYRIC_X,
        top: top - size * 0.7,
        height: size * 1.4,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'pre',
        filter: gold ? 'drop-shadow(0 0 14px rgba(214,178,110,0.38))' : 'drop-shadow(0 2px 12px rgba(0,0,0,0.6))',
        opacity: 1 - out,
      }}
    >
      {shown.map((ch, i) => {
        const p = prog(t, i * stagger, i * stagger + reveal, easeOutCubic);
        const cjk = isCjk(ch);
        const space = ch === ' ';
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: cjk ? size : undefined,
              marginRight: cjk ? size * SPACING : space ? 0 : size * 0.02,
              textAlign: 'center',
              fontFamily: cjk ? SERIF_CN : SERIF_EN,
              fontWeight: gold ? 500 : 300,
              fontSize: cjk ? size : size * 1.08,
              lineHeight: `${size * 1.4}px`,
              opacity: p,
              filter: p < 0.99 ? `blur(${lerp(9, 0, p) + out * 8}px)` : out > 0 ? `blur(${out * 8}px)` : undefined,
              transform: `translateY(${(1 - p) * 12}px)`,
              ...(gold
                ? {color: 'transparent', backgroundImage: LEAF, WebkitBackgroundClip: 'text', backgroundClip: 'text'}
                : {color: '#EFE7DA'}),
            }}
          >
            {space ? ' ' : ch}
          </span>
        );
      })}
    </div>
  );
};

const EnLine: React.FC<{text: string; top: number; t: number; out: number}> = ({text, top, t, out}) => (
  <div
    style={{
      position: 'absolute',
      left: LYRIC_X + 2,
      top: top - 20,
      fontFamily: SERIF_EN,
      fontStyle: 'italic',
      fontSize: 30,
      letterSpacing: '0.18em',
      color: 'rgba(236,220,190,0.78)',
      opacity: prog(t, 0, 0.5) * (1 - out),
      filter: `blur(${(1 - prog(t, 0, 0.5)) * 6 + out * 6}px)`,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

const CueView: React.FC<{c: Cue; time: number}> = ({c, time}) => {
  const t = time - c.start;
  const dur = c.end - c.start;
  const out = prog(time, c.end - 0.28, c.end, easeInCubic);
  const zh = c.zh ?? [];
  const two = zh.length === 2;
  const slow = c.start < 24.4;
  const span = slow ? 1.1 : 0.55;
  const t2 = t - (c.zh2At ?? 0);
  const lastTop = Y_2;
  const enTop = two ? Y_EN : Y_1 + 20;
  const last = zh[zh.length - 1] ?? '';
  const dustChars = c.dust ? 2 : 0;
  // The blown-away glyphs appear in step with the rest of the line.
  const dustOffset = ([...last].length - dustChars) * Math.min(0.07, span / Math.max(1, [...last].length));
  return (
    <>
      {c.en && time < c.end && <EnLine text={c.en} top={enTop} t={t} out={out} />}
      {two && time < c.end && <LyricLine text={zh[0]} top={Y_1} t={t} span={span} out={out} gold={false} />}
      {last && time < c.end && (
        <LyricLine text={last} top={lastTop} t={two ? t2 : t} span={span} out={out} gold trim={dustChars} />
      )}
      {c.dust && (
        <DustText
          text={[...last].slice(-dustChars).join('')}
          x={LYRIC_X + ([...last].length - dustChars) * SIZE * (1 + SPACING) + ((dustChars * SIZE + (dustChars - 1) * SIZE * SPACING) / 2)}
          y={lastTop}
          size={SIZE}
          weight={500}
          spacing={SPACING}
          t={t2 - dustOffset}
          stagger={0.05}
          reveal={0.4}
          blur={9}
          dissolve={dur - (c.zh2At ?? 0) - 1.25 - dustOffset}
          dissolveDur={1.0}
          glow={0.8}
          wind={[320, -60]}
          seed={`dust${c.start}`}
        />
      )}
    </>
  );
};

/** Dust from a blown-away line keeps drifting across the next cut for this long. */
const DUST_TAIL = 1.4;

/** All lyric lines that are visible at `time` (seconds) and not drawn by their shot. */
export const Lyrics: React.FC<{time: number}> = ({time}) => (
  <>
    {CUES.filter((c) => !c.owned && time >= c.start && time < c.end + (c.dust ? DUST_TAIL : 0)).map((c) => (
      <CueView key={c.start} c={c} time={time} />
    ))}
  </>
);
