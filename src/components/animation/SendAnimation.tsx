import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [phase, setPhase] = useState<'fold' | 'fly' | 'done'>('fold');
  const responseRef = useRef<string | null>(null);
  const animDoneRef = useRef(false);

  // Fire API call immediately
  useEffect(() => {
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
        responseRef.current = data.response;
        if (animDoneRef.current) {
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

  // Animation sequence
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fly'), 1200);
    const t2 = setTimeout(() => {
      setPhase('done');
      animDoneRef.current = true;
      if (responseRef.current) {
        onComplete(responseRef.current);
      }
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!animal) return null;

  return (
    <div className="send-anim" style={{ '--animal-color': animal.color } as React.CSSProperties}>
      <AnimatePresence mode="wait">
        {phase === 'fold' && (
          <motion.div
            key="paper"
            className="send-anim__paper"
            initial={{ scale: 1, rotateX: 0 }}
            animate={{ scale: 0.6, rotateX: 180 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <div className="send-anim__paper-content">
              <p className="send-anim__paper-greeting">Dear {animal.name},</p>
              <p className="send-anim__paper-text">{letterContent}</p>
            </div>
          </motion.div>
        )}

        {phase === 'fly' && (
          <motion.div
            key="envelope"
            className="send-anim__envelope"
            initial={{ scale: 0.6, x: 0, y: 0 }}
            animate={{
              x: [0, 100, 400],
              y: [0, -80, -200],
              scale: [0.6, 0.8, 0.3],
              rotate: [0, -5, -15],
            }}
            transition={{ duration: 1.8, ease: 'easeIn' }}
          >
            <span className="send-anim__envelope-icon">✉️</span>
          </motion.div>
        )}

        {phase === 'done' && !responseRef.current && (
          <motion.div
            key="waiting"
            className="send-anim__waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="send-anim__waiting-emoji">{animal.emoji}</span>
            <p className="send-anim__waiting-text">{animal.name} is reading your letter...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="send-anim__status">
        {phase === 'fold' && 'Folding your letter...'}
        {phase === 'fly' && `Sending to ${animal.name}!`}
        {phase === 'done' && !responseRef.current && 'Waiting for a reply...'}
      </p>
    </div>
  );
}
