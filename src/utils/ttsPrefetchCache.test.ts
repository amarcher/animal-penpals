import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ttsPrefetchCache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function loadModule() {
    return await import('./ttsPrefetchCache.ts');
  }

  it('prefetchTts fires fetch and caches promise', async () => {
    const mockData = { audio_base64: 'abc', alignment: { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) }));

    const { prefetchTts, getCachedTts } = await loadModule();

    const promise = prefetchTts('Hello', 'voice-1');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getCachedTts('Hello', 'voice-1')).toBe(promise);

    const result = await promise;
    expect(result.audio_base64).toBe('abc');
  });

  it('second call with same key returns existing promise without new fetch', async () => {
    const mockData = { audio_base64: 'abc', alignment: { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) }));

    const { prefetchTts } = await loadModule();

    const p1 = prefetchTts('Hello', 'voice-1');
    const p2 = prefetchTts('Hello', 'voice-1');

    expect(p1).toBe(p2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('different text/voiceId gets separate cache entry', async () => {
    const mockData = { audio_base64: 'abc', alignment: { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) }));

    const { prefetchTts } = await loadModule();

    prefetchTts('Hello', 'voice-1');
    prefetchTts('Goodbye', 'voice-1');

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('evictTts removes entry', async () => {
    const mockData = { audio_base64: 'abc', alignment: { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) }));

    const { prefetchTts, getCachedTts, evictTts } = await loadModule();

    prefetchTts('Hello', 'voice-1');
    expect(getCachedTts('Hello', 'voice-1')).toBeDefined();

    evictTts('Hello', 'voice-1');
    expect(getCachedTts('Hello', 'voice-1')).toBeUndefined();
  });

  it('getCachedTts returns undefined for uncached entry', async () => {
    const { getCachedTts } = await loadModule();
    expect(getCachedTts('nothing', 'voice-1')).toBeUndefined();
  });

  it('failed fetch removes cache entry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const { prefetchTts, getCachedTts } = await loadModule();

    const promise = prefetchTts('Hello', 'voice-1');
    await expect(promise).rejects.toThrow('TTS request failed');
    expect(getCachedTts('Hello', 'voice-1')).toBeUndefined();
  });
});
