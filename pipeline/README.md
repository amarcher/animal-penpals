# Animal Pipeline

Reusable pipeline for adding new animal characters to Animal Penpals.

## Quick Start

```bash
# 1. Define animals in animals.json (see format below)

# 2. Pick voices
./pipeline/generate-samples.sh           # fetch TTS samples (optional)
./pipeline/voice-screener/serve.sh       # → http://localhost:8111/voice-screener/
# Listen, design custom voices, pick winners → copy JSON config

# 3. Pick character images
./pipeline/character-picker/serve.sh     # → http://localhost:8222/character-picker/
# Generate photorealistic images, pick favorites → download PNGs

# 4. Update src/data/animals.ts with chosen voiceIds
# 5. Generate videos from character images (next step)
# 6. Upload assets to R2, regenerate landing pages
```

## Directory Structure

```
pipeline/
├── animals.json              ← INPUT: animal definitions + prompts
├── generate-samples.sh       ← fetches MP3 samples from voice candidates
├── .gitignore                ← excludes runtime artifacts from git
├── README.md
├── voice-samples/            ← generated MP3 files (gitignored)
├── character-images/         ← selected character PNGs (gitignored)
│   ├── swan_character.png
│   ├── pig_character.png
│   └── ...
├── storyboard-images/        ← storyboard beat PNGs (gitignored)
│   ├── swan_beat_1_receiving.png
│   ├── swan_beat_2_opening.png
│   └── ...
├── voice-screener/
│   ├── index.html            ← Voice Screener UI
│   ├── serve.sh              ← reads .env + animals.json → config.js
│   └── config.js             ← generated at runtime (gitignored)
├── character-picker/
│   ├── index.html            ← Character Picker UI
│   ├── serve.sh              ← reads .env + animals.json → config.js
│   └── config.js             ← generated at runtime (gitignored)
├── storyboard-picker/
│   ├── index.html            ← Storyboard Picker UI
│   ├── serve.sh              ← reads .env + animals.json → config.js
│   └── config.js             ← generated at runtime (gitignored)
└── video-generator/
    ├── index.html            ← Video Generator UI (manual + API + storyboard extend)
    ├── serve.sh              ← reads .env + animals.json + images → config.js
    └── config.js             ← generated at runtime (gitignored)
```

## animals.json Format

```jsonc
[
  {
    "id": "swan",
    "name": "Serena the Swan",
    "emoji": "🦢",
    "color": "#E8D5E0",
    "greeting": "Oh, how lovely…",               // TTS sample text (min 100 chars)
    "imagePrompt": "A photorealistic Mute Swan…", // Imagen generation prompt
    "voiceDesignPrompt": "An elegant, soft…",     // custom voice design prompt
    "voiceCandidates": [
      { "label": "A", "name": "Alice", "voiceId": "Xb7hH8MSUJpSbSDYk0k2" }
    ]
  }
]
```

## Pipeline Steps

### Step 1: Voice Selection (`voice-screener/`)

**Launch:** `./pipeline/voice-screener/serve.sh` (port 8111)
**Requires:** `ELEVENLABS_API_KEY` in `.env`

Features:
- Play pre-generated or on-the-fly TTS samples
- Generate & Play custom text with any voice
- Design custom voices from editable text prompts (ElevenLabs Voice Design API)
- Save designed voices to your ElevenLabs library
- Pick a winner per animal → copy JSON config

### Step 2: Character Image Selection (`character-picker/`)

**Launch:** `./pipeline/character-picker/serve.sh` (port 8222)
**Requires:** `GOOGLE_AI_API_KEY` in `.env` ([get one](https://aistudio.google.com/apikey))
**Cost:** ~$0.08 per generation (4 images × $0.02 via Imagen 4 Fast)

Features:
- Editable photorealistic image prompts per animal
- Generate 4 candidate images in a 2×2 grid (Google Imagen 4 API)
- Click to view full-size lightbox
- Pick favorites, regenerate with tweaked prompts
- Download selected images as `{animalId}_character.png`

### Step 3: Video Generation (TODO)

Generate idle + receive videos from selected character images.

### Step 4: Integration

1. Update `src/data/animals.ts` with voiceIds
2. Upload videos + thumbnails to R2
3. Regenerate landing pages: `npx tsx scripts/generate-animal-pages.tsx`

## Adding New Animals

1. Add entries to `animals.json` with all prompts and voice candidates
2. Run voice screener → pick/design voices
3. Run character picker → pick character images (saved to `character-images/`)
4. Run storyboard picker → pick beat keyframes (saved to `storyboard-images/`)
5. Run video generator → generate idle + receive videos (saved to `generated-videos/`)
6. Add animal to `src/data/animals.ts`, `api/generate-response.ts`, `src/data/videoManifest.ts`
7. Upload videos + thumbnails to R2: `npx wrangler r2 object put animal-penpals/... --remote`
8. Update Scribbles agent config: add animal to `agent_configs/Animal-Penpals.json`, deploy with `/elevenlabs`
9. Regenerate landing pages: `npx tsx scripts/generate-animal-pages.tsx`

## APIs Used

| Service | Endpoint | Purpose |
|---------|----------|---------|
| ElevenLabs | `GET /v1/voices` | List voices for candidate selection |
| ElevenLabs | `POST /v1/text-to-speech/{voiceId}` | Generate TTS sample |
| ElevenLabs | `POST /v1/text-to-voice/create-previews` | Generate 3 custom voice previews |
| ElevenLabs | `POST /v1/text-to-voice/create-voice-from-preview` | Save voice to library |
| Google AI | `POST /v1beta/models/imagen-4.0-fast-generate-001:predict` | Generate 4 candidate images |
