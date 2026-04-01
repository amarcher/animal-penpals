import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('videoPreloadCache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function loadModule() {
    return await import('./videoPreloadCache.ts');
  }

  it('preloadVideo creates and caches video element', async () => {
    const { preloadVideo, getCachedVideo } = await loadModule();

    const cached = preloadVideo('/test.mp4');
    expect(cached).toBeDefined();
    expect(cached.element).toBeInstanceOf(HTMLVideoElement);
    expect(getCachedVideo('/test.mp4')).toBe(cached);
  });

  it('second preloadVideo call returns same cached entry', async () => {
    const { preloadVideo } = await loadModule();

    const first = preloadVideo('/test.mp4');
    const second = preloadVideo('/test.mp4');
    expect(first).toBe(second);
  });

  it('getCachedVideo returns undefined for uncached URL', async () => {
    const { getCachedVideo } = await loadModule();
    expect(getCachedVideo('/nothing.mp4')).toBeUndefined();
  });

  it('evictVideo removes entry', async () => {
    const { preloadVideo, getCachedVideo, evictVideo } = await loadModule();

    preloadVideo('/test.mp4');
    expect(getCachedVideo('/test.mp4')).toBeDefined();

    evictVideo('/test.mp4');
    expect(getCachedVideo('/test.mp4')).toBeUndefined();
  });
});
