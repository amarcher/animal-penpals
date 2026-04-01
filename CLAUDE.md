# Animal Penpals

A kid-friendly app where children write pen pal letters to animal characters. An ElevenLabs voice agent ("Scribbles") coaches them through composing letters. Animals respond with AI-generated replies (via Claude API) read aloud with word-by-word highlighting so kids can read along.

## Tech Stack

- **UI:** React 19 + TypeScript 5.9, Vite 8
- **Voice Agent:** ElevenLabs Conversational AI (`@elevenlabs/react`)
- **Animations:** framer-motion
- **Styling:** Co-located CSS files (BEM naming, no CSS-in-JS)
- **Backend:** Vercel serverless functions (`api/` directory)
- **AI Responses:** Claude API via `@anthropic-ai/sdk`
- **TTS:** ElevenLabs text-to-speech with word-level timestamps
- **Deployment:** Vercel

## Commands

- `npm run dev` — start dev server (proxies `/api` to production)
- `npm run build` — type-check + build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npm run test` — run all tests once
- `npm run test:watch` — run tests in watch mode
- `npm run preview` — preview production build

## Testing

- **Framework:** Vitest + @testing-library/react + happy-dom
- **Co-located tests:** each `.tsx`/`.ts` has a matching `.test.tsx`/`.test.ts`
- **Setup:** `src/test/setup.ts` — global mocks for matchMedia, Audio, HTMLMediaElement, and framer-motion
- **Integration tests:** `src/test/integration/` — full App-level flows
- **API route tests:** `api/*.test.ts` — call handlers directly with mock req/res

## Architecture

### Navigation State Machine

Single `useState<AppState>` in App.tsx drives all views:
- `mailbox` — animal selection grid
- `compose` — letter writing interface
- `sending` — send animation (letter folds, envelope flies away)
- `receiving` — animal reads/writes animation
- `reading` — response display with TTS word highlighting

### Key Hooks

- `useNavigation` — state machine transitions
- `usePenpalConversation` — ElevenLabs agent wrapper with 3 client tools
- `useLetterStore` — localStorage-backed thread/letter persistence
- `useTtsPlayback` — TTS playback with word-level timing for highlighting

### Agent (Scribbles)

Config: `agent_configs/Animal-Penpals-Coach.json`
Tools: `select_animal`, `send_letter`, `go_to_mailbox` (in `tool_configs/`)

The agent helps kids compose letters, suggests topics, and can trigger navigation.

### API Routes

- `api/generate-response.ts` — Claude API generates animal replies
- `api/tts.ts` — proxies ElevenLabs TTS with timestamps (keeps API key server-side)

### Environment Variables

- `VITE_ELEVENLABS_AGENT_ID` — ElevenLabs agent ID for Scribbles
- `ELEVENLABS_API_KEY` — ElevenLabs API key (for TTS proxy)
- `ANTHROPIC_API_KEY` — Anthropic API key (for response generation)

## Conventions

- Follows same patterns as sibling projects: `solar-system/`, `periodic-table/`
- Co-located CSS: each `.tsx` has matching `.css` in same directory
- CSS custom property `--animal-color` propagates animal theme color
- No component library — custom HTML + CSS
- TypeScript strict mode, no `any`
