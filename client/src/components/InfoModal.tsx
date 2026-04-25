import { Info, X, Sparkles, User, Link2, Palette, ArrowLeft, Users } from 'lucide-react';
import { useState } from 'react';

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const [showNewFeatures, setShowNewFeatures] = useState(false);
  const [hasClickedFeatures, setHasClickedFeatures] = useState(() => {
    return localStorage.getItem('kelimelink_clicked_features_v2') === 'true';
  });

  const handleFeaturesClick = () => {
    setShowNewFeatures(true);
    if (!hasClickedFeatures) {
      setHasClickedFeatures(true);
      localStorage.setItem('kelimelink_clicked_features_v2', 'true');
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="profile-modal__close-x" onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="profile-modal__header">
          <div className="profile-modal__avatar">
            {showNewFeatures ? <Sparkles size={28} strokeWidth={2} /> : <Info size={28} strokeWidth={2} />}
          </div>
          <h2 className="profile-modal__title">{showNewFeatures ? "Yenilikler" : "Nasıl Oynanır?"}</h2>
        </div>

        <div className="info-modal__content">
          {showNewFeatures ? (
            <div className="new-features-list">
              <ul>
                <li>
                  <div className="new-feature-icon"><User size={20} /></div>
                  <div className="new-feature-content">
                    <h4>Kullanıcı Adı ve Liderlik</h4>
                    <p>Kendinize bir kullanıcı adı belirleyin ve en az tahminle günlük bulmacayı çözerek liderlik tablosuna adınızı yazdırın!</p>
                  </div>
                </li>
                <li>
                  <div className="new-feature-icon"><Link2 size={20} /></div>
                  <div className="new-feature-content">
                    <h4>Hatalı/Eksik Bağlantı Bildirimi</h4>
                    <p>Beklediğiniz gibi çalışmayan kelime bağlantılarını veya eksik eşleşmeleri bize daha kolay raporlayabilirsiniz.</p>
                  </div>
                </li>
                <li>
                  <div className="new-feature-icon"><Palette size={20} /></div>
                  <div className="new-feature-content">
                    <h4>Renklendirilmiş Listeler</h4>
                    <p>Yan paneldeki kelimeler, eklendikleri düğümün rengini (mavi, kırmızı, gri) alarak ağ yapısını çok daha iyi anlamanızı sağlar.</p>
                  </div>
                </li>
                <li>
                  <div className="new-feature-icon"><Users size={20} /></div>
                  <div className="new-feature-content">
                    <h4>Yeni Oyun Modu: VS</h4>
                    <p>Oda kur, arkadaşlarını davet et ve en hızlı kim bağlayacak gör!</p>
                  </div>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <p className="info-modal__description">
                <strong>KelimeLink</strong>, iki farklı kelimeyi birbirine en az tahminle bağlamaya çalıştığınız bir kelime ilişkilendirme oyunudur.
              </p>

              <div className="info-modal__rules">
                <div className="info-modal__rule">
                  <div className="info-modal__rule-number">1</div>
                  <p>Oyun size <strong>başlangıç</strong> ve <strong>hedef</strong> olmak üzere iki kelime verir.</p>
                </div>
                <div className="info-modal__rule">
                  <div className="info-modal__rule-number">2</div>
                  <p>Kelime tahmin ederek bu iki kelime arasında anlamsal köprüler kurmaya çalışın.</p>
                </div>
                <div className="info-modal__rule">
                  <div className="info-modal__rule-number">3</div>
                  <p>Yazdığınız kelimeler yapay zeka tarafından değerlendirilir ve eğer oyun kelimeleriyle ilişkiliyse ağa eklenir.</p>
                </div>
                <div className="info-modal__rule">
                  <div className="info-modal__rule-number">4</div>
                  <p>Başlangıç ve hedef kelimelerini birbirine bağladığınızda <strong>oyunu kazanırsınız!</strong></p>
                </div>
              </div>

              <button
                className={`info-modal__features-btn ${!hasClickedFeatures ? 'has-glow' : ''}`}
                onClick={handleFeaturesClick}
              >
                <Sparkles size={18} />
                Yeni Eklenen Özellikler
              </button>
            </>
          )}
        </div>

        <button className="profile-modal__close-btn" onClick={showNewFeatures ? () => setShowNewFeatures(false) : onClose}>
          {showNewFeatures ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ArrowLeft size={18} /> Geri Dön
            </span>
          ) : "Oyuna Başla"}
        </button>

        {!showNewFeatures && (
          <div className="info-modal__footer">
            Linxicon ve Numberbatch'e teşekkürler. <br></br>
            Öneri ve şikayetler için:
            <br></br>
            <a href="mailto:krmhsnmrcn220@gmail.com">krmhsnmrcn220@gmail.com</a>
          </div>
        )}

      </div>
    </div>
  );
}
