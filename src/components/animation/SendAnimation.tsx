import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import { prefetchTts } from '../../utils/ttsPrefetchCache.ts';
import type { Letter } from '../../types/app.ts';
import './SendAnimation.css';

interface SendAnimationProps {
  animalId: string;
  letterContent: string;
  threadId: string;
  threadHistory: Letter[];
  onComplete: (responsePromise: Promise<string>) => void;
}

export function SendAnimation({ animalId, letterContent, threadId, threadHistory, onComplete }: SendAnimationProps) {
  const animal = getAnimalById(animalId);
  const responsePromiseRef = useRef<Promise<string> | null>(null);
  const hasFiredRef = useRef(false);

  // Fire API call immediately, store the promise (skip StrictMode duplicate)
  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    // Filter out the current child letter from thread history to avoid
    // sending it twice (addLetter may or may not have flushed to state)
    const priorHistory = threadHistory
      .filter(l => !(l.from === 'child' && l.content === letterContent))
      .map(l => ({ from: l.from, content: l.content }));

    responsePromiseRef.current = fetch('/api/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animalId,
        childLetter: letterContent,
        threadId,
        threadHistory: priorHistory,
      }),
    })
      .then(r => r.json())
      .then(data => {
        // Start TTS prefetch immediately — don't wait for the receive video
        if (animal) {
          prefetchTts(data.response, animal.voiceId);
        }
        return data.response as string;
      })
      .catch(() => {
        return "Oh no, my quill broke! I'll write back soon, I promise!";
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After fold animation completes, transition immediately — don't wait for API
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(responsePromiseRef.current!);
    }, 1500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!animal) return null;

  return (
    <div className="send-anim" style={{ '--animal-color': animal.color } as React.CSSProperties}>
      <motion.div
        className="send-anim__paper"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0.4, opacity: 0, rotateX: 180 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      >
        <div className="send-anim__paper-content">
          <p className="send-anim__paper-greeting">Dear {animal.name},</p>
          <p className="send-anim__paper-text">{letterContent}</p>
        </div>
      </motion.div>
    </div>
  );
}
