#!/bin/bash
#
# run.sh — Streamlined pipeline driver for Animal Penpals.
#
# Usage:
#   ./pipeline/run.sh status                       # show what's done per animal
#   ./pipeline/run.sh status spider giraffe        # filter to specific animals
#   ./pipeline/run.sh samples [ids...]             # generate TTS voice samples
#   ./pipeline/run.sh voices                       # launch voice screener UI
#   ./pipeline/run.sh characters                   # launch character picker UI
#   ./pipeline/run.sh storyboards                  # launch storyboard picker UI
#   ./pipeline/run.sh videos                       # launch video generator UI
#   ./pipeline/run.sh publish <ids...>             # copy mp4+jpg to public/ for chosen animals
#   ./pipeline/run.sh r2 <ids...>                  # upload mp4+jpg to Cloudflare R2 (animal-penpals bucket)
#   ./pipeline/run.sh ship <ids...>                # publish + r2 + regenerate landing pages
#   ./pipeline/run.sh use-character <id> <path>    # use a manually-generated PNG as the character ref
#   ./pipeline/run.sh launch                       # open Mission Control HTML in browser
#   ./pipeline/run.sh help
#

set -euo pipefail

PIPELINE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$PIPELINE_DIR/.." && pwd)"

cmd="${1:-help}"
shift || true

# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

list_animal_ids() {
  python3 -c "import json; print(' '.join(a['id'] for a in json.load(open('$PIPELINE_DIR/animals.json'))))"
}

require_ids() {
  if [ "$#" -eq 0 ]; then
    echo "Error: this step requires one or more animal IDs."
    echo "Available: $(list_animal_ids)"
    exit 1
  fi
}

# ──────────────────────────────────────────────────────────────────────
# Commands
# ──────────────────────────────────────────────────────────────────────

cmd_status() {
  python3 - "$PIPELINE_DIR" "$PROJECT_ROOT" "$@" <<'PY'
import json, os, sys
pipeline_dir, project_root, *filter_ids = sys.argv[1:]
animals = json.load(open(os.path.join(pipeline_dir, 'animals.json')))
if filter_ids:
    animals = [a for a in animals if a['id'] in filter_ids]

def has(p):
    return '✓' if os.path.exists(p) else '·'

cols = ['id', 'voiceCfg', 'char', 'beats', 'idle.mp4', 'recv.mp4', 'pub.mp4', 'pub.jpg']
print(f"{'animal':<10} {'voice':<6} {'char':<5} {'beats':<6} {'idle':<5} {'recv':<5} {'public':<7} ")
print('─' * 60)
for a in animals:
    aid = a['id']
    voice = '✓' if a.get('voiceCandidates') else '·'
    char  = has(os.path.join(pipeline_dir, 'character-images', f'{aid}_character.png'))
    beat_count = sum(1 for f in os.listdir(os.path.join(pipeline_dir, 'storyboard-images'))
                     if f.startswith(f'{aid}_beat_')) if os.path.isdir(os.path.join(pipeline_dir, 'storyboard-images')) else 0
    idle  = has(os.path.join(pipeline_dir, 'generated-videos', f'{aid}_idle.mp4'))
    recv  = has(os.path.join(pipeline_dir, 'generated-videos', f'{aid}_receive.mp4'))
    pub_v = '✓' if (os.path.exists(os.path.join(project_root, 'public/animal-videos', f'{aid}_idle.mp4')) and
                    os.path.exists(os.path.join(project_root, 'public/animal-videos', f'{aid}_receive.mp4'))) else '·'
    print(f"{aid:<10} {voice:<6} {char:<5} {beat_count:<6} {idle:<5} {recv:<5} {pub_v:<7}")
PY
}

cmd_samples() {
  bash "$PIPELINE_DIR/generate-samples.sh" "$@"
}

cmd_voices()      { bash "$PIPELINE_DIR/voice-screener/serve.sh"; }
cmd_characters()  { bash "$PIPELINE_DIR/character-picker/serve.sh"; }
cmd_storyboards() { bash "$PIPELINE_DIR/storyboard-picker/serve.sh"; }
cmd_videos()      { bash "$PIPELINE_DIR/video-generator/serve.sh"; }

