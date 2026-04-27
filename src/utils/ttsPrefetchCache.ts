/**
 * TTS prefetch cache.
 *
 * Fires the TTS API request early (during the send animation) so audio is
 * ready by the time ReadingView mounts. Also pre-decodes the response into
 * an HTMLAudioElement backed by a Blob URL — the browser starts buffering
 * the MP3 immediately, so `audio.play()` from ReadingView is near-instant
 * instead of incurring a base64-decode + media-pipeline init.
 */

export interface TtsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface TtsResult {
  audio: HTMLAudioElement;
  blobUrl: string;
  alignment: TtsAlignment;
}

interface RawTtsResponse {
  audio_base64: string;
  alignment: TtsAlignment;
}

const cache = new Map<string, Promise<TtsResult>>();

function cacheKey(text: string, voiceId: string): string {
  return `${voiceId}:${text}`;
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Start a TTS request and cache the promise. Safe to call multiple times —
 * subsequent calls with the same text+voiceId return the existing promise.
 */
export function prefetchTts(text: string, voiceId: string): Promise<TtsResult> {
  const key = cacheKey(text, voiceId);
  const existing = cache.get(key);
  if (existing) return existing;

  console.time(`[tts] prefetch ${key.slice(0, 40)}`);
  const promise = fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  })
    .then(res => {
      if (!res.ok) throw new Error('TTS request failed');
      return res.json() as Promise<RawTtsResponse>;
    })
    .then(data => {
      console.timeEnd(`[tts] prefetch ${key.slice(0, 40)}`);
      const blob = base64ToBlob(data.audio_base64, 'audio/mpeg');
      const blobUrl = URL.createObjectURL(blob);

      // Pre-create the audio element so the browser starts decoding/buffering
      // now instead of when ReadingView mounts.
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = blobUrl;
      audio.load();
      console.log('[tts] audio element created and loading', { key: key.slice(0, 40), size: blob.size });

      return { audio, blobUrl, alignment: data.alignment };
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
 * Remove an entry from the cache and revoke its blob URL.
 */
export function evictTts(text: string, voiceId: string): void {
  const key = cacheKey(text, voiceId);
  const entry = cache.get(key);
  cache.delete(key);
  if (entry) {
    entry.then(({ blobUrl, audio }) => {
      audio.pause();
      audio.removeAttribute('src');
      URL.revokeObjectURL(blobUrl);
    }).catch(() => {});
  }
}
