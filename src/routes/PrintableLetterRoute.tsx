import { Navigate, useOutletContext, useParams } from 'react-router';
import { PrintableLetterView } from '../components/parent/PrintableLetterView.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function PrintableLetterRoute() {
  const { draftId } = useParams<{ draftId: string }>();
  const { reviewStore } = useOutletContext<AppOutletContext>();

  if (!draftId) return <Navigate to="/parent/review" replace />;

  const draft = reviewStore.getDraft(draftId);
  if (!draft || draft.status !== 'approved') return <Navigate to="/parent/review" replace />;

  return <PrintableLetterView draft={draft} />;
}
