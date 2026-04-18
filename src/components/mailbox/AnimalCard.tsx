import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { Animal } from '../../types/app.ts';
import { getAnimalVideo } from '../../data/videoManifest.ts';
import './AnimalCard.css';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface AnimalCardProps {
  animal: Animal;
  unreadCount: number;
  hasThread: boolean;
  onClick: (animalId: string) => void;
  viewTransitionName?: string;
}

export const AnimalCard = memo(function AnimalCard({ animal, unreadCount, hasThread, onClick, viewTransitionName }: AnimalCardProps) {
  const videoEntry = getAnimalVideo(animal.id, 'idle');
  const [videoError, setVideoError] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadRef = useRef<HTMLVideoElement | null>(null);

  const showVideo = !!videoEntry && !reducedMotion && !videoError;

  // Observe visibility — only load/play videos when near viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !showVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showVideo]);

  // Pause/play video based on viewport visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isNearViewport) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isNearViewport]);

  const handleMouseEnter = useCallback(() => {
    if (!videoEntry || preloadRef.current) return;
    hoverTimerRef.current = setTimeout(() => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = videoEntry.url;
      video.load();
      preloadRef.current = video;
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
      ref={cardRef}
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

      <div className="animal-card__visual" style={viewTransitionName ? { viewTransitionName } : undefined}>
        {showVideo ? (
          isNearViewport ? (
            <video
              ref={videoRef}
              className="animal-card__video"
              src={videoEntry.url}
              poster={videoEntry.poster}
              muted
              loop
              playsInline
              preload="none"
              onError={() => setVideoError(true)}
              aria-label={animal.name}
            />
          ) : (
            <img
              className="animal-card__poster"
              src={videoEntry.poster}
              alt={animal.name}
            />
          )
        ) : (
          <span className="animal-card__emoji">{animal.emoji}</span>
        )}

        <div className="animal-card__overlay">
          <span className="animal-card__name">{animal.name}</span>
          <span className="animal-card__cta">
            {hasThread ? 'Continue writing' : 'Write a letter'}
          </span>
        </div>
      </div>
    </button>
  );
});
