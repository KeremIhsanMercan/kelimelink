import { useState } from 'react';
import { X, Users, Clipboard } from 'lucide-react';

interface VsModeModalProps {
  onClose: () => void;
  onCreateRoom: (wordA: string, wordB: string) => Promise<void>;
  onJoinRoom: (code: string) => void;
  vsError: string | null;
  onClearVsError: () => void;
  isLoading: boolean;
}

export default function VsModeModal({ onClose, onCreateRoom, onJoinRoom, vsError, onClearVsError, isLoading }: VsModeModalProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreateError(null);
    try {
      await onCreateRoom(wordA, wordB);
    } catch (err: any) {
      setCreateError(err.message);
    }
  };

  const handleTabChange = (t: 'create' | 'join') => {
    setTab(t);
    setCreateError(null);
    onClearVsError();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJoinCode(text.trim().toUpperCase().slice(0, 6));
    } catch {
      // clipboard access denied
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal__close-x" onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        <div className="profile-modal__header">
          <div className="profile-modal__avatar profile-modal__avatar--vs">
            <Users size={28} strokeWidth={2} />
          </div>
          <h2 className="profile-modal__title">VS Modu</h2>
        </div>

        <div className="profile-modal__tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
          <button
            className={`profile-modal__tab ${tab === 'create' ? 'profile-modal__tab--active' : ''}`}
            onClick={() => handleTabChange('create')}
            style={{ fontFamily: 'inherit', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--color-border)', background: tab === 'create' ? 'var(--color-word-both-light)' : 'transparent', cursor: 'pointer', fontWeight: 600, color: tab === 'create' ? 'var(--color-word-both)' : 'var(--color-text-secondary)' }}
          >
            Oda Kur
          </button>
          <button
            className={`profile-modal__tab ${tab === 'join' ? 'profile-modal__tab--active' : ''}`}
            onClick={() => handleTabChange('join')}
            style={{ fontFamily: 'inherit', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--color-border)', background: tab === 'join' ? 'var(--color-word-both-light)' : 'transparent', cursor: 'pointer', fontWeight: 600, color: tab === 'join' ? 'var(--color-word-both)' : 'var(--color-text-secondary)' }}
          >
            Odaya Katıl
          </button>
        </div>

        <div className="profile-modal__content">
          {tab === 'create' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                Kelimeleri belirleyin veya boş bırakarak rastgele seçilmesini sağlayın.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Başlangıç Kelimesi</label>
                <input
                  type="text"
                  value={wordA}
                  onChange={(e) => setWordA(e.target.value)}
                  placeholder="Rastgele gelmesi için boş bırakınız..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Hedef Kelime</label>
                <input
                  type="text"
                  value={wordB}
                  onChange={(e) => setWordB(e.target.value)}
                  placeholder="Rastgele gelmesi için boş bırakınız..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              {createError && <div style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>{createError}</div>}
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="vs-btn vs-btn--primary"
                style={{ marginTop: '4px' }}
              >
                {isLoading ? <div className="loading-spinner loading-spinner--small" /> : 'Oda Oluştur'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                Arkadaşınızın gönderdiği oda kodunu girin.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Oda Kodu</label>
                <div style={{ position: 'relative', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); onClearVsError(); }}
                      maxLength={6}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      style={{ 
                        width: '100%', 
                        padding: '10px var(--vs-code-padding, 44px)', 
                        borderRadius: '8px', 
                        border: `1px solid ${vsError ? '#dc2626' : 'var(--color-border)'}`, 
                        outline: 'none', 
                        fontFamily: 'monospace', 
                        letterSpacing: 'min(1.5vw, 8px)', 
                        textAlign: 'center', 
                        fontSize: 'max(14px, 20px)', 
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                        color: 'transparent',
                        caretColor: '#3b82f6',
                        background: 'transparent',
                        position: 'relative',
                        zIndex: 1,
                      } as React.CSSProperties}
                    />
                  {/* Visual mask overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: 'min(1.5vw, 8px)',
                    fontSize: 'max(14px, 18px)',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    padding: '0 var(--vs-code-padding, 44px)',
                    color: joinCode.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {joinCode.length > 0 ? '●'.repeat(joinCode.length) : '●●●●●●'}
                  </div>
                  <button
                    onClick={handlePaste}
                    title="Yapıştır"
                    style={{ fontFamily: 'inherit', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center', zIndex: 2 }}
                  >
                    <Clipboard size={18} />
                  </button>
                </div>
                {vsError && <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>{vsError}</div>}
              </div>
              <button
                onClick={() => { onClearVsError(); onJoinRoom(joinCode); }}
                disabled={joinCode.length !== 6 || isLoading}
                className="vs-btn vs-btn--success"
                style={{ 
                    marginTop: '4px',
                    background: joinCode.length === 6 ? undefined : '#9ca3af' // Keep grey if not 6 chars
                }}
              >
                {isLoading ? <div className="loading-spinner loading-spinner--small" /> : 'Odaya Katıl'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
