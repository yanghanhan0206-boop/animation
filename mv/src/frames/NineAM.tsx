import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../fx/Bokeh';
import {rnd, rndRange} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {H, SANS_CN, SERIF_EN, W} from '../theme';
import {GoldText, fromLeft} from '../type/GoldText';

// 「翻聊天记录看 直到早上九点钟」: dawn through the blinds of a room where nobody slept.
// The whole conversation lies on a plane receding into the dark, scrolling back in time;
// the two messages in focus carry the lyric's own words.

interface Msg {
  mine: boolean;
  text?: string;
  /** Placeholder line widths (fractions) for messages that are just walls of text. */
  lines?: number[];
  w?: number;
}

const LOG: Msg[] = [
  {mine: false, lines: [1, 0.6], w: 360},
  {mine: true, lines: [1, 1, 0.4], w: 420},
  {mine: false, lines: [0.7], w: 240},
  {mine: true, lines: [1, 1, 1, 0.8, 0.3], w: 460},
  {mine: false, lines: [1, 0.5], w: 330},
  {mine: true, lines: [1, 1, 0.9, 1, 0.6], w: 460},
  {mine: false, lines: [0.8], w: 260},
  {mine: true, text: '我们是不是也许还有也许'},
  {mine: false, text: '这事儿暂时别提吧'},
  {mine: true, lines: [1, 0.7], w: 380},
  {mine: true, lines: [1, 1, 1, 0.5], w: 440},
  {mine: false, lines: [0.6], w: 230},
  {mine: true, lines: [1, 1, 0.8], w: 420},
];
const FOCUS = 7.5;

const MINT = '#86BF8A';
const PALE = '#C9D0D6';

const Stamp: React.FC<{text: string}> = ({text}) => (
  <div style={{textAlign: 'center', fontFamily: SANS_CN, fontWeight: 700, fontSize: 24, letterSpacing: '0.12em', color: 'rgba(210,220,232,0.55)'}}>{text}</div>
);

const MsgView: React.FC<{m: Msg; i: number; blur: number; fade: number}> = ({m, i, blur, fade}) => (
  <div style={{display: 'flex', justifyContent: m.mine ? 'flex-end' : 'flex-start', filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity: fade}}>
    <div
      style={{
        position: 'relative',
        width: m.w,
        padding: '22px 30px',
        borderRadius: 22,
        background: m.mine ? MINT : PALE,
        boxShadow: `0 0 36px ${m.mine ? 'rgba(130,200,140,0.18)' : 'rgba(200,215,230,0.14)'}`,
        fontFamily: SANS_CN,
        fontWeight: 700,
        fontSize: 44,
        whiteSpace: 'nowrap',
        color: m.mine ? '#0C160D' : '#11161B',
        boxSizing: 'border-box',
      }}
    >
      <div style={{position: 'absolute', top: 24, [m.mine ? 'right' : 'left']: -9, width: 22, height: 22, background: m.mine ? MINT : PALE, transform: 'rotate(45deg)', borderRadius: 3}} />
      {m.text ? (
        <span style={{position: 'relative'}}>{m.text}</span>
      ) : (
        (m.lines ?? []).map((l, k) => (
          <div key={k} style={{height: 14, margin: k ? '14px 0 0' : 0, borderRadius: 7, background: 'rgba(0,0,0,0.2)', width: `${l * (92 + rnd(`lw${i}${k}`) * 8)}%`}} />
        ))
      )}
    </div>
  </div>
);

/** Blind slats: bands of dawn light falling diagonally across the room. */
const stripes = (t: number) =>
  Array.from({length: 9}, (_, k) => ({
    c: 160 + k * 150 + Math.sin(t * 0.2) * 6,
    w: 64 + rndRange(`sw${k}`, -10, 10),
  }));

const SLOPE = -0.52;

export const NineAM: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const inStripe = (x: number, y: number) => {
    const u = x + (y - 540) * SLOPE;
    return stripes(t).some((s) => Math.abs(u - s.c) < s.w / 2) ? 1 : 0.12;
  };
  const room = useCanvas(
    (ctx) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#070A12');
      g.addColorStop(1, '#030407');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(10px)';
      for (const s of stripes(t)) {
        const quad = (u0: number, u1: number, fill: string | CanvasGradient) => {
          ctx.beginPath();
          ctx.moveTo(u0 + 540 * SLOPE, 0);
          ctx.lineTo(u1 + 540 * SLOPE, 0);
          ctx.lineTo(u1 - (H - 540) * SLOPE, H);
          ctx.lineTo(u0 - (H - 540) * SLOPE, H);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
        };
        const lg = ctx.createLinearGradient(0, 0, W, H);
        lg.addColorStop(0, 'rgba(150,180,235,0.22)');
        lg.addColorStop(0.6, 'rgba(120,150,210,0.10)');
        lg.addColorStop(1, 'rgba(90,110,170,0.03)');
        quad(s.c - s.w / 2, s.c + s.w / 2, lg);
        quad(s.c + s.w / 2 - 10, s.c + s.w / 2, 'rgba(255,190,120,0.18)');
      }
      ctx.filter = 'none';
      const win = ctx.createRadialGradient(1900, 60, 0, 1900, 60, 1200);
      win.addColorStop(0, 'rgba(255,214,170,0.22)');
      win.addColorStop(0.4, 'rgba(140,170,230,0.06)');
      win.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = win;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    },
    [f],
  );

  return (
    <AbsoluteFill>
      <canvas ref={room} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <div style={{position: 'absolute', left: 150, top: 160, fontFamily: SERIF_EN, fontWeight: 500, fontSize: 300, lineHeight: 1, letterSpacing: '0.02em', color: 'rgba(200,215,240,0.13)'}}>09:00</div>
      <Bokeh seed="dawn" count={150} focus={0.45} drift={[6, -4]} intensity={0.9} weight={inStripe} />
      <div
        style={{
          position: 'absolute',
          left: 1250,
          top: -1180,
          width: 1000,
          height: 2560,
          transform: 'translateX(-50%) perspective(1500px) rotateX(38deg)',
          transformOrigin: '50% 100%',
        }}
      >
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', gap: 40, transform: `translateY(${t * 26 - 430}px)`}}>
          {LOG.map((m, i) => {
            const d = Math.abs(i - FOCUS);
            const blur = Math.max(0, d - 1.2) * 2.2;
            const fade = Math.max(0.15, 1 - Math.max(0, FOCUS - i - 2) * 0.16);
            return (
              <React.Fragment key={i}>
                {i === 7 && <Stamp text="凌晨 03:12" />}
                <MsgView m={m} i={i} blur={blur} fade={fade} />
                {i === 8 && <Stamp text="你撤回了一条消息" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: 212, top: 752, fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 28, letterSpacing: '0.2em', color: 'rgba(214,226,240,0.6)'}}>
        scrolling back · 09:00 a.m.
      </div>
      <GoldText text="翻聊天记录看" x={fromLeft('翻聊天记录看', 210, 64, 0.18)} y={812} size={64} weight={300} spacing={0.18} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.2} flat="#EEF1F5" />
      <GoldText text="直到早上九点钟" x={fromLeft('直到早上九点钟', 210, 64, 0.18)} y={892} size={64} weight={500} spacing={0.18} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.8} />
    </AbsoluteFill>
  );
};