cmd_publish() {
  require_ids "$@"
  local src="$PIPELINE_DIR/generated-videos"
  local v_dst="$PROJECT_ROOT/public/animal-videos"
  local t_dst="$PROJECT_ROOT/public/animal-thumbnails"
  mkdir -p "$v_dst" "$t_dst"

  for aid in "$@"; do
    for kind in idle receive; do
      local mp4="$src/${aid}_${kind}.mp4"
      local jpg="$src/${aid}_${kind}.jpg"
      if [ ! -f "$mp4" ]; then
        echo "  ✗ missing $mp4 — skipping ${aid}/${kind}"
        continue
      fi
      cp "$mp4" "$v_dst/${aid}_${kind}.mp4"
      echo "  ✓ public/animal-videos/${aid}_${kind}.mp4"

      # Auto-extract poster from first frame if missing
      if [ ! -f "$jpg" ]; then
        if command -v ffmpeg >/dev/null 2>&1; then
          ffmpeg -y -loglevel error -i "$mp4" -frames:v 1 -q:v 3 "$jpg"
          echo "  ⌑ extracted poster ${aid}_${kind}.jpg from first frame"
        else
          echo "  ! no poster and ffmpeg not installed — install ffmpeg or extract manually"
          continue
        fi
      fi
      cp "$jpg" "$t_dst/${aid}_${kind}.jpg"
      echo "  ✓ public/animal-thumbnails/${aid}_${kind}.jpg"
    done
  done
}

cmd_r2() {
  require_ids "$@"
  local src="$PIPELINE_DIR/generated-videos"
  local bucket="animal-penpals"

  for aid in "$@"; do
    for kind in idle receive; do
      local mp4="$src/${aid}_${kind}.mp4"
      local jpg="$src/${aid}_${kind}.jpg"
      if [ -f "$mp4" ]; then
        echo "  ↑ R2 animal-videos/${aid}_${kind}.mp4"
        npx wrangler r2 object put "$bucket/animal-videos/${aid}_${kind}.mp4" --file "$mp4" --remote
      else
        echo "  ✗ missing $mp4"
      fi
      if [ -f "$jpg" ]; then
        echo "  ↑ R2 animal-thumbnails/${aid}_${kind}.jpg"
        npx wrangler r2 object put "$bucket/animal-thumbnails/${aid}_${kind}.jpg" --file "$jpg" --remote
      fi
    done
  done
}

cmd_ship() {
  require_ids "$@"
  cmd_publish "$@"
  cmd_r2 "$@"
  echo ""
  echo "→ regenerating landing pages…"
  (cd "$PROJECT_ROOT" && npx tsx --tsconfig tsconfig.app.json scripts/generate-animal-pages.tsx)
  echo ""
  echo "Done. Don't forget:"
  echo "  • update voiceId in src/data/animals.ts after voice screener"
  echo "  • redeploy Scribbles agent: /11labs push"
}

cmd_launch() {
  open "$PIPELINE_DIR/launch.html"
}

cmd_use_character() {
  if [ "$#" -ne 2 ]; then
    echo "Usage: ./pipeline/run.sh use-character <animal_id> <path/to/image>"
    echo "Available IDs: $(list_animal_ids)"
    exit 1
  fi
  local aid="$1"
  local src="$2"
  if [ ! -f "$src" ]; then
    echo "Error: file not found: $src"
    exit 1
  fi
  mkdir -p "$PIPELINE_DIR/character-images"
  local dst="$PIPELINE_DIR/character-images/${aid}_character.png"
  # Convert any image (jpg/webp/heic) to png so downstream tools get a consistent format
  if command -v sips >/dev/null 2>&1; then
    sips -s format png "$src" --out "$dst" >/dev/null
  else
    cp "$src" "$dst"
  fi
  echo "  ✓ saved → pipeline/character-images/${aid}_character.png"
  echo "  → restart any running picker to pick up the new reference"
}

cmd_help() {
  sed -n '3,19p' "$0" | sed 's/^# \{0,1\}//'
}

case "$cmd" in
  status)      cmd_status "$@" ;;
  samples)     cmd_samples "$@" ;;
  voices)      cmd_voices ;;
  characters)  cmd_characters ;;
  storyboards) cmd_storyboards ;;
  videos)      cmd_videos ;;
  publish)     cmd_publish "$@" ;;
  r2)          cmd_r2 "$@" ;;
  ship)        cmd_ship "$@" ;;
  launch)      cmd_launch ;;
  use-character) cmd_use_character "$@" ;;
  help|-h|--help) cmd_help ;;
  *) echo "Unknown command: $cmd"; cmd_help; exit 1 ;;
esac
