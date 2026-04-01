/**
 * TTS prefetch cache.
 *
 * Allows firing the TTS API request early (e.g. during the send animation)
 * so the audio is ready by the time ReadingView mounts.
 */

export interface TtsResult {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

const cache = new Map<string, Promise<TtsResult>>();

function cacheKey(text: string, voiceId: string): string {
  return `${voiceId}:${text}`;
}

/**
 * Start a TTS request and cache the promise. Safe to call multiple times —
 * subsequent calls with the same text+voiceId return the existing promise.
 */
export function prefetchTts(text: string, voiceId: string): Promise<TtsResult> {
  const key = cacheKey(text, voiceId);
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  })
    .then(res => {
      if (!res.ok) throw new Error('TTS request failed');
      return res.json() as Promise<TtsResult>;
    })
    .catch(err => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, promise);
  return promise;
}

/**
 * Retrieve a cached TTS promise, or undefined if not prefetched.
 */
export function getCachedTts(text: string, voiceId: string): Promise<TtsResult> | undefined {
  return cache.get(cacheKey(text, voiceId));
}

/**
 * Remove an entry from the cache.
 */
export function evictTts(text: string, voiceId: string): void {
  cache.delete(cacheKey(text, voiceId));
}
