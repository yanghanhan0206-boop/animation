import type {Cam} from '../sim/camera';

/**
 * 每个镜头按图层渲染：
 *  screenBack  —— 屏幕坐标，在一切之后（如社会的大摆锤）
 *  worldBack   —— 世界坐标（随镜头推拉），在家长的摆锤之后
 *  worldFront  —— 世界坐标，在家长的摆锤之前（手、冲击波）
 *  screenFront —— 屏幕坐标，最前（如标题）
 *  overlay     —— SVG 之上的 HTML / Canvas（如粒子）
 */
export type Layer = 'screenBack' | 'worldBack' | 'worldFront' | 'screenFront' | 'overlay';
export type ShotProps = {t: number; cam: Cam; layer: Layer};
