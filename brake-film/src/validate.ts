import {FPS, SCENES, SUBTITLE_FADE_IN, SUBTITLE_FADE_OUT} from './data';
import * as DATA from './data';

/**
 * 对 data.ts 做一遍体检，有问题时在 Studio 里直接报错：
 * 1. 分场首尾相接；2. 每条字幕完全可见不少于 2 秒、互不重叠、不超出本场；
 * 3. 全部文字里不出现破折号。
 */
export const validateData = (): string[] => {
  const errors: string[] = [];
  SCENES.forEach((s, i) => {
    if (i > 0 && Math.abs(SCENES[i - 1].end - s.start) > 1e-6) {
      errors.push(`第${s.index}场开始时间 ${s.start} 与上一场结束 ${SCENES[i - 1].end} 不相接`);
    }
    const dur = s.end - s.start;
    s.subtitles.forEach((sub, k) => {
      const full = Math.round(sub.to * FPS) - Math.round(sub.from * FPS) - SUBTITLE_FADE_IN - SUBTITLE_FADE_OUT;
      if (full < 2 * FPS) {
        errors.push(`第${s.index}场字幕「${sub.text}」完全可见只有 ${(full / FPS).toFixed(2)} 秒，少于 2 秒`);
      }
      if (sub.to > dur + 1e-6 || sub.from < 0) {
        errors.push(`第${s.index}场字幕「${sub.text}」超出本场时间范围`);
      }
      const next = s.subtitles[k + 1];
      if (next && next.from < sub.to - 1e-6) {
        errors.push(`第${s.index}场字幕「${sub.text}」与下一条重叠`);
      }
    });
  });
  const all = JSON.stringify(DATA);
  if (/[—–―]|—|―|⸺|⸻|﹘|－/.test(all)) {
    errors.push('data.ts 的文字里出现了破折号');
  }
  return errors;
};
