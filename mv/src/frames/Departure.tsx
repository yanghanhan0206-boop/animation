import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../fx/Bokeh';
import {Reflect} from '../fx/Reflect';
import {clamp, noise1, rnd} from '../lib/anim';
import {useCanvas} from '../lib/canvas';
import {H, MONO, SANS_CN, SERIF_EN, W} from '../theme';
import {GoldText, fromLeft} from '../type/GoldText';

// 「到纽约的班机 难道是最后一场别离」: a split-flap departures board in a dark terminal.
// Flight LW 0520 to New York, status 最后别离, still flipping into place.

interface Row {
  flight: string;
  cn: string;
  en: string;
  time: string;
  gate: string;
  status: string;
  hot?: boolean;
}

const ROWS: Row[] = [
  {flight: 'LW0520', cn: '纽约', en: 'NEW YORK', time: '23:55', gate: 'C17', status: '最后别离', hot: true},
  {flight: 'MU5101', cn: '上海', en: 'SHANGHAI', time: '00:10', gate: 'B02', status: '已到达'},
  {flight: 'CA1501', cn: '北京', en: 'BEIJING', time: '00:25', gate: 'A11', status: '延误'},
  {flight: 'CZ3539', cn: '广州', en: 'GUANGZHOU', time: '00:40', gate: 'D08', status: '值机'},
  {flight: 'HU7605', cn: '成都', en: 'CHENGDU', time: '01:05', gate: 'C03', status: '取消'},
  {flight: '3U8881', cn: '西安', en: "XI'AN", time: '01:20', gate: 'A06', status: '值机'},
];

const COLS: {key: keyof Row; n: number; label: string}[] = [
  {key: 'flight', n: 6, label: '航班 FLIGHT'},
  {key: 'cn', n: 3, label: '目的地'},
  {key: 'en', n: 10, label: 'DESTINATION'},
  {key: 'time', n: 5, label: '时间 TIME'},
  {key: 'gate', n: 3, label: '登机口'},
  {key: 'status', n: 4, label: '状态 STATUS'},
];

export const TW = 42;
export const TH = 60;
export const GAP = 4;
const COL_GAP = 22;
const ROW_GAP = 12;
export const AMBER = '#FFB54A';
const LATIN_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CJK_POOL = '纽约上海北京广州成都西安东京首尔巴黎伦敦延误值机取消到达登机已起飞最后别离';

export type BoardMode = 'still' | 'flip' | 'departed';
const PAPER = 'rgba(233,230,223,0.6)';

export const Tile: React.FC<{ch: string; color: string; flip?: number; dim?: boolean}> = ({ch, color, flip = 0, dim}) => {
  const isCn = /[一-鿿]/.test(ch);
  const glyph: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: isCn ? SANS_CN : MONO,
    fontWeight: 700,
    fontSize: isCn ? 34 : 38,
    color,
    textShadow: dim ? 'none' : `0 0 10px ${color === AMBER ? 'rgba(255,170,60,0.55)' : 'rgba(255,255,255,0.25)'}`,
  };
  return (
    <div style={{position: 'relative', width: TW, height: TH, borderRadius: 5, background: 'linear-gradient(#262626, #1B1B1B 49%, #090909 50%, #1C1C1C 52%, #121212)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 3px rgba(0,0,0,0.6)', overflow: 'hidden'}}>
      <div style={glyph}>{ch}</div>
      {flip > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: TW,
            height: TH / 2,
            overflow: 'hidden',
            borderRadius: '5px 5px 0 0',
            background: 'linear-gradient(#2E2E2E, #1E1E1E)',
            transformOrigin: '50% 100%',
            transform: `perspective(300px) rotateX(${-flip * 88}deg)`,
            filter: `brightness(${1 - flip * 0.5})`,
          }}
        >
          <div style={{...glyph, height: TH, bottom: 'auto'}}>{ch}</div>
        </div>
      )}
      <div style={{position: 'absolute', left: 0, right: 0, top: TH / 2 - 0.5, height: 1, background: 'rgba(0,0,0,0.9)'}} />
    </div>
  );
};

