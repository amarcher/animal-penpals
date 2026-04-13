/**
 * Thin wrapper around GA4's gtag() and PostHog for custom event tracking.
 * Falls back silently if gtag/posthog is not loaded (dev, ad-blockers).
 */

import posthog from 'posthog-js';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (key) {
    posthog.init(key, {
      autocapture: false,
      capture_pageview: true,
      persistence: 'localStorage',
      api_host: 'https://us.i.posthog.com',
    });
  }
}

function track(eventName: string, params?: Record<string, unknown>) {
  window.gtag?.('event', eventName, params);
  posthog.capture(eventName, params);
}

export function trackAnimalSelected(animalId: string) {
  track('animal_selected', { animal_id: animalId });
}

export function trackLetterSent(animalId: string, letterLength: number, isReply: boolean, threadLength?: number) {
  track('letter_sent', { animal_id: animalId, letter_length: letterLength, is_reply: isReply, thread_length: threadLength });
}

export function trackLetterReceived(animalId: string, threadLength?: number) {
  track('letter_received', { animal_id: animalId, thread_length: threadLength });
}

export function trackTtsPlaybackStarted(animalId: string) {
  track('tts_playback_started', { animal_id: animalId });
}

export function trackTtsPlaybackCompleted(animalId: string) {
  track('tts_playback_completed', { animal_id: animalId });
}

export function trackReplyClicked(animalId: string, threadLength: number) {
  track('reply_clicked', { animal_id: animalId, thread_length: threadLength });
}

export function trackVideoLoop(animalId: string, loopCount: number) {
  track('video_loop', { animal_id: animalId, loop_count: loopCount });
}

export function trackMailboxOpened() {
  track('mailbox_opened');
}
