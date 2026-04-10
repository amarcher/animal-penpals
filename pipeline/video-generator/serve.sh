#!/bin/bash
# serve.sh — Launch the Video Generator UI.
set -euo pipefail
cd "$(dirname "$0")/.."

# Google AI API key is optional (manual mode works without it)
GOOGLE_AI_API_KEY=$(grep GOOGLE_AI_API_KEY ../.env 2>/dev/null | cut -d= -f2 | tr -d "'" | tr -d '"' || echo "")

ANIMALS_JSON=$(python3 -c "
import json, os, base64
with open('animals.json') as f:
    animals = json.load(f)
for animal in animals:
    img_path = f\"character-images/{animal['id']}_character.png\"
    if os.path.exists(img_path):
        with open(img_path, 'rb') as img:
            animal['characterImageBase64'] = base64.b64encode(img.read()).decode()
            animal['characterImageMimeType'] = 'image/png'
    else:
        animal['characterImageBase64'] = None
print(json.dumps(animals))
")

cat > video-generator/config.js <<EOF
window.__GOOGLE_AI_API_KEY__ = "${GOOGLE_AI_API_KEY}";
window.__ANIMALS__ = ${ANIMALS_JSON};
EOF

echo "Video Generator running at http://localhost:8333/video-generator/"
open "http://localhost:8333/video-generator/"
python3 -m http.server 8333
