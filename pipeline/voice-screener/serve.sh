#!/bin/bash
#
# serve.sh — Launch the Voice Screener UI.
#
# Reads the ElevenLabs API key from .env and the animal definitions from
# animals.json, writes them into config.js, then serves the UI on port 8111.
#
# Usage:
#   ./pipeline/voice-screener/serve.sh
#
# Prerequisites:
#   1. animals.json exists in pipeline/ with animal definitions
#   2. Voice samples generated via generate-samples.sh (optional — you can
#      also design voices directly in the UI without pre-generated samples)
#

set -euo pipefail
cd "$(dirname "$0")/.."

# Read API key from project .env
ELEVENLABS_API_KEY=$(grep ELEVENLABS_API_KEY ../.env | cut -d= -f2 | tr -d "'" | tr -d '"')
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Error: ELEVENLABS_API_KEY not found in .env"
  exit 1
fi

# Read animal data from animals.json and build the config
ANIMALS_JSON=$(python3 -c "
import json, os

with open('animals.json') as f:
    animals = json.load(f)

# Resolve candidate file paths — check if MP3 exists
samples_dir = 'voice-samples'
for animal in animals:
    for c in animal.get('voiceCandidates', []):
        filename = f\"{animal['id']}_{c['name'].lower()}.mp3\"
        filepath = os.path.join(samples_dir, filename)
        c['file'] = f'../voice-samples/{filename}' if os.path.exists(filepath) else None

print(json.dumps(animals))
")

# Write config.js
cat > voice-screener/config.js <<EOF
window.__ELEVENLABS_API_KEY__ = "${ELEVENLABS_API_KEY}";
window.__ANIMALS__ = ${ANIMALS_JSON};
EOF

echo "Voice Screener running at http://localhost:8111/voice-screener/"
open "http://localhost:8111/voice-screener/"
python3 -m http.server 8111
