import { useState, useEffect, useMemo } from 'react';
import { Swords, Calendar, RefreshCw, BarChart3, Moon, Sun, Info, Users } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { useDarkMode } from './hooks/useDarkMode';
import { useVsMode } from './hooks/useVsMode';
import { useHydration } from './hooks/useHydration';
import { useRenderReady } from './hooks/useRenderReady';
import { useSEO } from './hooks/useSEO';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import WinBanner from './components/WinBanner';
import ProfileModal from './components/ProfileModal';
import InfoModal from './components/InfoModal';
import UsernameBadge from './components/UsernameBadge';
// AdUnit import removed — ads disabled until AdSense approval is granted
import VsModeModal from './components/VsModeModal';
import VsRoomModal from './components/VsRoomModal';
import VsGameOverModal from './components/VsGameOverModal';
import VsRematchModal from './components/VsRematchModal';
import CookieBanner from './components/CookieBanner';
import StructuredData, {
  createWebSiteSchema,
  createWebApplicationSchema,
  createBreadcrumbSchema,
} from './components/StructuredData';
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

  const isHydrated = useHydration();
  useRenderReady(); // App shell is ready instantly for the prerenderer!

  const { isDark, toggleDarkMode } = useDarkMode();
  const [showProfile, setShowProfile] = useState(false);
  const [showInfo, setShowInfo] = useState(() => {
    // Prevent the modal from showing automatically for crawlers to avoid interstitial penalties
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isCrawler = /googlebot|mediapartners|adsbot|bingbot|yandex|baiduspider|slurp|headlesschrome|bot|spider|crawl/.test(ua) || 
                        navigator.webdriver === true || 
                        (window as any).__PRERENDER_INJECTED !== undefined;
      if (isCrawler) return false;
    }

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
      startVsGame(vsMode.wordA, vsMode.wordB, vsMode.bannedWords);
      setShowVsModal(false);
      setShowVsRematchModal(false);
      setShowVsGameOverModal(false);
      setHasSeenGameOver(false);
    }
  }, [vsMode.status, vsMode.wordA, vsMode.wordB, vsMode.bannedWords, startVsGame]);

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

  // SEO meta tags for the homepage — captured by prerenderer
  useSEO({
    title: 'KelimeLink — Türkçe Kelime Bağlantı Bulmacası',
    description:
      'KelimeLink - Her gün yeni bir Türkçe kelime bağlantı bulmacası. İki uzak kelimeyi anlamsal köprüler kurarak birbirine bağlayın. Kelime dağarcığınızı ve mantığınızı test edin!',
    path: '/',
    ogTitle: 'KelimeLink — Türkçe Kelime Bağlantı Bulmacası',
    ogDescription:
      'İki kelimeyi anlamsal bağlantılarla birbirine bağla! Her gün yeni bir meydan okuma.',
  });

  // Structured data schemas — memoized to avoid re-creation on each render
  const homepageSchemas = useMemo(
    () => [
      createWebSiteSchema(),
      createWebApplicationSchema(),
      createBreadcrumbSchema([{ name: 'Ana Sayfa', path: '/' }]),
    ],
    []
  );

  const isInitialLoading = !isHydrated || isLoading;
  const showInitialError = error && nodes.length === 0 && !isLoading;

  if (isInitialLoading || showInitialError) {
    return (
      <div className="app-layout" style={{ overflowY: 'auto' }}>
        <StructuredData data={homepageSchemas} />
        <header className="app-header">
          <img src="/favicon.png" alt="KelimeLink Logo" className="app-header__logo" />
          <h1 className="app-header__title">KelimeLink</h1>
          <span className="app-header__subtitle">Kelime Bağlantı Bulmacası</span>
        </header>

        <main className="landing-main">
          <div className="landing-hero">
            {isInitialLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p className="loading-text">Yükleniyor...</p>
                <p className="loading-subtext">Bağlantılar kuruluyor</p>
              </div>
            ) : (
              <div className="error-state">
                <div className="error-icon">🔌</div>
                <h2>Bağlantı Kurulamadı</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                  Tekrar Dene
                </button>
              </div>
            )}
          </div>

          <article className="seo-homepage-content">
            <h2>KelimeLink Nedir?</h2>
            <p>
              KelimeLink, Türkçe'nin zengin kelime dünyasında anlamsal köprüler kurduğunuz
              eşsiz bir kelime bulmacasıdır. Her bulmacada size verilen iki kelime arasında
              anlam bağlantıları kurarak bir yol oluşturmanız gerekir. Yapay zeka tabanlı
              doğal dil işleme (NLP) teknolojisi sayesinde, kelimeler arasındaki anlamsal
              benzerlik gerçek zamanlı olarak ölçülür.
            </p>

            <h2>Nasıl Oynanır?</h2>
            <p>
              Oyun, kelimeler arasındaki anlamsal benzerliği ölçmek için ConceptNet Numberbatch
              dil modelini kullanır. Eklediğiniz her kelime, tahtadaki tüm kelimelerle karşılaştırılır.
              İki kelime arasındaki benzerlik skoru %26 veya üzerindeyse, aralarında otomatik olarak
              bir bağlantı oluşur. Başlangıç kelimesinden hedef kelimeye kesintisiz bir yol
              oluşturduğunuzda bulmacayı çözmüş olursunuz.
            </p>

            <h2>Oyun Modları</h2>
            <h3>🗓️ Günlük Bulmaca</h3>
            <p>
              Her gün UTC gece yarısında yeni bir kelime çifti yayınlanır. Tüm oyuncular aynı
              bulmacayı çözer ve en az tahminle çözen oyuncu günün rekortmeni olur.
            </p>
            <h3>⚔️ Pratik Modu</h3>
            <p>
              Sınırsız sayıda rastgele kelime çifti ile antrenman yapın. İpucu alma özelliği
              aktiftir — zor durumda kaldığınızda sistemden yardım isteyebilirsiniz.
            </p>
            <h3>👥 VS Modu</h3>
            <p>
              Arkadaşlarınızla gerçek zamanlı olarak aynı bulmacayı çözmeye yarışın! Bir oda
              oluşturarak veya katılarak, aynı kelime çiftini kim daha az tahminle çözerse o kazanır.
            </p>

            <h2>Arkasındaki Teknoloji</h2>
            <p>
              KelimeLink, ConceptNet Numberbatch kelime gömme modelini kullanarak kelimelerin
              anlamsal ilişkilerini 300 boyutlu vektörlerle temsil eder. İki kelime arasındaki
              kosinüs benzerliği hesaplanarak yüzdelik bir skor elde edilir. Bu sistem;
              React, TypeScript, HTML5 Canvas ve Python FastAPI teknolojileri üzerine kuruludur.
            </p>

            <div className="seo-footer-links">
              <a href="/nasil-oynanir">Detaylı oyun rehberi için tıklayın</a>
              <a href="/hakkinda">Hakkında daha fazla bilgi</a>
              <a href="/blog/konseptnet-nasil-calisir">ConceptNet Nasıl Çalışır?</a>
              <a href="/blog/kelime-oyunlarinda-nlp">Kelime Oyunlarında NLP</a>
              <a href="/gizlilik-politikasi">Gizlilik Politikası</a>
              <a href="/kullanim-kosullari">Kullanım Şartları</a>
              <a href="mailto:[EMAIL_ADDRESS]">İletişim</a>
              {/* newline respecting flex */}
              <div style={{ width: '100%' }}></div>
              <div className="app-footer__copyright">
                © 2026 KelimeLink. Tüm hakları saklıdır.
              </div>
            </div>
          </article>
        </main>
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
            className={`app-header__action-btn`}
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
          bannedWords={vsMode.status !== 'disconnected' && vsMode.bannedWords ? vsMode.bannedWords : null}
          nextPuzzleAt={nextPuzzleAt}
          serverOffset={serverOffset}
          onTimerEnd={switchToDaily}
          dailyRecordHolder={dailyRecordHolder}
          username={username}
          vsWinnerUsername={gameMode === 'vs' && vsMode.status === 'finished' ? (vsMode.winnerInfo?.username ?? null) : null}
        />
        {!(typeof navigator !== 'undefined' && /HeadlessChrome|Puppeteer|jsdom/i.test(navigator.userAgent)) && (
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
        )}
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
          onCreateRoom={(a, b, bannedWords) => vsMode.createRoom(a, b, bannedWords)}
          onJoinRoom={(code) => vsMode.joinRoom(code)}
          vsError={vsMode.error}
          onClearVsError={vsMode.clearError}
          isLoading={vsMode.isLoading}
        />
      )}

      {(vsMode.status === 'waiting' || (vsMode.status === 'finished' && !isSolved)) && vsMode.roomCode && (
        <VsRoomModal
          roomCode={vsMode.roomCode}
          wordA={vsMode.wordA}
          wordB={vsMode.wordB}
          bannedWords={vsMode.bannedWords}
          players={vsMode.players}
          isHost={vsMode.players[0] === username}
          status={vsMode.status as 'waiting' | 'finished'}
          onStartGame={vsMode.startGame}
          onLeave={vsMode.leaveRoom}
          isLoading={vsMode.isLoading}
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
          onRestart={(a, b, bannedWords) => vsMode.restartGame(a, b, bannedWords)}
          vsError={vsMode.error}
          onClearVsError={vsMode.clearError}
          isLoading={vsMode.isLoading}
        />
      )}

      <CookieBanner />




      <footer className="app-footer">
        <div className="app-footer__content">
          <div className="app-footer__links">
            <a href="/nasil-oynanir">Nasıl Oynanır?</a>
            <a href="/hakkinda">Hakkında</a>
            <a href="/arsiv">Bulmaca Arşivi</a>
            <a href="/blog/konseptnet-nasil-calisir">ConceptNet Nasıl Çalışır?</a>
            <a href="/blog/kelime-oyunlarinda-nlp">Kelime Oyunlarında NLP</a>
            <a href="/gizlilik-politikasi">Gizlilik Politikası</a>
            <a href="/kullanim-kosullari">Kullanım Şartları</a>
            <a href="mailto:krmhsnmrcn220@gmail.com">İletişim</a>
          </div>
          <div className="app-footer__copyright">
            © 2026 KelimeLink. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
