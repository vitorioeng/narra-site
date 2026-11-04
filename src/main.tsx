import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import NarraProvider from '@/state/NarraProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NarraProvider>
      <App />
    </NarraProvider>
  </StrictMode>
);
