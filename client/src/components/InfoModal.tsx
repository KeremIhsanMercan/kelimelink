import { Info, X } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
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
            <Info size={28} strokeWidth={2} />
          </div>
          <h2 className="profile-modal__title">Nasıl Oynanır?</h2>
        </div>

        <div className="info-modal__content">
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
        </div>

        <button className="profile-modal__close-btn" onClick={onClose}>
          Oyuna Başla
        </button>
      </div>
    </div>
  );
}
