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
}

export function ReadingView({ animalId, letterContent, ttsRequest, onReply, onBack, onMarkRead }: ReadingViewProps) {
  const animal = getAnimalById(animalId);
  const videoEntry = getAnimalVideo(animalId, 'receive');
  const tts = useTtsPlayback();
  const hasAutoPlayed = useRef(false);
  const lastTtsSeq = useRef<number | undefined>(undefined);

  useEffect(() => {
    onMarkRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play TTS once on mount
  useEffect(() => {
    if (!hasAutoPlayed.current && animal && letterContent) {
      hasAutoPlayed.current = true;
      tts.play(letterContent, animal.voiceId);
    }
    return () => tts.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      </header>

      <div className="reading__body">
        {videoEntry && (
          <div className="reading__video-wrap">
            <video
              className="reading__video"
              src={videoEntry.url}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          </div>
        )}

        <div className="reading__letter">
          <div className="reading__from">
            <span className="reading__from-name">From {animal.name}</span>
          </div>

          <div className="reading__paper">
            <HighlightedText
              text={letterContent}
              wordTimings={tts.wordTimings}
              currentWordIndex={tts.currentWordIndex}
              animalColor={animal.color}
            />
          </div>

          <div className="reading__tts-controls">
            {tts.isLoading && (
              <span className="reading__tts-status">Loading voice...</span>
            )}
            {tts.isPlaying && (
              <button className="reading__tts-btn" onClick={tts.stop} type="button">
                Pause
              </button>
            )}
            {!tts.isPlaying && !tts.isLoading && (
              <button className="reading__tts-btn" onClick={handleReplay} type="button">
                Read aloud
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="reading__actions">
        <button className="reading__reply" onClick={onReply} type="button">
          Write Back
        </button>
        <button className="reading__other" onClick={onBack} type="button">
          Choose another animal
        </button>
      </div>
    </motion.div>
  );
}
