// Render individual frames:  node scripts/stills.mjs --frames=70,180 [--out=dir] [--debug] [--bare] [--scale=0.5]
import {renderStill} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, browserExecutable, parseArgs, setup} from './lib.mjs';

const args = parseArgs();
const frames = String(args.frames ?? '0').split(',').map(Number);
const out = path.resolve(ROOT, args.out ?? 'out/_qa/stills');
const inputProps = {debug: Boolean(args.debug), bare: Boolean(args.bare)};
const scale = Number(args.scale ?? 1);
fs.mkdirSync(out, {recursive: true});

const {serveUrl, browser, composition} = await setup(inputProps);
for (const frame of frames) {
  const file = path.join(out, `${args.prefix ?? 'f'}${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output: file, inputProps, scale, imageFormat: 'png', puppeteerInstance: browser, browserExecutable});
  console.log(file);
}
await browser.close({silent: true});
