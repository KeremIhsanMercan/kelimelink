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
      let fired = false;
      const fire = () => {
        if (fired) return;
        fired = true;
        setTimeout(() => {
          document.dispatchEvent(new Event('render-ready'));
        }, 100);
      };

      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(fire);
      }
      // Guarantee it fires even if requestAnimationFrame is stuck (e.g. in JSDOM)
      setTimeout(fire, 500);
    }
  }, [isReady]);
}
