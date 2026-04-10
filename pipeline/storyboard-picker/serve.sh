#!/bin/bash
# serve.sh — Launch the Storyboard Picker UI.
set -euo pipefail
cd "$(dirname "$0")/.."

GOOGLE_AI_API_KEY=$(grep GOOGLE_AI_API_KEY ../.env | cut -d= -f2 | tr -d "'" | tr -d '"')
if [ -z "$GOOGLE_AI_API_KEY" ]; then
  echo "Error: GOOGLE_AI_API_KEY not found in .env"
  echo "Get one at https://aistudio.google.com/apikey"
  exit 1
fi

ANIMALS_JSON=$(python3 -c "
import json, os, base64
with open('animals.json') as f:
    animals = json.load(f)
for animal in animals:
    img_path = f\"character-images/{animal['id']}_character.png\"
    if os.path.exists(img_path):
        with open(img_path, 'rb') as img:
            animal['characterImageBase64'] = base64.b64encode(img.read()).decode()
    else:
        animal['characterImageBase64'] = None
print(json.dumps(animals))
")

cat > storyboard-picker/config.js <<EOF
window.__GOOGLE_AI_API_KEY__ = "${GOOGLE_AI_API_KEY}";
window.__ANIMALS__ = ${ANIMALS_JSON};
EOF

echo "Storyboard Picker running at http://localhost:8444/storyboard-picker/"
open "http://localhost:8444/storyboard-picker/"
python3 -m http.server 8444
