import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/oswald/500.css';
import {continueRender, delayRender} from 'remotion';
import * as DATA from './data';

// 字体文件随工程打包（不依赖网络）。中文字体按 unicode-range 切片，
// 这里把片中出现的所有文字预先加载好，再开始逐帧截图。
const ALL_TEXT = JSON.stringify(DATA) + '0123456789.+%亿约月日年第名？';

const handle = delayRender('加载字体');
Promise.all([
  document.fonts.load('500 40px "Noto Sans SC"', ALL_TEXT),
  document.fonts.load('700 40px "Noto Serif SC"', ALL_TEXT),
  document.fonts.load('500 40px "Oswald"', '0123456789.,+%'),
])
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error('字体加载失败', err);
    continueRender(handle);
  });
