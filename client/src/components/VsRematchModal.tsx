import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface VsRematchModalProps {
  onClose: () => void;
  onRestart: (wordA: string, wordB: string) => void;
  vsError: string | null;
  onClearVsError: () => void;
  isLoading: boolean;
}

export default function VsRematchModal({ onClose, onRestart, vsError, onClearVsError, isLoading }: VsRematchModalProps) {
  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');

  const handleRestart = () => {
    onRestart(wordA, wordB);
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal__close-x" onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        <div className="profile-modal__header">
          <div className="profile-modal__avatar profile-modal__avatar--success">
            <RefreshCw size={28} strokeWidth={2} />
          </div>
          <h2 className="profile-modal__title">Yeni Oyun Başlat</h2>
        </div>

        <div className="profile-modal__content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
              Yeni oyun için kelimeleri belirleyin veya boş bırakın.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Başlangıç Kelimesi</label>
              <input
                type="text"
                value={wordA}
                onChange={(e) => { setWordA(e.target.value); onClearVsError(); }}
                placeholder="Rastgele gelmesi için boş bırakınız..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Hedef Kelime</label>
              <input
                type="text"
                value={wordB}
                onChange={(e) => { setWordB(e.target.value); onClearVsError(); }}
                placeholder="Rastgele gelmesi için boş bırakınız..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            {vsError && <div style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>{vsError}</div>}
            <button
              onClick={handleRestart}
              disabled={isLoading}
              className="vs-btn vs-btn--success"
              style={{ marginTop: '4px' }}
            >
              {isLoading ? (
                <div className="loading-spinner loading-spinner--small" />
              ) : (
                <>
                  <RefreshCw size={18} />
                  Oyunu Başlat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
