import React from 'react';
import {Audio, getStaticFiles, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {AUDIO, FPS, TOTAL_FRAMES} from '../data';
import {bgmEnvelope, buildCues} from './cues';

/** public/ 里是否有这个文件；没有就不挂音频，保证缺文件时也能正常渲染 */
const hasFile = (path: string) => {
  try {
    return getStaticFiles().some((f) => f.name === path);
  } catch {
    return false;
  }
};

/**
 * 两条音频轨：背景音乐（BGM）与音效（SFX）。
 * 文件缺失时仍然保留同名的空 Sequence，在 Studio 时间线上能看到每个触发点。
 */
export const AudioTracks: React.FC = () => {
  // 全片绝对帧。背景音乐循环播放时，音量回调收到的是「本轮循环内」的帧号，
  // 所以包络一律按这里的绝对帧计算，保证冲破后的静音一拍和片尾淡出落在正确位置。
  const frame = useCurrentFrame();
  const cues = buildCues();
  const bgmOk = hasFile(AUDIO.bgm.file);
  return (
    <>
      <Sequence name={`♪ 背景音乐 ${AUDIO.bgm.file}${bgmOk ? '' : '（缺文件）'}`} layout="none">
        {bgmOk ? (
          <Audio
            src={staticFile(AUDIO.bgm.file)}
            loop
            volume={() => AUDIO.bgm.volume * bgmEnvelope(frame, TOTAL_FRAMES)}
          />
        ) : null}
      </Sequence>
      {cues.map((c, i) => {
        const def = AUDIO.sfx[c.sfx];
        const ok = hasFile(def.file);
        return (
          <Sequence
            key={i}
            from={Math.round(c.at * FPS)}
            durationInFrames={Math.max(1, Math.round(c.length * FPS))}
            name={`♪ ${c.note}${ok ? '' : '（缺 ' + def.file + '）'}`}
            layout="none"
          >
            {ok ? (
              <Audio
                src={staticFile(def.file)}
                volume={def.volume * (c.gain ?? 1)}
                playbackRate={c.playbackRate ?? 1}
              />
            ) : null}
          </Sequence>
        );
      })}
    </>
  );
};
