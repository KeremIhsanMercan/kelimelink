import { useState, useEffect } from 'react';

/**
 * Returns true only after the component has mounted on the client.
 * This ensures that the initial SSR/prerender matches the first client render,
 * avoiding React hydration mismatches.
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Prevent hydration if this is the prerenderer (Puppeteer)
    const isPrerenderer = navigator.userAgent.includes('HeadlessChrome') || 
                          (window as any).__PRERENDER_INJECTED !== undefined;
    
    if (!isPrerenderer) {
      setIsHydrated(true);
    }
  }, []);

  return isHydrated;
}
