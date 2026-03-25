import { motion } from 'framer-motion';
import { animals } from '../../data/animals.ts';
import { AnimalCard } from './AnimalCard.tsx';
import './Mailbox.css';

interface MailboxProps {
  onSelectAnimal: (animalId: string) => void;
  getUnreadCount: (animalId: string) => number;
  hasThread: (animalId: string) => boolean;
}

export function Mailbox({ onSelectAnimal, getUnreadCount, hasThread }: MailboxProps) {
  return (
    <div className="mailbox">
      <header className="mailbox__header">
        <h1 className="mailbox__title">Animal Penpals</h1>
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
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
