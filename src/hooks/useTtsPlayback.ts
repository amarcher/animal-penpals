import { useCallback, useRef, useState } from 'react';
import { getCachedTts, prefetchTts, type TtsAlignment, type TtsResult } from '../utils/ttsPrefetchCache.ts';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface TtsPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
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
    isPaused: false,
    isLoading: false,
    currentWordIndex: -1,
    currentCharIndex: -1,
    wordTimings: [],
    charCount: 0,
  });
  const charTimesRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const playIdRef = useRef(0);
  // Highlight-loop tick from the current play(); resume() restarts it after a pause.
  const tickRef = useRef<(() => void) | null>(null);

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
    tickRef.current = null;
    setState({ isPlaying: false, isPaused: false, isLoading: false, currentWordIndex: -1, currentCharIndex: -1, wordTimings: [], charCount: 0 });
  }, [detachAudio]);

  // Pause in place: audio and highlight state stay put so resume() can continue.
  // Deliberately does NOT bump playIdRef — the paused play() session stays live.
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused || audio.ended) return;
    audio.pause();
    cancelAnimationFrame(animFrameRef.current);
    setState(s => ({ ...s, isPlaying: false, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.ended) return;
    setState(s => ({ ...s, isPlaying: true, isPaused: false }));
    audio.play().then(() => {
      if (tickRef.current) {
        animFrameRef.current = requestAnimationFrame(tickRef.current);
      }
    }).catch(() => {
      setState(s => ({ ...s, isPlaying: false, isPaused: true }));
    });
  }, []);

  const play = useCallback(async (text: string, voiceId: string): Promise<boolean> => {
    playIdRef.current += 1;
    const thisPlayId = playIdRef.current;

    detachAudio();

    setState(s => ({ ...s, isLoading: true, isPlaying: false, isPaused: false, currentWordIndex: -1, currentCharIndex: -1, charCount: 0 }));

    const playStartedAt = performance.now();
    console.log('[tts] play() called', { textLength: text.length });

    try {
      // Prefer prefetched + pre-decoded audio; fall back to a fresh fetch.
      const cachedPromise = getCachedTts(text, voiceId) ?? prefetchTts(text, voiceId);
      const data: TtsResult = await cachedPromise;

      if (thisPlayId !== playIdRef.current) return false;

      const wordTimings = buildWordTimings(text, data.alignment);
      charTimesRef.current = data.alignment.character_start_times_seconds;

      // Reuse the pre-decoded audio element. Reset to start so replays work.
      const audio = data.audio;
      audio.currentTime = 0;
      audioRef.current = audio;

      setState({ isLoading: false, isPlaying: true, isPaused: false, wordTimings, currentWordIndex: 0, currentCharIndex: 0, charCount: data.alignment.characters.length });

      console.log(`[tts] starting playback ${(performance.now() - playStartedAt).toFixed(0)}ms after play()`);
      await audio.play();
      console.log(`[tts] audio.play() resolved at ${(performance.now() - playStartedAt).toFixed(0)}ms`);

      if (thisPlayId !== playIdRef.current) return false;

      const charStarts = charTimesRef.current;
      const tick = () => {
        if (!audioRef.current || thisPlayId !== playIdRef.current) return;
        const t = audioRef.current.currentTime;
        const wordIdx = wordTimings.findIndex(w => t >= w.startTime && t < w.endTime);
        let charIdx = -1;
        for (let i = charStarts.length - 1; i >= 0; i--) {
          if (charStarts[i] <= t) { charIdx = i; break; }
        }
        setState(s => {
          if (s.currentWordIndex === wordIdx && s.currentCharIndex === charIdx) return s;
          return { ...s, currentWordIndex: wordIdx >= 0 ? wordIdx : s.currentWordIndex, currentCharIndex: charIdx };
        });
        if (!audioRef.current.paused && !audioRef.current.ended) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      tickRef.current = tick;
      animFrameRef.current = requestAnimationFrame(tick);

      audio.onended = () => {
        if (thisPlayId !== playIdRef.current) return;
        setState(s => ({
          ...s,
          isPlaying: false,
          isPaused: false,
          currentWordIndex: s.wordTimings.length - 1,
          currentCharIndex: s.charCount - 1,
        }));
        cancelAnimationFrame(animFrameRef.current);
      };

      return true;
    } catch (err) {
      if (thisPlayId !== playIdRef.current) return false;
      console.error('[TTS] playback failed:', err);
      setState({ isPlaying: false, isPaused: false, isLoading: false, currentWordIndex: -1, currentCharIndex: -1, wordTimings: [], charCount: 0 });
      return false;
    }
  }, [detachAudio]);

  return { ...state, play, pause, resume, stop };
}
