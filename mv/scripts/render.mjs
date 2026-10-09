// Render the MV's frames as PNGs:  node scripts/render.mjs [--from=0] [--to=2220] [--out=out/frames] [--concurrency=4]
// Frames already on disk are skipped, so an interrupted render picks up where it stopped.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderFrames, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : true];
}));
const out = path.resolve(ROOT, args.out ?? 'out/frames');
const concurrency = Number(args.concurrency ?? 4);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
fs.mkdirSync(out, {recursive: true});

const name = (f) => path.join(out, `f${String(f).padStart(5, '0')}.png`);

const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts'), onProgress: () => undefined});
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: 'MV', puppeteerInstance: browser, browserExecutable, timeoutInMilliseconds: 180000});
const from = Number(args.from ?? 0);
const to = Math.min(Number(args.to ?? composition.durationInFrames - 1), composition.durationInFrames - 1);

// Contiguous runs of frames that still need rendering.
const runs = [];
for (let f = from; f <= to; f++) {
  if (fs.existsSync(name(f))) continue;
  const last = runs[runs.length - 1];
  if (last && last[1] === f - 1) last[1] = f;
  else runs.push([f, f]);
}
const todo = runs.reduce((n, [a, b]) => n + b - a + 1, 0);
console.log(`${todo} frames to render in ${runs.length} run(s), concurrency ${concurrency}`);

let done = 0;
const t0 = Date.now();
for (const [a, b] of runs) {
  await renderFrames({
    composition,
    serveUrl,
    inputProps: {},
    outputDir: null,
    imageFormat: 'png',
    frameRange: [a, b],
    concurrency,
    puppeteerInstance: browser,
    browserExecutable,
    timeoutInMilliseconds: 180000,
    onStart: () => undefined,
    onFrameUpdate: () => undefined,
    // Write each frame under its own number (atomically, so a killed render leaves no half files).
    onFrameBuffer: (buffer, frame) => {
      fs.writeFileSync(`${name(frame)}.tmp`, buffer);
      fs.renameSync(`${name(frame)}.tmp`, name(frame));
      done++;
      if (done % 24 === 0 || done === todo) {
        const s = (Date.now() - t0) / 1000;
        console.log(`${done}/${todo} frames  ${s.toFixed(0)} s  (${(s / done).toFixed(2)} s/frame, eta ${(((todo - done) * s) / done / 60).toFixed(1)} min)`);
      }
    },
  });
}
await browser.close({silent: true});
console.log('done');
