#!/usr/bin/env bash
# 把 out/ 里的母版二次编码成体积适合放进仓库的版本（两遍 x264，无音轨），输出到 output/。
#   scripts/deliver.sh            # 默认 2.6 Mbps
#   KBPS=4000 scripts/deliver.sh  # 指定码率
set -euo pipefail
cd "$(dirname "$0")/.."
KBPS=${KBPS:-2600}
mkdir -p output
for name in 完整版 上集 下集; do
  src="out/你哭的不是选择是悬着_${name}.mp4"
  dst="output/你哭的不是选择是悬着_${name}.mp4"
  [ -f "$src" ] || { echo "跳过：没有 $src"; continue; }
  log="out/x264_${name}"
  ffmpeg -v error -y -i "$src" -an -c:v libx264 -preset slow -b:v ${KBPS}k -pass 1 -passlogfile "$log" -pix_fmt yuv420p -f mp4 /dev/null
  ffmpeg -v error -y -i "$src" -an -c:v libx264 -preset slow -b:v ${KBPS}k -maxrate $((KBPS * 2))k -bufsize $((KBPS * 4))k \
    -pass 2 -passlogfile "$log" -pix_fmt yuv420p -movflags +faststart "$dst"
  rm -f "$log"*
  echo "✓ $dst  $(du -h "$dst" | cut -f1)"
done
