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
python3 -c "
import http.server, json, base64, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save-pick':
            length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(length))
            img_dir = 'storyboard-images'
            os.makedirs(img_dir, exist_ok=True)
            filename = os.path.basename(body['filename'])
            data = base64.b64decode(body['base64'])
            path = os.path.join(img_dir, filename)
            with open(path, 'wb') as f:
                f.write(data)
            print(f'  Saved {path} ({len(data)} bytes)')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'path': path}).encode())
        else:
            self.send_response(404)
            self.end_headers()

http.server.HTTPServer(('', 8444), Handler).serve_forever()
"
