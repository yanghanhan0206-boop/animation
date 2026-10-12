// Remotion CLI 配置：横版 1080p / 30fps，导出 H.264，不带音轨。
import {Config} from '@remotion/cli/config';

// 用 PNG 截帧：JPEG 的 8×8 压缩块会让胶片颗粒更难编码（同画质体积约大 4 倍），
// 而且 PNG 截帧输出的是标准的 yuv420p（JPEG 截帧会变成全范围 yuvj420p）
Config.setVideoImageFormat('png');
Config.setCodec('h264');
// CRF 20 ≈ 10 Mbps，完整版约 240 MB；改成 18 会保留更多黑底颗粒，体积约 3 倍
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
// 全片无声：导出的 mp4 不包含音轨
Config.setMuted(true);
