import { useState, useEffect } from 'react';
import { Swords, Calendar, RefreshCw, BarChart3, Moon, Sun, Info, Users } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { useDarkMode } from './hooks/useDarkMode';
import { useVsMode } from './hooks/useVsMode';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import WinBanner from './components/WinBanner';
import ProfileModal from './components/ProfileModal';
import InfoModal from './components/InfoModal';
import UsernameBadge from './components/UsernameBadge';
import AdUnit from './components/AdUnit';
import VsModeModal from './components/VsModeModal';
import VsRoomModal from './components/VsRoomModal';
import VsGameOverModal from './components/VsGameOverModal';
import VsRematchModal from './components/VsRematchModal';
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
    vsStats,
    recordVsGame,
    username,
    setUsername,
    dailyRecordHolder,
    startVsGame,
    resetVsGame,
    loadBoard,
  } = useGameState();

  const vsMode = useVsMode(username);
  const [showVsModal, setShowVsModal] = useState(false);
  const [showVsGameOverModal, setShowVsGameOverModal] = useState(false);
  const [showVsRematchModal, setShowVsRematchModal] = useState(false);
  const [hasSeenGameOver, setHasSeenGameOver] = useState(false);


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

  const [hasClickedInfo, setHasClickedInfo] = useState(() => {
    return localStorage.getItem('kelimelink_clicked_info_v2') === 'true';
  });

  const handleInfoClick = () => {
    setShowInfo(true);
    if (!hasClickedInfo) {
      setHasClickedInfo(true);
      localStorage.setItem('kelimelink_clicked_info_v2', 'true');
    }
  };

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

  const shortestPath = isSolved ? getShortestPath() : null;

  // Sync VsMode logic
  useEffect(() => {
    if (vsMode.status === 'playing' && vsMode.wordA && vsMode.wordB) {
      // If we are transitioning to playing, we must ensure startVsGame is called
      // even if we are already in 'vs' gameMode (rematch case)
      startVsGame(vsMode.wordA, vsMode.wordB);
      setShowVsModal(false);
      setShowVsRematchModal(false);
      setShowVsGameOverModal(false);
      setHasSeenGameOver(false);
    }
  }, [vsMode.status, vsMode.wordA, vsMode.wordB, startVsGame]);

  useEffect(() => {
    if (vsMode.status === 'waiting' && gameMode === 'vs') {
      setShowVsGameOverModal(false);
      setShowVsRematchModal(false);
      setHasSeenGameOver(false);
      resetVsGame();
    }
  }, [vsMode.status, gameMode, resetVsGame]);

  useEffect(() => {
    if (vsMode.status === 'finished' && !hasSeenGameOver && gameMode === 'vs') {
      const didWin = vsMode.winnerInfo?.username === username;
      recordVsGame(didWin, didWin ? vsMode.winnerInfo?.guesses : undefined);
      
      if (vsMode.winnerInfo?.username !== username) {
        setShowVsGameOverModal(true);
      }
      setHasSeenGameOver(true);
    }
  }, [vsMode.status, gameMode, hasSeenGameOver, vsMode.winnerInfo, username, recordVsGame]);

  useEffect(() => {
    if (gameMode === 'vs' && isSolved && vsMode.status === 'playing') {
      vsMode.sendSolved(guessCount, shortestPath || [], nodes, links);
    }
  }, [isSolved, gameMode, vsMode, guessCount, shortestPath, nodes, links]);

  // Load winner board manually
  const loadWinnerBoard = () => {
    if (vsMode.winnerInfo) {
      loadBoard(vsMode.winnerInfo.nodes, vsMode.winnerInfo.links, true, vsMode.winnerInfo.guesses);
      setShowVsGameOverModal(false);
    }
  };

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

  // Disable input during the win animation highlighting phase
  const inputDisabled = winAnimationPhase === 'highlighting';

  return (
    <div className="app-layout">
      {/* Üst Başlık */}
      <header className="app-header">
        <div className="app-header__left-actions">
          <button
            className={`app-header__action-btn ${!hasClickedInfo ? 'has-glow' : ''}`}
            onClick={handleInfoClick}
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
          <UsernameBadge username={username} onUsernameChange={setUsername} />
          <button
            className="app-header__action-btn"
            onClick={toggleDarkMode}
            aria-label="Karanlık Modu Değiştir"
            title="Karanlık Modu Değiştir"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className={`app-header__action-btn ${vsMode.status !== 'disconnected' ? 'app-header__action-btn--active' : ''} ${vsMode.status === 'finished' && vsMode.players[0] === username ? 'app-header__action-btn--text' : ''}`}
            onClick={() => {
              if (vsMode.status === 'disconnected') {
                setShowVsModal(true);
              } else if ((vsMode.status === 'finished' || vsMode.status === 'waiting') && vsMode.players[0] === username) {
                setShowVsRematchModal(true);
              }
            }}
            aria-label="VS Modu"
            title="VS Modu"
          >
            {(vsMode.status === 'finished' || vsMode.status === 'waiting') && vsMode.players[0] === username ? (
              <>
                <Users size={20} className="app-header__action-btn-icon--mobile" />
                <span className="app-header__action-btn-text--desktop" style={{ fontSize: '12px', fontFamily: 'Arial', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '0 2px' }}>
                  {vsMode.status === 'waiting' ? 'Kelimeler' : 'Yeni Oyun'}
                </span>
              </>
            ) : (
              <Users size={20} />
            )}
          </button>
          <button
            className={`app-header__action-btn ${gameMode === 'practice' ? 'app-header__action-btn--active' : ''}`}
            onClick={() => {
              if (gameMode === 'practice') {
                switchToDaily();
              } else {
                // Leave vs room if in vs mode, then start practice
                if (gameMode === 'vs') vsMode.leaveRoom();
                switchToPractice();
              }
            }}
            aria-label={gameMode === 'practice' ? 'Günlük Bulmacaya Dön' : 'Pratik Modu'}
            title={gameMode === 'practice' ? 'Günlük Bulmacaya Dön' : 'Pratik Modu'}
          >
            {gameMode === 'practice' ? (
              <Calendar size={20} />
            ) : (
              <Swords size={20} />
            )}
          </button>
          {(gameMode === 'practice') && (
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
          nodes={nodes}
          shortestPath={shortestPath}
          nodeCount={nodes.length}
          guessCount={guessCount}
          isSolved={isSolved || inputDisabled || (gameMode === 'vs' && vsMode.status === 'finished')}
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
          dailyRecordHolder={dailyRecordHolder}
          username={username}
          vsWinnerUsername={gameMode === 'vs' && vsMode.status === 'finished' ? (vsMode.winnerInfo?.username ?? null) : null}
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

      {/* Kazanma Bannerı - vs modunda sadece kazanan için göster */}
      {showWinBanner && !(gameMode === 'vs' && vsMode.winnerInfo?.username !== username) && (
        <WinBanner
          guessCount={guessCount}
          stats={gameMode === 'daily' ? stats : undefined}
          practiceStats={gameMode === 'practice' ? practiceStats : undefined}
          gameMode={gameMode}
          onClose={closeWinBanner}
          onNewPractice={gameMode === 'practice' ? startNewPracticeGame : undefined}
          isVsHost={gameMode === 'vs' && vsMode.players[0] === username}
          onNewVsGame={() => setShowVsRematchModal(true)}
        />
      )}

      {/* Profil/İstatistik Modal */}
      {showProfile && (
        <ProfileModal
          stats={stats}
          practiceStats={practiceStats}
          vsStats={vsStats}
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

      {/* VS Modals */}
      {showVsModal && vsMode.status === 'disconnected' && (
        <VsModeModal
          onClose={() => { vsMode.clearError(); setShowVsModal(false); }}
          onCreateRoom={(a, b) => vsMode.createRoom(a, b)}
          onJoinRoom={(code) => vsMode.joinRoom(code)}
          vsError={vsMode.error}
          onClearVsError={vsMode.clearError}
        />
      )}

      {(vsMode.status === 'waiting' || (vsMode.status === 'finished' && !isSolved)) && vsMode.roomCode && (
        <VsRoomModal
          roomCode={vsMode.roomCode}
          wordA={vsMode.wordA}
          wordB={vsMode.wordB}
          players={vsMode.players}
          isHost={vsMode.players[0] === username}
          status={vsMode.status as 'waiting' | 'finished'}
          onStartGame={vsMode.startGame}
          onLeave={vsMode.leaveRoom}
        />
      )}

      {showVsGameOverModal && vsMode.winnerInfo && (
        <VsGameOverModal
          winnerInfo={vsMode.winnerInfo}
          onClose={() => setShowVsGameOverModal(false)}
          onViewWinnerBoard={loadWinnerBoard}
          isHost={vsMode.players[0] === username}
          onNewGame={() => setShowVsRematchModal(true)}
        />
      )}

      {showVsRematchModal && (
        <VsRematchModal
          onClose={() => setShowVsRematchModal(false)}
          onRestart={(a, b) => vsMode.restartGame(a, b)}
          vsError={vsMode.error}
          onClearVsError={vsMode.clearError}
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
