/**
 * 渲染风格预览静帧：node scripts/render-stills.mjs [秒数 ...]
 * 不带参数时渲染下面 FRAMES 里每个镜头的代表帧，输出到 out/stills/。
 * 没有网络下载 Chrome Headless Shell 时，用环境变量 REMOTION_BROWSER 指定本机浏览器。
 */
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const FPS = 30;
const FRAMES = [
  {name: '01_吼', t: 3.25},
  {name: '02_补偿', t: 12.95},
  {name: '03_更凶', t: 21.45},
  {name: '04_摆锤效应', t: 31.0},
  {name: '05_溶解变形', t: 40.3},
  {name: '06_四只手', t: 60.45},
  {name: '07_社会的大摆锤', t: 72.0},
  {name: '08_牛顿摆', t: 85.72},
  {name: '09a_吸收冲击', t: 89.15},
  {name: '09b_只留孩子和光', t: 99.6},
];

const args = process.argv.slice(2).map(Number).filter((x) => !Number.isNaN(x));
const list = args.length ? args.map((t) => ({name: `t${t.toFixed(2)}`, t})) : FRAMES;
const outDir = path.resolve('out/stills');
fs.mkdirSync(outDir, {recursive: true});

const browserExecutable = process.env.REMOTION_BROWSER || null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'PendulumEffect', browserExecutable});
for (const f of list) {
  const output = path.join(outDir, `${f.name}.png`);
  await renderStill({composition, serveUrl, output, frame: Math.round(f.t * FPS), imageFormat: 'png', browserExecutable});
  console.log('✓', output);
}
