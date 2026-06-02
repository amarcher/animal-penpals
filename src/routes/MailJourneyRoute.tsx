import { Navigate, useOutletContext, useParams } from 'react-router';
import { MailJourneyView } from '../components/mailbox/MailJourneyView.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function MailJourneyRoute() {
  const { animalId, threadId } = useParams<{ animalId: string; threadId: string }>();
  const { reviewStore, goToMailbox } = useOutletContext<AppOutletContext>();

  if (!animalId || !threadId) return <Navigate to="/mailbox" replace />;

  const draft = reviewStore.getLatestDraftByThread(threadId, animalId);

  return (
    <MailJourneyView
      animalId={animalId}
      threadId={threadId}
      draft={draft}
      onBack={goToMailbox}
    />
  );
}
