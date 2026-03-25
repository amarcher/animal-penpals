import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import './ReceiveAnimation.css';

interface ReceiveAnimationProps {
  animalId: string;
  onComplete: () => void;
}

type Phase = 'deliver' | 'read' | 'write' | 'reply' | 'done';

export function ReceiveAnimation({ animalId, onComplete }: ReceiveAnimationProps) {
  const animal = getAnimalById(animalId);
  const [phase, setPhase] = useState<Phase>('deliver');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('read'), 1400),
      setTimeout(() => setPhase('write'), 3200),
      setTimeout(() => setPhase('reply'), 5000),
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 6300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!animal) return null;

  return (
    <div className="receive-anim" style={{ '--animal-color': animal.color } as React.CSSProperties}>
      <div className="receive-anim__scene">
        <motion.div
          className="receive-anim__animal"
          animate={{
            scale: phase === 'read' ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.6, repeat: phase === 'read' ? 2 : 0 }}
        >
          <span className="receive-anim__animal-emoji">{animal.emoji}</span>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === 'deliver' && (
            <motion.div
              key="deliver"
              className="receive-anim__envelope"
              initial={{ x: -300, y: -100, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              ✉️
            </motion.div>
          )}

          {phase === 'read' && (
            <motion.div
              key="reading"
              className="receive-anim__bubble"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              📖 Reading...
            </motion.div>
          )}

          {phase === 'write' && (
            <motion.div
              key="writing"
              className="receive-anim__bubble"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="receive-anim__dots">
                <span>✏️ Writing</span>
                <span className="receive-anim__dot">.</span>
                <span className="receive-anim__dot">.</span>
                <span className="receive-anim__dot">.</span>
              </span>
            </motion.div>
          )}

          {phase === 'reply' && (
            <motion.div
              key="reply"
              className="receive-anim__envelope"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ x: [0, 50, 200], y: [0, -40, -100], opacity: [0, 1, 1], scale: [0.5, 0.8, 0.6] }}
              transition={{ duration: 1.2, ease: 'easeIn' }}
            >
              ✉️
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="receive-anim__status">
        {phase === 'deliver' && `Your letter arrived!`}
        {phase === 'read' && `${animal.name} is reading your letter...`}
        {phase === 'write' && `${animal.name} is writing back...`}
        {phase === 'reply' && `${animal.name} sent a reply!`}
      </p>
    </div>
  );
}
