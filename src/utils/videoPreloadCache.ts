/**
 * Shared video preload cache.
 *
 * ComposeView preloads the receive video into this cache. ReceiveAnimation
 * retrieves the already-buffered element and mounts it directly, avoiding a
 * second network fetch and the blank-screen pause that comes with it.
 */

interface CachedVideo {
  element: HTMLVideoElement;
  ready: boolean;           // true once canplay has fired
  readyPromise: Promise<void>;
}

const cache = new Map<string, CachedVideo>();

/**
 * Start preloading a video URL. Safe to call multiple times for the same URL.
 * Returns the CachedVideo entry.
 */
export function preloadVideo(url: string): CachedVideo {
  const existing = cache.get(url);
  if (existing) return existing;

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  const entry: CachedVideo = {
    element: video,
    ready: false,
    readyPromise: new Promise<void>((resolve) => {
      const onReady = () => {
        entry.ready = true;
        resolve();
        video.removeEventListener('canplay', onReady);
      };
      video.addEventListener('canplay', onReady);
    }),
  };

  video.load();
  cache.set(url, entry);
  return entry;
}

/**
 * Retrieve a previously preloaded video, or return undefined.
 */
export function getCachedVideo(url: string): CachedVideo | undefined {
  return cache.get(url);
}

/**
 * Remove a URL from the cache and release its resources.
 */
export function evictVideo(url: string): void {
  const entry = cache.get(url);
  if (entry) {
    entry.element.src = '';
    entry.element.load();
    cache.delete(url);
  }
}
