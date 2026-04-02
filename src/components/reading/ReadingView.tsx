import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import { getAnimalVideo } from '../../data/videoManifest.ts';
import { useTtsPlayback } from '../../hooks/useTtsPlayback.ts';
import { HighlightedText } from './HighlightedText.tsx';
import './ReadingView.css';

interface ReadingViewProps {
  animalId: string;
  letterContent: string;
  ttsRequest?: { seq: number };
  onReply: () => void;
  onBack: () => void;
  onMarkRead: () => void;
  onTtsAutoPlayStarted?: () => void;
  onTtsAutoPlayFailed?: () => void;
  onTtsEnd?: () => void;
}

export function ReadingView({ animalId, letterContent, ttsRequest, onReply, onBack, onMarkRead, onTtsAutoPlayStarted, onTtsAutoPlayFailed, onTtsEnd }: ReadingViewProps) {
  const animal = getAnimalById(animalId);
  const videoEntry = getAnimalVideo(animalId, 'receive');
  const tts = useTtsPlayback();
  const lastTtsSeq = useRef<number | undefined>(undefined);

  useEffect(() => {
    onMarkRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play TTS on mount. No hasAutoPlayed guard needed — play() already
  // deduplicates via playIdRef, and the guard breaks under StrictMode
  // (which unmounts/remounts route components, leaving the ref stale).
  useEffect(() => {
    if (animal && letterContent) {
      tts.play(letterContent, animal.voiceId).then(started => {
        if (started) onTtsAutoPlayStarted?.();
        else onTtsAutoPlayFailed?.();
      });
    }
    return () => tts.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify when TTS playback ends
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    if (wasPlayingRef.current && !tts.isPlaying) {
      onTtsEnd?.();
    }
    wasPlayingRef.current = tts.isPlaying;
  }, [tts.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle agent-triggered TTS (only if it's a new request)
  useEffect(() => {
    if (ttsRequest && ttsRequest.seq !== lastTtsSeq.current && animal && letterContent) {
      lastTtsSeq.current = ttsRequest.seq;
      tts.play(letterContent, animal.voiceId);
    }
  }, [ttsRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplay = useCallback(() => {
    if (animal) {
      tts.play(letterContent, animal.voiceId);
    }
  }, [animal, letterContent, tts]);

  if (!animal) return null;

  return (
    <motion.div
      className="reading"
      style={{ '--animal-color': animal.color } as React.CSSProperties}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="reading__header">
        <button className="reading__back" onClick={onBack} type="button" aria-label="Back to mailbox">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Mailbox
        </button>
        <span className="reading__from-name">From {animal.name}</span>
      </header>

      <div className="reading__body">
        {videoEntry && (
          <MutedVideo className="reading__video" src={videoEntry.url} loop />
        )}

        <div className="reading__letter">

          <div className="reading__paper">
            <HighlightedText
              text={letterContent}
              wordTimings={tts.wordTimings}
              currentWordIndex={tts.currentWordIndex}
              animalColor={animal.color}
            />
          </div>

          <div className="reading__actions">
            <button className="reading__reply" onClick={onReply} type="button">
              Write Back
            </button>
            {tts.isLoading ? (
              <button className="reading__action-btn reading__action-btn--loading" type="button" disabled>
                Loading voice...
              </button>
            ) : tts.isPlaying ? (
              <button className="reading__action-btn" onClick={tts.stop} type="button">
                Pause
              </button>
            ) : (
              <button className="reading__action-btn" onClick={handleReplay} type="button">
                Read aloud
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Renders a video element that is guaranteed muted before playback starts. */
function MutedVideo({ className, src, loop }: { className: string; src: string; loop?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const video = document.createElement('video');
    video.className = className;
    video.muted = true;
    video.volume = 0;
    video.loop = !!loop;
    video.playsInline = true;
    video.preload = 'auto';
    // Set src AFTER muted + volume=0 so the browser never plays audio
    video.src = src;
    container.appendChild(video);
    video.play().catch(() => {});

    return () => {
      video.pause();
      video.removeAttribute('src');
      if (container.contains(video)) container.removeChild(video);
    };
  }, [className, src, loop]);

  return <div className="reading__video-wrap" ref={containerRef} />;
}
