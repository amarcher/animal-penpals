import { useParams, Navigate, useOutletContext } from 'react-router';
import { ReceiveAnimation } from '../components/animation/ReceiveAnimation.tsx';
import { letterFlowState } from '../utils/letterFlowState.ts';
import type { AppOutletContext } from '../types/outlet.ts';

export function ReceivingRoute() {
  const { animalId, threadId } = useParams<{ animalId: string; threadId: string }>();
  const { handleReceiveComplete } = useOutletContext<AppOutletContext>();

  if (!animalId || !threadId) return <Navigate to="/mailbox" replace />;

  const responsePromise = letterFlowState.getResponsePromise();
  if (!responsePromise) return <Navigate to={`/compose/${animalId}`} replace />;

  return (
    <ReceiveAnimation
      animalId={animalId}
      responsePromise={responsePromise}
      onComplete={handleReceiveComplete}
    />
  );
}
