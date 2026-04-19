import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import WinBanner from './components/WinBanner';
import ProfileModal from './components/ProfileModal';
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
    addWord,
    selectNode,
    closeWinBanner,
    getShortestPath,
    winAnimationPhase,
    winShortestPath,
    preWinChainSides,
    finishWinAnimation,
  } = useGameState();

  const [showProfile, setShowProfile] = useState(false);

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
        <img src="/favicon.png" alt="KelimeLink Logo" className="app-header__logo" />
        <h1 className="app-header__title">KelimeLink</h1>
        <span className="app-header__subtitle">Kelime Bağlantı Bulmacası</span>
        <button
          className="app-header__profile-btn"
          onClick={() => setShowProfile(true)}
          aria-label="Profil ve İstatistikler"
          title="İstatistikler"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 17V13" />
            <path d="M11 17V9" />
            <path d="M15 17V5" />
            <path d="M19 17V11" />
          </svg>
        </button>
      </header>

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
          stats={stats}
          onClose={closeWinBanner}
        />
      )}

      {/* Profil/İstatistik Modal */}
      {showProfile && (
        <ProfileModal
          stats={stats}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
