import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import { getAnimalVideo } from '../../data/videoManifest.ts';
import { getCachedVideo, preloadVideo, evictVideo } from '../../utils/videoPreloadCache.ts';
import './ReceiveAnimation.css';

interface ReceiveAnimationProps {
  animalId: string;
  onComplete: () => void;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ReceiveAnimation({ animalId, onComplete }: ReceiveAnimationProps) {
  const animal = getAnimalById(animalId);
  const videoEntry = getAnimalVideo(animalId, 'receive');
  const [videoError, setVideoError] = useState(false);

  const useVideo = !!videoEntry && !reducedMotion && !videoError;

  if (!animal) return null;

  if (useVideo) {
    return (
      <ReceiveAnimationVideo
        videoUrl={videoEntry.url}
        onComplete={onComplete}
        onError={() => setVideoError(true)}
      />
    );
  }

  return <ReceiveAnimationFallback animal={animal} onComplete={onComplete} />;
}

// --- Video-based animation ---

function ReceiveAnimationVideo({ videoUrl, onComplete, onError }: {
  videoUrl: string;
  onComplete: () => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    const log = (msg: string) => console.log(`[ReceiveVideo] ${msg} (+${Math.round(performance.now() - t0)}ms)`);

    const container = containerRef.current;
    if (!container) return;

    log('mount');

    // Grab the preloaded element from the cache, or create a fresh one as fallback
    const cached = getCachedVideo(videoUrl);
    const video = cached ? cached.element : preloadVideo(videoUrl).element;
    log(`using ${cached ? 'CACHED' : 'NEW'} element, readyState=${video.readyState}, networkState=${video.networkState}, buffered=${video.buffered.length > 0 ? `${video.buffered.start(0)}-${video.buffered.end(0)}` : 'empty'}`);

    // Style the element so it matches the layout
    video.className = 'receive-anim__video';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    const handleEnded = () => { log('ended'); onComplete(); };
    const handleError = () => { log(`error: ${video.error?.message}`); onError(); };
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Mount the (already-buffered) element into the DOM
    container.appendChild(video);
    log('appended to DOM');

    // If already buffered, play immediately; otherwise wait for canplay
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      log(`already ready (readyState=${video.readyState}), playing immediately`);
      setReady(true);
      video.play().catch((e) => log(`play() rejected: ${e}`));
    } else {
      log(`NOT ready (readyState=${video.readyState}), waiting for canplay...`);
      const onCanPlay = () => {
        log(`canplay fired (readyState=${video.readyState})`);
        setReady(true);
        video.play().catch((e) => log(`play() rejected: ${e}`));
        video.removeEventListener('canplay', onCanPlay);
      };
      video.addEventListener('canplay', onCanPlay);
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.pause();
      if (container.contains(video)) container.removeChild(video);
      // Now that we're done with the video, clean up the cache entry
      evictVideo(videoUrl);
    };
  }, [videoUrl, onComplete, onError]);

  // Safety timeout in case ended event never fires
  useEffect(() => {
    const timer = setTimeout(onComplete, 30_000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="receive-anim">
      {!ready && <LoadingIndicator />}
      <div ref={containerRef} style={{ display: ready ? 'contents' : 'none' }} />
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

function ReceiveAnimationFallback({ animal, onComplete }: {
  animal: { emoji: string; name: string; color: string };
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<FallbackPhase>('deliver');

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
