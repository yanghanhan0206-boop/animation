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
  {file: '08_镜头8_球内_箭头射向一点', composition: 'Full', sec: at(8, 5.0)},
  {file: '09_镜头8_箭头分裂_警报波纹', composition: 'Full', sec: at(8, 9.5)},
  {file: '10_镜头9_担忧漩涡', composition: 'Full', sec: at(9, 14.2)},
  {file: '11_镜头10_神经网络点亮', composition: 'Full', sec: at(10, 6.4)},
  {file: '12_镜头10_避开有蛇的石头', composition: 'Full', sec: at(10, 11.1)},
  {file: '13_镜头11_落路锁定', composition: 'Full', sec: at(11, 2.95)},
  {file: '14_镜头11_冰壳冻住', composition: 'Full', sec: at(11, 9.0)},
  {file: '15_镜头12_早闭与延缓', composition: 'Full', sec: at(12, 12)},
  {file: '16_镜头14_星空', composition: 'Full', sec: at(14, 9.5)},
  {file: '17_镜头15_停下的星星', composition: 'Full', sec: at(15, 9.0)},
  {file: '18_镜头16_一块一块地翻', composition: 'Full', sec: at(16, 7.6)},
  {file: '19_镜头17_呼吸的光点', composition: 'Full', sec: at(17, 9.0)},
  {file: '20_上集结尾_下集预告', composition: 'Part1', sec: 114.2},
  {file: '21_下集引子', composition: 'Part2', sec: 3.5},
  {file: '00_时间表', composition: 'TimingSheet', sec: 0},
];

/**
 * 也可以抽查任意时刻：
 *   npm run stills -- --times=Full:70.5,71,72 --scale=0.5
 * 输出到 out/review/，文件名是「composition_秒数」。
 */
const parseTimes = (args: string[]) => {
  const arg = args.find((a) => a.startsWith('--times='));
  if (!arg) {
    return null;
  }
  const [comp, list] = arg.slice('--times='.length).split(':');
  return list.split(',').map((x) => ({
    file: `${comp}_${Number(x).toFixed(2).padStart(6, '0')}`,
    composition: comp as Still['composition'],
    sec: Number(x),
  }));
};

const main = async () => {
  const args = process.argv.slice(2);
  const custom = parseTimes(args);
  const scaleArg = args.find((a) => a.startsWith('--scale='));
  const scale = scaleArg ? Number(scaleArg.slice('--scale='.length)) : 1;
  const only = args.filter((a) => !a.startsWith('--'));
  const outDir = path.join(process.cwd(), custom ? 'out/review' : 'preview');
  fs.mkdirSync(outDir, {recursive: true});
  console.log('打包中…');
  const serveUrl = await bundle({entryPoint: path.join(process.cwd(), 'src/index.ts')});
  const browserExecutable = process.env.BROWSER ?? null;
  const browser = await openBrowser('chrome', {browserExecutable});
  try {
    for (const s of custom ?? STILLS) {
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
        scale,
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
