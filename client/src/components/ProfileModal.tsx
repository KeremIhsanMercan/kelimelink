import { useState } from 'react';
import { User, Calendar, Swords, X } from 'lucide-react';
import type { PlayerStats, PracticeStats } from '../hooks/useLocalStorage';
import AdUnit from './AdUnit';
import { computeAverageFromDistribution } from '../utils/stats';

interface ProfileModalProps {
  stats: PlayerStats;
  practiceStats: PracticeStats;
  gameMode: 'daily' | 'practice';
  onClose: () => void;
}

export default function ProfileModal({ stats, practiceStats, gameMode, onClose }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'practice'>(gameMode);

  // Compute daily stats from distribution
  const dailyDistribution = stats.guessDistribution || {};
  const dailyEntries = Object.entries(dailyDistribution)
    .map(([k, v]) => ({ guessCount: Number(k), count: v }))
    .sort((a, b) => a.guessCount - b.guessCount);

  const dailyAvgValue = computeAverageFromDistribution(stats.guessDistribution);
  const dailyAvg = dailyEntries.length > 0 ? dailyAvgValue.toFixed(1) : '—';

  // Compute practice stats from distribution
  const practiceDistribution = practiceStats.guessDistribution || {};
  const practiceEntries = Object.entries(practiceDistribution)
    .map(([k, v]) => ({ guessCount: Number(k), count: v }))
    .sort((a, b) => a.guessCount - b.guessCount);

  const practiceAvgValue = computeAverageFromDistribution(practiceStats.guessDistribution);
  const practiceAvg = practiceEntries.length > 0 ? practiceAvgValue.toFixed(1) : '—';

  const isDailyTab = activeTab === 'daily';
  const currentEntries = isDailyTab ? dailyEntries : practiceEntries;
  const maxCount = currentEntries.length > 0 ? Math.max(...currentEntries.map((e) => e.count)) : 0;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="modal-ad-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Left Ad */}
        <div className="modal-ad-side modal-ad-side--left">
          <AdUnit
            slotId="2380840697"
            format="vertical"
            style={{ width: '160px', height: '600px' }}
          />
        </div>

        <div className="profile-modal">
          {/* Close button */}
          <button className="profile-modal__close-x" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="profile-modal__header">
            <div className="profile-modal__avatar">
              <User size={36} strokeWidth={1.5} />
            </div>
            <h2 className="profile-modal__title">İstatistikler</h2>
          </div>

          {/* Tab Switcher */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'daily' ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              <Calendar size={14} />
              Günlük
            </button>
            <button
              className={`profile-tab ${activeTab === 'practice' ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <Swords size={14} />
              Pratik
            </button>
          </div>

          {/* Stats Grid */}
          {isDailyTab ? (
            <div className="profile-stats-grid profile-stats-grid--daily">
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{stats.gamesPlayed}</div>
                <div className="profile-stat-card__label">Oyun</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{dailyAvg}</div>
                <div className="profile-stat-card__label">Ortalama</div>
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
          ) : (
            <div className="profile-stats-grid profile-stats-grid--practice">
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{practiceStats.gamesPlayed}</div>
                <div className="profile-stat-card__label">Oyun</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{practiceAvg}</div>
                <div className="profile-stat-card__label">Ortalama</div>
              </div>
            </div>
          )}

          {/* Guess Distribution */}
          <div className="profile-distribution">
            <h3 className="profile-distribution__title">Tahmin Dağılımı</h3>
            {currentEntries.length > 0 ? (
              <div className="profile-distribution__chart">
                {currentEntries.map(({ guessCount, count }) => {
                  const widthPct = maxCount > 0 ? Math.max((count / maxCount) * 100, 8) : 8;
                  return (
                    <div className="profile-dist-row" key={guessCount}>
                      <span className="profile-dist-row__label">{guessCount}</span>
                      <div className="profile-dist-row__bar-track">
                        <div
                          className={`profile-dist-row__bar ${!isDailyTab ? 'profile-dist-row__bar--practice' : ''}`}
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
                {isDailyTab
                  ? 'Henüz kazanılan oyun yok. İlk bulmacayı çözün!'
                  : 'Henüz pratik oyun kazanılmadı. Hemen deneyin!'}
              </p>
            )}
          </div>

          <button className="profile-modal__close-btn" onClick={onClose}>
            Kapat
          </button>
        </div>

        {/* Right Ad */}
        <div className="modal-ad-side modal-ad-side--right">
          <AdUnit
            slotId="2772570390"
            format="vertical"
            style={{ width: '160px', height: '600px' }}
          />
        </div>
      </div>
    </div>
  );
}
