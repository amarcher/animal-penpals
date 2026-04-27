import { TransitionProvider } from '../../contexts/TransitionContext.tsx';
import { AppLayout } from './AppLayout.tsx';

export function LayoutWithProvider() {
  return (
    <TransitionProvider>
      <AppLayout />
    </TransitionProvider>
  );
}
