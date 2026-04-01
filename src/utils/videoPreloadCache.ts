/**
 * Shared video preload cache.
 *
 * ComposeView preloads the receive video into this cache. ReceiveAnimation
 * retrieves the already-buffered element and mounts it directly, avoiding a
 * second network fetch and the blank-screen pause that comes with it.
 */

export interface CachedVideo {
  element: HTMLVideoElement;
  ready: boolean;           // true once canplay has fired
  readyPromise: Promise<void>;
  preloadedAt: number;
}

const cache = new Map<string, CachedVideo>();
const PREFIX = '[VideoCache]';

/**
 * Start preloading a video URL. Safe to call multiple times for the same URL.
 * Returns the CachedVideo entry.
 */
export function preloadVideo(url: string): CachedVideo {
  const existing = cache.get(url);
  if (existing) {
    console.log(`${PREFIX} already cached: ${url} (ready=${existing.ready}, readyState=${existing.element.readyState}, age=${Math.round(performance.now() - existing.preloadedAt)}ms)`);
    return existing;
  }

  const t0 = performance.now();
  console.log(`${PREFIX} preloading: ${url}`);

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
        console.log(`${PREFIX} canplay fired: ${url} (+${Math.round(performance.now() - t0)}ms, readyState=${video.readyState})`);
        resolve();
        video.removeEventListener('canplay', onReady);
      };
      video.addEventListener('canplay', onReady);
    }),
    preloadedAt: performance.now(),
  };

  video.addEventListener('loadedmetadata', () => {
    console.log(`${PREFIX} loadedmetadata: ${url} (+${Math.round(performance.now() - t0)}ms, duration=${video.duration}s)`);
  });
  video.addEventListener('error', () => {
    console.warn(`${PREFIX} error loading: ${url}`, video.error);
  });

  video.load();
  cache.set(url, entry);
  return entry;
}

/**
 * Retrieve a previously preloaded video, or return undefined.
 */
export function getCachedVideo(url: string): CachedVideo | undefined {
  const entry = cache.get(url);
  if (entry) {
    console.log(`${PREFIX} cache HIT: ${url} (ready=${entry.ready}, readyState=${entry.element.readyState})`);
  } else {
    console.log(`${PREFIX} cache MISS: ${url}`);
  }
  return entry;
}

/**
 * Remove a URL from the cache and release its resources.
 */
export function evictVideo(url: string): void {
  const entry = cache.get(url);
  if (entry) {
    console.log(`${PREFIX} evicting: ${url}`);
    // Remove the error listener before clearing src to avoid spurious
    // MEDIA_ELEMENT_ERROR from the empty src attribute.
    entry.element.removeAttribute('src');
    cache.delete(url);
  }
}
