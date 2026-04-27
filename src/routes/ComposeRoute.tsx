import { useParams, useSearchParams, Navigate } from 'react-router';
import { useOutletContext } from 'react-router';
import { ComposeView } from '../components/compose/ComposeView.tsx';
import { useTransitionContext } from '../contexts/useTransitionContext.ts';
import type { AppOutletContext } from '../types/outlet.ts';

export function ComposeRoute() {
  const { animalId } = useParams<{ animalId: string }>();
  const [searchParams] = useSearchParams();
  const { store, handleComposeSend, handleDraftChange, handleReadLetter, goToMailbox } = useOutletContext<AppOutletContext>();
  const { externalText } = useTransitionContext();

  if (!animalId) return <Navigate to="/mailbox" replace />;

  const threadId = searchParams.get('thread') ?? undefined;
  const thread = threadId ? store.getThread(threadId) : undefined;

  return (
    <ComposeView
      key={animalId}
      animalId={animalId}
      thread={thread}
      externalText={externalText}
      onSend={handleComposeSend}
      onBack={goToMailbox}
      onDraftChange={handleDraftChange}
      onReadLetter={handleReadLetter}
    />
  );
}
