import { useCallback, useEffect, useRef } from 'react';
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
  const pendingSendRef = useRef<{ threadId: string; animalId: string } | null>(null);

  // Track which animal the child wants to send to (for agent tool)
  const currentAnimalRef = useRef<string | null>(null);
  const currentDraftRef = useRef<string>('');

  const handleSelectAnimal = useCallback((animalId: string) => {
    const existingThread = store.getThreadByAnimal(animalId);
    goToCompose(animalId, existingThread?.id);
  }, [store, goToCompose]);

  const handleSendLetter = useCallback(() => {
    if (nav.view !== 'compose' || !currentDraftRef.current.trim()) return;
    const content = currentDraftRef.current.trim();
    const { threadId } = store.addLetter(nav.animalId, 'child', content, nav.threadId);
    goToSending(nav.animalId, threadId, content);
  }, [nav, store, goToSending]);

  const voice = usePenpalConversation({
    onSelectAnimal: handleSelectAnimal,
    onSendLetter: handleSendLetter,
    onGoToMailbox: goToMailbox,
  });

  // Notify agent of view changes
  useEffect(() => {
    voice.notifyViewChange(nav);
    if (nav.view === 'compose') {
      currentAnimalRef.current = nav.animalId;
    }
  }, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComposeSend = useCallback((content: string) => {
    if (nav.view !== 'compose') return;
    const { threadId } = store.addLetter(nav.animalId, 'child', content, nav.threadId);
    goToSending(nav.animalId, threadId, content);
  }, [nav, store, goToSending]);

  const handleDraftChange = useCallback((animalId: string, content: string) => {
    currentDraftRef.current = content;
    voice.notifyDraftChange(animalId, content);
  }, [voice]);

  const handleSendComplete = useCallback((animalResponse: string) => {
    if (nav.view !== 'sending') return;
    const { letterId } = store.addLetter(nav.animalId, 'animal', animalResponse, nav.threadId);
    pendingSendRef.current = { threadId: nav.threadId, animalId: nav.animalId };
    goToReceiving(nav.animalId, nav.threadId);
    // Store the letter ID for when receive animation completes
    pendingSendRef.current = { ...pendingSendRef.current };
    // We need to store the letterId somewhere accessible
    (pendingSendRef.current as { threadId: string; animalId: string; letterId?: string }).letterId = letterId;
  }, [nav, store, goToReceiving]);

  const handleReceiveComplete = useCallback(() => {
    if (nav.view !== 'receiving') return;
    const pending = pendingSendRef.current as { threadId: string; animalId: string; letterId?: string } | null;
    if (pending?.letterId) {
      goToReading(nav.animalId, pending.letterId, nav.threadId);
    } else {
      // Fallback: find the latest animal letter in the thread
      const thread = store.getThread(nav.threadId);
      const latestAnimalLetter = thread?.letters.filter(l => l.from === 'animal').pop();
      if (latestAnimalLetter) {
        goToReading(nav.animalId, latestAnimalLetter.id, nav.threadId);
      } else {
        goToMailbox();
      }
    }
  }, [nav, store, goToReading, goToMailbox]);

  const handleReply = useCallback(() => {
    if (nav.view !== 'reading') return;
    currentDraftRef.current = '';
    goToCompose(nav.animalId, nav.threadId);
  }, [nav, goToCompose]);

  const hasThread = useCallback((animalId: string) => {
    return !!store.getThreadByAnimal(animalId);
  }, [store]);

  const handleMarkRead = useCallback(() => {
    if (nav.view === 'reading') {
      store.markRead(nav.letterId);
    }
  }, [nav, store]);

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
