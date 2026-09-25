#!/usr/bin/env bash
# Rebuild the film from scratch: render every shot, synthesize the sound track,
# and composite/encode the final video.
#
#   ./build.sh            # full quality (hours on a 4-core CPU)
#   Q=draft ./build.sh    # quick low-res pass
#   ./render_all.sh       # (optional) render the shots with two parallel workers first
#
# Requirements: python3.11, pip packages bpy==4.5.* numpy scipy pillow imageio-ffmpeg,
# and the CJK fonts fonts-noto-cjk + fonts-lxgw-wenkai (only used to typeset the text).
set -euo pipefail
cd "$(dirname "$0")"
Q=${Q:-final}
export RENDER_DIR=${RENDER_DIR:-$PWD/renders}
mkdir -p build

SHOTS=$(python3 -c "import sys; sys.path.insert(0,'src'); import edl; print(' '.join(n for n,_ in edl.EDL if n not in ('black','end')))")
for s in $SHOTS; do
  python3 src/render.py "$s" --q "$Q"
done

python3 src/audio/score.py build/soundtrack.wav
# master (CRF 19, ~200 MB), then a two-pass copy small enough for the repo, then the stills
python3 src/post/compose.py --q "$Q" --crf 19 --audio build/soundtrack.wav --out build/master.mp4
OUT=output; [ "$Q" = final ] || OUT=build/$Q      # only a final build replaces the committed film
python3 src/post/deliver.py build/master.mp4 "$OUT/感谢您的投递.mp4" --audio build/soundtrack.wav
python3 src/post/stills.py --q "$Q" --out "$OUT/stills"
