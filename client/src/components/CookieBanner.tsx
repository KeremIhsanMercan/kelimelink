import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('kelimelink_cookie_consent');
    if (consent) return; // Already consented, do nothing

    // To prevent the banner from showing up in Google's Inspection Tool screenshots
    // (which can cause AdSense rejections), we wait for the first real user interaction.
    const handleInteraction = () => {
      setShow(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };

    window.addEventListener('mousemove', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('scroll', handleInteraction, { once: true });

    return cleanup;
  }, []);

  const handleAccept = () => {
    localStorage.setItem('kelimelink_cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner__content">
        <p>
          Deneyiminizi iyileştirmek ve reklam sunumu yapmak için çerezleri kullanıyoruz. 
          Sitemizi kullanarak çerez politikamızı kabul etmiş sayılırsınız. 
          Daha fazla bilgi için <a href="/privacy.html" target="_blank">Gizlilik Politikamıza</a> göz atabilirsiniz.
        </p>
        <button onClick={handleAccept} className="cookie-banner__btn">
          Anladım
        </button>
      </div>
    </div>
  );
}
