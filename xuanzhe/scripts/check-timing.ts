/**
 * 检查时间线配置：镜头是否首尾相接、每段字幕停留是否够、阅读速度是否合适。
 * 运行：npm run check
 */
import {FPS, FULL, PART1, PART2, SHOTS, SUBTITLE_TIMING, type PartConfig} from '../src/config/timeline';
import {buildPlan} from '../src/lib/plan';

let errors = 0;
let warnings = 0;

for (let i = 1; i < SHOTS.length; i++) {
  const prev = SHOTS[i - 1];
  const cur = SHOTS[i];
  if (Math.abs(prev.end - cur.start) > 1e-6) {
    console.log(`✗ 镜头${prev.id} 结束 ${prev.end}s 与镜头${cur.id} 开始 ${cur.start}s 不相接`);
    errors++;
  }
  if (cur.end <= cur.start) {
    console.log(`✗ 镜头${cur.id} 时长不为正`);
    errors++;
  }
}

const fmt = (frames: number) => (frames / FPS).toFixed(2).padStart(6);

const report = (name: string, part: PartConfig) => {
  const plan = buildPlan(part);
  console.log(`\n=== ${name}：${(plan.durationInFrames / FPS).toFixed(2)} 秒，${plan.durationInFrames} 帧 ===`);
  console.log('  段落      出现     出全     淡出     消失   停留   字/秒  字幕');
  let lastEnd = -Infinity;
  for (const s of plan.subtitles) {
    const flags: string[] = [];
    if (!s.holdOk) {
      flags.push(`✗ 停留不足 ${SUBTITLE_TIMING.minHold}s`);
      errors++;
    }
    if (!s.readOk) {
      flags.push(`! 超过 ${SUBTITLE_TIMING.readingSpeed} 字/秒`);
      warnings++;
    }
    if (s.fromFrame < lastEnd) {
      flags.push('✗ 与上一段重叠');
      errors++;
    }
    if (s.fromFrame < 0 || s.toFrame > plan.durationInFrames) {
      flags.push('✗ 超出本集时长');
      errors++;
    }
    lastEnd = s.toFrame;
    const typedF = s.fromFrame + Math.round((s.typed - s.start) * FPS);
    const fadeF = s.fromFrame + Math.round((s.fadeOutStart - s.start) * FPS);
    console.log(
      `  ${s.key.padEnd(9)}${fmt(s.fromFrame)}  ${fmt(typedF)}  ${fmt(fadeF)}  ${fmt(s.toFrame)}  ${s.hold
        .toFixed(2)
        .padStart(5)}  ${s.cps.toFixed(1).padStart(5)}  ${s.lines.join(' / ')} ${flags.join(' ')}`,
    );
  }
  for (const c of plan.citations) {
    console.log(`  角标 ${c.key.padEnd(7)} ${fmt(c.fromFrame)} → ${fmt(c.toFrame)}  ${c.text}`);
  }
  for (const c of plan.clocks) {
    console.log(`  时钟        ${fmt(c.fromFrame)} → ${fmt(c.toFrame)}`);
  }
};

report('Full 完整版', FULL);
report('Part1 上集', PART1);
report('Part2 下集', PART2);

console.log(`\n${errors} 个错误，${warnings} 个提醒`);
process.exit(errors > 0 ? 1 : 0);
