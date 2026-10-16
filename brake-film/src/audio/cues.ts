import {AUDIO, FPS, SCENES} from '../data';
import {S1} from '../scenes/Scene1Line';
import {tickTimes} from '../scenes/Scene2Speed';
import {S3} from '../scenes/Scene3Bars';
import {S4} from '../scenes/Scene4Break';
import {ringSegments, S5} from '../scenes/Scene5Ring';
import {chimeTimes} from '../scenes/Scene6Money';
import {S7} from '../scenes/Scene7Accel';
import {heartbeatTimes} from '../scenes/Scene8Zhengzhou';

export type SfxKey = keyof typeof AUDIO.sfx;

export type Cue = {
  sfx: SfxKey;
  /** 全片绝对时间（秒） */
  at: number;
  /** 片段长度（秒），只用于在时间线上占位 */
  length: number;
  /** 相对 AUDIO.sfx 里基础音量的倍数 */
  gain?: number;
  playbackRate?: number;
  note: string;
};

const sceneStart = (i: number) => SCENES[i].start;

/**
 * 音效触发表：全部由各场的动画节拍推出来，改动画时间音效会跟着走。
 */
export const buildCues = (): Cue[] => {
  const cues: Cue[] = [];
  const add = (c: Cue) => cues.push({...c, at: Math.round(c.at * 1000) / 1000});

  // 第一场：金线划出，一声细长的「嗡」
  add({sfx: 'hum', at: sceneStart(0) + S1.drawFrom, length: 4, note: '第一场 金线划出'});

  // 第二场：时钟滴答逐渐加速，字幕结束时停止
  tickTimes().forEach((t, i) =>
    add({sfx: 'tick', at: sceneStart(1) + t, length: 0.3, gain: 0.7 + 0.3 * (i / 40), note: '第二场 滴答'}),
  );

  // 第三场：每根柱子落定一个重拍
  S3.bars.forEach((b, i) => add({sfx: 'hit', at: sceneStart(2) + b.land, length: 1.5, note: `第三场 第${i + 1}根柱子落定`}));

  // 第四场：冲破瞬间玻璃碎裂（随后背景音乐静音一拍，见 BGM_DUCK）
  add({sfx: 'glass', at: sceneStart(3) + S4.shatterAt, length: 2.5, note: '第四场 金线碎裂'});

  // 第五场：每段圆环亮起一声金属音
  const segs = ringSegments();
  S5.lightAt.forEach((t, i) =>
    add({
      sfx: 'ding',
      at: sceneStart(4) + t,
      length: 1.5,
      gain: i === S5.lightAt.length - 1 ? 0.5 : 1,
      playbackRate: [1, 1.12, 1.06, 1.18, 1.1, 1.22, 1.3, 0.9][i] ?? 1,
      note: `第五场 圆环「${segs[i]?.name ?? i + 1}」亮起`,
    }),
  );

  // 第六场：光点落下时细碎铃声
  chimeTimes().forEach((t, i) =>
    add({
      sfx: 'chime',
      at: sceneStart(5) + t,
      length: 1.2,
      gain: 0.6 + 0.4 * ((i * 37) % 10) / 10,
      playbackRate: 0.9 + ((i * 53) % 7) * 0.05,
      note: '第六场 光点铃声',
    }),
  );

  // 第七场：排行榜停住一个重拍
  add({sfx: 'hit', at: sceneStart(6) + S7.stopAt, length: 1.5, note: '第七场 排行榜停在第9位'});

  // 第八场：问号闪烁时轻微心跳
  heartbeatTimes().forEach((t) => add({sfx: 'heartbeat', at: sceneStart(7) + t, length: 0.9, note: '第八场 问号闪烁'}));

  return cues.sort((a, b) => a.at - b.at);
};

/** 第四场冲破后，背景音乐静音一拍 */
export const BGM_DUCK = {
  at: sceneStart(3) + S4.shatterAt,
  silentFor: 1.0,
  recoverIn: 1.5,
};

/** 背景音乐音量包络（帧 → 音量倍数） */
export const bgmEnvelope = (frame: number, totalFrames: number) => {
  const t = frame / FPS;
  const fadeIn = Math.min(1, t / 2);
  const fadeOut = Math.min(1, Math.max(0, (totalFrames / FPS - 2.2 - t) / 3));
  let duck = 1;
  if (t >= BGM_DUCK.at - 0.03) {
    const k = t - BGM_DUCK.at;
    if (k < BGM_DUCK.silentFor) {
      duck = 0;
    } else {
      duck = Math.min(1, (k - BGM_DUCK.silentFor) / BGM_DUCK.recoverIn);
    }
  }
  return fadeIn * fadeOut * duck;
};
