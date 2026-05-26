import { useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Mailbox } from '../components/mailbox/Mailbox.tsx';
import { useTransitionContext } from '../contexts/useTransitionContext.ts';
import { useMailboxMode } from '../utils/mailboxExperiment.ts';
import type { AppOutletContext } from '../types/outlet.ts';

const showsComposeVideo = window.matchMedia('(min-width: 701px)');

export function MailboxRoute() {
  const { handleSelectAnimal, store, reviewStore, hasThread } = useOutletContext<AppOutletContext>();
  const { selectedAnimalId, setSelectedAnimalId } = useTransitionContext();
  const [mailboxModeEnabled, setMailboxModeEnabled] = useMailboxMode();

  useEffect(() => {
    setSelectedAnimalId(null);
  }, [setSelectedAnimalId]);

  return (
    <Mailbox
      onSelectAnimal={handleSelectAnimal}
      getUnreadCount={store.getUnreadCount}
      hasThread={hasThread}
      selectedAnimalId={showsComposeVideo.matches ? selectedAnimalId : null}
      mailboxModeEnabled={mailboxModeEnabled}
      pendingMailCount={reviewStore.pendingCount}
      onToggleMailboxMode={() => setMailboxModeEnabled(!mailboxModeEnabled)}
    />
  );
}
