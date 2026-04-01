import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import './App.css';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
