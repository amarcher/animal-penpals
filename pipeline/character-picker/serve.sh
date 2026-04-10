#!/bin/bash
# serve.sh — Launch the Character Picker UI.
# Reads Google AI API key from .env and animal data from animals.json.
set -euo pipefail
cd "$(dirname "$0")/.."

GOOGLE_AI_API_KEY=$(grep GOOGLE_AI_API_KEY ../.env | cut -d= -f2 | tr -d "'" | tr -d '"')
if [ -z "$GOOGLE_AI_API_KEY" ]; then
  echo "Error: GOOGLE_AI_API_KEY not found in .env"
  echo "Get one at https://aistudio.google.com/apikey"
  exit 1
fi

ANIMALS_JSON=$(python3 -c "import json; print(json.dumps(json.load(open('animals.json'))))")

cat > character-picker/config.js <<EOF
window.__GOOGLE_AI_API_KEY__ = "${GOOGLE_AI_API_KEY}";
window.__ANIMALS__ = ${ANIMALS_JSON};
EOF

echo "Character Picker running at http://localhost:8222/character-picker/"
open "http://localhost:8222/character-picker/"
python3 -m http.server 8222
