/**
 * 字体：Noto Serif SC（思源宋体），通过 @fontsource 打包进项目，渲染时不依赖网络。
 * 按 unicode-range 拆成很多小文件，这里把片中用到的所有文字预先加载，
 * 用 delayRender 等字体就绪后再出帧，避免出现回退字体。
 */
import '@fontsource/noto-serif-sc/500.css';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/noto-serif-sc/900.css';
import {S4, S5, S6, S7, SHOTS} from './timeline';

export const ALL_TEXT = [
  ...SHOTS.map((s) => s.subtitle),
  '吼补偿恐惧愧疚',
  S4.subtitle,
  ...S5.morphs.flatMap((m) => [m.from, m.to]),
  ...S6.hands.map((h) => h.label),
  S7.big.leftWord,
  S7.big.rightWord,
  '摆锤效应祖辈你的父母孩子',
].join('');

let ready: Promise<void> | null = null;

export const loadFonts = () => {
  if (!ready) {
    ready = Promise.all(
      ['500', '700', '900'].map((w) => document.fonts.load(`${w} 64px "Noto Serif SC"`, ALL_TEXT)),
    ).then(() => document.fonts.ready.then(() => undefined));
  }
  return ready;
};
