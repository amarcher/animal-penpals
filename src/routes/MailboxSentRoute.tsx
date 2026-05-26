import { Navigate, useOutletContext, useParams } from 'react-router';
import { MailboxSentView } from '../components/mailbox/MailboxSentView.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function MailboxSentRoute() {
  const { animalId, threadId } = useParams<{ animalId: string; threadId: string }>();
  const { goToMailbox } = useOutletContext<AppOutletContext>();

  if (!animalId || !threadId) return <Navigate to="/mailbox" replace />;

  return <MailboxSentView animalId={animalId} threadId={threadId} onBack={goToMailbox} />;
}
