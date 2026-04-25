# Animal Pipeline

Reusable pipeline for adding new animal characters to Animal Penpals.

## Quick Start

Single entry point — `./pipeline/run.sh <step>` drives every stage:

```bash
./pipeline/run.sh status                          # see what's done per animal
./pipeline/run.sh samples spider giraffe          # generate TTS samples
./pipeline/run.sh voices                          # → voice screener UI (localhost:8111)
./pipeline/run.sh characters                      # → character picker UI (localhost:8222)
./pipeline/run.sh storyboards                     # → storyboard picker UI (localhost:8444)
./pipeline/run.sh videos                          # → video generator UI (localhost:8333)
./pipeline/run.sh ship spider giraffe hippo eagle # publish to public/ + R2 + regenerate pages
```

After `ship`, update `voiceId` in `src/data/animals.ts` with the picks from
the voice screener and redeploy the Scribbles agent (`/11labs push`).

The individual `*/serve.sh` scripts still work standalone — `run.sh` is just
a thin driver over them with shared status, publish, and R2 upload helpers.

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

1. Add entries to `pipeline/animals.json` with all prompts and voice candidates.
2. Add the same animals (with placeholder `voiceId`) to `src/data/animals.ts`,
   `api/generate-response.ts`, `src/data/videoManifest.ts`, and the Scribbles
   prompt in `agent_configs/Animal-Penpals.json`.
3. `./pipeline/run.sh samples <ids...>` then `./pipeline/run.sh voices` →
   pick/design voices → paste real `voiceId` back into `src/data/animals.ts`.
4. `./pipeline/run.sh characters` → pick character images.
5. `./pipeline/run.sh storyboards` → pick beat keyframes.
6. `./pipeline/run.sh videos` → generate idle + receive videos.
7. `./pipeline/run.sh ship <ids...>` → copies to `public/`, uploads to R2,
   regenerates landing pages.
8. Redeploy Scribbles agent: `/11labs push`.

Run `./pipeline/run.sh status` at any time to see what's still pending.

## APIs Used

| Service | Endpoint | Purpose |
|---------|----------|---------|
| ElevenLabs | `GET /v1/voices` | List voices for candidate selection |
| ElevenLabs | `POST /v1/text-to-speech/{voiceId}` | Generate TTS sample |
| ElevenLabs | `POST /v1/text-to-voice/create-previews` | Generate 3 custom voice previews |
| ElevenLabs | `POST /v1/text-to-voice/create-voice-from-preview` | Save voice to library |
| Google AI | `POST /v1beta/models/imagen-4.0-fast-generate-001:predict` | Generate 4 candidate images |
