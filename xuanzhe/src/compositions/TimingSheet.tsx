/**
 * 工具：时间表（静帧）。直接读 src/config/timeline.ts 和排程结果，
 * 在 Studio 里改完配置立刻能看到每段字幕的出入点、停留时长和阅读速度。
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, FONTS} from '../config/theme';
import {CLOCK, FPS, FULL, PART1, PART2, SHOTS, SUBTITLE_TIMING} from '../config/timeline';
import {useFontsReady} from '../lib/fonts';
import {buildPlan, type PlannedSubtitle} from '../lib/plan';

export const SHEET_WIDTH = 1920;
export const SHEET_HEIGHT = 1640;

const full = buildPlan(FULL);
const p1 = buildPlan(PART1);
const p2 = buildPlan(PART2);
const TOTAL = full.durationInFrames / FPS;
const X0 = 90;
const X1 = SHEET_WIDTH - 90;
const sx = (sec: number) => X0 + ((X1 - X0) * sec) / TOTAL;

const dim = 'rgba(245,239,224,0.55)';
const gold = COLORS.gold1;

const SegBar: React.FC<{s: PlannedSubtitle; y: number; h: number}> = ({s, y, h}) => {
  const a = s.fromFrame / FPS;
  const typed = a + (s.typed - s.start);
  const fo = a + (s.fadeOutStart - s.start);
  const e = s.toFrame / FPS;
  const bad = !s.holdOk;
  return (
    <>
      <div style={{position: 'absolute', left: sx(a), top: y, width: sx(typed) - sx(a), height: h, background: 'rgba(245,215,110,0.45)'}} />
      <div style={{position: 'absolute', left: sx(typed), top: y, width: sx(fo) - sx(typed), height: h, background: bad ? '#a33' : gold}} />
      <div style={{position: 'absolute', left: sx(fo), top: y, width: Math.max(1, sx(e) - sx(fo)), height: h, background: 'rgba(245,215,110,0.3)'}} />
    </>
  );
};

const Stat: React.FC<{s?: PlannedSubtitle}> = ({s}) =>
  s ? (
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{fontSize: 21, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
        {s.text}
      </div>
      <div style={{fontSize: 16, color: s.holdOk && s.readOk ? dim : '#e66', fontFamily: FONTS.sans, marginTop: 2}}>
        {(s.fromFrame / FPS).toFixed(2)}s 起 · {s.chars} 字 · 出全后停留 {s.hold.toFixed(2)}s · {s.cps.toFixed(1)} 字/秒
        {s.lines.length > 1 ? ' · 两行' : ''}
      </div>
    </div>
  ) : (
    <div style={{flex: 1}} />
  );

export const TimingSheet: React.FC = () => {
  useFontsReady();
  const rows = [
    ...SHOTS.map((shot) => ({
      label: `镜头${shot.id}`,
      name: shot.name,
      range: `${shot.start}–${shot.end}s`,
      segs: full.subtitles.filter((s) => s.owner === `shot${shot.id}`),
      cite: shot.citation,
    })),
    {
      label: '上集结尾',
      name: `Part1 ${p1.durationInFrames / FPS}s`,
      range: `+${PART1.outro?.duration}s`,
      segs: p1.subtitles.filter((s) => s.owner === 'outro'),
      cite: undefined,
    },
    {
      label: '下集引子',
      name: `Part2 ${p2.durationInFrames / FPS}s · 第二段延续进镜头11`,
      range: `${PART2.intro?.duration}s`,
      segs: p2.subtitles.filter((s) => s.owner === 'intro'),
      cite: undefined,
    },
  ];
  const ticks = Array.from({length: Math.floor(TOTAL / 10) + 1}, (_, i) => i * 10);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg, fontFamily: FONTS.serif, color: COLORS.text}}>
      <div style={{position: 'absolute', left: X0, top: 50, fontSize: 40, color: gold, letterSpacing: '0.08em'}}>
        时间表 · 你哭的不是选择，是悬着
      </div>
      <div style={{position: 'absolute', left: X0, top: 108, fontSize: 20, color: dim, fontFamily: FONTS.sans}}>
        Full {TOTAL}s · Part1 {p1.durationInFrames / FPS}s · Part2 {p2.durationInFrames / FPS}s · {FPS}fps · 逐字
        {SUBTITLE_TIMING.charStagger} 帧/字 · 出全后至少停留 {SUBTITLE_TIMING.minHold}s · 参考阅读速度 ≤{' '}
        {SUBTITLE_TIMING.readingSpeed} 字/秒 · 时钟 {CLOCK.text}
      </div>

      {/* 时间轴 */}
      {ticks.map((s) => (
        <React.Fragment key={s}>
          <div style={{position: 'absolute', left: sx(s), top: 160, width: 1, height: 196, background: 'rgba(245,239,224,0.12)'}} />
          <div style={{position: 'absolute', left: sx(s) - 20, top: 362, width: 40, textAlign: 'center', fontSize: 15, color: dim, fontFamily: FONTS.sans}}>
            {s}
          </div>
        </React.Fragment>
      ))}
      {SHOTS.map((shot, i) => (
        <div
          key={shot.id}
          style={{
            position: 'absolute',
            left: sx(shot.start) + 1,
            top: 170,
            width: sx(shot.end) - sx(shot.start) - 2,
            height: 52,
            background: i % 2 ? 'rgba(212,175,55,0.22)' : 'rgba(212,175,55,0.36)',
            fontSize: 20,
            color: COLORS.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.sans,
          }}
        >
          {shot.id}
        </div>
      ))}
      <div style={{position: 'absolute', left: 14, top: 236, fontSize: 15, color: dim}}>字幕</div>
      {full.subtitles.map((s) => (
        <SegBar key={s.key} s={s} y={236} h={22} />
      ))}
      <div style={{position: 'absolute', left: 14, top: 272, fontSize: 15, color: dim}}>角标</div>
      {full.citations.map((c) => (
        <div
          key={c.key}
          style={{position: 'absolute', left: sx(c.fromFrame / FPS), top: 274, width: sx(c.toFrame / FPS) - sx(c.fromFrame / FPS), height: 12, background: 'rgba(212,175,55,0.55)'}}
        />
      ))}
      <div style={{position: 'absolute', left: 14, top: 300, fontSize: 15, color: dim}}>时钟</div>
      {full.clocks.map((c, i) => (
        <div
          key={i}
          style={{position: 'absolute', left: sx(c.fromFrame / FPS), top: 302, width: sx(c.toFrame / FPS) - sx(c.fromFrame / FPS), height: 12, background: 'rgba(245,239,224,0.5)'}}
        />
      ))}
      <div style={{position: 'absolute', left: X0, top: 326, fontSize: 15, color: dim, fontFamily: FONTS.sans}}>
        字幕条：浅色 = 逐字出现，金色 = 出全后停留（红色表示不足 {SUBTITLE_TIMING.minHold}s），淡色 = 淡出
      </div>

      {/* 明细表 */}
      <div style={{position: 'absolute', left: X0, right: 90, top: 410}}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{display: 'flex', gap: 28, alignItems: 'center', height: 62, borderTop: '1px solid rgba(212,175,55,0.18)'}}
          >
            <div style={{width: 210, flexShrink: 0}}>
              <div style={{fontSize: 22, color: gold}}>
                {r.label} <span style={{fontSize: 18, color: dim}}>{r.range}</span>
              </div>
              <div style={{fontSize: 16, color: dim}}>{r.name}</div>
            </div>
            <Stat s={r.segs[0]} />
            <Stat s={r.segs[1]} />
            <div style={{width: 250, flexShrink: 0, fontSize: 14, color: dim, fontFamily: FONTS.sans}}>{r.cite ?? ''}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
