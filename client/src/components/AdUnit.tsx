import { useEffect } from 'react';

/**
 * AdSense approval guard.
 * Set this to `true` only AFTER Google AdSense has approved the site.
 * While `false`, no ad scripts will load and no ad containers will render,
 * preventing "ads on screens without publisher content" violations.
 */
const ADSENSE_APPROVED = false;

interface AdUnitProps {
  publisherId?: string;
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdUnit({
  publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID,
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: AdUnitProps) {
  useEffect(() => {
    if (!ADSENSE_APPROVED) return;

    // Dinamik olarak script'i yükle
    if (publisherId && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [slotId, publisherId]);

  // Don't render anything until approval is granted
  if (!ADSENSE_APPROVED) return null;

  return (
    <div className={`ad-container ${className}`} style={{ minHeight: '100px', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
