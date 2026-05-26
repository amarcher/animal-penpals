import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router';
import { ReadingView } from '../components/reading/ReadingView.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function ParentPreviewRoute() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { reviewStore } = useOutletContext<AppOutletContext>();

  if (!draftId) return <Navigate to="/parent/review" replace />;

  const draft = reviewStore.getDraft(draftId);
  if (!draft) return <Navigate to="/parent/review" replace />;

  return (
    <ReadingView
      animalId={draft.animalId}
      letterContent={draft.draftText}
      onReply={() => navigate('/parent/review')}
      onBack={() => navigate('/parent/review')}
      onMarkRead={() => {}}
      showReply={false}
    />
  );
}
