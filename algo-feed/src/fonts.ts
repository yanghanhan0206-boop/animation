import {cancelRender, continueRender, delayRender} from 'remotion';
import sc700 from '@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2';
import sc900 from '@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-900-normal.woff2';
import mono800 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2';

// Noto Sans SC (思源黑体, SIL OFL) ships a single "chinese-simplified" file per weight that
// covers ~7,900 common characters, so editing the script never needs a font re-subset.
const FACES: [string, string, string][] = [
  ['Noto Sans SC', sc900, '900'],
  ['Noto Sans SC', sc700, '700'],
  ['JetBrains Mono', mono800, '800'],
];

let started = false;

/** Registers the fonts once and holds the render until they are ready. */
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(([family, url, weight]) => {
      const face = new FontFace(family, `url(${url}) format('woff2')`, {weight});
      (document.fonts as unknown as Set<FontFace>).add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    // A fallback font would silently ruin every frame, so fail the render instead.
    .catch((err) => cancelRender(err));
};
