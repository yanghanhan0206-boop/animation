import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AutumnWind} from '../frames/AutumnWind';
import {Departure} from '../frames/Departure';
import {Fork} from '../frames/Fork';
import {Lethe} from '../frames/Lethe';
import {LoveSong, type LoveSongVariant} from '../frames/LoveSong';
import {NineAM} from '../frames/NineAM';
import {loadFonts} from '../fonts';
import {easeInOutSine, easeOutCubic, keysFlash, lerp, prog} from './mvAnim';
import {Candle} from './scenes/Candle';
import {ChatReply} from './scenes/ChatReply';
import {Days} from './scenes/Days';
import {Gratitude} from './scenes/Gratitude';
import {MicClose} from './scenes/MicClose';
import {Problem} from './scenes/Problem';
import {Receipt} from './scenes/Receipt';
import {Sanctuary} from './scenes/Sanctuary';
import {Sky} from './scenes/Sky';
import {Supper} from './scenes/Supper';
import {TheEnd} from './scenes/TheEnd';
import {Vinyl} from './scenes/Vinyl';
import {Opening} from '../scenes/Opening';
import {Lyrics} from './Lyrics';
import {FPS, type Shot, bar, shotAt} from './timeline';

/** Camera distance along the road for the two fork shots. */
const forkCam = (v: string | undefined, t: number, dur: number) =>
  v === 'fly'
    ? t < 3.4
      ? lerp(-60, 1.5, easeOutCubic(t / 3.4))
      : lerp(1.5, 4, easeInOutSine(Math.min(1, (t - 3.4) / (dur - 3.4))))
    : lerp(0, 4.5, easeInOutSine(t / dur));

const Scene: React.FC<{shot: Shot; t: number}> = ({shot, t}) => {
  const dur = shot.end - shot.start;
  switch (shot.scene) {
    case 'love-song':
      return <LoveSong t={t} v={shot.v as LoveSongVariant} dur={dur} />;
    case 'mic':
      return <MicClose t={t} dur={dur} v={shot.v} />;
    case 'fork':
      return <Fork t={t} text={false} camZ={forkCam(shot.v, t, dur)} />;
    case 'supper':
      return <Supper t={t} dur={dur} />;
    case 'sanctuary':
      return <Sanctuary t={t} dur={dur} v={shot.v} />;
    case 'problem':
      return <Problem t={t} dur={dur} />;
    case 'candle':
      return <Candle t={t} dur={dur} />;
    case 'the-end':
      return <TheEnd t={t} dur={dur} />;
    case 'departure':
      return <Departure t={t} text={false} mode="flip" />;
    case 'chat':
      return shot.v === 'reply' ? <ChatReply t={t} dur={dur} /> : <NineAM t={t} text={false} mode="night" />;
    case 'sky':
      return <Sky t={t} dur={dur} />;
    case 'days':
      return <Days t={t} dur={dur} />;
    case 'memory':
      return <Gratitude t={t} dur={dur} />;
    case 'title':
      return <Opening t={t} v="title" />;
    case 'dawn-chat':
      return <NineAM t={t + 3} text={false} mode="dawn" />;
    case 'autumn':
      return <AutumnWind t={t + 1.2} text={false} />;
    case 'vinyl':
      return <Vinyl t={t} dur={dur} />;
    case 'lethe':
      return <Lethe t={t} />;
    case 'receipt':
      return <Receipt t={t} dur={dur} />;
    case 'farewell':
      return <Departure t={t} text={false} mode="departed" />;
    case 'ending':
      return <LoveSong t={t} v="ending" dur={dur} />;
    default:
      return null;
  }
};

const DROP = bar(8);
const VERSE = bar(16);

export const MV: React.FC = () => {
  loadFonts();
  const time = useCurrentFrame() / FPS;
  const shot = shotAt(time);
  const t = time - shot.start;
  // Hits: a bright flash on the drop, a softer one where the verse comes in.
  const flash = Math.max(keysFlash(time, DROP, 0.85, 0.45), keysFlash(time, VERSE, 0.35, 0.3));
  // The very first frames rise out of black.
  const intro = prog(time, 0, 0.6, easeInOutSine);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: intro}}>
        <Scene shot={shot} t={t} />
      </AbsoluteFill>
      <Lyrics time={time} />
      {flash > 0.002 && <AbsoluteFill style={{background: '#FFF6E4', opacity: flash}} />}
    </AbsoluteFill>
  );
};
