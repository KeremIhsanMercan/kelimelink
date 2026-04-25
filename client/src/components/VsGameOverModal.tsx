import { Trophy, Search, RefreshCw } from 'lucide-react';
import type { WinnerInfo } from '../hooks/useVsMode';

interface VsGameOverModalProps {
  winnerInfo: WinnerInfo;
  onClose: () => void;
  onViewWinnerBoard: () => void;
  isHost: boolean;
  onNewGame: () => void;
}

export default function VsGameOverModal({ winnerInfo, onClose, onViewWinnerBoard, isHost, onNewGame }: VsGameOverModalProps) {
  return (
    <div className="win-overlay" style={{ zIndex: 1000 }}>
      <div className="win-banner" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-word-both-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Trophy size={32} />
          </div>
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Oyun Bitti!</h2>
        
        <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          <strong style={{ color: 'var(--color-success)', fontSize: '22px' }}>{winnerInfo.username}</strong> oyunu <strong>{winnerInfo.guesses}</strong> tahminde bitirdi!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={onViewWinnerBoard}
            style={{ fontFamily: 'inherit', padding: '14px', background: '#4f46e5', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
          >
            <Search size={18} />
            Kazananın Tahtasını İncele
          </button>

          {isHost && (
            <button 
              onClick={onNewGame}
              style={{ fontFamily: 'inherit', padding: '14px', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
            >
              <RefreshCw size={18} />
              Yeni Oyun Başlat
            </button>
          )}
          
          <button 
            onClick={onClose}
            style={{ fontFamily: 'inherit', padding: '14px', background: 'transparent', color: 'var(--color-text-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
