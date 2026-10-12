import {Config} from '@remotion/cli/config';

// 全片无声：导出时不带音轨
Config.setMuted(true);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');

// 在没有网络下载 Chrome Headless Shell 的环境里，可以用环境变量指定本机浏览器
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
