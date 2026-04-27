import { useParams, Navigate, useOutletContext } from 'react-router';
import { SendAnimation } from '../components/animation/SendAnimation.tsx';
import { letterFlowState } from '../utils/letterFlowState.ts';
import type { AppOutletContext } from '../types/outlet.ts';

export function SendingRoute() {
  const { animalId, threadId } = useParams<{ animalId: string; threadId: string }>();
  const { store, handleSendComplete } = useOutletContext<AppOutletContext>();

  if (!animalId || !threadId) return <Navigate to="/mailbox" replace />;

  const letterContent = letterFlowState.getLetterContent();
  if (!letterContent) return <Navigate to={`/compose/${animalId}`} replace />;

  return (
    <SendAnimation
      animalId={animalId}
      letterContent={letterContent}
      threadId={threadId}
      threadHistory={store.getThread(threadId)?.letters ?? []}
      onComplete={handleSendComplete}
    />
  );
}
