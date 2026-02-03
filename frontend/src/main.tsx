import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import '@/styles/index.css';

// Force cache bust - Version 4.0
console.log('🚀 App loaded [v4.0]:', new Date().toISOString());
console.log('✅ ThemeProvider now integrated in App component');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);