/**
 * 批量导出确认用的关键帧静帧（JPEG）到 preview/。
 * 只打包一次、只开一次浏览器，比逐张 `remotion still` 快很多。
 *
 *   npm run stills
 *   BROWSER=/path/to/chrome npm run stills   # 使用指定的 Chrome / headless shell
 */
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {FPS, at} from '../src/config/timeline';

interface Still {
  file: string;
  composition: 'Full' | 'Part1' | 'Part2' | 'TimingSheet';
  /** 秒（该 composition 的时间） */
  sec: number;
}

const STILLS: Still[] = [
  {file: '01_镜头1_凌晨三点', composition: 'Full', sec: at(1, 4.5)},
  {file: '02_镜头2_四条路轮流亮起', composition: 'Full', sec: at(2, 3.8)},
  {file: '03_镜头4_沿轨道前进_残影与对勾', composition: 'Full', sec: at(4, 5.5)},
  {file: '04_镜头4_轨道碎裂_字幕逐字出现中', composition: 'Full', sec: at(4, 9.0)},
  {file: '05_镜头5_翻到蛇_电光', composition: 'Full', sec: at(5, 4.96)},
  {file: '06_镜头6_倒U曲线', composition: 'Full', sec: at(6, 8.3)},
  {file: '07_镜头7_不确定性_光泽扫过', composition: 'Full', sec: at(7, 1.8)},
  {file: '08_镜头12_早闭与延缓', composition: 'Full', sec: at(12, 12)},
  {file: '09_镜头14_星空', composition: 'Full', sec: at(14, 9.5)},
  {file: '10_上集结尾_下集预告', composition: 'Part1', sec: 114.2},
  {file: '00_时间表', composition: 'TimingSheet', sec: 0},
];

const main = async () => {
  const only = process.argv.slice(2);
  const outDir = path.join(process.cwd(), 'preview');
  fs.mkdirSync(outDir, {recursive: true});
  console.log('打包中…');
  const serveUrl = await bundle({entryPoint: path.join(process.cwd(), 'src/index.ts')});
  const browserExecutable = process.env.BROWSER ?? null;
  const browser = await openBrowser('chrome', {browserExecutable});
  try {
    for (const s of STILLS) {
      if (only.length && !only.some((o) => s.file.includes(o))) {
        continue;
      }
      const composition = await selectComposition({serveUrl, id: s.composition, puppeteerInstance: browser});
      const frame = Math.min(composition.durationInFrames - 1, Math.round(s.sec * FPS));
      const output = path.join(outDir, `${s.file}.jpg`);
      await renderStill({
        serveUrl,
        composition,
        frame,
        output,
        imageFormat: 'jpeg',
        jpegQuality: 92,
        puppeteerInstance: browser,
        browserExecutable,
      });
      console.log(`✓ ${s.file}  (${s.composition} 第 ${frame} 帧)`);
    }
  } finally {
    await browser.close({silent: true});
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
