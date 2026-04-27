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
  // The selected animal returning from compose should immediately load — its
  // video is the morph target, and waiting for IntersectionObserver causes a
  // visible blink as the snapshot fades to the static poster.
  const [hasBeenNearViewport, setHasBeenNearViewport] = useState(!!viewTransitionName);
  const cardRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadRef = useRef<HTMLVideoElement | null>(null);

  const showVideo = !!videoEntry && !reducedMotion && !videoError;

  // Observe visibility — flips hasBeenNearViewport (which assigns src) and
  // pauses the video when scrolled off-screen. The autoPlay attribute drives
  // first playback once src loads; resume-on-scroll-back is handled in the
  // play/pause effect below.
  const [isInViewport, setIsInViewport] = useState(!!viewTransitionName);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !showVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenNearViewport(true);
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasBeenNearViewport) return;
    if (isInViewport) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isInViewport, hasBeenNearViewport]);

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
          <video
            ref={videoRef}
            className="animal-card__video"
            // src is only set once we know the card is (or has been) near the
            // viewport. Before that, the poster attribute fills the space.
            src={hasBeenNearViewport ? videoEntry.url : undefined}
            poster={videoEntry.poster}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onError={() => setVideoError(true)}
            aria-label={animal.name}
          />
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
