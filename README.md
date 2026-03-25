# Animal Penpals

A kid-friendly app where children write pen pal letters to animal characters. An ElevenLabs voice agent coaches them through writing, animals respond with AI-generated letters read aloud with word-by-word highlighting, and kids can keep the correspondence going.

## Features

- **8 animal pen pals** with distinct personalities — Ella the Elephant, Percy the Penguin, Deena the Dolphin, Oliver the Owl, Finn the Fox, Shelly the Turtle, Polly the Parrot, and Bruno the Bear
- **Voice writing coach** ("Scribbles") powered by ElevenLabs Conversational AI helps kids compose their letters
- **AI-generated responses** — each animal writes back in character using Claude
- **Word-by-word TTS highlighting** — the animal's reply is read aloud with each word highlighted as it's spoken, so kids can read along
- **Send/receive animations** — letters fold into envelopes, fly away, and the animal reads and writes back with playful animations
- **Conversation threads** — kids can reply and keep the pen pal correspondence going, or write to a different animal
- **Persistent mailbox** — threads are saved locally so kids can pick up where they left off

## Getting Started

### Prerequisites

- Node.js 18+
- An [ElevenLabs](https://elevenlabs.io) account (for voice agent and TTS)
- An [Anthropic](https://console.anthropic.com) API key (for animal response generation)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/anthropics/animal-penpals.git
   cd animal-penpals
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `VITE_ELEVENLABS_AGENT_ID` — your ElevenLabs agent ID for the writing coach
   - `ELEVENLABS_API_KEY` — your ElevenLabs API key (used server-side for TTS)
   - `ANTHROPIC_API_KEY` — your Anthropic API key (used server-side for response generation)

4. Start the dev server:
   ```bash
   npm run dev
   ```

### Deployment

The app is designed for [Vercel](https://vercel.com). The `api/` directory contains serverless functions that handle AI response generation and TTS proxying.

```bash
vercel deploy
```

Set the environment variables in your Vercel project settings.

## Tech Stack

- **Frontend:** React 19, TypeScript 5.9, Vite 8
- **Voice Agent:** ElevenLabs Conversational AI (`@elevenlabs/react`)
- **Animations:** framer-motion
- **AI Responses:** Claude API via `@anthropic-ai/sdk`
- **TTS:** ElevenLabs with word-level timestamps
- **Styling:** Co-located CSS (no CSS-in-JS)
- **Deployment:** Vercel with serverless functions

## Architecture

The app uses a single `useState` state machine in `App.tsx` to drive 5 views:

1. **Mailbox** — grid of animal cards with unread indicators
2. **Compose** — lined paper writing interface with voice coach
3. **Sending** — fold/envelope/fly animation (API call runs in parallel)
4. **Receiving** — animal reads and writes back animation
5. **Reading** — response with word-by-word TTS highlighting

Follows the same patterns as sibling projects [Solar System Explorer](https://github.com/anthropics/solar-system) and [Periodic Table](https://github.com/anthropics/periodic-table).
