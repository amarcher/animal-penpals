import { useCallback, useRef, useState } from 'react';
import { getCachedTts, prefetchTts, type TtsAlignment, type TtsResult } from '../utils/ttsPrefetchCache.ts';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface TtsPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentWordIndex: number;
  currentCharIndex: number;
  wordTimings: WordTiming[];
  charCount: number;
}

export function buildWordTimings(text: string, alignment: TtsAlignment): WordTiming[] {
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
    currentCharIndex: -1,
    wordTimings: [],
    charCount: 0,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const playIdRef = useRef(0);

  const detachAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audioRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const stop = useCallback(() => {
    playIdRef.current += 1;
    detachAudio();
    setState({ isPlaying: false, isLoading: false, currentWordIndex: -1, currentCharIndex: -1, wordTimings: [], charCount: 0 });
  }, [detachAudio]);

  const play = useCallback(async (text: string, voiceId: string): Promise<boolean> => {
    playIdRef.current += 1;
    const thisPlayId = playIdRef.current;

    detachAudio();

    setState(s => ({ ...s, isLoading: true, isPlaying: false, currentWordIndex: -1, currentCharIndex: -1, charCount: 0 }));

    const playStartedAt = performance.now();
    console.log('[tts] play() called', { textLength: text.length });

    try {
      // Prefer prefetched + pre-decoded audio; fall back to a fresh fetch.
      const cachedPromise = getCachedTts(text, voiceId) ?? prefetchTts(text, voiceId);
      const data: TtsResult = await cachedPromise;

      if (thisPlayId !== playIdRef.current) return false;

      // alignment is mutated by the streaming prefetch as more chunks arrive,
      // so word timings have to be recomputed when its length grows.
      let wordTimings = buildWordTimings(text, data.alignment);
      let lastSeenAlignmentLength = data.alignment.characters.length;

      // Reuse the pre-decoded audio element. Reset to start so replays work.
      const audio = data.audio;
      audio.currentTime = 0;
      audioRef.current = audio;

      setState({ isLoading: false, isPlaying: true, wordTimings, currentWordIndex: 0, currentCharIndex: 0, charCount: data.alignment.characters.length });

      console.log(`[tts] starting playback ${(performance.now() - playStartedAt).toFixed(0)}ms after play()`);
      await audio.play();
      console.log(`[tts] audio.play() resolved at ${(performance.now() - playStartedAt).toFixed(0)}ms`);

      if (thisPlayId !== playIdRef.current) return false;

      const tick = () => {
        if (!audioRef.current || thisPlayId !== playIdRef.current) return;

        if (data.alignment.characters.length !== lastSeenAlignmentLength) {
          lastSeenAlignmentLength = data.alignment.characters.length;
          wordTimings = buildWordTimings(text, data.alignment);
        }

        const t = audioRef.current.currentTime;
        const wordIdx = wordTimings.findIndex(w => t >= w.startTime && t < w.endTime);
        const charStarts = data.alignment.character_start_times_seconds;
        let charIdx = -1;
        for (let i = charStarts.length - 1; i >= 0; i--) {
          if (charStarts[i] <= t) { charIdx = i; break; }
        }
        setState(s => {
          const wordChanged = wordIdx >= 0 && s.currentWordIndex !== wordIdx;
          const charChanged = s.currentCharIndex !== charIdx;
          const charCountChanged = s.charCount !== data.alignment.characters.length;
          const timingsChanged = s.wordTimings !== wordTimings;
          if (!wordChanged && !charChanged && !charCountChanged && !timingsChanged) return s;
          return {
            ...s,
            wordTimings,
            currentWordIndex: wordChanged ? wordIdx : s.currentWordIndex,
            currentCharIndex: charIdx,
            charCount: data.alignment.characters.length,
          };
        });
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
          currentCharIndex: s.charCount - 1,
        }));
        cancelAnimationFrame(animFrameRef.current);
      };

      return true;
    } catch (err) {
      if (thisPlayId !== playIdRef.current) return false;
      console.error('[TTS] playback failed:', err);
      setState({ isPlaying: false, isLoading: false, currentWordIndex: -1, currentCharIndex: -1, wordTimings: [], charCount: 0 });
      return false;
    }
  }, [detachAudio]);

  return { ...state, play, stop };
}
