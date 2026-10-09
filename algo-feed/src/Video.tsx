import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Background} from './components/Background';
import {Header} from './components/Header';
import {Flashes, GlitchBars, SafeZoneOverlay} from './components/Overlays';
import {Subtitles} from './components/Subtitles';
import {TitleCard} from './components/TitleCard';
import {loadFonts} from './fonts';
import {BareContext} from './lib/context';
import {CUT, irisOpen, pushUp, wipeRight} from './lib/transitions';
import {S01Hook} from './scenes/S01Hook';
import {S02Bridge} from './scenes/S02Bridge';
import {S04Signals} from './scenes/S04Signals';
import {S06Recall} from './scenes/S06Recall';
import {S08Ranking} from './scenes/S08Ranking';
import {IRIS_CENTER} from './scenes/S08Ranking.layout';
import {S10Loop} from './scenes/S10Loop';
import {S11Reverse} from './scenes/S11Reverse';
import {S12Question} from './scenes/S12Question';
import {DURATION, STEPS} from './timeline';
import {C, FONT_CN, accentA} from './theme';

export interface VideoProps {
  /** Overlay the platform UI zones and layout bands. */
  debug: boolean;
  /** Black background, decoration off: only key content (used by QA). */
  bare: boolean;
  [key: string]: unknown;
}

const Layer: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={style}>{children}</AbsoluteFill>
);

export const Video: React.FC<VideoProps> = ({debug, bare}) => {
  loadFonts();
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;

  const push = pushUp(f, CUT.s04);
  const wipe = wipeRight(f, CUT.s06);
  const iris = irisOpen(f, CUT.s08, IRIS_CENTER.x, IRIS_CENTER.y);

  return (
    <BareContext.Provider value={bare}>
      <AbsoluteFill style={{background: bare ? '#000' : C.bg, fontFamily: FONT_CN, overflow: 'hidden'}}>
        <Background />

        {on(0, CUT.s01 + 8) && <S01Hook />}
        {on(CUT.s01 + 2, CUT.s02 + 8) && <S02Bridge />}
        {on(CUT.s02 - 8, CUT.s03 + 8) && <TitleCard step={STEPS[0]} zoomIn />}

        {on(CUT.s03 - 6, CUT.s04 + 9) && (
          <Layer style={{transform: `translateY(${push.outY}px)`}}>
            <S04Signals />
          </Layer>
        )}
        {on(CUT.s04 - 9, CUT.s05 + 8) && (
          <Layer style={{transform: `translateY(${push.inY}px)`}}>
            <TitleCard step={STEPS[1]} />
          </Layer>
        )}

        {on(CUT.s05 - 6, CUT.s06 + 9) && (
          <Layer style={{clipPath: wipe.outClip}}>
            <S06Recall />
          </Layer>
        )}
        {on(CUT.s06 - 9, CUT.s07 + 8) && (
          <Layer style={{clipPath: wipe.inClip}}>
            <TitleCard step={STEPS[2]} />
          </Layer>
        )}
        {!bare && wipe.p > 0 && wipe.p < 1 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: wipe.x - 34,
              width: 68,
              height: 1920,
              background: C.accent,
              boxShadow: `0 0 60px 20px ${accentA(0.55)}`,
            }}
          />
        )}

        {on(CUT.s07 - 6, CUT.s08 + 9) && (
          <Layer style={{transform: `scale(${iris.outScale})`, transformOrigin: `${IRIS_CENTER.x}px ${IRIS_CENTER.y}px`}}>
            <S08Ranking />
          </Layer>
        )}
        {on(CUT.s08 - 9, CUT.s09 + 8) && (
          <Layer style={{clipPath: iris.inClip}}>
            <TitleCard step={STEPS[3]} />
          </Layer>
        )}
        {!bare && iris.p > 0 && iris.p < 1 && (
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <circle cx={IRIS_CENTER.x} cy={IRIS_CENTER.y} r={iris.p * 2300} fill="none" stroke={C.accent} strokeWidth={14} />
          </svg>
        )}

        {on(CUT.s09 - 6, CUT.s10 + 10) && <S10Loop />}
        {on(CUT.s10 - 6, CUT.s11 + 14) && <S11Reverse />}
        {on(CUT.s11 - 2, DURATION) && <S12Question />}

        <Header />
        <Subtitles />
        <GlitchBars />
        <Flashes />
        {debug && <SafeZoneOverlay />}
      </AbsoluteFill>
    </BareContext.Provider>
  );
};
