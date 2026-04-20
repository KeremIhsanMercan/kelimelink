import { useEffect } from 'react';

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
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [slotId]);

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
