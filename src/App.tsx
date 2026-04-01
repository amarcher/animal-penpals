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
  useEffect(() => { navRef.current = nav; });
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; });
  const currentDraftRef = useRef('');

  const pendingResponseRef = useRef<string | null>(null);
  const [pendingResponse, setPendingResponse] = useState<string | null>(null);
  const [externalText, setExternalText] = useState<{ text: string; seq: number } | undefined>(undefined);
  const externalTextSeq = useRef(0);
  // Clear stale voice-dictated text when switching to a new animal's compose view
  const [lastComposeAnimal, setLastComposeAnimal] = useState<string | null>(null);
  const composeAnimal = nav.view === 'compose' ? nav.animalId : null;
  if (composeAnimal !== lastComposeAnimal) {
    setLastComposeAnimal(composeAnimal);
    if (composeAnimal !== null) setExternalText(undefined);
  }

  // Ref for triggering TTS from the agent
  const [ttsRequest, setTtsRequest] = useState<{ seq: number } | undefined>(undefined);
  const ttsSeq = useRef(0);

  const handleSelectAnimal = useCallback((animalId: string) => {
    const existingThread = storeRef.current.getThreadByAnimal(animalId);
    const animalLetterCount = existingThread?.letters.filter(l => l.from === 'animal').length ?? 0;
    goToCompose(animalId, existingThread?.id, animalLetterCount);
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

  const voice = usePenpalConversation({
    onSelectAnimal: handleSelectAnimal,
    onSendLetter: handleSendLetter,
    onGoToMailbox: goToMailbox,
    onWriteText: handleWriteText,
    onReadAloud: handleReadAloud,
    onReadPreviousLetter: handleReadPreviousLetter,
  });

  const handleTtsAutoPlayStarted = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    voice.muteAgent();
    const letter = storeRef.current.getLetterById(current.letterId);
    const content = letter?.content ?? pendingResponseRef.current;
    if (content) voice.notifyLetterReceivedWithTts(current.animalId, content);
  }, [voice]);

  const handleTtsAutoPlayFailed = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    const letter = storeRef.current.getLetterById(current.letterId);
    const content = letter?.content ?? pendingResponseRef.current;
    if (content) voice.notifyLetterReceivedNoTts(current.animalId, content);
  }, [voice]);

  const handleTtsEnd = useCallback(() => {
    voice.unmuteAgent();
  }, [voice]);

  // Notify agent of view changes
  useEffect(() => {
    voice.notifyViewChange(nav);
    if (nav.view === 'compose') {
      currentDraftRef.current = '';
    }
    // Letter received context is now sent from TTS callbacks (onTtsAutoPlayStarted/Failed)
    // so the agent gets the right message depending on whether auto-play worked
  }, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComposeSend = useCallback((content: string) => {
    const current = navRef.current;
    if (current.view !== 'compose') return;
    // Clear stale pending response from previous send
    pendingResponseRef.current = null;
    setPendingResponse(null);
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

  const responsePromiseRef = useRef<Promise<string> | null>(null);

  const handleSendComplete = useCallback((responsePromise: Promise<string>) => {
    const current = navRef.current;
    if (current.view !== 'sending') return;
    // Store the promise — ReceiveAnimation will await it alongside the video
    responsePromiseRef.current = responsePromise;
    goToReceiving(current.animalId, current.threadId);
  }, [goToReceiving]);

  const handleReceiveComplete = useCallback((animalResponse: string) => {
    const current = navRef.current;
    if (current.view !== 'receiving') return;

    // Now that both video and API are done, persist the response
    const { letterId } = storeRef.current.addLetter(current.animalId, 'animal', animalResponse, current.threadId);
    pendingResponseRef.current = animalResponse;
    setPendingResponse(animalResponse);

    goToReading(current.animalId, letterId, current.threadId);
  }, [goToReading, goToMailbox]);

  const handleReadLetter = useCallback((letterId: string) => {
    const current = navRef.current;
    if (current.view !== 'compose' || !current.threadId) return;
    goToReading(current.animalId, letterId, current.threadId);
  }, [goToReading]);

  const handleReply = useCallback(() => {
    const current = navRef.current;
    if (current.view !== 'reading') return;
    currentDraftRef.current = '';
    const thread = storeRef.current.getThread(current.threadId);
    const animalLetterCount = thread?.letters.filter(l => l.from === 'animal').length ?? 0;
    goToCompose(current.animalId, current.threadId, animalLetterCount);
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

  // Get letter content for reading view — fall back to the pending response ref
  // because the store state update may not have flushed yet
  const readingLetterFromStore = nav.view === 'reading' ? store.getLetterById(nav.letterId) : undefined;
  const readingLetterContent = readingLetterFromStore?.content ?? pendingResponse ?? null;

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
          key={nav.animalId}
          animalId={nav.animalId}
          thread={nav.threadId ? store.getThread(nav.threadId) : undefined}
          externalText={externalText}
          onSend={handleComposeSend}
          onBack={goToMailbox}
          onDraftChange={handleDraftChange}
          onReadLetter={handleReadLetter}
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
          responsePromise={responsePromiseRef.current!}
          onComplete={handleReceiveComplete}
        />
      )}

      {nav.view === 'reading' && readingLetterContent && (
        <ReadingView
          animalId={nav.animalId}
          letterContent={readingLetterContent}
          ttsRequest={ttsRequest}
          onReply={handleReply}
          onBack={goToMailbox}
          onMarkRead={handleMarkRead}
          onTtsAutoPlayStarted={handleTtsAutoPlayStarted}
          onTtsAutoPlayFailed={handleTtsAutoPlayFailed}
          onTtsEnd={handleTtsEnd}
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
