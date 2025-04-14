
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Using a single instance of createRoot
const root = createRoot(rootElement);

// Rendering with BrowserRouter as the outermost router component
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
