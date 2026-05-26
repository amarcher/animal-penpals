import { useOutletContext } from 'react-router';
import { ParentReviewView } from '../components/parent/ParentReviewView.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function ParentReviewRoute() {
  const { reviewStore } = useOutletContext<AppOutletContext>();
  return <ParentReviewView reviewStore={reviewStore} />;
}
