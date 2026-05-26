import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Navigate } from 'react-router';
import { LayoutWithProvider } from '../components/layout/LayoutWithProvider.tsx';
import { MailboxRoute } from '../routes/MailboxRoute.tsx';
import { ComposeRoute } from '../routes/ComposeRoute.tsx';
import { SendingRoute } from '../routes/SendingRoute.tsx';
import { ReceivingRoute } from '../routes/ReceivingRoute.tsx';
import { ReadingRoute } from '../routes/ReadingRoute.tsx';
import { MailboxSentRoute } from '../routes/MailboxSentRoute.tsx';
import { MailJourneyRoute } from '../routes/MailJourneyRoute.tsx';
import { ParentReviewRoute } from '../routes/ParentReviewRoute.tsx';
import { ParentPreviewRoute } from '../routes/ParentPreviewRoute.tsx';
import { PrintableLetterRoute } from '../routes/PrintableLetterRoute.tsx';
import { QrReadAloudRoute } from '../routes/QrReadAloudRoute.tsx';

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
      { path: 'mailbox-sent/:animalId/:threadId', element: <MailboxSentRoute /> },
      { path: 'mail-journey/:animalId/:threadId', element: <MailJourneyRoute /> },
      { path: 'parent/review', element: <ParentReviewRoute /> },
      { path: 'parent/preview/:draftId', element: <ParentPreviewRoute /> },
      { path: 'print/:draftId', element: <PrintableLetterRoute /> },
      { path: 'read-aloud/:token', element: <QrReadAloudRoute /> },
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
