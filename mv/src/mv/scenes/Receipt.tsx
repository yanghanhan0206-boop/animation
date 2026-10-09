import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bokeh} from '../../fx/Bokeh';
import {easeInOutSine, easeOutCubic, lerp, noise1, prog} from '../../lib/anim';
import {MONO, SANS_CN, SERIF_EN} from '../../theme';

// 「互相欠的太多 我不想账单会逾期」: a long receipt prints out of the dark, itemising what was
// owed; a red OVERDUE stamp lands on it.

const LINES: [string, string][] = [
  ['四年半', '×1'],
  ['小作文', '×99'],
  ['最好的结局', '×1'],
  ['也许还有也许', '×∞'],
  ['没说出口的爱你', '×1'],
];
const STAMP_AT = 0.95;

const Row: React.FC<{l: string; r: string}> = ({l, r}) => (
  <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
    <span style={{fontFamily: SANS_CN, fontWeight: 700}}>{l}</span>
    <span style={{flex: 1, borderBottom: '3px dotted rgba(40,34,28,0.45)', transform: 'translateY(-6px)'}} />
    <span style={{fontFamily: MONO, fontWeight: 700}}>{r}</span>
  </div>
);

export const Receipt: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const print = lerp(-520, 0, prog(t, 0, 1.0, easeOutCubic));
  const stamp = prog(t, STAMP_AT, STAMP_AT + 0.16, easeOutCubic);
  const shake = t > STAMP_AT && t < STAMP_AT + 0.2 ? noise1(t * 80) * 6 : 0;
  const zoom = lerp(1.0, 1.05, prog(t, 0, dur, easeInOutSine));
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 40% 70% at 62% 20%, #1D1914 0%, #050404 75%)', transform: `translate(${shake}px, ${shake * 0.4}px) scale(${zoom})`}}>
      <Bokeh seed="bill" count={50} focus={0.6} drift={[-3, 6]} intensity={0.45} />
      <div
        style={{
          position: 'absolute',
          left: 1180,
          top: 172 + print,
          width: 560,
          transform: 'translateX(-50%) perspective(1400px) rotateX(10deg) rotateZ(-4deg) scale(0.86)',
          transformOrigin: '50% 0%',
        }}
      >
        <div
          style={{
            padding: '60px 48px 70px',
            background: 'linear-gradient(180deg, #D3CCBD 0%, #DED8CA 40%, #B9B1A0 100%)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,0,0,0.12)',
            color: '#2A2420',
            fontSize: 34,
            lineHeight: 1.9,
            clipPath: 'polygon(0 0, 100% 0, 100% 98%, 96% 100%, 92% 98%, 88% 100%, 84% 98%, 80% 100%, 76% 98%, 72% 100%, 68% 98%, 64% 100%, 60% 98%, 56% 100%, 52% 98%, 48% 100%, 44% 98%, 40% 100%, 36% 98%, 32% 100%, 28% 98%, 24% 100%, 20% 98%, 16% 100%, 12% 98%, 8% 100%, 4% 98%, 0 100%)',
          }}
        >
          <div style={{textAlign: 'center', fontFamily: SANS_CN, fontWeight: 700, fontSize: 46, letterSpacing: '0.3em'}}>账 单</div>
          <div style={{textAlign: 'center', fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 26, letterSpacing: '0.2em', opacity: 0.7, marginBottom: 18}}>statement</div>
          <div style={{borderTop: '3px dashed rgba(40,34,28,0.5)', margin: '10px 0 18px'}} />
          {LINES.map(([l, r]) => (
            <Row key={l} l={l} r={r} />
          ))}
          <div style={{borderTop: '3px dashed rgba(40,34,28,0.5)', margin: '18px 0'}} />
          <Row l="合计 TOTAL" r="∞" />
          <Row l="到期 DUE" r="已逾期" />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 560,
            padding: '10px 34px',
            border: '8px solid rgba(196,35,43,0.85)',
            borderRadius: 18,
            color: 'rgba(196,35,43,0.88)',
            fontFamily: SANS_CN,
            fontWeight: 700,
            fontSize: 88,
            letterSpacing: '0.12em',
            transform: `rotate(-14deg) scale(${lerp(1.8, 1, stamp)})`,
            opacity: stamp,
            mixBlendMode: 'multiply',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          逾期
          <div style={{fontFamily: SERIF_EN, fontStyle: 'italic', fontSize: 30, letterSpacing: '0.3em'}}>overdue</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
