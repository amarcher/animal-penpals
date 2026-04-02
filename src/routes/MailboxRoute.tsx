import { useOutletContext } from 'react-router';
import { Mailbox } from '../components/mailbox/Mailbox.tsx';
import type { AppOutletContext } from '../types/outlet.ts';

export function MailboxRoute() {
  const { handleSelectAnimal, store, hasThread } = useOutletContext<AppOutletContext>();
  return (
    <Mailbox
      onSelectAnimal={handleSelectAnimal}
      getUnreadCount={store.getUnreadCount}
      hasThread={hasThread}
    />
  );
}
