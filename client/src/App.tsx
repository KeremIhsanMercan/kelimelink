import { useState, useEffect, useMemo } from 'react';
import { Swords, Calendar, RefreshCw, BarChart3, Moon, Sun, Info, Users, ArrowUp, Menu, ChevronDown, BookOpen, Clock, PenTool, Signpost } from 'lucide-react';
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
// CookieBanner removed for AdSense built-in CMP
import Footer from './components/Footer';
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
  const [showInfo, setShowInfo] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [hideScrollIndicator, setHideScrollIndicator] = useState(false);

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

  const seoText = (
    <>
      <h2>KelimeLink Nedir?</h2>
      <p>
        KelimeLink, Türkçe'nin zengin kelime dünyasında anlamsal köprüler kurduğunuz
        yenilikçi ve zeka geliştirici bir kelime bulmacasıdır. Her bulmacada size verilen
        iki farklı (başlangıç ve hedef) kelime arasında anlam bağlantıları kurarak bir yol
        oluşturmanız gerekir. Yapay zeka tabanlı doğal dil işleme (NLP) teknolojisi sayesinde,
        yazdığınız her kelimenin diğer kelimelerle olan anlamsal benzerliği gerçek zamanlı
        olarak ölçülür. Hem kelime dağarcığınızı test eden hem de analitik düşünme becerinizi
        geliştiren bu semantik oyun, klasik bulmaca ve kelime oyunlarına yepyeni bir boyut kazandırıyor.
      </p>

      <h2>Nasıl Oynanır ve Kurallar Nelerdir?</h2>
      <p>
        Oyunun amacı, başlangıç kelimesinden hedef kelimeye en kısa yoldan ulaşmaktır.
        Sistem, kelimeler arasındaki anlamsal benzerliği çok boyutlu vektör uzayında ölçmek için
        gelişmiş ConceptNet Numberbatch dil modelini kullanır. Eklediğiniz her yeni kelime,
        oyun tahtasındaki tüm mevcut kelimelerle anında karşılaştırılır.
        İki kelime arasındaki benzerlik (kosinüs benzerliği) skoru %26 veya üzerindeyse,
        aralarında otomatik olarak görsel bir bağlantı ağı (köprü) oluşur.
        Başlangıç kelimesinden hedef kelimeye kadar kesintisiz, mantıklı bir zincir
        oluşturduğunuzda bulmacayı başarıyla çözmüş olursunuz.
      </p>

      <h2>Oyun Modları ve Seçenekler</h2>
      <h3>🗓️ Günlük Bulmaca (Günün Kelimeleri)</h3>
      <p>
        Her gün TSİ 03:00'te tüm oyuncular için ortak ve yepyeni bir kelime çifti yayınlanır.
        Tüm oyuncular aynı zorluk seviyesindeki bulmacayı çözmeye çalışır. Hedefe en az kelime
        tahminiyle ve en hızlı şekilde ulaşan oyuncu, günün rekortmeni olarak arşivlerimize
        kaydedilir. Her gün beyninize yeni bir egzersiz yaptırmak için idealdir.
      </p>
      <h3>⚔️ Pratik Modu (Sınırsız Oyun)</h3>
      <p>
        Günlük bulmacayı çözdükten sonra oynamaya devam etmek isterseniz, Pratik Modu tam size göre.
        Sınırsız sayıda rastgele kelime çifti ile antrenman yapabilir, yeni stratejiler geliştirebilirsiniz.
        Zor durumda kaldığınızda "İpucu" alma özelliği aktiftir, sistemden yardım isteyerek
        hedefe giden yoldaki eksik halkaları öğrenebilirsiniz.
      </p>
      <h3>👥 VS Modu (Çok Oyunculu)</h3>
      <p>
        Kelime yeteneklerinizi arkadaşlarınıza karşı test edin! Arkadaşlarınızla gerçek zamanlı olarak
        aynı bulmacayı çözmek için yarışın. Özel bir oda oluşturarak veya mevcut bir odaya katılarak,
        aynı kelime çiftini kimin daha az tahminle ve daha hızlı çözeceğini rekabet dolu bir ortamda belirleyin.
      </p>

      <h2>Neden KelimeLink Oynamalısınız?</h2>
      <p>
        Düzenli olarak KelimeLink oynamak, dil becerilerinizi ve analitik düşünme yeteneğinizi geliştirir.
        Kelimelerin sadece eş anlamlılarını değil, bağlamsal ve semantik (anlamsal) ilişkilerini de
        düşünmeye zorladığı için zihinsel esnekliği artırır. Geleneksel kare bulmaca, çengel bulmaca veya
        kelime avı oyunlarından farklı olarak, doğrudan yapay zeka ile etkileşime girerek kelimelerin
        derinliklerine inmenizi sağlar. Hem öğrenciler, hem dil tutkunları, hem de zihin jimnastiği
        yapmak isteyen herkes için mükemmel bir beyin egzersizidir.
      </p>

      <h2>Arkasındaki Teknoloji ve Altyapı</h2>
      <p>
        KelimeLink, Türkçe kelimelerin anlamsal ilişkilerini 300 boyutlu vektörlerle temsil eden
        Açık Kaynaklı ConceptNet Numberbatch kelime gömme (word embedding) NLP modelini kullanır.
        İki kelimenin vektörleri arasındaki kosinüs benzerliği hesaplanarak yüzdelik bir skor elde edilir.
        Kullanıcı dostu arayüz; React, TypeScript ve etkileşimli HTML5 Canvas ile geliştirilmiş olup,
        hızlı ve güvenilir arka plan işlemleri Python FastAPI teknolojileriyle desteklenmektedir.
      </p>

      <h2>Sıkça Sorulan Sorular (SSS)</h2>

      <h3>Kelimelerin bağlantı skoru nasıl bulunuyor?</h3>
      <p>
        KelimeLink, Türkçe kelimeleri anlamlarına göre 300 boyutlu matematiksel vektörler olarak temsil eden
        gelişmiş bir yapay zeka ve doğal dil işleme (NLP) modeli kullanır. Oyuna yazdığınız her kelimenin
        matematiksel konumu hesaplanır ve oyun tahtasındaki diğer kelimelerin konumlarıyla karşılaştırılarak
        aralarındaki anlamsal mesafe <strong>kosinüs benzerliği</strong> ile hesaplanır. Anlamca yakın kelimeler, bu çok boyutlu uzayda birbirine daha
        yakın noktalarda bulunurlar.
      </p>

      <h3>Kosinüs Benzerliği (Cosine Similarity) nedir?</h3>
      <p>
        Kosinüs benzerliği, makine öğrenmesi ve veri biliminde iki vektör arasındaki açıyı ölçerek
        birbirlerine ne kadar benzediklerini bulmaya yarayan standart bir formüldür. Kelimeler 300 boyutlu
        uzayda birbirlerine ne kadar yakın bir yönü gösteriyorsa, anlamsal olarak o kadar bağlantılıdırlar.
        KelimeLink, bu karmaşık matematiksel hesabı arka planda anlık olarak yapar ve sonucu sizin için
        anlaşılır yüzdelik bir skora (örneğin %45) dönüştürür.
      </p>

      <h3>Neden bağlantı sınırı %26?</h3>
      <p>
        Kullandığımız dil modelinde, kelimeler arası ilişkilerin "rastgele" olmaktan çıkıp gerçekten anlamlı
        ve sezgisel bir seviyeye ulaştığı denge noktası, kapsamlı testlerimiz ve kullanıcı geri bildirimlerisonucunda %26 olarak belirlenmiştir.
        Bu oranın altındaki skorlar genellikle çok zayıf veya tesadüfi ilişkileri ifade ederken, %26 ve üzerindeki
        skorlar iki kelime arasında güçlü bir "anlamsal köprü" kurmaya yetecek kadar yakındır. Farklı bir oran öneriniz var ise,
        kelime örnekleriniz ile beraber <a href="/mailto:krmhsnmrcn220@gmail.com" style={{ textDecoration: 'underline', color: 'var(--primary-color)' }}>bize</a> ulaşabilirsiniz.
      </p>

      <h3>Bağlanması gerektiğini düşündüğüm kelimeler bağlanmadı, ne yapmalıyım?</h3>
      <p>
        Yapay zeka dil modelleri devasa metin verilerinden (Wikipedia, haber siteleri, makaleler vb.) öğrenirler.
        Bazen günlük hayatta bize çok bariz gelen kültürel, yerel veya mecazi bir bağlantı, modelin eğitim verisinde
        istatistiksel olarak yeterince güçlü yer almamış olabilir. Bu durumu elimizden geldiğince düzeltmek için sizden
        yardım alıyoruz. Bağlanması gerektiğini düşündüğünüz kelime çiftlerini Bağlananlar ve Bağlanmayanlar listesindeki
        <strong> '+' </strong> butonuna tıklayarak bize gönderebilirsiniz. Gönderdiğiniz kelime çiftleri ekibimiz tarafından incelenerek,
        kelimelerin birbirine bağlanmasının uygun olduğuna karar verilirse bu kelimeler birbirine bağlanabilir hale getirilecektir.
      </p>

      <h3>Pratik modundaki ipuçları nasıl çalışıyor?</h3>
      <p>
        Pratik modunda ipucu istediğinizde, sistem tahtaya eklediğiniz son kelime ile diğer hedef kelime arasındaki bağlantı uzayını tarar.
        Amacı, eklediğiniz kelimeye kesin olarak bağlanabilen (benzerliği <strong>%26'nın üzerinde</strong> olan) yeni bir kelime bulmaktır.
        Bunu yaparken üç farklı strateji izler:
        <br /><br />
        <strong>1. Normal İpucu:</strong> Doğrudan çözümü vermemek için, tahtadaki kelimeye ne çok uzak ne de çok yakın olan
        (benzerliği %15 ile %25 arasında olan) dengeli bir kelime seçer. Böylece var olduğunuz noktadan, hedefe doğru bir adım atmış olursunuz.<br />
        <strong>2. Süper İpucu:</strong> 4 ipucu isteğinizden sonraki her isteğiniz Süper İpucu olarak değerlendirilir.
        Bu ipucu için hem eklediğiniz kelimeye hem de hedef kelimeye aynı anda bağlanabilen
        (her ikisine de %26 veya daha fazla benzeyen) nadir "altın köprü" kelimelerini arar.<br />
        <strong>3. En İyi Alternatif:</strong> Eğer yukarıdaki koşullara uyan bir kelime bulunamazsa,
        tahtadaki kelimeye bağlanan kelimeler arasından <strong>hedefe en çok yaklaşan</strong> (en yüksek benzerlik skoruna sahip)
        kelimeyi seçerek size ipucu olarak sunar.
      </p>

      <h3>İpuçları neden bazen çok üst seviye veya yabancı kökenli kelimeler veriyor?</h3>
      <p>
        KelimeLink'in altyapısını oluşturan dil modeli, kelime ilişkilerini birçok farklı dilde yazılmış devasa metin veri setlerini (akademik makaleler, kitaplar, haberler vb.)
        okuyarak öğrenmiştir. Türkçe; Arapça, Farsça ve Fransızca gibi dillerden birçok kelime almış zengin bir dildir.
        Sistemimiz size bir ipucu seçerken kelimenin günlük hayattaki popülerliğine değil, hedef kelimeye olan
        <strong> matematiksel yakınlığına</strong> bakar. Bu nedenle bazen hedefe giden en optimal ve kısa yol;
        günlük konuşmada sık kullanmadığımız eski bir kelimeden, eş anlamlı yabancı kökenli bir kelimeden veya
        akademik bir terimden geçebilir.
      </p>

      <h3>KelimeLink oynamak ücretli mi?</h3>
      <p>
        Hayır, KelimeLink oynamak tamamen ücretsizdir. Her gün yenilenen Günlük Bulmacayı çözebilir,
        Pratik modunda sınırsız antrenman yapabilir ve arkadaşlarınızla VS modunda çevrimiçi olarak hiçbir
        ücret ödemeden yarışabilirsiniz.
      </p>
      <button
        className="scroll-to-top-btn"
        onClick={() => document.querySelector('.app-layout')?.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={18} /> Başa Dön
      </button>
    </>
  );

  if (isInitialLoading || showInitialError) {
    return (
      <div className="app-layout" style={{ overflowY: 'auto' }}>
        <StructuredData data={homepageSchemas} />
        <header className="app-header">
          <div className="app-header__left-actions" />
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
          </div>
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
            {seoText}
          </article>
        </main>
        <Footer />
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
          <div className="nav-menu-container" style={{ position: 'relative' }}>
            <button
              className={`app-header__action-btn`}
              onClick={() => setShowNavMenu(!showNavMenu)}
              aria-label="Menü"
              title="Menü"
            >
              <Menu size={20} />
            </button>
            {showNavMenu && (
              <div className="nav-menu-dropdown">
                <a href="/nasil-oynanir" className="nav-menu-item"><Signpost size={16} /> Detaylı Oyun Rehberi</a>
                <a href="/hakkinda" className="nav-menu-item"><PenTool size={16} /> Hakkında</a>
                <a href="/arsiv" className="nav-menu-item"><Clock size={16} /> Arşiv</a>
                <a href="/blog/konseptnet-nasil-calisir" className="nav-menu-item"><BookOpen size={16} /> Blog: ConceptNet</a>
                <a href="/blog/kelime-oyunlarinda-nlp" className="nav-menu-item"><BookOpen size={16} /> Blog: NLP</a>
              </div>
            )}
          </div>
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
        {guessCount === 0 && !hideScrollIndicator && (
          <button
            className="scroll-down-indicator"
            onClick={() => {
              const article = document.querySelector('.seo-homepage-content');
              if (article) {
                const headerOffset = 56;
                const elementPosition = article.getBoundingClientRect().top;
                const offsetPosition = elementPosition + (document.querySelector('.app-layout')?.scrollTop || 0) - headerOffset;
                document.querySelector('.app-layout')?.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
              setHideScrollIndicator(true);
            }}
            aria-label="Aşağı Kaydır"
          >
            <ChevronDown size={24} />
            <span>Bilgi</span>
          </button>
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
      <article className="seo-homepage-content" style={{ paddingBottom: '24px' }}>
        {seoText}
      </article>

      <Footer />
    </div>
  );
}
