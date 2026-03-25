import { memo, useCallback, useRef, useState } from 'react';
import type { Animal } from '../../types/app.ts';
import { getAnimalVideo } from '../../data/videoManifest.ts';
import './AnimalCard.css';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface AnimalCardProps {
  animal: Animal;
  unreadCount: number;
  hasThread: boolean;
  onClick: (animalId: string) => void;
}

export const AnimalCard = memo(function AnimalCard({ animal, unreadCount, hasThread, onClick }: AnimalCardProps) {
  const videoEntry = getAnimalVideo(animal.id, 'idle');
  const [videoError, setVideoError] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadLinkRef = useRef<HTMLLinkElement | null>(null);

  const showVideo = !!videoEntry && !reducedMotion && !videoError;

  const handleMouseEnter = useCallback(() => {
    if (!videoEntry || preloadLinkRef.current) return;
    hoverTimerRef.current = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = videoEntry.url;
      document.head.appendChild(link);
      preloadLinkRef.current = link;
    }, 300);
  }, [videoEntry]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  return (
    <button
      className="animal-card"
      style={{ '--animal-color': animal.color } as React.CSSProperties}
      onClick={() => onClick(animal.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      type="button"
      aria-label={`Write to ${animal.name}`}
    >
      {unreadCount > 0 && (
        <span className="animal-card__badge" aria-label={`${unreadCount} unread`}>
          {unreadCount}
        </span>
      )}

      <div className="animal-card__visual">
        {showVideo ? (
          <video
            className="animal-card__video"
            src={videoEntry.url}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            onError={() => setVideoError(true)}
            aria-label={animal.name}
          />
        ) : (
          <span className="animal-card__emoji">{animal.emoji}</span>
        )}
      </div>

      <div className="animal-card__info">
        <span className="animal-card__name">{animal.name}</span>
        <span className="animal-card__cta">
          {hasThread ? 'Continue writing' : 'Write a letter'}
        </span>
      </div>
    </button>
  );
});
