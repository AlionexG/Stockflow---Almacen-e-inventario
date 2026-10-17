// Polyfill window.fetch setter to prevent Chrome extension errors
try {
  let currFetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get() {
      return currFetch;
    },
    set(newF) {
      currFetch = newF;
    },
    configurable: true,
    enumerable: true,
  });
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerSW';

// Register PWA service worker for robust offline caching
registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
