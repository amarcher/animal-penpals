import { memo } from 'react';
import type { Animal } from '../../types/app.ts';
import './AnimalCard.css';

interface AnimalCardProps {
  animal: Animal;
  unreadCount: number;
  hasThread: boolean;
  onClick: (animalId: string) => void;
}

export const AnimalCard = memo(function AnimalCard({ animal, unreadCount, hasThread, onClick }: AnimalCardProps) {
  return (
    <button
      className="animal-card"
      style={{ '--animal-color': animal.color } as React.CSSProperties}
      onClick={() => onClick(animal.id)}
      type="button"
      aria-label={`Write to ${animal.name}`}
    >
      {unreadCount > 0 && (
        <span className="animal-card__badge" aria-label={`${unreadCount} unread`}>
          {unreadCount}
        </span>
      )}
      <span className="animal-card__emoji">{animal.emoji}</span>
      <span className="animal-card__name">{animal.name}</span>
      <span className="animal-card__traits">
        {animal.traits[0]}
      </span>
      <span className="animal-card__cta">
        {hasThread ? 'Continue writing' : 'Write a letter'}
      </span>
    </button>
  );
});
