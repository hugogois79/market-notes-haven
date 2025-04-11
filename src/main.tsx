
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker installed and ready to take over');
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
