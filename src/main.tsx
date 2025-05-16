
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { initEntitlementsCache } from './lib/entitlements/init';

// Get the root element and create a React root
const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found. Make sure there is an element with id 'root' in your HTML file.")
}

// Create a client
const queryClient = new QueryClient();

// Initialize the entitlements caching system
initEntitlementsCache();

// Create root and render the app
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
