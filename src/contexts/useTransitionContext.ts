import { useContext } from 'react';
import { TransitionContext, type TransitionState } from './transitionContextValue.ts';

export function useTransitionContext(): TransitionState {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransitionContext must be used within TransitionProvider');
  return ctx;
}
