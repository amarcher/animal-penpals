import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import type { Letter } from '../../types/app.ts';
import './SendAnimation.css';

interface SendAnimationProps {
  animalId: string;
  letterContent: string;
  threadId: string;
  threadHistory: Letter[];
  onComplete: (animalResponse: string) => void;
}

export function SendAnimation({ animalId, letterContent, threadId, threadHistory, onComplete }: SendAnimationProps) {
  const animal = getAnimalById(animalId);
  const responseRef = useRef<string | null>(null);
  const animDoneRef = useRef(false);

  // Fire API call immediately
  useEffect(() => {
    const t0 = performance.now();
    console.log('[SendAnim] mount, firing API call');
    fetch('/api/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animalId,
        childLetter: letterContent,
        threadId,
        threadHistory: threadHistory.map(l => ({ from: l.from, content: l.content })),
      }),
    })
      .then(r => r.json())
      .then(data => {
        console.log(`[SendAnim] API responded (+${Math.round(performance.now() - t0)}ms), animDone=${animDoneRef.current}`);
        responseRef.current = data.response;
        if (animDoneRef.current) {
          console.log(`[SendAnim] calling onComplete (API was slower)`);
          onComplete(data.response);
        }
      })
      .catch(err => {
        console.error('[SendAnimation] API error:', err);
        responseRef.current = "Oh no, my quill broke! I'll write back soon, I promise!";
        if (animDoneRef.current) {
          onComplete(responseRef.current);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After fold completes, transition immediately
  useEffect(() => {
    const t0 = performance.now();
    const timer = setTimeout(() => {
      animDoneRef.current = true;
      console.log(`[SendAnim] anim timer fired (+${Math.round(performance.now() - t0)}ms), hasResponse=${!!responseRef.current}`);
      if (responseRef.current) {
        console.log(`[SendAnim] calling onComplete (API was faster)`);
        onComplete(responseRef.current);
      }
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
