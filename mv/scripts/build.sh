#!/usr/bin/env bash
# The whole MV, end to end:
#   AUDIO=path/to/song.(wav|mp4) scripts/build.sh
#   1. out/frames/f*.png       clean frames from Remotion (resumable: existing frames are kept)
#   2. out/master.mp4          film pass in each shot's grade, 2.39:1 bars, CRF 14 + the song
#   3. output/林宛瑜-MV.mp4     two-pass delivery encode, sized for the repository
#   4. output/stills/          graded key frames for the README
set -euo pipefail
cd "$(dirname "$0")/.."
AUDIO=${AUDIO:?set AUDIO to the song (wav or mp4)}
node scripts/render.mjs 2>&1 | grep -v -i "memory\|cgroup\|docker\|lower amount" || true
python3 scripts/finish.py --audio "$AUDIO" --out out/master.mp4
scripts/deliver.sh out/master.mp4 "output/林宛瑜-MV.mp4"
scripts/stills.sh out/master.mp4 output/stills
