// Render individual frames:  node scripts/stills.mjs --comp=Preview --frames=100,200 [--out=dir] [--scale=0.5]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : true];
}));
const id = args.comp ?? 'Preview';
const frames = String(args.frames ?? '0').split(',').map(Number);
const out = path.resolve(ROOT, args.out ?? 'out/_qa/stills');
const scale = Number(args.scale ?? 1);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
fs.mkdirSync(out, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts'), onProgress: () => undefined});
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser, browserExecutable, timeoutInMilliseconds: 180000});
for (const frame of frames) {
  const file = path.join(out, `${args.prefix ?? id}-${String(frame).padStart(4, '0')}.${args.jpeg ? 'jpg' : 'png'}`);
  await renderStill({composition, serveUrl, frame, output: file, scale, ...(args.jpeg ? {imageFormat: 'jpeg', jpegQuality: 92} : {imageFormat: 'png'}), puppeteerInstance: browser, browserExecutable, timeoutInMilliseconds: 180000});
  console.log(file);
}
await browser.close({silent: true});
