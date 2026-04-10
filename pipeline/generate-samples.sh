#!/bin/bash
#
# generate-samples.sh — Fetch TTS voice samples for each animal's voice candidates.
#
# Reads animals.json and generates one MP3 per candidate using ElevenLabs TTS API.
# Output goes to voice-samples/{animalId}_{voiceName}.mp3
#
# Usage:
#   ./pipeline/generate-samples.sh              # generate all
#   ./pipeline/generate-samples.sh pig narwhal   # generate specific animals only
#

set -euo pipefail
cd "$(dirname "$0")"

# Load API key from project .env
ELEVENLABS_API_KEY=$(grep ELEVENLABS_API_KEY ../.env | cut -d= -f2 | tr -d "'" | tr -d '"')
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Error: ELEVENLABS_API_KEY not found in .env"
  exit 1
fi

ANIMALS_FILE="animals.json"
OUTPUT_DIR="voice-samples"
mkdir -p "$OUTPUT_DIR"

# Optional filter: only generate for specific animal IDs
FILTER_ANIMALS=("$@")

# Read animals from JSON
ANIMAL_COUNT=$(python3 -c "import json; print(len(json.load(open('$ANIMALS_FILE'))))")

for i in $(seq 0 $((ANIMAL_COUNT - 1))); do
  ANIMAL_ID=$(python3 -c "import json; print(json.load(open('$ANIMALS_FILE'))[$i]['id'])")
  GREETING=$(python3 -c "import json; print(json.load(open('$ANIMALS_FILE'))[$i]['greeting'])")

  # Skip if filter is set and this animal isn't in it
  if [ ${#FILTER_ANIMALS[@]} -gt 0 ]; then
    FOUND=0
    for f in "${FILTER_ANIMALS[@]}"; do
      if [ "$f" = "$ANIMAL_ID" ]; then FOUND=1; break; fi
    done
    if [ $FOUND -eq 0 ]; then continue; fi
  fi

  CANDIDATE_COUNT=$(python3 -c "import json; print(len(json.load(open('$ANIMALS_FILE'))[$i]['voiceCandidates']))")

  for j in $(seq 0 $((CANDIDATE_COUNT - 1))); do
    VOICE_NAME=$(python3 -c "import json; print(json.load(open('$ANIMALS_FILE'))[$i]['voiceCandidates'][$j]['name'])")
    VOICE_ID=$(python3 -c "import json; print(json.load(open('$ANIMALS_FILE'))[$i]['voiceCandidates'][$j]['voiceId'])")

    OUTFILE="$OUTPUT_DIR/${ANIMAL_ID}_$(echo "$VOICE_NAME" | tr '[:upper:]' '[:lower:]').mp3"

    if [ -f "$OUTFILE" ]; then
      echo "  skip $OUTFILE (already exists)"
      continue
    fi

    echo "  generating $OUTFILE ($VOICE_NAME / $VOICE_ID)..."
    curl -s "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
      -H "xi-api-key: $ELEVENLABS_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$(python3 -c "import json; print(json.dumps({'text': '''$GREETING''', 'model_id': 'eleven_v3'}))")" \
      --output "$OUTFILE"

    SIZE=$(wc -c < "$OUTFILE" | tr -d ' ')
    echo "    done (${SIZE} bytes)"
  done
done

echo ""
echo "Samples ready in $OUTPUT_DIR/"
echo "Run ./voice-screener/serve.sh to launch the screener UI."
