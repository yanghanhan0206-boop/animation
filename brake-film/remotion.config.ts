import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// 输出标准 BT.709 有限范围（tv range），避免部分播放器、剪辑软件把黑色读灰
Config.setColorSpace('bt709');
Config.setCrf(18);
Config.setOverwriteOutput(true);
