import { useState } from 'react';
import { X, Users, Copy, Check, Play } from 'lucide-react';

interface VsRoomModalProps {
  roomCode: string;
  wordA: string | null;
  wordB: string | null;
  players: string[];
  isHost: boolean;
  status: 'waiting' | 'finished';
  onStartGame: () => void;
  onLeave: () => void;
  isLoading: boolean;
}

export default function VsRoomModal({ roomCode, wordA, wordB, players, isHost, status, onStartGame, onLeave, isLoading }: VsRoomModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFinished = status === 'finished';

  return (
    <div className="profile-overlay" onClick={onLeave}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal__close-x" onClick={onLeave} aria-label="Ayrıl">
          <X size={18} />
        </button>

        <div className="profile-modal__header">
          <div className="profile-modal__avatar profile-modal__avatar--vs">
            <Users size={28} strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="profile-modal__title" style={{ marginBottom: 0, color: 'var(--color-text-primary)' }}>
              Oda: {isHost ? roomCode : '••••••'}
            </h2>
            {isHost && (
              <button
                onClick={handleCopy}
                style={{ fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: copied ? 'var(--color-success)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '4px 0', borderRadius: '4px' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Kopyalandı' : 'Kodu Kopyala'}
              </button>
            )}
          </div>
        </div>

        <div className="profile-modal__content" style={{ marginTop: '16px' }}>
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              {isFinished ? 'Biten Oyun' : 'Hedef'}
            </p>
            <p style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              {wordA && wordB ? `${wordA} ⟷ ${wordB}` : 'Rastgele Kelimeler'}
            </p>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Katılımcılar ({players.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            {players.map((p, i) => (
              <li key={i} style={{ padding: '10px 12px', borderBottom: i < players.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{p}</span>
                {i === 0 && <span style={{ fontSize: '10px', background: 'var(--color-word-both)', color: 'white', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto', fontWeight: 700 }}>Kurucu</span>}
              </li>
            ))}
          </ul>

          {isFinished && isHost ? (
            <div style={{ marginTop: '24px', padding: '12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
                Oyun sona erdi. Yeni bir oyun başlatmak için üstteki "Yeni Oyun" butonunu kullanın.
              </p>
            </div>
          ) : isFinished && !isHost ? (
            <div style={{ marginTop: '24px', padding: '12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
                Oyun kurucusunun yeni kelimeleri belirlemesini bekleyin.
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={onStartGame}
                disabled={players.length < 2 || !isHost || isLoading}
                className="vs-btn vs-btn--purple"
                style={{ 
                    marginTop: '24px', 
                    fontSize: '16px', 
                    padding: '14px',
                    background: (!isHost || players.length < 2) ? 'var(--color-text-muted)' : undefined,
                    boxShadow: '0 4px 6px -1px rgba(165, 121, 241, 0.2)',
                    opacity: isLoading ? 0.8 : 1
                }}
              >
                {isLoading ? (
                  <div className="loading-spinner loading-spinner--small" />
                ) : (
                  <>
                    <Play size={18} fill="white" />
                    Oyunu Başlat
                  </>
                )}
              </button>
              {!isHost ? (
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '8px' }}>Sadece kurucu başlatabilir</p>
              ) : players.length < 2 && (
                <p style={{ fontSize: '11px', color: '#dc2626', textAlign: 'center', marginTop: '8px' }}>Başlatmak için en az 2 oyuncu gerekiyor</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
