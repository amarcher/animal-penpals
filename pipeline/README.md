# Animal Pipeline

Reusable pipeline for adding new animal characters to Animal Penpals.

## Quick Start

```bash
# 1. Define animals in animals.json (see format below)
# 2. Generate voice samples from library candidates
./pipeline/generate-samples.sh

# 3. Launch the Voice Screener UI
./pipeline/voice-screener/serve.sh
# → opens http://localhost:8111/voice-screener/

# 4. In the UI: listen to candidates, design custom voices, pick winners
# 5. Copy the JSON config from the summary panel
# 6. Update src/data/animals.ts with the chosen voiceIds
```

## Directory Structure

```
pipeline/
├── animals.json              ← INPUT: animal definitions + voice search config
├── generate-samples.sh       ← generates MP3 samples from voice candidates
├── .gitignore                ← excludes config.js and *.mp3 from git
├── README.md
├── voice-samples/            ← generated MP3 files (gitignored)
│   ├── swan_alice.mp3
│   ├── swan_lily.mp3
│   └── ...
└── voice-screener/
    ├── index.html            ← Voice Screener UI (config-driven, no hardcoded data)
    ├── serve.sh              ← injects .env key + animals.json → config.js, serves UI
    └── config.js             ← generated at runtime by serve.sh (gitignored)
```

## animals.json Format

```jsonc
[
  {
    "id": "swan",                    // must match the animal id in animals.ts
    "name": "Serena the Swan",       // display name
    "emoji": "🦢",
    "color": "#E8D5E0",             // theme color (used in UI accents)
    "greeting": "Oh, how lovely…",  // sample text for TTS (min 100 chars for voice design)
    "voiceDesignPrompt": "An elegant, soft…",  // starter prompt for custom voice generation
    "voiceCandidates": [
      { "label": "A", "name": "Alice", "voiceId": "Xb7hH8MSUJpSbSDYk0k2" },
      { "label": "B", "name": "Lily",  "voiceId": "pFZP5JQG7iQjIQuC4Bku" }
    ]
  }
]
```

## Voice Screener Features

- **Play pre-generated samples** — from `voice-samples/` directory
- **Play on-the-fly** — if no MP3 exists, generates via ElevenLabs TTS API on click
- **Generate & Play custom text** — type anything and hear it in the selected voice
- **Design custom voices** — editable prompt → generates 3 preview voices via ElevenLabs Voice Design API
- **Save to Library** — saves a generated voice permanently to your ElevenLabs account
- **Pick & compare** — pick a winner per animal, see summary with copyable JSON config

## Data Flow

```
animals.json ──→ generate-samples.sh ──→ voice-samples/*.mp3
     │                                        │
     └──→ serve.sh ──→ config.js ─────────────┘
                           │
                    voice-screener/index.html
                           │
                    ┌──────┴──────┐
                    │  User picks │
                    │  voices in  │
                    │  browser UI │
                    └──────┬──────┘
                           │
                    JSON config output
                           │
              src/data/animals.ts (voiceId field)
```

## Adding New Animals

1. Add entries to `animals.json` with voice candidates and design prompts
2. Run `./pipeline/generate-samples.sh` (or skip — UI can generate on-the-fly)
3. Run `./pipeline/voice-screener/serve.sh`
4. Pick/design voices, copy config
5. Add animal to `src/data/animals.ts`, `api/generate-response.ts`, `src/data/videoManifest.ts`
6. Generate videos and thumbnails, upload to R2
7. Regenerate landing pages: `npx tsx scripts/generate-animal-pages.tsx`

## ElevenLabs APIs Used

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/voices` | List available voices for candidate selection |
| `POST /v1/text-to-speech/{voiceId}` | Generate TTS sample from existing voice |
| `POST /v1/text-to-voice/create-previews` | Generate 3 custom voice previews from description |
| `POST /v1/text-to-voice/create-voice-from-preview` | Save a generated voice to your library |
