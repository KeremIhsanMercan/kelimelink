import type { PlayerStats } from '../hooks/useLocalStorage';

interface WinBannerProps {
  guessCount: number;
  stats: PlayerStats;
  onClose: () => void;
}

export default function WinBanner({ guessCount, stats, onClose }: WinBannerProps) {
  return (
    <div className="win-overlay" onClick={onClose}>
      <div className="win-banner" onClick={(e) => e.stopPropagation()}>
        <div className="win-banner__emoji">🎉</div>
        <h2 className="win-banner__title">Tebrikler!</h2>
        <p className="win-banner__subtitle">
          İki kelimeyi <strong>{guessCount} tahmin</strong> ile birbirine
          bağladınız!
        </p>
        <div className="win-banner__stats">
          <div className="win-stat">
            <div className="win-stat__value">{stats.gamesWon}</div>
            <div className="win-stat__label">Kazanılan</div>
          </div>
          <div className="win-stat">
            <div className="win-stat__value">{stats.currentStreak}</div>
            <div className="win-stat__label">Seri</div>
          </div>
          <div className="win-stat">
            <div className="win-stat__value">{stats.maxStreak}</div>
            <div className="win-stat__label">En İyi Seri</div>
          </div>
        </div>
        <button className="win-banner__close" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}
