import { useCallback, useEffect, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useNavigation } from './hooks/useNavigation.ts';
import { useLetterStore } from './hooks/useLetterStore.ts';
import { usePenpalConversation } from './hooks/usePenpalConversation.ts';
import { Mailbox } from './components/mailbox/Mailbox.tsx';
import { ComposeView } from './components/compose/ComposeView.tsx';
import { SendAnimation } from './components/animation/SendAnimation.tsx';
import { ReceiveAnimation } from './components/animation/ReceiveAnimation.tsx';
import { ReadingView } from './components/reading/ReadingView.tsx';
import { VoiceAgent } from './components/ui/VoiceAgent.tsx';
import './App.css';

function App() {
  const { nav, goToMailbox, goToCompose, goToSending, goToReceiving, goToReading } = useNavigation();
  const store = useLetterStore();

  // Refs so agent tool callbacks always see current values (no stale closures)
  const navRef = useRef(nav);
  navRef.current = nav;
  const storeRef = useRef(store);
  storeRef.current = store;
  const currentDraftRef = useRef('');
  const pendingLetterIdRef = useRef<string | null>(null);
  const [externalText, setExternalText] = useState<{ text: string; seq: number } | undefined>(undefined);
  const externalTextSeq = useRef(0);

  // Ref for triggering TTS from the agent
  const [ttsRequest, setTtsRequest] = useState<{ seq: number } | undefined>(undefined);
  const ttsSeq = useRef(0);

  const handleSelectAnimal = useCallback((animalId: string) => {
    const existingThread = storeRef.current.getThreadByAnimal(animalId);
    goToCompose(animalId, existingThread?.id);
  }, [goToCompose]);

  const handleSendLetter = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'compose' || !currentDraftRef.current.trim()) return;
    const content = currentDraftRef.current.trim();
    const { threadId } = storeRef.current.addLetter(current.animalId, 'child', content, current.threadId);
    goToSending(current.animalId, threadId, content);
  }, [goToSending]);

  const handleWriteText = useCallback((text: string) => {
    currentDraftRef.current = currentDraftRef.current
      ? currentDraftRef.current + ' ' + text
      : text;
    externalTextSeq.current += 1;
    setExternalText({ text, seq: externalTextSeq.current });
  }, []);

  const handleReadAloud = useCallback(() => {
    ttsSeq.current += 1;
    setTtsRequest({ seq: ttsSeq.current });
    return 'Reading the letter aloud now!';
  }, []);

  const voice = usePenpalConversation({
    onSelectAnimal: handleSelectAnimal,
    onSendLetter: handleSendLetter,
    onGoToMailbox: goToMailbox,
    onWriteText: handleWriteText,
    onReadAloud: handleReadAloud,
  });

  // Notify agent of view changes
  useEffect(() => {
    voice.notifyViewChange(nav);
    if (nav.view === 'compose') {
      currentDraftRef.current = '';
    }
    if (nav.view === 'reading') {
      const letter = storeRef.current.getLetterById(nav.letterId);
      if (letter) {
        voice.notifyLetterReceived(nav.animalId, letter.content);
      }
    }
  }, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComposeSend = useCallback((content: string) => {
    const current = navRef.current;
    if (current.view !== 'compose') return;
    const { threadId } = storeRef.current.addLetter(current.animalId, 'child', content, current.threadId);
    goToSending(current.animalId, threadId, content);
  }, [goToSending]);

  const draftNotifyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDraftChange = useCallback((animalId: string, content: string) => {
    currentDraftRef.current = content;
    if (draftNotifyRef.current) clearTimeout(draftNotifyRef.current);
    draftNotifyRef.current = setTimeout(() => {
      voice.notifyDraftChange(animalId, content);
    }, 800);
  }, [voice]);

  const handleSendComplete = useCallback((animalResponse: string) => {
    const current = navRef.current;
    if (current.view !== 'sending') return;
    const { letterId } = storeRef.current.addLetter(current.animalId, 'animal', animalResponse, current.threadId);
    pendingLetterIdRef.current = letterId;
    goToReceiving(current.animalId, current.threadId);
  }, [goToReceiving]);

  const handleReceiveComplete = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'receiving') return;

    if (pendingLetterIdRef.current) {
      goToReading(current.animalId, pendingLetterIdRef.current, current.threadId);
      pendingLetterIdRef.current = null;
    } else {
      // Fallback: find latest animal letter
      const thread = storeRef.current.getThread(current.threadId);
      const latestAnimalLetter = thread?.letters.filter(l => l.from === 'animal').pop();
      if (latestAnimalLetter) {
        goToReading(current.animalId, latestAnimalLetter.id, current.threadId);
      } else {
        goToMailbox();
      }
    }
  }, [goToReading, goToMailbox]);

  const handleReply = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    currentDraftRef.current = '';
    goToCompose(current.animalId, current.threadId);
  }, [goToCompose]);

  const hasThread = useCallback((animalId: string) => {
    return !!storeRef.current.getThreadByAnimal(animalId);
  }, []);

  const handleMarkRead = useCallback(() => {
    const current = navRef.current;
    if (current.view === 'reading') {
      storeRef.current.markRead(current.letterId);
    }
  }, []);

  // Get letter content for reading view
  const readingLetter = nav.view === 'reading' ? store.getLetterById(nav.letterId) : undefined;

  return (
    <div className="app">
      {nav.view === 'mailbox' && (
        <Mailbox
          onSelectAnimal={handleSelectAnimal}
          getUnreadCount={store.getUnreadCount}
          hasThread={hasThread}
        />
      )}

      {nav.view === 'compose' && (
        <ComposeView
          animalId={nav.animalId}
          thread={nav.threadId ? store.getThread(nav.threadId) : undefined}
          externalText={externalText}
          onSend={handleComposeSend}
          onBack={goToMailbox}
          onDraftChange={handleDraftChange}
        />
      )}

      {nav.view === 'sending' && (
        <SendAnimation
          animalId={nav.animalId}
          letterContent={nav.letterContent}
          threadId={nav.threadId}
          threadHistory={store.getThread(nav.threadId)?.letters ?? []}
          onComplete={handleSendComplete}
        />
      )}

      {nav.view === 'receiving' && (
        <ReceiveAnimation
          animalId={nav.animalId}
          onComplete={handleReceiveComplete}
        />
      )}

      {nav.view === 'reading' && readingLetter && (
        <ReadingView
          animalId={nav.animalId}
          letterContent={readingLetter.content}
          ttsRequest={ttsRequest}
          onReply={handleReply}
          onBack={goToMailbox}
          onMarkRead={handleMarkRead}
        />
      )}

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
    </div>
  );
}

export default App;
