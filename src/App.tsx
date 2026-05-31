import { ConversationProvider } from '@elevenlabs/react';
import { RouterProvider } from 'react-router';

import { router } from './routes.tsx';
import './App.css';

function App() {
  return (
    <ConversationProvider>
      <RouterProvider router={router} />
    </ConversationProvider>
  );
}

export default App;
