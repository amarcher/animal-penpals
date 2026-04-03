/**
 * Thin wrapper around GA4's gtag() for custom event tracking.
 * Falls back silently if gtag is not loaded (dev, ad-blockers).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(eventName: string, params?: Record<string, unknown>) {
  window.gtag?.('event', eventName, params);
}

export function trackAnimalSelected(animalId: string) {
  track('animal_selected', { animal_id: animalId });
}

export function trackLetterSent(animalId: string, letterLength: number, isReply: boolean) {
  track('letter_sent', { animal_id: animalId, letter_length: letterLength, is_reply: isReply });
}

export function trackLetterReceived(animalId: string) {
  track('letter_received', { animal_id: animalId });
}

export function trackTtsPlaybackStarted(animalId: string) {
  track('tts_playback_started', { animal_id: animalId });
}

export function trackMailboxOpened() {
  track('mailbox_opened');
}
