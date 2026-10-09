import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {easeInOutSine, easeOutBackLite, lerp, prog} from './ease';
import {useCanvas} from '../../lib/canvas';
import {H, SANS_CN, W} from '../../theme';

// 「可结论是这事儿暂时别提」: close on the conversation at night. His message waits on the
// right; on the left, "typing…" for a moment, then the answer.

const MINT = '#86BF8A';
const PALE = '#C9D0D6';
const REPLY_AT = 0.7;

const Bubble: React.FC<{mine: boolean; children: React.ReactNode; x: number; y: number; scale?: number; opacity?: number}> = ({mine, children, x, y, scale = 1, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${mine ? '-100%' : '0'}, -50%) scale(${scale})`,
      transformOrigin: mine ? '100% 50%' : '0% 50%',
      opacity,
    }}
  >
    <div
      style={{
        position: 'relative',
        padding: '28px 40px',
        borderRadius: 28,
        background: mine ? MINT : PALE,
        boxShadow: `0 0 60px ${mine ? 'rgba(130,200,140,0.22)' : 'rgba(200,215,230,0.18)'}`,
        fontFamily: SANS_CN,
        fontWeight: 700,
        fontSize: 54,
        whiteSpace: 'nowrap',
        color: mine ? '#0C160D' : '#11161B',
      }}
    >
      <div style={{position: 'absolute', top: 32, [mine ? 'right' : 'left']: -11, width: 26, height: 26, background: mine ? MINT : PALE, transform: 'rotate(45deg)', borderRadius: 3}} />
      <span style={{position: 'relative'}}>{children}</span>
    </div>
  </div>
);

export const ChatReply: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const room = useCanvas(
    (ctx) => {
      ctx.fillStyle = '#04060C';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(1150, 1150, 0, 1150, 1150, 1200);
      g.addColorStop(0, 'rgba(120,170,255,0.24)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    },
    [f],
  );
  const pop = prog(t, REPLY_AT, REPLY_AT + 0.35, easeOutBackLite);
  const typing = t < REPLY_AT;
  const drift = lerp(0, -30, prog(t, 0, dur, easeInOutSine));
  return (
    <AbsoluteFill>
      <canvas ref={room} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <Bokeh seed="reply" count={50} focus={0.2} drift={[3, -2]} intensity={0.35} sizeScale={1.3} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${drift}px)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: SANS_CN, fontWeight: 700, fontSize: 26, letterSpacing: '0.12em', color: 'rgba(210,220,232,0.5)'}}>凌晨 03:14</div>
        <Bubble mine x={1700} y={360}>
          我们是不是也许还有也许
        </Bubble>
        {typing ? (
          <Bubble mine={false} x={560} y={540}>
            <span style={{letterSpacing: '0.2em'}}>
              {[0, 1, 2].map((k) => (
                <span key={k} style={{opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 10 - k * 0.9))}}>
                  ●
                </span>
              ))}
            </span>
          </Bubble>
        ) : (
          <Bubble mine={false} x={560} y={540} scale={lerp(0.85, 1, pop)} opacity={Math.min(1, pop * 1.5)}>
            这事儿暂时别提吧
          </Bubble>
        )}
      </div>
    </AbsoluteFill>
  );
};
