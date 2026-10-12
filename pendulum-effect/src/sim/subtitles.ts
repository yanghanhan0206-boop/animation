/**
 * 字幕排程
 *  - 超过 maxChars（不计标点）的句子在标点处拆段（优先句号/问号处、两段尽量均衡），
 *    拆完仍过长就继续拆；
 *  - 逐字淡入（每字间隔 charStagger 帧），全部出现后至少停留 minHold 秒，再整体淡出；
 *  - 前一段淡出完，下一段才开始；镜头时间富余时，均匀加长每段的停留。
 */
import {FPS, SHOTS, SUBTITLE_STYLE as ST} from '../timeline';

const PUNCT = /[，。？！、；：,.!?;:…—“”"']/;
const STRONG = /[。？！]/;
export const countChars = (s: string) => [...s].filter((c) => !PUNCT.test(c)).length;

/** 段末的逗号、句号不显示；问号、感叹号保留 */
const tidy = (s: string) => s.replace(/[，。、；：,.;:]+$/u, '');

export const splitSubtitle = (text: string, max = ST.maxChars): string[] => {
  const chars = [...text];
  if (countChars(text) <= max) return [tidy(text)];
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < chars.length - 1; i++) {
    if (!PUNCT.test(chars[i])) continue;
    const left = chars.slice(0, i + 1).join('');
    const right = chars.slice(i + 1).join('');
    const cl = countChars(left);
    const cr = countChars(right);
    if (cl === 0 || cr === 0) continue;
    const score = (cl <= max && cr <= max ? 0 : 1000) + Math.abs(cl - cr) - (STRONG.test(chars[i]) ? 6 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0) return [tidy(text)];
  return [
    ...splitSubtitle(chars.slice(0, best + 1).join(''), max),
    ...splitSubtitle(chars.slice(best + 1).join(''), max),
  ];
};

export type SubtitleSeg = {
  text: string;
  start: number; // 第一个字开始淡入
  full: number; // 最后一个字淡入完成
  end: number; // 开始淡出
  gone: number; // 淡出完成
};

const typeIn = (s: string) => ((([...s].length - 1) * ST.charStagger + ST.charFade) / FPS);

export const SUBTITLES: SubtitleSeg[] = SHOTS.flatMap((shot) => {
  const segs = splitSubtitle(shot.subtitle);
  const start = shot.start + shot.subtitleAt;
  const pad = 'subtitleEndPad' in shot ? (shot as {subtitleEndPad: number}).subtitleEndPad : ST.endPad;
  const limit = shot.end - pad;
  const need = segs.reduce((a, s) => a + typeIn(s) + ST.minHold + ST.fadeOut, 0) + ST.gap * (segs.length - 1);
  const extra = Math.max(0, limit - start - need) / segs.length;
  let cur = start;
  return segs.map((text) => {
    const seg = {text, start: cur, full: cur + typeIn(text), end: 0, gone: 0};
    seg.end = seg.full + ST.minHold + extra;
    seg.gone = seg.end + ST.fadeOut;
    cur = seg.gone + ST.gap;
    return seg;
  });
});
