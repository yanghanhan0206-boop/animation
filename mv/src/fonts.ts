import {cancelRender, continueRender, delayRender} from 'remotion';
import cormorant500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2';
import cormorant500i from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2';
import serif300 from '@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-300-normal.woff2';
import serif500 from '@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-500-normal.woff2';
import serif700 from '@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-700-normal.woff2';
import sans700 from '@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2';
import mono700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2';

// 思源宋体 (Noto Serif SC) and Cormorant Garamond, both SIL OFL. The "chinese-simplified"
// file covers ~7,900 common characters, so any lyric can be typeset without re-subsetting.
const FACES: [string, string, string, string][] = [
  ['Noto Serif SC', serif300, '300', 'normal'],
  ['Noto Serif SC', serif500, '500', 'normal'],
  ['Noto Serif SC', serif700, '700', 'normal'],
  ['Noto Sans SC', sans700, '700', 'normal'],
  ['JetBrains Mono', mono700, '700', 'normal'],
  ['Cormorant Garamond', cormorant500, '500', 'normal'],
  ['Cormorant Garamond', cormorant500i, '500', 'italic'],
];

let started = false;

export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(([family, url, weight, style]) => {
      const face = new FontFace(family, `url(${url}) format('woff2')`, {weight, style});
      (document.fonts as unknown as Set<FontFace>).add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    // A fallback font would silently ruin every frame, so fail the render instead.
    .catch((err) => cancelRender(err));
};
