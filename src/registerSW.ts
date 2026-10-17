/**
 * Service Worker Registration for StockFlow PWA
 * Registers /service-worker.js with update checking and offline support
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const doRegister = () => {
    // Register the primary service worker
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[StockFlow PWA] Service Worker registered successfully with scope:', registration.scope);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[StockFlow PWA] New version available! Ready to reload.');
              } else {
                console.log('[StockFlow PWA] Content is cached for offline use.');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[StockFlow PWA] Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    doRegister();
  } else {
    window.addEventListener('load', doRegister);
  }
}
