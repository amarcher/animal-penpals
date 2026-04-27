import { useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Mailbox } from '../components/mailbox/Mailbox.tsx';
import { useTransitionContext } from '../contexts/useTransitionContext.ts';
import type { AppOutletContext } from '../types/outlet.ts';

const showsComposeVideo = window.matchMedia('(min-width: 701px)');

export function MailboxRoute() {
  const { handleSelectAnimal, store, hasThread } = useOutletContext<AppOutletContext>();
  const { selectedAnimalId, setSelectedAnimalId } = useTransitionContext();

  useEffect(() => {
    setSelectedAnimalId(null);
  }, [setSelectedAnimalId]);

  return (
    <Mailbox
      onSelectAnimal={handleSelectAnimal}
      getUnreadCount={store.getUnreadCount}
      hasThread={hasThread}
      selectedAnimalId={showsComposeVideo.matches ? selectedAnimalId : null}
    />
  );
}
