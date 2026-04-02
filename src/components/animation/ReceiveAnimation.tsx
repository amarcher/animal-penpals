import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import { getAnimalVideo } from '../../data/videoManifest.ts';
import { getCachedVideo, preloadVideo, evictVideo } from '../../utils/videoPreloadCache.ts';
import { prefetchTts } from '../../utils/ttsPrefetchCache.ts';
import './ReceiveAnimation.css';

interface ReceiveAnimationProps {
  animalId: string;
  responsePromise: Promise<string>;
  onComplete: (animalResponse: string) => void;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function ReceiveAnimation({ animalId, responsePromise, onComplete }: ReceiveAnimationProps) {
  const animal = getAnimalById(animalId);
  const videoEntry = getAnimalVideo(animalId, 'receive');
  const [videoError, setVideoError] = useState(false);

  // Prefetch TTS audio as soon as the API response is available — while the
  // video is still playing — so it's ready by the time ReadingView mounts.
  // (Also fires from SendAnimation, but this is a safe duplicate call.)
  useEffect(() => {
    if (!animal) return;
    responsePromise.then(text => {
      prefetchTts(text, animal.voiceId);
    });
  }, [animal, responsePromise]);

  const useVideo = !!videoEntry && !reducedMotion && !videoError;

  if (!animal) return null;

  if (useVideo) {
    return (
      <ReceiveAnimationVideo
        videoUrl={videoEntry.url}
        responsePromise={responsePromise}
        onComplete={onComplete}
        onError={() => setVideoError(true)}
      />
    );
  }

  return <ReceiveAnimationFallback animal={animal} responsePromise={responsePromise} onComplete={onComplete} />;
}

// --- Video-based animation ---

function ReceiveAnimationVideo({ videoUrl, responsePromise, onComplete, onError }: {
  videoUrl: string;
  responsePromise: Promise<string>;
  onComplete: (animalResponse: string) => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const container = containerRef.current;
    if (!container) return;

    // Grab the preloaded element from the cache, or create a fresh one as fallback
    const cached = getCachedVideo(videoUrl);
    const video = cached ? cached.element : preloadVideo(videoUrl).element;
    videoRef.current = video;

    video.className = 'receive-anim__video';
    video.autoplay = true;
    video.playsInline = true;

    // iOS requires muted for autoplay to work without user gesture
    if (isIOS) video.muted = true;

    // Wait for BOTH video end AND API response before transitioning
    const videoEndedPromise = new Promise<void>((resolve) => {
      video.addEventListener('ended', () => resolve(), { once: true });
    });

    video.addEventListener('error', () => onError(), { once: true });

    Promise.all([videoEndedPromise, responsePromise]).then(([, animalResponse]) => {
      if (!cancelled) onComplete(animalResponse);
    });

    // Mount the (already-buffered) element into the DOM
    container.appendChild(video);

    const attemptPlay = () => {
      video.play().catch(() => {
        if (!cancelled) setShowPlayButton(true);
      });
    };

    // If already buffered, play immediately; otherwise wait for canplay
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      setReady(true);
      attemptPlay();
    } else {
      const onCanPlay = () => {
        setReady(true);
        attemptPlay();
        video.removeEventListener('canplay', onCanPlay);
      };
      video.addEventListener('canplay', onCanPlay);
    }

    return () => {
      cancelled = true;
      video.pause();
      video.muted = true;
      video.volume = 0;
      if (container.contains(video)) container.removeChild(video);
      evictVideo(videoUrl);
    };
  }, [videoUrl, responsePromise, onComplete, onError]);

  // Safety timeout in case ended event never fires
  useEffect(() => {
    const timer = setTimeout(() => {
      responsePromise.then((r) => onComplete(r));
    }, 15_000);
    return () => clearTimeout(timer);
  }, [onComplete, responsePromise]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
      setShowPlayButton(false);
    }
  };

  return (
    <div className="receive-anim">
      {!ready && <LoadingIndicator />}
      <div ref={containerRef} style={{ display: ready ? 'contents' : 'none' }} />
      {showPlayButton && (
        <button className="receive-anim__play-btn" onClick={handlePlay} aria-label="Play video">
          ▶️
        </button>
      )}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="receive-anim__loading">
      <span className="receive-anim__loading-envelope">✉️</span>
      <p className="receive-anim__loading-text">Opening your letter...</p>
    </div>
  );
}

// --- Fallback: original framer-motion animation ---

type FallbackPhase = 'deliver' | 'read' | 'write' | 'reply' | 'done';

function ReceiveAnimationFallback({ animal, responsePromise, onComplete }: {
  animal: { emoji: string; name: string; color: string };
  responsePromise: Promise<string>;
  onComplete: (animalResponse: string) => void;
}) {
  const [phase, setPhase] = useState<FallbackPhase>('deliver');

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const animDone = new Promise<void>((resolve) => {
      timers.push(
        setTimeout(() => setPhase('read'), 1400),
        setTimeout(() => setPhase('write'), 3200),
        setTimeout(() => setPhase('reply'), 5000),
        setTimeout(() => {
          setPhase('done');
          resolve();
        }, 6300),
      );
    });

    Promise.all([animDone, responsePromise]).then(([, animalResponse]) => {
      if (!cancelled) onComplete(animalResponse);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="receive-anim receive-anim--fallback" style={{ '--animal-color': animal.color } as React.CSSProperties}>
      <div className="receive-anim__scene">
        <motion.div
          className="receive-anim__animal"
          animate={{ scale: phase === 'read' ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.6, repeat: phase === 'read' ? 2 : 0 }}
        >
          <span className="receive-anim__animal-emoji">{animal.emoji}</span>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === 'deliver' && (
            <motion.div key="deliver" className="receive-anim__envelope"
              initial={{ x: -300, y: -100, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}>
              ✉️
            </motion.div>
          )}
          {phase === 'read' && (
            <motion.div key="reading" className="receive-anim__bubble"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}>
              📖 Reading...
            </motion.div>
          )}
          {phase === 'write' && (
            <motion.div key="writing" className="receive-anim__bubble"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}>
              <span className="receive-anim__dots">
                <span>✏️ Writing</span>
                <span className="receive-anim__dot">.</span>
                <span className="receive-anim__dot">.</span>
                <span className="receive-anim__dot">.</span>
              </span>
            </motion.div>
          )}
          {phase === 'reply' && (
            <motion.div key="reply" className="receive-anim__envelope"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ x: [0, 50, 200], y: [0, -40, -100], opacity: [0, 1, 1], scale: [0.5, 0.8, 0.6] }}
              transition={{ duration: 1.2, ease: 'easeIn' }}>
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
