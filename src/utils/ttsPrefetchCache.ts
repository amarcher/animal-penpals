/**
 * TTS streaming prefetch cache.
 *
 * Calls /api/tts (which proxies ElevenLabs' stream/with-timestamps SSE
 * endpoint), parses chunks as they arrive, and feeds the audio bytes into a
 * MediaSource so playback can start before the full generation finishes.
 * The cache promise resolves on the FIRST chunk so callers can begin playback
 * almost immediately; the alignment array keeps growing as later chunks land.
 *
 * Browsers without MediaSource + audio/mpeg (notably Safari historically) fall
 * back to a non-streaming Blob — same behaviour as before this change.
 */

export interface TtsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface TtsResult {
  audio: HTMLAudioElement;
  blobUrl: string;
  /**
   * Mutated as more chunks arrive. Consumers should re-derive word timings
   * when they observe `alignment.characters.length` growing.
   */
  alignment: TtsAlignment;
  /** Resolves when the entire stream has been received and appended. */
  fullyLoaded: Promise<void>;
}

interface RawSseChunk {
  audio_base64?: string;
  alignment?: TtsAlignment;
}

const cache = new Map<string, Promise<TtsResult>>();

function cacheKey(text: string, voiceId: string): string {
  return `${voiceId}:${text}`;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function supportsMediaSourceMpeg(): boolean {
  return typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg');
}

/** Append a chunk and wait for the SourceBuffer to finish processing it. */
function appendBuffer(sourceBuffer: SourceBuffer, bytes: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEnd = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error('SourceBuffer append failed')); };
    const cleanup = () => {
      sourceBuffer.removeEventListener('updateend', onEnd);
      sourceBuffer.removeEventListener('error', onErr);
    };
    sourceBuffer.addEventListener('updateend', onEnd);
    sourceBuffer.addEventListener('error', onErr);
    try {
      sourceBuffer.appendBuffer(bytes as unknown as BufferSource);
    } catch (err) {
      cleanup();
      reject(err as Error);
    }
  });
}

/**
 * Start a TTS request and cache the promise. Safe to call multiple times —
 * subsequent calls with the same text+voiceId return the existing promise.
 */
export function prefetchTts(text: string, voiceId: string): Promise<TtsResult> {
  const key = cacheKey(text, voiceId);
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = supportsMediaSourceMpeg()
    ? streamTts(text, voiceId, key)
    : batchTts(text, voiceId, key);

  cache.set(key, promise);
  promise.catch(err => {
    console.error('[tts] prefetch failed:', err);
    cache.delete(key);
  });
  return promise;
}

