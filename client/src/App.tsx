import { useState, useEffect } from 'react';
import { Swords, Calendar, RefreshCw, BarChart3, Moon, Sun, Info } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { useDarkMode } from './hooks/useDarkMode';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import WinBanner from './components/WinBanner';
import ProfileModal from './components/ProfileModal';
import InfoModal from './components/InfoModal';
import AdUnit from './components/AdUnit';
import './index.css';

export default function App() {
  const {
    isLoading,
    error,
    wordA,
    wordB,
    nodes,
    links,
    guessCount,
    isSolved,
    showWinBanner,
    selectedNode,
    selectedNodeSimilarities,
    isGuessing,
    stats,
    practiceStats,
    gameMode,
    addWord,
    selectNode,
    closeWinBanner,
    getShortestPath,
    winAnimationPhase,
    winShortestPath,
    preWinChainSides,
    finishWinAnimation,
    switchToDaily,
    switchToPractice,
    startNewPracticeGame,
    nextPuzzleAt,
    serverOffset,
  } = useGameState();


  const { isDark, toggleDarkMode } = useDarkMode();
  const [showProfile, setShowProfile] = useState(false);
  const [showInfo, setShowInfo] = useState(() => {
    const hasVisited = localStorage.getItem('kelimelink_visited');
    if (!hasVisited) {
      localStorage.setItem('kelimelink_visited', 'true');
      return true;
    }
    return false;
  });

  // Reset scroll position to top on mount and whenever game state changes.
  // This prevents the header from being pushed off-screen by mobile browser behavior
  // during input focus and keyboard events.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  }, [isSolved, error]);

  // Also handle window resize (keyboard pop up/down) to ensure we're at the top
  useEffect(() => {
    const handleResize = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Bulmaca yükleniyor...</p>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="loading-screen">
        <p className="loading-text" style={{ color: '#dc2626' }}>
          {error}
        </p>
      </div>
    );
  }

  const shortestPath = isSolved ? getShortestPath() : null;

  // Disable input during the win animation highlighting phase
  const inputDisabled = winAnimationPhase === 'highlighting';

  return (
    <div className="app-layout">
      {/* Üst Başlık */}
      <header className="app-header">
        <div className="app-header__left-actions">
          <button
            className="app-header__action-btn"
            onClick={() => setShowInfo(true)}
            aria-label="Nasıl Oynanır?"
            title="Nasıl Oynanır?"
          >
            <Info size={20} />
          </button>
        </div>
        <img src="/favicon.png" alt="KelimeLink Logo" className="app-header__logo" />
        <h1 className="app-header__title">KelimeLink</h1>
        <span className="app-header__subtitle">Kelime Bağlantı Bulmacası</span>
        <div className="app-header__actions">
          <button
            className="app-header__action-btn"
            onClick={toggleDarkMode}
            aria-label="Karanlık Modu Değiştir"
            title="Karanlık Modu Değiştir"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className={`app-header__action-btn ${gameMode === 'practice' ? 'app-header__action-btn--active' : ''}`}
            onClick={gameMode === 'practice' ? switchToDaily : switchToPractice}
            aria-label={gameMode === 'practice' ? 'Günlük Bulmacaya Dön' : 'Pratik Modu'}
            title={gameMode === 'practice' ? 'Günlük Bulmacaya Dön' : 'Pratik Modu'}
          >
            {gameMode === 'practice' ? (
              <Calendar size={20} />
            ) : (
              <Swords size={20} />
            )}
          </button>
          {gameMode === 'practice' && (
            <button
              className="app-header__action-btn app-header__action-btn--new-game"
              onClick={startNewPracticeGame}
              aria-label="Yeni Pratik Oyun"

              title="Yeni Pratik Oyun"
            >
              <RefreshCw size={20} />
            </button>
          )}
          <button
            className="app-header__action-btn"
            onClick={() => setShowProfile(true)}
            aria-label="Profil ve İstatistikler"
            title="İstatistikler"
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </header>

      {/* Pratik Modu Banner */}
      {gameMode === 'practice' && (
        <div className="practice-banner">
          <Swords size={14} strokeWidth={2.5} />
          Pratik Modu
        </div>
      )}

      {/* Ana İçerik */}
      <main className="app-main">
        <Sidebar
          wordA={wordA}
          wordB={wordB}
          nodeCount={nodes.length}
          guessCount={guessCount}
          isSolved={isSolved || inputDisabled}
          isGuessing={isGuessing}
          error={error}
          selectedNode={selectedNode}
          selectedNodeSimilarities={selectedNodeSimilarities}
          onAddWord={addWord}
          onSelectNode={selectNode}
          gameMode={gameMode}
          nextPuzzleAt={nextPuzzleAt}
          serverOffset={serverOffset}
          onTimerEnd={switchToDaily}
        />
        <GraphCanvas
          nodes={nodes}
          links={links}
          isSolved={isSolved}
          shortestPath={shortestPath}
          selectedNode={selectedNode}
          onNodeClick={selectNode}
          winAnimationPhase={winAnimationPhase}
          winShortestPath={winShortestPath}
          preWinChainSides={preWinChainSides}
          onWinAnimationFinish={finishWinAnimation}
        />
      </main>

      {/* Kazanma Bannerı */}
      {showWinBanner && (
        <WinBanner
          guessCount={guessCount}
          stats={gameMode === 'daily' ? stats : undefined}
          practiceStats={gameMode === 'practice' ? practiceStats : undefined}
          gameMode={gameMode}
          onClose={closeWinBanner}
          onNewPractice={gameMode === 'practice' ? startNewPracticeGame : undefined}

        />
      )}

      {/* Profil/İstatistik Modal */}
      {showProfile && (
        <ProfileModal
          stats={stats}
          practiceStats={practiceStats}
          gameMode={gameMode}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Info Modal */}
      {showInfo && (
        <InfoModal
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* Sticky Bottom Ad */}
      <div className="sticky-bottom-ad">
        <AdUnit
          slotId="5519199413"
          format="horizontal"
          responsive={true}
          style={{ height: '90px' }}
        />
      </div>
    </div>
  );
}
