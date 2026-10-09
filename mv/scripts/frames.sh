#!/usr/bin/env bash
# Render every style frame at its key moment and run the film finish over it.
#   scripts/frames.sh [scene-id ...]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${OUT:-style-frames}
mkdir -p out/_qa/raw "$OUT"
LIST=$(node --input-type=module -e "
import fs from 'node:fs';
const src = fs.readFileSync('src/Frames.tsx', 'utf8');
const re = /id: '([^']+)', title: '([^']+)', Comp: \w+, grade: '([^']+)', key: ([\d.]+)/g;
let m, i = 0; const rows = [];
while ((m = re.exec(src))) { rows.push([i++, ...m.slice(1)].join(' ')); }
console.log(rows.join('\n'));")
FRAMES=""
while read -r idx id title grade key; do
  [ "$#" -gt 0 ] && [[ ! " $* " =~ " $id " ]] && continue
  FRAMES="$FRAMES,$(python3 -c "print(round(($idx*8+$key)*24))")"
done <<< "$LIST"
node scripts/stills.mjs --comp=Frames --frames="${FRAMES#,}" --out=out/_qa/raw --prefix=raw 2>&1 | grep -v -i "memory\|cgroup\|docker\|lower amount" || true
while read -r idx id title grade key; do
  [ "$#" -gt 0 ] && [[ ! " $* " =~ " $id " ]] && continue
  fr=$(python3 -c "print(round(($idx*8+$key)*24))")
  n=$(printf "%02d" $((idx + 1)))
  python3 scripts/post.py "out/_qa/raw/raw-$(printf "%04d" "$fr").png" "$OUT/${n}-${id}.jpg" --grade "$grade" --seed "$fr" --bars 138
  echo "$OUT/${n}-${id}.jpg ($title)"
done <<< "$LIST"
