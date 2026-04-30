import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('kelimelink_cookie_consent');
    if (!consent) {
      setShow(true);
    }
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
