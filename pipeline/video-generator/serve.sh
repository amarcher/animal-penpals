#!/bin/bash
# serve.sh — Launch the Video Generator UI.
set -euo pipefail
cd "$(dirname "$0")/.."

# Google AI API key is optional (manual mode works without it)
GOOGLE_AI_API_KEY=$(grep GOOGLE_AI_API_KEY ../.env 2>/dev/null | cut -d= -f2 | tr -d "'" | tr -d '"' || echo "")

ANIMALS_JSON=$(python3 -c "
import json, os, base64, glob

with open('animals.json') as f:
    animals = json.load(f)

for animal in animals:
    aid = animal['id']

    # Character reference image
    img_path = f'character-images/{aid}_character.png'
    if os.path.exists(img_path):
        with open(img_path, 'rb') as img:
            animal['characterImageBase64'] = base64.b64encode(img.read()).decode()
            animal['characterImageMimeType'] = 'image/png'
    else:
        animal['characterImageBase64'] = None

    # Storyboard beat images (auto-discover from storyboard-images/)
    beats = {}
    for f in sorted(glob.glob(f'storyboard-images/{aid}_beat_*.png')):
        # Filename: {id}_beat_{N}_{label}.png
        basename = os.path.basename(f)
        parts = basename.replace('.png', '').split('_beat_')
        if len(parts) == 2:
            rest = parts[1]  # e.g. '1_receiving'
            idx_str = rest.split('_')[0]
            label = '_'.join(rest.split('_')[1:])
            with open(f, 'rb') as img:
                beats[int(idx_str)] = {
                    'base64': base64.b64encode(img.read()).decode(),
                    'mimeType': 'image/png',
                    'label': label
                }
    animal['storyboardBeats'] = beats if beats else None

print(json.dumps(animals))
")

EXISTING_VIDEOS=$(python3 -c "
import json, os, glob
videos = {}
for f in glob.glob('generated-videos/*.mp4'):
    name = os.path.basename(f)
    # e.g. pig_receive.mp4 -> { animalId: 'pig', type: 'receive' }
    parts = name.replace('.mp4', '').split('_', 1)
    if len(parts) == 2:
        aid, vtype = parts
        # Skip segment files (pig_receive_seg1.mp4)
        if 'seg' in vtype:
            continue
        videos.setdefault(aid, {})[vtype] = f'/generated-videos/{name}'
print(json.dumps(videos))
")

cat > video-generator/config.js <<EOF
window.__GOOGLE_AI_API_KEY__ = "${GOOGLE_AI_API_KEY}";
window.__ANIMALS__ = ${ANIMALS_JSON};
window.__EXISTING_VIDEOS__ = ${EXISTING_VIDEOS};
EOF

echo "Video Generator running at http://localhost:8333/video-generator/"
open "http://localhost:8333/video-generator/"
python3 -c "
import http.server, json, base64, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save-video':
            length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(length))
            vid_dir = 'generated-videos'
            os.makedirs(vid_dir, exist_ok=True)
            filename = os.path.basename(body['filename'])
            data = base64.b64decode(body['base64'])
            path = os.path.join(vid_dir, filename)
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

http.server.HTTPServer(('', 8333), Handler).serve_forever()
"