async function streamTts(text: string, voiceId: string, key: string): Promise<TtsResult> {
  const startedAt = performance.now();
  console.time(`[tts] stream-to-first-chunk ${key.slice(0, 40)}`);

  const mediaSource = new MediaSource();
  const blobUrl = URL.createObjectURL(mediaSource);
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = blobUrl;

  // SourceBuffer can only be created after MediaSource is open
  await new Promise<void>(resolve => {
    mediaSource.addEventListener('sourceopen', () => resolve(), { once: true });
  });
  const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

  const alignment: TtsAlignment = {
    characters: [],
    character_start_times_seconds: [],
    character_end_times_seconds: [],
  };

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok || !res.body) {
    URL.revokeObjectURL(blobUrl);
    throw new Error(`TTS request failed: ${res.status}`);
  }

  let firstChunkResolve!: () => void;
  let firstChunkResolved = false;
  const firstChunk = new Promise<void>(resolve => { firstChunkResolve = resolve; });
  let fullyLoadedResolve!: () => void;
  let fullyLoadedReject!: (err: Error) => void;
  const fullyLoaded = new Promise<void>((resolve, reject) => {
    fullyLoadedResolve = resolve;
    fullyLoadedReject = reject;
  });

  // Append serially so SourceBuffer never sees concurrent updates
  let appendQueue: Promise<void> = Promise.resolve();
  const enqueueAppend = (bytes: Uint8Array): Promise<void> => {
    appendQueue = appendQueue.then(() => appendBuffer(sourceBuffer, bytes));
    return appendQueue;
  };

  // Drive the SSE parser in the background; the outer promise resolves
  // synchronously on the first chunk.
  (async () => {
    try {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE: events are separated by blank lines
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          const dataPayload = event
            .split('\n')
            .filter(l => l.startsWith('data:'))
            .map(l => l.slice(5).trimStart())
            .join('');
          if (!dataPayload) continue;

          let chunk: RawSseChunk;
          try {
            chunk = JSON.parse(dataPayload);
          } catch (err) {
            console.warn('[tts] skipping malformed SSE chunk', err);
            continue;
          }

          if (chunk.alignment) {
            alignment.characters.push(...chunk.alignment.characters);
            alignment.character_start_times_seconds.push(...chunk.alignment.character_start_times_seconds);
            alignment.character_end_times_seconds.push(...chunk.alignment.character_end_times_seconds);
          }

          if (chunk.audio_base64) {
            const bytes = base64ToBytes(chunk.audio_base64);
            enqueueAppend(bytes); // don't await — let parsing run ahead
            if (!firstChunkResolved) {
              firstChunkResolved = true;
              console.timeEnd(`[tts] stream-to-first-chunk ${key.slice(0, 40)}`);
              firstChunkResolve();
            }
          }
        }
      }

      // Drain remaining appends, then close the MediaSource
      await appendQueue;
      if (mediaSource.readyState === 'open') mediaSource.endOfStream();
      console.log(`[tts] stream complete in ${(performance.now() - startedAt).toFixed(0)}ms (${alignment.characters.length} chars)`);
      fullyLoadedResolve();
    } catch (err) {
      console.error('[tts] stream error:', err);
      try { if (mediaSource.readyState === 'open') mediaSource.endOfStream('decode'); } catch { /* ignore */ }
      fullyLoadedReject(err as Error);
    }
  })();

  // If the first SSE event somehow has no audio, the outer promise would
  // hang forever. Race against fullyLoaded so we still resolve in that case.
  await Promise.race([firstChunk, fullyLoaded]);

  return { audio, blobUrl, alignment, fullyLoaded };
}

/** Non-streaming fallback for browsers without MediaSource audio/mpeg. */
async function batchTts(text: string, voiceId: string, key: string): Promise<TtsResult> {
  console.time(`[tts] batch ${key.slice(0, 40)}`);
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok || !res.body) throw new Error(`TTS request failed: ${res.status}`);

  const alignment: TtsAlignment = {
    characters: [],
    character_start_times_seconds: [],
    character_end_times_seconds: [],
  };
  const audioParts: Uint8Array[] = [];

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) {
      const dataPayload = event
        .split('\n')
        .filter(l => l.startsWith('data:'))
        .map(l => l.slice(5).trimStart())
        .join('');
      if (!dataPayload) continue;
      let chunk: RawSseChunk;
      try { chunk = JSON.parse(dataPayload); } catch { continue; }
      if (chunk.audio_base64) audioParts.push(base64ToBytes(chunk.audio_base64));
      if (chunk.alignment) {
        alignment.characters.push(...chunk.alignment.characters);
        alignment.character_start_times_seconds.push(...chunk.alignment.character_start_times_seconds);
        alignment.character_end_times_seconds.push(...chunk.alignment.character_end_times_seconds);
      }
    }
  }

  const blob = new Blob(audioParts as BlobPart[], { type: 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = blobUrl;
  audio.load();
  console.timeEnd(`[tts] batch ${key.slice(0, 40)}`);

  return { audio, blobUrl, alignment, fullyLoaded: Promise.resolve() };
}

/** Retrieve a cached TTS promise, or undefined if not prefetched. */
export function getCachedTts(text: string, voiceId: string): Promise<TtsResult> | undefined {
  return cache.get(cacheKey(text, voiceId));
}

/** Remove an entry from the cache and revoke its blob URL. */
export function evictTts(text: string, voiceId: string): void {
  const key = cacheKey(text, voiceId);
  const entry = cache.get(key);
  cache.delete(key);
  if (entry) {
    entry.then(({ blobUrl, audio }) => {
      audio.pause();
      audio.removeAttribute('src');
      URL.revokeObjectURL(blobUrl);
    }).catch(() => { /* ignored */ });
  }
}
