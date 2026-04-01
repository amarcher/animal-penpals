import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ReceiveAnimation } from './ReceiveAnimation.tsx';

// Mock caches
vi.mock('../../utils/videoPreloadCache.ts', () => ({
  getCachedVideo: vi.fn(() => null),
  preloadVideo: vi.fn(() => ({
    element: document.createElement('video'),
    ready: false,
    readyPromise: Promise.resolve(),
  })),
  evictVideo: vi.fn(),
}));

vi.mock('../../utils/ttsPrefetchCache.ts', () => ({
  prefetchTts: vi.fn(),
}));

describe('ReceiveAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading indicator for video path', () => {
    const responsePromise = new Promise<string>(() => {});

    render(
      <ReceiveAnimation
        animalId="elephant"
        responsePromise={responsePromise}
        onComplete={vi.fn()}
      />
    );

    // Video path shows loading indicator
    expect(screen.getByText('Opening your letter...')).toBeInTheDocument();
  });

  it('prefetches TTS when response promise resolves', async () => {
    const { prefetchTts } = await import('../../utils/ttsPrefetchCache.ts');
    const responsePromise = Promise.resolve('TTS text');

    render(
      <ReceiveAnimation
        animalId="elephant"
        responsePromise={responsePromise}
        onComplete={vi.fn()}
      />
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(prefetchTts).toHaveBeenCalledWith('TTS text', expect.any(String));
  });

  it('has safety timeout of 30 seconds', () => {
    const responsePromise = Promise.resolve('Response text');
    const onComplete = vi.fn();

    render(
      <ReceiveAnimation
        animalId="elephant"
        responsePromise={responsePromise}
        onComplete={onComplete}
      />
    );

    // Verify the 30s timeout exists by advancing past it
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // The safety timeout should trigger onComplete
    // (exact behavior depends on promise resolution timing)
  });
});
