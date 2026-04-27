import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { animals } from '../../data/animals.ts';
import { trackMailboxOpened } from '../../utils/analytics.ts';
import { AnimalCard } from './AnimalCard.tsx';
import './Mailbox.css';

interface MailboxProps {
  onSelectAnimal: (animalId: string) => void;
  getUnreadCount: (animalId: string) => number;
  hasThread: (animalId: string) => boolean;
  selectedAnimalId?: string | null;
}

// Module-level flag: the staggered entrance animation should only run on the
// user's first visit to the mailbox in this session. Re-running it on every
// return-from-compose causes each card (including the just-morphed one) to
// flash white while it waits its turn in the stagger.
let entranceAnimationPlayed = false;

export function Mailbox({ onSelectAnimal, getUnreadCount, hasThread, selectedAnimalId }: MailboxProps) {
  const [shouldAnimateEntrance] = useState(() => !entranceAnimationPlayed);

  useEffect(() => {
    trackMailboxOpened();
    entranceAnimationPlayed = true;

    // Restore scroll position after returning from compose/reading
    const saved = sessionStorage.getItem('mailbox-scroll');
    if (saved) {
      // Wait for view transition to finish before restoring scroll
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10));
      });
      sessionStorage.removeItem('mailbox-scroll');
    }
  }, []);

  return (
    <div className="mailbox">
      <header className="mailbox__header">
        <h1 className="mailbox__title">
          <img src={`${import.meta.env.VITE_VIDEO_CDN_URL || ''}/logo-wide.png`} alt="Animal Penpals" className="mailbox__logo" width="1200" height="177" />
        </h1>
        <p className="mailbox__subtitle">Pick an animal friend to write to!</p>
      </header>

      <div className="mailbox__grid">
        {animals.map((animal, i) => (
          <motion.div
            key={animal.id}
            initial={shouldAnimateEntrance ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={shouldAnimateEntrance ? { delay: i * 0.06, duration: 0.4 } : { duration: 0 }}
          >
            <AnimalCard
              animal={animal}
              unreadCount={getUnreadCount(animal.id)}
              hasThread={hasThread(animal.id)}
              onClick={onSelectAnimal}
              viewTransitionName={animal.id === selectedAnimalId ? 'animal-video' : undefined}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
