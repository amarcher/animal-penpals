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
    while (charIndex < text.length && /\s/.test(text[charIndex])) {
      charIndex++;
    }

    const wordStart = charIndex;
    const wordEnd = charIndex + word.length - 1;

    if (wordStart < alignment.characters.length && wordEnd < alignment.characters.length) {
      timings.push({
        word,
        startTime: alignment.character_start_times_seconds[wordStart],
        endTime: alignment.character_end_times_seconds[wordEnd],
      });
    } else if (timings.length > 0) {
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
  const playIdRef = useRef(0);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const stop = useCallback(() => {
    playIdRef.current += 1;
    stopAudio();
    setState({ isPlaying: false, isLoading: false, currentWordIndex: -1, wordTimings: [] });
  }, [stopAudio]);

  const play = useCallback(async (text: string, voiceId: string): Promise<boolean> => {
    // Increment play ID to invalidate any in-flight requests
    playIdRef.current += 1;
    const thisPlayId = playIdRef.current;

    // Stop any current playback
    stopAudio();

    setState(s => ({ ...s, isLoading: true, isPlaying: false, currentWordIndex: -1 }));

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      // If a newer play was requested while we were fetching, bail out
      if (thisPlayId !== playIdRef.current) return false;

      if (!res.ok) throw new Error('TTS request failed');

      const data = await res.json();

      if (thisPlayId !== playIdRef.current) return false;

      const wordTimings = buildWordTimings(text, data.alignment);
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audioRef.current = audio;

      setState({ isLoading: false, isPlaying: true, wordTimings, currentWordIndex: 0 });

      await audio.play();

      if (thisPlayId !== playIdRef.current) return false;

      const tick = () => {
        if (!audioRef.current || thisPlayId !== playIdRef.current) return;
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
        if (thisPlayId !== playIdRef.current) return;
        setState(s => ({
          ...s,
          isPlaying: false,
          currentWordIndex: s.wordTimings.length - 1,
        }));
        cancelAnimationFrame(animFrameRef.current);
      };

      return true;
    } catch (err) {
      if (thisPlayId !== playIdRef.current) return false;
      console.error('[TTS] playback failed:', err);
      setState({ isPlaying: false, isLoading: false, currentWordIndex: -1, wordTimings: [] });
      return false;
    }
  }, [stopAudio]);

  return { ...state, play, stop };
}
