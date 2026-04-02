import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

  it('has safety timeout of 15 seconds', async () => {
    const responsePromise = Promise.resolve('Response text');
    const onComplete = vi.fn();

    render(
      <ReceiveAnimation
        animalId="elephant"
        responsePromise={responsePromise}
        onComplete={onComplete}
      />
    );

    // Should NOT have fired at 14s
    await act(async () => {
      vi.advanceTimersByTime(14_000);
    });
    expect(onComplete).not.toHaveBeenCalled();

    // Should fire at 15s
    await act(async () => {
      vi.advanceTimersByTime(1_000);
      await vi.runAllTimersAsync();
    });

    expect(onComplete).toHaveBeenCalledWith('Response text');
  });

  it('shows play button when autoplay is blocked', async () => {
    const { preloadVideo } = await import('../../utils/videoPreloadCache.ts');
    const mockVideo = document.createElement('video');

    // Simulate autoplay rejection
    mockVideo.play = vi.fn().mockRejectedValue(new DOMException('NotAllowedError'));

    vi.mocked(preloadVideo).mockReturnValue({
      element: mockVideo,
      ready: false,
      readyPromise: Promise.resolve(),
    });

    const responsePromise = new Promise<string>(() => {});

    render(
      <ReceiveAnimation
        animalId="elephant"
        responsePromise={responsePromise}
        onComplete={vi.fn()}
      />
    );

    // Dispatch canplay to trigger the play attempt
    await act(async () => {
      mockVideo.dispatchEvent(new Event('canplay'));
      await vi.runAllTimersAsync();
    });

    expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument();
  });

  it('hides play button and plays video when tapped', async () => {
    const { preloadVideo } = await import('../../utils/videoPreloadCache.ts');
    const mockVideo = document.createElement('video');

    // First call rejects (autoplay blocked), second call succeeds (user tap)
    mockVideo.play = vi.fn()
      .mockRejectedValueOnce(new DOMException('NotAllowedError'))
      .mockResolvedValueOnce(undefined);

    vi.mocked(preloadVideo).mockReturnValue({
      element: mockVideo,
      ready: false,
      readyPromise: Promise.resolve(),
    });

    const responsePromise = new Promise<string>(() => {});

    render(
      <ReceiveAnimation
        animalId="elephant"
        responsePromise={responsePromise}
        onComplete={vi.fn()}
      />
    );

    await act(async () => {
      mockVideo.dispatchEvent(new Event('canplay'));
      await vi.runAllTimersAsync();
    });

    const playBtn = screen.getByRole('button', { name: 'Play video' });
    fireEvent.click(playBtn);

    expect(mockVideo.play).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Play video' })).not.toBeInTheDocument();
  });
});