const Board: React.FC<{t: number; mode: BoardMode}> = ({t, mode}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: ROW_GAP, padding: '26px 30px 30px', background: 'linear-gradient(#0E0E0F, #070708)', borderRadius: 10, boxShadow: '0 0 0 2px #151517, 0 30px 80px rgba(0,0,0,0.8)'}}>
    <div style={{display: 'flex', gap: COL_GAP, marginBottom: 4}}>
      {COLS.map((c) => (
        <div key={c.key} style={{width: c.n * TW + (c.n - 1) * GAP, fontFamily: SANS_CN, fontWeight: 700, fontSize: 17, letterSpacing: '0.14em', color: 'rgba(233,230,223,0.55)'}}>
          {c.label}
        </div>
      ))}
    </div>
    {ROWS.map((r, ri) => (
      <div key={ri} style={{display: 'flex', gap: COL_GAP, position: 'relative'}}>
        {r.hot && <div style={{position: 'absolute', left: -18, right: -18, top: -7, bottom: -7, borderRadius: 8, background: 'rgba(255,160,60,0.10)', boxShadow: '0 0 40px rgba(255,150,50,0.22)'}} />}
        {COLS.map((c, ci) => {
          const departed = mode === 'departed' && r.hot && c.key === 'status';
          const chars = [...String(departed ? '已起飞' : (r[c.key] ?? ''))];
          return (
            <div key={c.key} style={{display: 'flex', gap: GAP}}>
              {Array.from({length: c.n}, (_, k) => {
                const ch = chars[k] ?? '';
                let shown = ch;
                let flipping = 0;
                // Flaps spin through random characters until they land, row by row; the New
                // York row lands last. 'departed' re-spins only its status column.
                const settle =
                  mode === 'flip' ? 0.1 + ri * 0.08 + ci * 0.05 + k * 0.025 + (r.hot ? 0.62 : 0) : departed ? 1.25 + k * 0.09 : -1;
                const from = departed ? 1.0 : 0;
                if (t < settle && t >= from && (ch || departed)) {
                  const pool = /[\u4e00-\u9fff]/.test(ch) || departed ? CJK_POOL : LATIN_POOL;
                  const step = Math.floor(t * 16);
                  shown = [...pool][Math.floor(rnd(`sp${ri}${ci}${k}${step}`) * [...pool].length)];
                  flipping = (t * 16) % 1;
                } else if (mode === 'still' && r.hot && ch && rnd(`flip${c.key}${k}${Math.floor(t * 6)}`) < 0.18) {
                  // The style frame: a few flaps of the New York row still settling.
                  flipping = clamp(0.25 + rnd(`fa${c.key}${k}${Math.floor(t * 6)}`) * 0.6);
                }
                return <Tile key={k} ch={shown} color={r.hot ? AMBER : PAPER} flip={flipping} dim={!r.hot} />;
              })}
            </div>
          );
        })}
      </div>
    ))}
  </div>
);

export const Departure: React.FC<{t: number; text?: boolean; mode?: BoardMode}> = ({t, text = true, mode = 'still'}) => {
  const f = useCurrentFrame();
  const bg = useCanvas(
    (ctx) => {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#0B1424');
      g.addColorStop(0.35, '#070A11');
      g.addColorStop(1, '#040506');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Tall terminal windows on the left: cold night outside, rain running down the glass.
      for (let i = 0; i < 4; i++) {
        const x = -60 + i * 150;
        const wg = ctx.createLinearGradient(0, 120, 0, 900);
        wg.addColorStop(0, 'rgba(60,96,160,0.20)');
        wg.addColorStop(1, 'rgba(30,50,90,0.06)');
        ctx.fillStyle = wg;
        ctx.fillRect(x, 120, 132, 780);
      }
      ctx.strokeStyle = 'rgba(150,180,230,0.10)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 160; i++) {
        const x = -60 + rnd(`rx${i}`) * 600;
        const y0 = 120 + ((rnd(`ry${i}`) * 780 + t * (40 + rnd(`rv${i}`) * 80)) % 780);
        const len = 8 + rnd(`rl${i}`) * 30;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x + noise1(i + t) * 2, y0 + len);
        ctx.stroke();
      }
      // Warm light spill from the board onto the floor.
      ctx.globalCompositeOperation = 'lighter';
      const spill = ctx.createRadialGradient(1080, 640, 0, 1080, 640, 760);
      spill.addColorStop(0, 'rgba(255,150,60,0.10)');
      spill.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = spill;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    },
    [f],
  );
  const sway = Math.sin(t * 0.25) * 1.5;
  const board = (
    <div
      style={{
        position: 'absolute',
        left: 1010,
        top: 402,
        transform: `translate(-50%, -50%) perspective(1900px) rotateY(${-21 + sway}deg) rotateX(2deg) scale(0.86)`,
        transformOrigin: '50% 50%',
      }}
    >
      <Board t={t} mode={mode} />
    </div>
  );
  return (
    <AbsoluteFill>
      <canvas ref={bg} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed="term" count={40} focus={0.15} drift={[5, -2]} intensity={0.5} sizeScale={1.4} />
      {board}
      <Reflect floor={664} depth={190} strength={0.2} blur={3}>
        {board}
      </Reflect>
      <div style={{position: 'absolute', left: 0, right: 0, top: 664, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,170,90,0.12), transparent)'}} />
      {text && (
        <>
      <div style={{position: 'absolute', left: 212, top: 752, fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 28, letterSpacing: '0.2em', color: 'rgba(233,214,180,0.6)'}}>
        flight LW 0520 · to New York
      </div>
      <GoldText text="到纽约的班机" x={fromLeft('到纽约的班机', 210, 64, 0.18)} y={812} size={64} weight={300} spacing={0.18} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.3} flat="#EFE8DC" />
      <GoldText text="难道是最后一场别离" x={fromLeft('难道是最后一场别离', 210, 64, 0.18)} y={892} size={64} weight={500} spacing={0.18} t={t} stagger={0.06} reveal={0.8} blur={10} glow={0.8} />
        </>
      )}
    </AbsoluteFill>
  );
};
