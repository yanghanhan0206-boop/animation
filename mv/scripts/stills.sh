#!/usr/bin/env bash
# Graded key frames from the master for the README gallery (picture area only, no bars).
#   scripts/stills.sh master.mp4 outdir
set -euo pipefail
SRC=$1; OUT=$2
mkdir -p "$OUT"
i=0
for t in 3.4 10.6 16.9 22.4 37.2 40.6 44.0 48.2 51.4 56.6 59.2 60.9 62.8 71.8 77.6 82.6 85.6 92.0; do
  i=$((i + 1))
  ffmpeg -y -loglevel error -ss "$t" -i "$SRC" -frames:v 1 -vf "crop=1920:804:0:138,scale=1280:-2:flags=lanczos" -q:v 3 \
    "$OUT/$(printf '%02d' $i)-$(printf '%05.1f' "$t" | tr . _).jpg"
done
ls "$OUT"
