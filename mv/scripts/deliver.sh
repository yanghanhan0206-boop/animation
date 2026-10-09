#!/usr/bin/env bash
# Two-pass H.264 delivery copy of the master, sized to stay under GitHub's 50 MB warning.
#   scripts/deliver.sh master.mp4 out.mp4 [video-kbps]
set -euo pipefail
SRC=$1; DST=$2; RATE=${3:-3900}
LOG=$(mktemp -d)/x264
mkdir -p "$(dirname "$DST")"
ffmpeg -y -loglevel error -i "$SRC" -an -c:v libx264 -preset slower -tune grain -b:v "${RATE}k" \
  -pass 1 -passlogfile "$LOG" -f null /dev/null
ffmpeg -y -loglevel error -i "$SRC" -c:v libx264 -preset slower -tune grain -b:v "${RATE}k" \
  -maxrate "$((RATE * 2))k" -bufsize "$((RATE * 4))k" -pass 2 -passlogfile "$LOG" \
  -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -movflags +faststart "$DST"
ls -l "$DST"
