import { useState, useEffect } from 'react';
import { X, Flame, Trophy, Star, Loader, Info } from 'lucide-react';
import { fetchLeaderboard, type LeaderboardData } from '../services/api';

interface LeaderboardModalProps {
  onClose: () => void;
}

type LeaderboardTab = 'streaks' | 'champions' | 'total_wins';

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4.', '5.'];
const RANK_CLASSES = ['leaderboard-item--gold', 'leaderboard-item--silver', 'leaderboard-item--bronze', '', ''];

const TAB_CONFIG: { key: LeaderboardTab; icon: typeof Flame; label: string; suffix: string }[] = [
  { key: 'streaks', icon: Flame, label: 'En Uzun Seri', suffix: 'gün' },
  { key: 'champions', icon: Trophy, label: 'Gün Şampiyonları', suffix: 'kez' },
  { key: 'total_wins', icon: Star, label: 'En Çok Kazanan', suffix: 'puan' },
];

export default function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('streaks');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchLeaderboard()
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Liderlik tablosu yüklenemedi.');
        setIsLoading(false);
      });
  }, []);

  const currentConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;
  const currentList = data ? data[activeTab] : [];

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="profile-modal__close-x" onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="profile-modal__header">
          <div className="profile-modal__avatar leaderboard-modal__avatar">
            <Trophy size={28} strokeWidth={1.5} />
          </div>
          <h2 className="profile-modal__title">Başarı Listesi</h2>
        </div>

        {/* Tab Switcher */}
        <div className="profile-tabs">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              className={`profile-tab ${activeTab === tab.key ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="leaderboard-content">
          {isLoading ? (
            <div className="leaderboard-loading">
              <Loader size={24} className="leaderboard-spinner" />
              <span>Yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="leaderboard-empty">{error}</div>
          ) : currentList.length === 0 ? (
            <div className="leaderboard-empty">
              Henüz kayıtlı oyuncu yok. İlk sen ol! 🎯
            </div>
          ) : (
            <div className="leaderboard-list">
              {currentList.map((entry, index) => (
                <div
                  key={`${entry.username}-${index}`}
                  className={`leaderboard-item ${RANK_CLASSES[index] || ''}`}
                >
                  <span className="leaderboard-item__rank">{RANK_EMOJIS[index]}</span>
                  <span className="leaderboard-item__name">{entry.username}</span>
                  <span className="leaderboard-item__value">
                    {entry.value} <span className="leaderboard-item__suffix">{currentConfig.suffix}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Text */}
        <div className="leaderboard-note">
          <Info size={14} />
          <p>
            Listeye girebilecek puana sahipseniz, skorunuzun buraya yansıması için yeni bir bulmaca çözerek kaydetmeniz gerekir.
          </p>
        </div>

        <button className="profile-modal__close-btn" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}
