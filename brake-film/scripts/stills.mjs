// 批量导出关键帧，用于快速检查画面：
//   node scripts/stills.mjs out/stills 300 1500 2700 ...
// 不写帧号时，每一场取开头、中间、结尾三帧。
// 可选环境变量 BROWSER=/path/to/chrome 指定浏览器。
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [outDir = 'out/stills', ...frameArgs] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.BROWSER || null;
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: 'BrakeFilm', puppeteerInstance: browser});

let frames = frameArgs.map(Number);
if (frames.length === 0) {
  const bounds = [0, 12, 24, 45, 72, 102, 128, 144, 156].map((s) => s * composition.fps);
  for (let i = 0; i < bounds.length - 1; i++) {
    const [a, b] = [bounds[i], bounds[i + 1]];
    frames.push(a + 45, Math.round((a + b) / 2), b - 30);
  }
}

for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.jpg`);
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
  console.log('✓', output);
}
await browser.close({silent: true});
