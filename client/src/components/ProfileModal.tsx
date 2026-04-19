import type { PlayerStats } from '../hooks/useLocalStorage';

interface ProfileModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export default function ProfileModal({ stats, onClose }: ProfileModalProps) {
  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  // Build sorted guess distribution entries
  const distribution = stats.guessDistribution || {};
  const entries = Object.entries(distribution)
    .map(([k, v]) => ({ guessCount: Number(k), count: v }))
    .sort((a, b) => a.guessCount - b.guessCount);

  const maxCount = entries.length > 0 ? Math.max(...entries.map((e) => e.count)) : 0;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="profile-modal__close-x" onClick={onClose} aria-label="Kapat">
          ✕
        </button>

        {/* Header */}
        <div className="profile-modal__header">
          <div className="profile-modal__avatar">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </div>
          <h2 className="profile-modal__title">İstatistikler</h2>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-card__value">{stats.gamesPlayed}</div>
            <div className="profile-stat-card__label">Oyun</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-card__value">{winRate}%</div>
            <div className="profile-stat-card__label">Kazanma</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-card__value">{stats.currentStreak}</div>
            <div className="profile-stat-card__label">Güncel Seri</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-card__value">{stats.maxStreak}</div>
            <div className="profile-stat-card__label">En İyi Seri</div>
          </div>
        </div>

        {/* Guess Distribution */}
        <div className="profile-distribution">
          <h3 className="profile-distribution__title">Tahmin Dağılımı</h3>
          {entries.length > 0 ? (
            <div className="profile-distribution__chart">
              {entries.map(({ guessCount, count }) => {
                const widthPct = maxCount > 0 ? Math.max((count / maxCount) * 100, 8) : 8;
                return (
                  <div className="profile-dist-row" key={guessCount}>
                    <span className="profile-dist-row__label">{guessCount}</span>
                    <div className="profile-dist-row__bar-track">
                      <div
                        className="profile-dist-row__bar"
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="profile-dist-row__count">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="profile-distribution__empty">
              Henüz kazanılan oyun yok. İlk bulmacayı çözün!
            </p>
          )}
        </div>

        <button className="profile-modal__close-btn" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}
