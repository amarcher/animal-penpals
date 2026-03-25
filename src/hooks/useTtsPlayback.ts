import { useCallback, useRef, useState } from 'react';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface TtsPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentWordIndex: number;
  wordTimings: WordTiming[];
}

interface TtsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

function buildWordTimings(text: string, alignment: TtsAlignment): WordTiming[] {
  const timings: WordTiming[] = [];
  const words = text.split(/\s+/);
  let charIndex = 0;

  for (const word of words) {
    // Skip whitespace in character index
    while (charIndex < text.length && /\s/.test(text[charIndex])) {
      charIndex++;
    }

    const wordStart = charIndex;
    const wordEnd = charIndex + word.length - 1;

    // Find timing for this word's characters
    if (wordStart < alignment.characters.length && wordEnd < alignment.characters.length) {
      timings.push({
        word,
        startTime: alignment.character_start_times_seconds[wordStart],
        endTime: alignment.character_end_times_seconds[wordEnd],
      });
    } else if (timings.length > 0) {
      // Fallback: estimate based on previous timing
      const prev = timings[timings.length - 1];
      const avgDuration = prev.endTime - prev.startTime;
      timings.push({
        word,
        startTime: prev.endTime,
        endTime: prev.endTime + avgDuration,
      });
    }

    charIndex += word.length;
  }

  return timings;
}

export function useTtsPlayback() {
  const [state, setState] = useState<TtsPlaybackState>({
    isPlaying: false,
    isLoading: false,
    currentWordIndex: -1,
    wordTimings: [],
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setState({ isPlaying: false, isLoading: false, currentWordIndex: -1, wordTimings: [] });
  }, []);

  const play = useCallback(async (text: string, voiceId: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);

    setState(s => ({ ...s, isLoading: true, isPlaying: false, currentWordIndex: -1 }));

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!res.ok) throw new Error('TTS request failed');

      const data = await res.json();
      const wordTimings = buildWordTimings(text, data.alignment);

      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audioRef.current = audio;

      setState({ isLoading: false, isPlaying: true, wordTimings, currentWordIndex: 0 });

      await audio.play();

      const tick = () => {
        if (!audioRef.current) return;
        const t = audioRef.current.currentTime;
        const idx = wordTimings.findIndex(w => t >= w.startTime && t < w.endTime);
        if (idx >= 0) {
          setState(s => ({ ...s, currentWordIndex: idx }));
        }
        if (!audioRef.current.paused && !audioRef.current.ended) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);

      audio.onended = () => {
        setState(s => ({
          ...s,
          isPlaying: false,
          currentWordIndex: s.wordTimings.length - 1,
        }));
        cancelAnimationFrame(animFrameRef.current);
      };
    } catch (err) {
      console.error('[TTS] playback failed:', err);
      setState({ isPlaying: false, isLoading: false, currentWordIndex: -1, wordTimings: [] });
    }
  }, []);

  return { ...state, play, stop };
}
