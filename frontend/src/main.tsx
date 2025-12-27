import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
    // Optional: Show a toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FarmBot AI', {
        body: 'App is ready to work offline!',
        icon: '/icons/icon-192x192.png'
      });
    }
  },
  onRegisteredSW(swScriptUrl: string) {
    console.log('Service Worker registered:', swScriptUrl);
  },
  onRegisterError(error: Error) {
    console.error('Service Worker registration error:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);