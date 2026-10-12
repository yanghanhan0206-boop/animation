import {SHOT01} from './Shot01Roar';
import {SHOT02} from './Shot02Compensate';
import {SHOT03} from './Shot03Harder';
import {SHOT04} from './Shot04Title';
import {SHOT05} from './Shot05Dissolve';
import {SHOT06} from './Shot06Hands';
import {SHOT07} from './Shot07Society';
import {SHOT08} from './Shot08Cradle';
import {SHOT09} from './Shot09Stillness';

/** 按时间顺序排列的镜头；每一时刻只由一个镜头负责（镜头之间靠连续的场景元素衔接） */
export const SHOT_LIST = [SHOT01, SHOT02, SHOT03, SHOT04, SHOT05, SHOT06, SHOT07, SHOT08, SHOT09];

export const shotAt = (t: number) =>
  SHOT_LIST.find((s) => t >= s.def.start && t < s.def.end) ?? SHOT_LIST[SHOT_LIST.length - 1];
