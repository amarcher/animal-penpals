import { describe, it, expect, vi, beforeEach } from 'vitest';

// happy-dom doesn't implement MediaSource, so the prefetch automatically takes
// the batchTts (non-streaming) fallback path. That path still parses the SSE
// response body — these tests cover that contract.

function sseStreamFrom(events: Array<Record<string, unknown>>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const lines = events.map(e => `data: ${JSON.stringify(e)}\n\n`);
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < lines.length) {
        controller.enqueue(encoder.encode(lines[i++]));
      } else {
        controller.close();
      }
    },
  });
}

const baseAlignment = {
  characters: ['H', 'i'],
  character_start_times_seconds: [0, 0.1],
  character_end_times_seconds: [0.1, 0.2],
};

describe('ttsPrefetchCache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function loadModule() {
    return await import('./ttsPrefetchCache.ts');
  }

  it('parses an SSE response into an audio element + alignment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: sseStreamFrom([{ audio_base64: 'dGVzdA==', alignment: baseAlignment }]),
    }));

    const { prefetchTts, getCachedTts } = await loadModule();
    const promise = prefetchTts('Hi', 'voice-1');
    expect(getCachedTts('Hi', 'voice-1')).toBe(promise);

    const result = await promise;
    expect(result.audio).toBeInstanceOf(HTMLAudioElement);
    expect(result.blobUrl).toMatch(/^blob:/);
    expect(result.alignment.characters).toEqual(['H', 'i']);
  });

  it('concatenates alignment across multiple SSE chunks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: sseStreamFrom([
        {
          audio_base64: 'dGVzdA==',
          alignment: { characters: ['H'], character_start_times_seconds: [0], character_end_times_seconds: [0.1] },
        },
        {
          audio_base64: 'dGVzdA==',
          alignment: { characters: ['i'], character_start_times_seconds: [0.1], character_end_times_seconds: [0.2] },
        },
      ]),
    }));

    const { prefetchTts } = await loadModule();
    const result = await prefetchTts('Hi', 'voice-1');
    await result.fullyLoaded;
    expect(result.alignment.characters).toEqual(['H', 'i']);
    expect(result.alignment.character_end_times_seconds).toEqual([0.1, 0.2]);
  });

  it('second call with same key returns existing promise without new fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: sseStreamFrom([{ audio_base64: 'dGVzdA==', alignment: baseAlignment }]),
    }));

    const { prefetchTts } = await loadModule();
    const p1 = prefetchTts('Hi', 'voice-1');
    const p2 = prefetchTts('Hi', 'voice-1');
    expect(p1).toBe(p2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('different text/voiceId gets a separate cache entry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: sseStreamFrom([{ audio_base64: 'dGVzdA==', alignment: baseAlignment }]),
    }));

    const { prefetchTts } = await loadModule();
    prefetchTts('Hello', 'voice-1');
    prefetchTts('Goodbye', 'voice-1');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('evictTts removes the entry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: sseStreamFrom([{ audio_base64: 'dGVzdA==', alignment: baseAlignment }]),
    }));

    const { prefetchTts, getCachedTts, evictTts } = await loadModule();
    prefetchTts('Hi', 'voice-1');
    expect(getCachedTts('Hi', 'voice-1')).toBeDefined();
    evictTts('Hi', 'voice-1');
    expect(getCachedTts('Hi', 'voice-1')).toBeUndefined();
  });

  it('getCachedTts returns undefined for uncached entry', async () => {
    const { getCachedTts } = await loadModule();
    expect(getCachedTts('nothing', 'voice-1')).toBeUndefined();
  });

  it('failed fetch removes cache entry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, body: null }));

    const { prefetchTts, getCachedTts } = await loadModule();
    const promise = prefetchTts('Hi', 'voice-1');
    await expect(promise).rejects.toThrow(/TTS request failed/);
    expect(getCachedTts('Hi', 'voice-1')).toBeUndefined();
  });
});
