import { motion } from 'framer-motion';
import { animals } from '../../data/animals.ts';
import { AnimalCard } from './AnimalCard.tsx';
import './Mailbox.css';

interface MailboxProps {
  onSelectAnimal: (animalId: string) => void;
  getUnreadCount: (animalId: string) => number;
  hasThread: (animalId: string) => boolean;
  selectedAnimalId?: string | null;
}

export function Mailbox({ onSelectAnimal, getUnreadCount, hasThread, selectedAnimalId }: MailboxProps) {
  return (
    <div className="mailbox">
      <header className="mailbox__header">
        <h1 className="mailbox__title">
          <img src="/logo.png" alt="Animal Penpals" className="mailbox__logo" />
        </h1>
        <p className="mailbox__subtitle">Pick an animal friend to write to!</p>
      </header>

      <div className="mailbox__grid">
        {animals.map((animal, i) => (
          <motion.div
            key={animal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
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
