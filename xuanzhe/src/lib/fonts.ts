/**
 * 字体：Noto Serif SC（字幕、画面文字），Noto Sans SC（时钟、角标）。
 * 字体文件随 npm 包本地打包，渲染时不需要联网。
 * 渲染前用 delayRender 等全片用到的字都加载完，避免第一帧掉字。
 */
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import '@fontsource/noto-sans-sc/100.css';
import '@fontsource/noto-sans-sc/400.css';
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {CLOCK, LABELS, PART1, PART2, SHOTS} from '../config/timeline';

const collectText = () => {
  const parts: string[] = [CLOCK.text, '0123456789:'];
  for (const s of SHOTS) {
    parts.push(s.subtitle, s.citation ?? '');
  }
  parts.push(PART1.outro?.subtitle ?? '', PART2.intro?.subtitle ?? '');
  for (const v of Object.values(LABELS)) {
    parts.push(Array.isArray(v) ? v.join('') : v);
  }
  return Array.from(new Set(Array.from(parts.join('').replace(/[｜\s]/g, '')))).join('');
};

const FACES = ['400 46px "Noto Serif SC"', '600 46px "Noto Serif SC"', '100 40px "Noto Sans SC"', '400 18px "Noto Sans SC"'];

export const useFontsReady = () => {
  const [handle] = useState(() => delayRender('加载字体', {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    const text = collectText();
    Promise.all(FACES.map((f) => document.fonts.load(f, text)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [handle]);
};
