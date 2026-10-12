/** 黑金配色与字体 */
export const COLORS = {
  bg: '#0a0a0a',
  gold0: '#D4AF37', // 金色渐变起点
  gold1: '#F5D76E', // 金色渐变终点
  goldHi: '#FFF1C2', // 高光 / 内发光
  goldDeep: '#9C7A22', // 暗部
  warm0: '#D9892B', // 镜头 2：偏暖的拖尾
  warm1: '#F7C46A',
  darkGold0: '#5E4A18', // 大摆锤 / 祖辈：暗金
  darkGold1: '#8E7330',
  text: '#F5EFE0', // 字幕：浅金白
};

export const FONT_FAMILY = "'Noto Serif SC', 'Noto Serif CJK SC', serif";

const parse = (c: string): [number, number, number] => {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/[\d.]+/g) ?? ['0', '0', '0'];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
};

/** 线性插值两个颜色（#rrggbb 或 rgb()） */
export const mixColor = (a: string, b: string, t: number): string => {
  const pa = parse(a);
  const pb = parse(b);
  const m = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
};
