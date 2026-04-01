import { useParams, Navigate } from 'react-router';
import { useOutletContext } from 'react-router';
import { ReceiveAnimation } from '../components/animation/ReceiveAnimation.tsx';
import { useTransitionContext } from '../contexts/TransitionContext.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function ReceivingRoute() {
  const { animalId, threadId } = useParams<{ animalId: string; threadId: string }>();
  const { handleReceiveComplete } = useOutletContext<AppOutletContext>();
  const { responsePromiseRef } = useTransitionContext();

  if (!animalId || !threadId) return <Navigate to="/mailbox" replace />;

  const responsePromise = responsePromiseRef.current;
  if (!responsePromise) return <Navigate to={`/compose/${animalId}`} replace />;

  return (
    <ReceiveAnimation
      animalId={animalId}
      responsePromise={responsePromise}
      onComplete={handleReceiveComplete}
    />
  );
}
