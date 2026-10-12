/** 字幕：居中偏下，逐字淡入，整体溶解淡出 */
import React from 'react';
import {FPS, SUBTITLE_STYLE as ST} from '../timeline';
import {COLORS, FONT_FAMILY} from '../theme';
import {easeInOutSine, ramp} from '../lib/math';
import {SUBTITLES} from '../sim/subtitles';

export const Subtitles: React.FC<{t: number}> = ({t}) => {
  const seg = SUBTITLES.find((s) => t >= s.start && t < s.gone);
  if (!seg) return null;
  const out = ramp(t, seg.end, seg.gone, easeInOutSine);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: ST.centerY - ST.fontSize * 0.75,
        height: ST.fontSize * 1.5,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: FONT_FAMILY,
        fontWeight: 500,
        fontSize: ST.fontSize,
        color: COLORS.text,
        letterSpacing: `${0.14 + out * 0.06}em`,
        opacity: 1 - out,
        filter: out > 0.01 ? `blur(${out * 4}px)` : undefined,
        textShadow: '0 0 14px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7)',
        whiteSpace: 'pre',
      }}
    >
      {[...seg.text].map((c, i) => {
        const t0 = seg.start + (i * ST.charStagger) / FPS;
        const u = ramp(t, t0, t0 + ST.charFade / FPS, easeInOutSine);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: u,
              transform: `translateY(${(1 - u) * 7}px)`,
              filter: u < 0.99 ? `blur(${(1 - u) * 3}px)` : undefined,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};
