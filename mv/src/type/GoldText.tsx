import React from 'react';
import {clamp, easeOutCubic, lerp, prog} from '../lib/anim';
import {SERIF_CN} from '../theme';

export interface GoldTextProps {
  text: string;
  /** Centre of the text block. */
  x: number;
  y: number;
  size: number;
  weight?: number;
  /** Extra space between characters, in em. */
  spacing?: number;
  vertical?: boolean;
  font?: string;
  /** Seconds since the text started appearing. */
  t: number;
  /** Seconds between consecutive characters starting to appear. */
  stagger?: number;
  /** Seconds each character takes to come into focus. */
  reveal?: number;
  /** Blur (px) a character starts from. */
  blur?: number;
  /** Distance (px) a character drifts in from, along the reading direction. */
  drift?: number;
  /** 0..1 exit: characters blur out and fade, in reading order. */
  out?: number;
  /** Position of the travelling highlight, 0..1 across the block (outside that range: none). */
  sweep?: number;
  /** Glow strength 0..1. */
  glow?: number;
  opacity?: number;
  /** Flat colour instead of gold leaf (e.g. warm white for secondary lines). */
  flat?: string;
}

// Gold leaf: lighter at the top of each glyph, darker below, with a small rebound at the
// bottom edge the way metal catches light; one shared gradient across the whole block.
const LEAF = 'linear-gradient(180deg, #FFF1CC 0%, #E8C886 26%, #C29A55 52%, #86622C 78%, #C9A260 100%)';

/** Length of a line of n glyphs along its reading direction. */
export const lineLength = (n: number, size: number, spacing: number) => n * size + (n - 1) * size * spacing;

/** Centre x for a horizontal line whose first glyph starts at `left`. */
export const fromLeft = (text: string, left: number, size: number, spacing: number) =>
  left + lineLength([...text].length, size, spacing) / 2;

/** Gold lettering revealed glyph by glyph, from soft focus to sharp, with a slow highlight sweep. */
export const GoldText: React.FC<GoldTextProps> = ({
  text,
  x,
  y,
  size,
  weight = 500,
  spacing = 0.12,
  vertical = false,
  font = SERIF_CN,
  t,
  stagger = 0.12,
  reveal = 1.1,
  blur = 14,
  drift = 18,
  out = 0,
  sweep = -1,
  glow = 0.5,
  opacity = 1,
  flat,
}) => {
  const chars = [...text];
  const n = chars.length;
  const adv = size * (1 + spacing);
  const len = n * size + (n - 1) * size * spacing;
  const band = Math.max(size * 1.6, len * 0.35);
  const sweepPos = sweep * (len + band * 2) - band;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        opacity,
        filter: glow > 0 ? `drop-shadow(0 0 ${size * 0.22 * glow}px rgba(214,178,110,${0.38 * glow}))` : undefined,
      }}
    >
      {chars.map((ch, i) => {
        const along = i * adv;
        const left = vertical ? x - size / 2 : x - len / 2 + along;
        const top = vertical ? y - len / 2 + along : y - size / 2;
        const p = prog(t, i * stagger, i * stagger + reveal, easeOutCubic);
        const o = clamp(out * (1 + n * 0.15) - (i / n) * n * 0.15);
        const a = p * (1 - o);
        if (a <= 0.002) return null;
        const b = lerp(blur, 0, p) + o * blur;
        const d = (1 - p) * drift - o * drift * 0.6;
        const highlight =
          sweep >= 0 && sweep <= 1
            ? `linear-gradient(${vertical ? 180 : 90}deg, rgba(255,250,236,0) ${sweepPos - band / 2}px, rgba(255,250,236,0.85) ${sweepPos}px, rgba(255,250,236,0) ${sweepPos + band / 2}px)`
            : null;
        const bgSize = vertical ? `${size * 1.4}px ${len}px` : `${len}px ${size * 1.4}px`;
        const bgPos = vertical ? `0px ${-along}px` : `${-along}px 0px`;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left,
              top: top - size * 0.2,
              width: size,
              height: size * 1.4,
              lineHeight: `${size * 1.4}px`,
              textAlign: 'center',
              fontFamily: font,
              fontWeight: weight,
              fontSize: size,
              opacity: a,
              filter: b > 0.05 ? `blur(${b}px)` : undefined,
              transform: vertical ? `translateY(${d}px)` : `translateX(${d}px)`,
              ...(flat
                ? {color: flat}
                : {
                    color: 'transparent',
                    backgroundImage: highlight ? `${highlight}, ${LEAF}` : LEAF,
                    backgroundSize: highlight ? `${bgSize}, ${size * 1.4}px ${size * 1.4}px` : `${size * 1.4}px ${size * 1.4}px`,
                    backgroundPosition: highlight ? `${bgPos}, 0px 0px` : '0px 0px',
                    backgroundRepeat: 'no-repeat',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};
