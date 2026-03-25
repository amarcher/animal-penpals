import { useCallback, useState } from 'react';
import type { AppState } from '../types/app.ts';

export function useNavigation() {
  const [nav, setNav] = useState<AppState>({ view: 'mailbox' });

  const goToMailbox = useCallback(() =>
    setNav({ view: 'mailbox' }), []);

  const goToCompose = useCallback((animalId: string, threadId?: string) =>
    setNav({ view: 'compose', animalId, threadId }), []);

  const goToSending = useCallback((animalId: string, threadId: string, letterContent: string) =>
    setNav({ view: 'sending', animalId, threadId, letterContent }), []);

  const goToReceiving = useCallback((animalId: string, threadId: string) =>
    setNav({ view: 'receiving', animalId, threadId }), []);

  const goToReading = useCallback((animalId: string, letterId: string, threadId: string) =>
    setNav({ view: 'reading', animalId, letterId, threadId }), []);

  return { nav, goToMailbox, goToCompose, goToSending, goToReceiving, goToReading };
}
