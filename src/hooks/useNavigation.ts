import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router';
import { letterFlowState } from '../utils/letterFlowState.ts';
import type { AppState } from '../types/app.ts';

function pathnameToView(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return segment || 'mailbox';
}

export function useNavigation() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const nav = useMemo<AppState>(() => {
    const view = pathnameToView(location.pathname);

    switch (view) {
      case 'compose': {
        const animalId = params.animalId ?? '';
        const threadId = searchParams.get('thread') ?? undefined;
        const countParam = searchParams.get('count');
        const animalLetterCount = countParam ? parseInt(countParam, 10) : undefined;
        return { view: 'compose', animalId, threadId, animalLetterCount };
      }
      case 'sending': {
        const animalId = params.animalId ?? '';
        const threadId = params.threadId ?? '';
        const letterContent = letterFlowState.getLetterContent() ?? '';
        return { view: 'sending', animalId, threadId, letterContent };
      }
      case 'receiving': {
        const animalId = params.animalId ?? '';
        const threadId = params.threadId ?? '';
        return { view: 'receiving', animalId, threadId };
      }
      case 'reading': {
        const animalId = params.animalId ?? '';
        const letterId = params.letterId ?? '';
        const threadId = searchParams.get('thread') ?? '';
        return { view: 'reading', animalId, letterId, threadId };
      }
      default:
        return { view: 'mailbox' };
    }
  }, [location.pathname, params, searchParams]);

  const goToMailbox = useCallback(() => {
    routerNavigate('/mailbox', { viewTransition: true });
  }, [routerNavigate]);

  const goToCompose = useCallback((animalId: string, threadId?: string, animalLetterCount?: number) => {
    // Save mailbox scroll position before navigating away
    sessionStorage.setItem('mailbox-scroll', String(window.scrollY));

    const params = new URLSearchParams();
    if (threadId) params.set('thread', threadId);
    if (animalLetterCount !== undefined) params.set('count', String(animalLetterCount));
    const query = params.toString();
    routerNavigate(`/compose/${animalId}${query ? `?${query}` : ''}`, { viewTransition: true });
  }, [routerNavigate]);

  const goToSending = useCallback((animalId: string, threadId: string, letterContent: string) => {
    letterFlowState.setLetterContent(letterContent);
    routerNavigate(`/sending/${animalId}/${threadId}`);
  }, [routerNavigate]);

  const goToReceiving = useCallback((animalId: string, threadId: string, options?: { viewTransition?: boolean }) => {
    routerNavigate(`/receiving/${animalId}/${threadId}`, options?.viewTransition ? { viewTransition: true } : undefined);
  }, [routerNavigate]);

  const goToReading = useCallback((animalId: string, letterId: string, threadId: string) => {
    const params = new URLSearchParams();
    if (threadId) params.set('thread', threadId);
    const query = params.toString();
    routerNavigate(`/reading/${animalId}/${letterId}${query ? `?${query}` : ''}`, { viewTransition: true });
  }, [routerNavigate]);

  return { nav, goToMailbox, goToCompose, goToSending, goToReceiving, goToReading };
}
