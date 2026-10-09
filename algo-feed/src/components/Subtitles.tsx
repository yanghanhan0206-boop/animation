import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeInCubic, easeOutBack, easeOutCubic, keys, prog} from '../lib/anim';
import {REVERSE_LOCK} from '../lib/transitions';
import {CUES, type Cue} from '../timeline';
import {L} from '../theme';
import {RichLine, layoutText} from './Text';

const BASE_SIZE = 88;
const LINE_HEIGHT = 1.25;

/** Per-line overrides: the closing lines are set larger. */
const OVERRIDES: Record<number, {size?: number; glitch?: boolean}> = {
  27: {size: 100},
  28: {size: 100, glitch: true},
  29: {size: 96},
};

const glitchAmount = (c: Cue, f: number) => {
  const t = f - c.start;
  return Math.max(
    keys(t, [0, 1, 7], [0, 0.8, 0]),
    keys(f, [REVERSE_LOCK - 1, REVERSE_LOCK, REVERSE_LOCK + 10], [0, 1, 0]),
    t > 22 && t % 11 < 1.5 ? 0.45 : 0,
  );
};

const Block: React.FC<{c: Cue; f: number}> = ({c, f}) => {
  const o = OVERRIDES[c.id] ?? {};
  const {lines, size} = layoutText(c.text, o.size ?? BASE_SIZE, L.subMaxWidth);
  const t = f - c.start;
  const isLast = c.id === CUES.length;
  const enter = easeOutBack(prog(t, 0, 9));
  const fadeIn = prog(t, 0, 4);
  // Lines hand over to the next one: the old line drifts up while the new one rises in.
  const exit = isLast ? 0 : prog(f, c.end - 2, c.end + 4, easeInCubic);
  const marker = prog(t, 5, 14, easeOutCubic);
  const pop = 1 + 0.1 * Math.sin(Math.PI * prog(t, 4, 14)) + (isLast ? 0.045 * Math.sin(Math.max(0, t - 14) / 5) : 0);
  const blockH = lines.length * size * LINE_HEIGHT;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: L.W,
        top: L.subCy - blockH / 2,
        height: blockH,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: fadeIn * (1 - exit),
        transform: `translateY(${(1 - enter) * 34 - exit * 30}px) scale(${0.92 + 0.08 * enter})`,
      }}
    >
      {lines.map((segs, i) => (
        <RichLine
          key={i}
          segs={segs}
          size={size}
          marker={marker}
          emphPop={pop}
          glitch={o.glitch ? {f, amount: glitchAmount(c, f), seed: `sub${c.id}`} : undefined}
        />
      ))}
    </div>
  );
};

/** Regular subtitles and the closing question; hook and title lines are drawn by their shots. */
export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const visible = CUES.filter(
    (c) => (c.mode === 'sub' || c.mode === 'question') && f >= c.start && f < c.end + 5,
  );
  return (
    <>
      {visible.map((c) => (
        <Block key={c.id} c={c} f={f} />
      ))}
    </>
  );
};
