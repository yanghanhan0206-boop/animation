#!/usr/bin/env bash
# Rebuild the film from scratch: render every shot, synthesize the sound track,
# and composite/encode the final video.
#
#   ./build.sh            # full quality (hours on a 4-core CPU)
#   Q=draft ./build.sh    # quick low-res pass
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
python3 src/post/compose.py --q "$Q" --audio build/soundtrack.wav --out "build/感谢您的投递.mp4"
