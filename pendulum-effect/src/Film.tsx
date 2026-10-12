/**
 * 全片：一个连续长镜头。
 *   背景 → [震屏]{ 大摆锤(屏幕) → [镜头]{ 镜头元素(后) → 家长的摆锤 → 镜头元素(前) } → 标题(屏幕) → 粒子 → 字幕 } → 暗角 → 颗粒
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Sequence, cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {FPS, HEIGHT, S6, WIDTH} from './timeline';
import {COLORS} from './theme';
import {ramp} from './lib/math';
import {loadFonts} from './fonts';
import {cameraAt, shakeAt} from './sim/camera';
import {Defs} from './components/Defs';
import {TextBlurDefs} from './components/GoldText';
import {HandDefs} from './components/Hand';
import {Subtitles} from './components/Subtitles';
import {Vignette} from './components/Vignette';
import {FilmGrain} from './components/FilmGrain';
import {MainPendulum, handPressure} from './scenes/MainPendulum';
import {SHOT_LIST, shotAt} from './shots';

const vignetteAt = (t: number) => 0.42 + 0.45 * (handPressure(t) / S6.hands.length) + 0.12 * ramp(t, 96, 100);

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('加载 Noto Serif SC'));
  useEffect(() => {
    loadFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);

  const cam = cameraAt(t);
  const shake = shakeAt(t);
  const {Component: Shot} = shotAt(t);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      {/* Studio 时间线上的镜头标记，方便定位 */}
      {SHOT_LIST.map(({def}) => (
        <Sequence key={def.name} name={def.name} from={Math.round(def.start * FPS)} durationInFrames={Math.round((def.end - def.start) * FPS)} layout="none">
          <></>
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(212,175,55,0.035) 0%, rgba(212,175,55,0) 70%)',
        }}
      />
      {ready ? (
        <AbsoluteFill style={{transform: `translate(${shake.x}px, ${shake.y}px)`}}>
          <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <Defs />
            <TextBlurDefs />
            <HandDefs />
            <Shot t={t} cam={cam} layer="screenBack" />
            <g transform={`translate(${cam.px} ${cam.py}) scale(${cam.zoom})`}>
              <Shot t={t} cam={cam} layer="worldBack" />
              <MainPendulum t={t} cam={cam} />
              <Shot t={t} cam={cam} layer="worldFront" />
            </g>
            <Shot t={t} cam={cam} layer="screenFront" />
          </svg>
          <Shot t={t} cam={cam} layer="overlay" />
          <Subtitles t={t} />
        </AbsoluteFill>
      ) : null}
      <Vignette strength={vignetteAt(t)} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
