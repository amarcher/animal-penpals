import { useParams, Navigate, useOutletContext } from 'react-router';
import { ReadingView } from '../components/reading/ReadingView.tsx';
import { useTransitionContext } from '../contexts/useTransitionContext.ts';
import type { AppOutletContext } from '../types/outlet.ts';

export function ReadingRoute() {
  const { animalId, letterId } = useParams<{ animalId: string; letterId: string }>();
  const { store, handleReply, handleMarkRead, handleTtsAutoPlayStarted, handleTtsAutoPlayFailed, handleTtsEnd, goToMailbox } = useOutletContext<AppOutletContext>();
  const { pendingResponse, ttsRequest } = useTransitionContext();

  if (!animalId || !letterId) return <Navigate to="/mailbox" replace />;

  const letterFromStore = store.getLetterById(letterId);
  const letterContent = letterFromStore?.content ?? pendingResponse;

  if (!letterContent) return <Navigate to="/mailbox" replace />;

  return (
    <ReadingView
      animalId={animalId}
      letterContent={letterContent}
      ttsRequest={ttsRequest}
      onReply={handleReply}
      onBack={goToMailbox}
      onMarkRead={handleMarkRead}
      onTtsAutoPlayStarted={handleTtsAutoPlayStarted}
      onTtsAutoPlayFailed={handleTtsAutoPlayFailed}
      onTtsEnd={handleTtsEnd}
    />
  );
}
