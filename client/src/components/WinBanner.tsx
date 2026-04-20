import type { PlayerStats, PracticeStats } from '../hooks/useLocalStorage';
import type { GameMode } from '../hooks/useGameState';
import AdUnit from './AdUnit';
import { computeAverageFromDistribution } from '../utils/stats';
import { Trophy } from 'lucide-react';

interface WinBannerProps {
  guessCount: number;
  stats?: PlayerStats;
  practiceStats?: PracticeStats;
  gameMode: GameMode;
  onClose: () => void;
  onNewPractice?: () => void;
}

export default function WinBanner({ guessCount, stats, practiceStats, gameMode, onClose, onNewPractice }: WinBannerProps) {
  const isPractice = gameMode === 'practice';
  const practiceAverage = practiceStats
    ? computeAverageFromDistribution(practiceStats.guessDistribution).toFixed(1)
    : '0';

  return (
    <div className="win-overlay" onClick={onClose}>
      <div className="win-banner" onClick={(e) => e.stopPropagation()}>
        <div className="win-banner__emoji"><Trophy size={48} /></div>
        <h2 className="win-banner__title">Tebrikler!</h2>
        <p className="win-banner__subtitle">
          İki kelimeyi <strong>{guessCount} tahmin</strong> ile birbirine
          bağladınız!
        </p>
        <div className="win-banner__stats">
          {isPractice && practiceStats ? (
            <>
              <div className="win-stat">
                <div className="win-stat__value">{practiceStats.gamesWon}</div>
                <div className="win-stat__label">Pratik Kazanılan</div>
              </div>
              <div className="win-stat">
                <div className="win-stat__value">
                  {practiceStats.gamesWon > 0 ? practiceAverage : 0}
                </div>
                <div className="win-stat__label">Ortalama Tahmin</div>
              </div>
            </>
          ) : stats ? (
            <>
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
            </>
          ) : null}
        </div>

        {/* Win Banner Ad */}
        <div className="win-banner-ad">
          <AdUnit
            slotId="9301472260"
            format="horizontal"
            responsive={true}
            style={{ minHeight: '90px' }}
          />
        </div>

        <div className="win-banner__actions">
          {isPractice && onNewPractice && (
            <button className="win-banner__new-game" onClick={onNewPractice}>
              Yeni Pratik Oyun
            </button>
          )}
          <button className="win-banner__close" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
