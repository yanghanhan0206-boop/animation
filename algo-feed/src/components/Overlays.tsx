import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {keys, rnd} from '../lib/anim';
import {useBare} from '../lib/context';
import {CUT, FLASHES} from '../lib/transitions';
import {L} from '../theme';

/** White flashes that punctuate the hard hits (lock-on, zoom-through, collapse). */
export const Flashes: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  if (bare) return null;
  const opacity = Math.max(0, ...FLASHES.map((fl) => keys(f, [fl.at - fl.rise, fl.at, fl.at + fl.fall], [0, fl.peak, 0])));
  if (opacity <= 0.001) return null;
  return <AbsoluteFill style={{background: '#F4FFF0', opacity}} />;
};

const GLITCH_AT = [CUT.s10];

/** A few frames of displaced green/white bars across the frame at the glitch cut. */
export const GlitchBars: React.FC = () => {
  const f = useCurrentFrame();
  const bare = useBare();
  const hit = GLITCH_AT.find((at) => f >= at - 3 && f <= at + 4);
  if (bare || hit === undefined) return null;
  return (
    <AbsoluteFill>
      {Array.from({length: 7}, (_, i) => {
        const y = rnd(`gb${f}-${i}`) * 1920;
        const h = 6 + rnd(`gh${f}-${i}`) * 50;
        const x = (rnd(`gx${f}-${i}`) * 2 - 1) * 200;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 1080,
              height: h,
              background: i % 2 ? 'rgba(242,245,243,0.55)' : 'rgba(57,255,20,0.6)',
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Debug guide: platform UI zones in red, side margins, stage and subtitle bands. */
export const SafeZoneOverlay: React.FC = () => {
  const zone = (top: number, height: number, label: string) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top,
        width: L.W,
        height,
        background: 'rgba(255,0,72,0.30)',
        color: 'rgba(255,255,255,0.9)',
        font: '600 28px monospace',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </div>
  );
  const band = (top: number, bottom: number, color: string) => (
    <div
      style={{
        position: 'absolute',
        left: L.safeLeft,
        top,
        width: L.safeRight - L.safeLeft,
        height: bottom - top,
        border: `2px dashed ${color}`,
        boxSizing: 'border-box',
      }}
    />
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {zone(0, L.safeTop, `平台遮挡 0–${L.safeTop}`)}
      {zone(L.safeBottom, L.H - L.safeBottom, `平台遮挡 ${L.safeBottom}–${L.H}`)}
      {band(L.safeTop, L.safeBottom, 'rgba(255,214,0,0.8)')}
      {band(L.stageTop, L.stageBottom, 'rgba(0,200,255,0.55)')}
      {band(L.subTop, L.subBottom, 'rgba(255,140,0,0.7)')}
    </AbsoluteFill>
  );
};
