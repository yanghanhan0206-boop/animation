/**
 * 每个镜头组件通过 useShot() 拿到自己的时间：
 *   t   —— 距本镜头名义起点的秒数（入场叠化时为负，退场叠化时超过 dur）
 *   gt  —— 对应完整版的绝对秒数，用于跨镜头连续的颤动噪声
 *   dur —— 本镜头时长（秒）
 * 这样镜头组件只关心「自己的第几秒」，上下集复用时完全不用改。
 */
import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS, type ShotConfig} from '../config/timeline';

interface ShotContextValue {
  shot: ShotConfig;
  timeOffset: number;
}

const ShotContext = createContext<ShotContextValue | null>(null);

export const ShotProvider: React.FC<{
  shot: ShotConfig;
  timeOffset: number;
  children: React.ReactNode;
}> = ({shot, timeOffset, children}) => (
  <ShotContext.Provider value={{shot, timeOffset}}>{children}</ShotContext.Provider>
);

export const useShot = () => {
  const ctx = useContext(ShotContext);
  const frame = useCurrentFrame();
  if (!ctx) {
    throw new Error('镜头组件必须放在 <ShotProvider> 里');
  }
  const t = frame / FPS + ctx.timeOffset;
  const dur = ctx.shot.end - ctx.shot.start;
  return {
    shot: ctx.shot,
    t,
    gt: ctx.shot.start + t,
    dur,
    /** 0→1 的镜头进度 */
    p: Math.min(1, Math.max(0, t / dur)),
  };
};
