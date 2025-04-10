
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Safe initialization - prevent conflicts with browser extensions
if (window && !Object.getOwnPropertyDescriptor(window, 'ethereum')) {
  // Only define ethereum if not already defined to avoid conflicts
  try {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  } catch (error) {
    console.warn('Ethereum property already defined by an extension, using existing definition:', error);
  }
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
