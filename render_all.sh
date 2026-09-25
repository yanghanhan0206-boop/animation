#!/usr/bin/env bash
# Shoot every shot at final quality with two interleaved workers (2 threads each):
# worker k renders frames k, k+2, k+4... of every shot, so both stay busy.
set -uo pipefail
cd "$(dirname "$0")"
Q=${Q:-final}
export RENDER_DIR=${RENDER_DIR:-$PWD/renders}
SHOTS=${SHOTS:-$(python3 -c "import sys; sys.path.insert(0,'src'); import edl; print(' '.join(n for n,_ in edl.EDL if n not in ('black','end')))")}
worker() {
  for s in $SHOTS; do
    python3 src/render.py "$s" --q "$Q" --threads 2 --part "$1/2" 2>&1 | grep -E --line-buffered "done|Error|Traceback|rror" | sed "s/^/[w$1] /"
  done
}
worker 0 &
worker 1 &
wait
echo "ALL SHOTS RENDERED"
