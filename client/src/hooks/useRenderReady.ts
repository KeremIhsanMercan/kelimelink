import { useEffect } from 'react';

/**
 * Dispatches a 'render-ready' event for the pre-renderer.
 * By using requestAnimationFrame + setTimeout, we ensure that React Router
 * has finished routing and the browser has actually painted the DOM elements
 * before we tell Puppeteer to capture the snapshot.
 */
export function useRenderReady(isReady: boolean = true) {
  useEffect(() => {
    if (isReady) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.dispatchEvent(new Event('render-ready'));
        }, 100);
      });
    }
  }, [isReady]);
}
