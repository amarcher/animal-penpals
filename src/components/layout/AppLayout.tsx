import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useNavigation } from '../../hooks/useNavigation.ts';
import { useLetterStore } from '../../hooks/useLetterStore.ts';
import { usePenpalConversation } from '../../hooks/usePenpalConversation.ts';
import { useTransitionContext } from '../../contexts/TransitionContext.tsx';
import { getAnimalById } from '../../data/animals.ts';
import { prefetchTts } from '../../utils/ttsPrefetchCache.ts';
import { VoiceAgent } from '../ui/VoiceAgent.tsx';
import { trackAnimalSelected, trackLetterSent, trackLetterReceived, trackTtsPlaybackStarted, trackTtsPlaybackCompleted, trackReplyClicked } from '../../utils/analytics.ts';
import type { AppOutletContext } from '../../types/outlet.ts';

export function AppLayout() {
  const { nav, goToMailbox, goToCompose, goToSending, goToReceiving, goToReading } = useNavigation();
  const store = useLetterStore();
  const ctx = useTransitionContext();
  const location = useLocation();

  // Refs so agent tool callbacks always see current values (no stale closures)
  const navRef = useRef(nav);
  useEffect(() => { navRef.current = nav; });
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; });

  const externalTextSeq = useRef(0);
  // Clear stale voice-dictated text when switching to a new animal's compose view
  const [lastComposeAnimal, setLastComposeAnimal] = useState<string | null>(null);
  const composeAnimal = nav.view === 'compose' ? nav.animalId : null;
  if (composeAnimal !== lastComposeAnimal) {
    setLastComposeAnimal(composeAnimal);
    if (composeAnimal !== null) ctx.setExternalText(undefined);
  }

  const ttsSeq = useRef(0);

  const handleSelectAnimal = useCallback((animalId: string) => {
    trackAnimalSelected(animalId);
    ctx.setSelectedAnimalId(animalId);
    const existingThread = storeRef.current.getThreadByAnimal(animalId);
    const animalLetterCount = existingThread?.letters.filter(l => l.from === 'animal').length ?? 0;
    goToCompose(animalId, existingThread?.id, animalLetterCount);
  }, [goToCompose, ctx]);

  const handleSendLetter = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'compose' || !ctx.currentDraftRef.current.trim()) return;
    const content = ctx.currentDraftRef.current.trim();
    const { threadId } = storeRef.current.addLetter(current.animalId, 'child', content, current.threadId);
    goToSending(current.animalId, threadId, content);
  }, [goToSending, ctx.currentDraftRef]);

  const handleWriteText = useCallback((text: string) => {
    ctx.currentDraftRef.current = ctx.currentDraftRef.current
      ? ctx.currentDraftRef.current + ' ' + text
      : text;
    externalTextSeq.current += 1;
    ctx.setExternalText({ text, seq: externalTextSeq.current });
  }, [ctx]);

  const handleReadAloud = useCallback(() => {
    ttsSeq.current += 1;
    ctx.setTtsRequest({ seq: ttsSeq.current });
    return 'Reading the letter aloud now!';
  }, [ctx]);

  const handleReadPreviousLetter = useCallback((letterIndex: number) => {
    const current = navRef.current;
    if (current.view !== 'compose' || !current.threadId) {
      return 'You need to be in a conversation to read previous letters.';
    }
    const thread = storeRef.current.getThread(current.threadId);
    if (!thread) return 'No conversation history found.';
    const animalLetters = thread.letters.filter(l => l.from === 'animal');
    const idx = letterIndex - 1; // convert 1-based to 0-based
    if (idx < 0 || idx >= animalLetters.length) {
      return `There are only ${animalLetters.length} letter(s) from the animal. Try a number between 1 and ${animalLetters.length}.`;
    }
    goToReading(current.animalId, animalLetters[idx].id, current.threadId);
    return `Opening letter #${letterIndex} from the animal. The child can read it and use "Write Back" to return to composing.`;
  }, [goToReading]);

  const getSessionContext = useCallback(() => {
    const current = navRef.current;
    const animalId = 'animalId' in current ? current.animalId : undefined;
    const threadId = 'threadId' in current ? current.threadId : undefined;
    const thread = threadId ? storeRef.current.getThread(threadId)
      : animalId ? storeRef.current.getThreadByAnimal(animalId)
      : undefined;
    return {
      nav: current,
      draft: ctx.currentDraftRef.current ?? '',
      thread,
    };
  }, [ctx.currentDraftRef]);

  const voice = usePenpalConversation({
    onSelectAnimal: handleSelectAnimal,
    onSendLetter: handleSendLetter,
    onGoToMailbox: goToMailbox,
    onWriteText: handleWriteText,
    onReadAloud: handleReadAloud,
    onReadPreviousLetter: handleReadPreviousLetter,
    getSessionContext,
  });

  const handleTtsAutoPlayStarted = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    trackTtsPlaybackStarted(current.animalId);
    voice.muteAgent();
    const letter = storeRef.current.getLetterById(current.letterId);
    const content = letter?.content ?? ctx.pendingResponseRef.current;
    if (content) voice.notifyLetterReceivedWithTts(current.animalId, content);
  }, [voice, ctx.pendingResponseRef]);

  const handleTtsAutoPlayFailed = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    const letter = storeRef.current.getLetterById(current.letterId);
    const content = letter?.content ?? ctx.pendingResponseRef.current;
    if (content) voice.notifyLetterReceivedNoTts(current.animalId, content);
  }, [voice, ctx.pendingResponseRef]);

  const handleTtsEnd = useCallback(() => {
    const current = navRef.current;
    if (current.view === 'reading') {
      trackTtsPlaybackCompleted(current.animalId);
    }
    voice.unmuteAgent();
  }, [voice]);

  // Notify agent of view changes
  useEffect(() => {
    const animalId = 'animalId' in nav ? nav.animalId : undefined;
    const threadId = 'threadId' in nav ? nav.threadId : undefined;
    const thread = threadId ? store.getThread(threadId)
      : animalId ? store.getThreadByAnimal(animalId)
      : undefined;
    voice.notifyViewChange(nav, thread, ctx.currentDraftRef.current ?? '');
    if (nav.view === 'compose') {
      ctx.currentDraftRef.current = '';
    }
  }, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  // TTS cleanup: unmute agent when navigating away from reading
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (prev.startsWith('/reading') && !location.pathname.startsWith('/reading')) {
      voice.unmuteAgent();
    }
  }, [location.pathname, voice]);

  // Cancel pending draft notifications when leaving compose
  const draftNotifyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!location.pathname.startsWith('/compose') && draftNotifyRef.current) {
      clearTimeout(draftNotifyRef.current);
      draftNotifyRef.current = null;
    }
  }, [location.pathname]);

  const handleComposeSend = useCallback((content: string) => {
    const current = navRef.current;
    if (current.view !== 'compose') return;

    // Clear stale pending response from previous send
    ctx.pendingResponseRef.current = null;
    ctx.setPendingResponse(null);

    const { threadId } = storeRef.current.addLetter(current.animalId, 'child', content, current.threadId);
    const thread = storeRef.current.getThread(threadId);
    trackLetterSent(current.animalId, content.length, !!current.threadId, thread?.letters.length);
    const animal = getAnimalById(current.animalId);

    // Fire the API call (moved from SendAnimation)
    const priorHistory = (thread?.letters ?? [])
      .filter(l => !(l.from === 'child' && l.content === content))
      .map(l => ({ from: l.from, content: l.content }));

    ctx.responsePromiseRef.current = fetch('/api/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animalId: current.animalId,
        childLetter: content,
        threadId,
        threadHistory: priorHistory,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (animal) prefetchTts(data.response, animal.voiceId);
        return data.response as string;
      })
      .catch(() => "Oh no, my quill broke! I'll write back soon, I promise!");

    // Swap view-transition-names before the snapshot so the send-letter
    // CSS rules match. The unique name "sending-letter" scopes the animation
    // without needing view transition types.
    const videoWrap = document.querySelector('.compose__video-wrap');
    if (videoWrap) (videoWrap as HTMLElement).style.viewTransitionName = 'none';

    const composeContent = document.querySelector('.compose__content');
    if (composeContent) (composeContent as HTMLElement).style.viewTransitionName = 'sending-letter';

    const composeActions = document.querySelector('.compose__actions');
    if (composeActions) (composeActions as HTMLElement).style.viewTransitionName = 'none';

    goToReceiving(current.animalId, threadId, { viewTransition: true });
  }, [goToReceiving, ctx]);

  const handleDraftChange = useCallback((animalId: string, content: string) => {
    ctx.currentDraftRef.current = content;
    if (draftNotifyRef.current) clearTimeout(draftNotifyRef.current);
    draftNotifyRef.current = setTimeout(() => {
      voice.notifyDraftChange(animalId, content);
    }, 800);
  }, [voice, ctx.currentDraftRef]);

  const handleSendComplete = useCallback((responsePromise: Promise<string>) => {
    const current = navRef.current;
    if (current.view !== 'sending') return;
    ctx.responsePromiseRef.current = responsePromise;
    goToReceiving(current.animalId, current.threadId);
  }, [goToReceiving, ctx.responsePromiseRef]);

  const handleReceiveComplete = useCallback((animalResponse: string) => {
    const current = navRef.current;
    if (current.view !== 'receiving') return;
    const { letterId } = storeRef.current.addLetter(current.animalId, 'animal', animalResponse, current.threadId);
    const thread = storeRef.current.getThread(current.threadId);
    trackLetterReceived(current.animalId, thread?.letters.length);
    ctx.pendingResponseRef.current = animalResponse;
    ctx.setPendingResponse(animalResponse);
    goToReading(current.animalId, letterId, current.threadId);
  }, [goToReading, ctx]);

  const handleReadLetter = useCallback((letterId: string) => {
    const current = navRef.current;
    if (current.view !== 'compose' || !current.threadId) return;
    goToReading(current.animalId, letterId, current.threadId);
  }, [goToReading]);

  const handleReply = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    ctx.currentDraftRef.current = '';
    const thread = storeRef.current.getThread(current.threadId);
    const threadLength = thread?.letters.length ?? 0;
    trackReplyClicked(current.animalId, threadLength);
    const animalLetterCount = thread?.letters.filter(l => l.from === 'animal').length ?? 0;
    goToCompose(current.animalId, current.threadId, animalLetterCount);
  }, [goToCompose, ctx.currentDraftRef]);

  const hasThread = useCallback((animalId: string) => {
    return !!storeRef.current.getThreadByAnimal(animalId);
  }, []);

  const handleMarkRead = useCallback(() => {
    const current = navRef.current;
    if (current.view === 'reading') {
      storeRef.current.markRead(current.letterId);
    }
  }, []);

  const outletContext: AppOutletContext = {
    store,
    handleSelectAnimal,
    handleComposeSend,
    handleSendComplete,
    handleReceiveComplete,
    handleReply,
    handleReadLetter,
    handleDraftChange,
    handleMarkRead,
    handleTtsAutoPlayStarted,
    handleTtsAutoPlayFailed,
    handleTtsEnd,
    hasThread,
    goToMailbox,
  };

  return (
    <div className="app">
      <Outlet context={outletContext} />

      {voice.agentId && (
        <div className="app__voice-float">
          <VoiceAgent
            status={voice.status}
            isSpeaking={voice.isSpeaking}
            onToggle={voice.toggle}
            micError={voice.micError}
            onDismissError={voice.clearMicError}
          />
        </div>
      )}

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
