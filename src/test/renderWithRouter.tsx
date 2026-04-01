import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { TransitionProvider } from '../contexts/TransitionContext.tsx';
import { AppLayout } from '../components/layout/AppLayout.tsx';
import { MailboxRoute } from '../routes/MailboxRoute.tsx';
import { ComposeRoute } from '../routes/ComposeRoute.tsx';
import { SendingRoute } from '../routes/SendingRoute.tsx';
import { ReceivingRoute } from '../routes/ReceivingRoute.tsx';
import { ReadingRoute } from '../routes/ReadingRoute.tsx';
import { Navigate } from 'react-router';

function LayoutWithProvider() {
  return (
    <TransitionProvider>
      <AppLayout />
    </TransitionProvider>
  );
}

const routes = [
  {
    element: <LayoutWithProvider />,
    children: [
      { index: true, element: <Navigate to="/mailbox" replace /> },
      { path: 'mailbox', element: <MailboxRoute /> },
      { path: 'compose/:animalId', element: <ComposeRoute /> },
      { path: 'sending/:animalId/:threadId', element: <SendingRoute /> },
      { path: 'receiving/:animalId/:threadId', element: <ReceivingRoute /> },
      { path: 'reading/:animalId/:letterId', element: <ReadingRoute /> },
      { path: '*', element: <Navigate to="/mailbox" replace /> },
    ],
  },
];

export function renderWithRouter(initialPath = '/mailbox') {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  });
  return render(<RouterProvider router={router} />);
}
