#!/usr/bin/env bash
# 把 Remotion 导出的母版（out/master.mp4，CRF 16，约 100 MB）压成适合分享和放进仓库的版本：
# 标准 yuv420p / BT.709 / TV 范围，x264 grain 调优保留胶片颗粒，不带音轨，约 30 MB。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p output
ffmpeg -v error -y -i out/master.mp4 -an \
  -vf "scale=in_range=full:out_range=tv:in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -tune grain -profile:v high -level 4.1 \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -movflags +faststart "output/摆锤效应.mp4"
ffprobe -v error -show_entries stream=codec_type,codec_name,pix_fmt,nb_frames -show_entries format=duration,size -of compact "output/摆锤效应.mp4"
