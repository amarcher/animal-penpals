import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { buildWordTimings, useTtsPlayback } from './useTtsPlayback.ts';

describe('buildWordTimings', () => {
  it('builds timings from alignment data', () => {
    const text = 'Hello world';
    const alignment = {
      characters: ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'],
      character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
    };

    const timings = buildWordTimings(text, alignment);

    expect(timings).toHaveLength(2);
    expect(timings[0]).toEqual({ word: 'Hello', startTime: 0, endTime: 0.5 });
    expect(timings[1]).toEqual({ word: 'world', startTime: 0.6, endTime: 1.1 });
  });

  it('handles single word', () => {
    const text = 'Hi';
    const alignment = {
      characters: ['H', 'i'],
      character_start_times_seconds: [0, 0.1],
      character_end_times_seconds: [0.1, 0.2],
    };

    const timings = buildWordTimings(text, alignment);

    expect(timings).toHaveLength(1);
    expect(timings[0]).toEqual({ word: 'Hi', startTime: 0, endTime: 0.2 });
  });

  it('handles multiple spaces between words', () => {
    const text = 'Hello  world';
    const alignment = {
      characters: ['H', 'e', 'l', 'l', 'o', ' ', ' ', 'w', 'o', 'r', 'l', 'd'],
      character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
    };

    const timings = buildWordTimings(text, alignment);
    expect(timings).toHaveLength(2);
  });

  it('falls back for words beyond alignment bounds', () => {
    const text = 'Hello world extra';
    const alignment = {
      characters: ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'],
      character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
    };

    const timings = buildWordTimings(text, alignment);
    expect(timings).toHaveLength(3);
    // Third word should have estimated timing based on previous word
    expect(timings[2].word).toBe('extra');
    expect(timings[2].startTime).toBe(timings[1].endTime);
  });

  it('handles empty text', () => {
    const timings = buildWordTimings('', {
      characters: [],
      character_start_times_seconds: [],
      character_end_times_seconds: [],
    });
    expect(timings).toHaveLength(0);
  });
});

describe('useTtsPlayback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useTtsPlayback());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentWordIndex).toBe(-1);
    expect(result.current.wordTimings).toEqual([]);
  });

  it('play fetches TTS when no cache available', async () => {
    const mockTtsData = {
      audio_base64: 'dGVzdA==',
      alignment: {
        characters: ['H', 'i'],
        character_start_times_seconds: [0, 0.1],
        character_end_times_seconds: [0.1, 0.2],
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTtsData),
    }));

    const { result } = renderHook(() => useTtsPlayback());

    await act(async () => {
      await result.current.play('Hi', 'voice-1');
    });

    expect(fetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('stop resets state', async () => {
    const { result } = renderHook(() => useTtsPlayback());

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentWordIndex).toBe(-1);
  });
});
