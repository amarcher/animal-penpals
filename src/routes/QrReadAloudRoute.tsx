import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router';
import { ReadingView } from '../components/reading/ReadingView.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function QrReadAloudRoute() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { reviewStore } = useOutletContext<AppOutletContext>();

  if (!token) return <Navigate to="/mailbox" replace />;

  const draft = reviewStore.getDraftByToken(token);
  if (!draft) return <Navigate to="/mailbox" replace />;

  return (
    <ReadingView
      animalId={draft.animalId}
      letterContent={draft.draftText}
      onReply={() => navigate(`/compose/${draft.animalId}?thread=${draft.threadId}`)}
      onBack={() => navigate('/mailbox')}
      onMarkRead={() => {}}
    />
  );
}
