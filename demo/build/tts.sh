#!/usr/bin/env bash
# Generates the Indonesian voice-over and writes demo/build/durations.json.
#
# Requires edge-tts (pip install edge-tts) and ffprobe.
#   EDGE_TTS=/path/to/edge-tts demo/build/tts.sh
set -euo pipefail

cd "$(dirname "$0")/../.."
EDGE_TTS="${EDGE_TTS:-edge-tts}"
VOICE="${VOICE:-id-ID-ArdiNeural}"
OUT="demo/build/audio"
mkdir -p "$OUT"

count=$(node -e 'console.log(require("./demo/narration.json").length)')

for ((i = 0; i < count; i++)); do
  idx=$(printf '%02d' "$i")
  text=$(node -e "console.log(require('./demo/narration.json')[$i].text)")
  "$EDGE_TTS" --voice "$VOICE" --rate=-4% --text "$text" --write-media "$OUT/$idx.mp3" >/dev/null 2>&1
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$idx.mp3")
  echo "  ${idx}.mp3  ${dur}s"
done

ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i <(for ((i = 0; i < count; i++)); do printf "file '%s/%02d.mp3'\n" "$PWD/$OUT" "$i"; done) \
  -ar 24000 -ac 1 -c:a pcm_s16le "$OUT/all.wav"

node -e '
const { execSync } = require("child_process");
const fs = require("fs");
const n = require("./demo/narration.json");
const out = n.map((s, i) => {
  const f = "demo/build/audio/" + String(i).padStart(2, "0") + ".mp3";
  const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`).toString().trim());
  return { id: s.id, caption: s.caption, file: f, duration: Math.round(d * 100) / 100 };
});
fs.writeFileSync("demo/build/durations.json", JSON.stringify(out, null, 2));
const total = out.reduce((a, b) => a + b.duration, 0);
console.log("\n" + out.length + " segmen, total narasi " + total.toFixed(1) + "s");
'
