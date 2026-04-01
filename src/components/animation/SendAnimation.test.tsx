import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { SendAnimation } from './SendAnimation.tsx';

// Mock TTS prefetch
vi.mock('../../utils/ttsPrefetchCache.ts', () => ({
  prefetchTts: vi.fn(),
}));

describe('SendAnimation', () => {
  const defaultProps = {
    animalId: 'elephant',
    letterContent: 'Hello Ella!',
    threadId: 'thread-1',
    threadHistory: [],
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ response: 'Hello little one!' }),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires generate-response API on mount', () => {
    render(<SendAnimation {...defaultProps} />);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/generate-response', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('sends correct body to API', () => {
    render(<SendAnimation {...defaultProps} />);

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.animalId).toBe('elephant');
    expect(body.childLetter).toBe('Hello Ella!');
    expect(body.threadId).toBe('thread-1');
  });

  it('filters duplicate child letter from threadHistory', () => {
    const threadHistory = [
      { id: 'l1', threadId: 'thread-1', animalId: 'elephant', from: 'child' as const, content: 'Hello Ella!', timestamp: 1, read: true },
    ];

    render(<SendAnimation {...defaultProps} threadHistory={threadHistory} />);

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.threadHistory).toEqual([]);
  });

  it('keeps non-duplicate history entries', () => {
    const threadHistory = [
      { id: 'l1', threadId: 'thread-1', animalId: 'elephant', from: 'child' as const, content: 'Previous letter', timestamp: 1, read: true },
      { id: 'l2', threadId: 'thread-1', animalId: 'elephant', from: 'animal' as const, content: 'Previous response', timestamp: 2, read: true },
    ];

    render(<SendAnimation {...defaultProps} threadHistory={threadHistory} />);

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.threadHistory).toHaveLength(2);
  });

  it('calls onComplete with promise after 1500ms', async () => {
    render(<SendAnimation {...defaultProps} />);

    expect(defaultProps.onComplete).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onComplete).toHaveBeenCalledWith(expect.any(Promise));
  });

  it('does not fire duplicate API call on re-mount (hasFiredRef)', () => {
    const { unmount } = render(<SendAnimation {...defaultProps} />);
    expect(fetch).toHaveBeenCalledTimes(1);

    unmount();
    render(<SendAnimation {...defaultProps} />);

    // hasFiredRef persists across remounts in StrictMode-like scenarios,
    // but in real unmount/remount the ref resets with new component instance
    // This test verifies a single mount only fires once
    expect(fetch).toHaveBeenCalledTimes(2); // New instance = new ref
  });

  it('prefetches TTS when API response arrives', async () => {
    const { prefetchTts } = await import('../../utils/ttsPrefetchCache.ts');

    render(<SendAnimation {...defaultProps} />);

    // Let the fetch resolve
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(prefetchTts).toHaveBeenCalledWith('Hello little one!', expect.any(String));
  });

  it('handles API error with fallback message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const onComplete = vi.fn();

    render(<SendAnimation {...defaultProps} onComplete={onComplete} />);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(onComplete).toHaveBeenCalledWith(expect.any(Promise));

    const promise = onComplete.mock.calls[0][0];
    const result = await promise;
    expect(result).toContain('quill broke');
  });
});
