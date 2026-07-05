import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Navigate } from 'react-router';
import { LayoutWithProvider } from '../components/layout/LayoutWithProvider.tsx';
import { MailboxRoute } from '../routes/MailboxRoute.tsx';
import { ComposeRoute } from '../routes/ComposeRoute.tsx';
import { ReceivingRoute } from '../routes/ReceivingRoute.tsx';
import { ReadingRoute } from '../routes/ReadingRoute.tsx';

const routes = [
  {
    element: <LayoutWithProvider />,
    children: [
      { index: true, element: <Navigate to="/mailbox" replace /> },
      { path: 'mailbox', element: <MailboxRoute /> },
      { path: 'compose/:animalId', element: <ComposeRoute /> },
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
