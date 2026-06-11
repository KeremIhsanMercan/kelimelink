import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, Moon, Sun } from 'lucide-react';
import { useHydration } from '../hooks/useHydration';
import { useRenderReady } from '../hooks/useRenderReady';
import { useDarkMode } from '../hooks/useDarkMode';
import { useSEO } from '../hooks/useSEO';
import StructuredData, { createBreadcrumbSchema } from '../components/StructuredData';
import '../index.css';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface ArchivePuzzle {
  date: string;
  word_a: string;
  word_b: string;
  path: string | null;
  player_name: string | null;
}

export default function Archive() {
  const [puzzles, setPuzzles] = useState<ArchivePuzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isDark, toggleDarkMode } = useDarkMode();
  const isHydrated = useHydration();
  useRenderReady();

  useSEO({
    title: 'Günlük Çözümler Arşivi — KelimeLink Bulmaca Arşivi',
    description: 'KelimeLink günlük bulmaca arşivi. Geçmiş günlere ait kelime bağlantı bulmacalarını, en kısa çözüm yollarını ve rekortmen oyuncuları inceleyin.',
    path: '/arsiv',
    ogTitle: 'KelimeLink Bulmaca Arşivi — Günlük Çözümler',
    ogDescription: 'Geçmiş günlere ait KelimeLink bulmacalarını ve en kısa çözüm yollarını inceleyin.',
  });

  const breadcrumbSchema = useMemo(
    () => createBreadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Bulmaca Arşivi', path: '/arsiv' },
    ]),
    []
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/archive`)
      .then(res => res.json())
      .then(data => {
        setPuzzles(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // SEO intro content — shown in both loading and loaded states
  const seoIntro = (
    <div className="archive-seo-intro">
      <p>
        KelimeLink her gün UTC gece yarısında yeni bir kelime çifti yayınlar. Tüm oyuncular aynı
        günlük bulmacayı çözer ve en kısa yolu bulan oyuncu günün rekortmeni olarak arşivlenir.
        Aşağıda geçmiş günlere ait bulmacaları, başlangıç ve hedef kelimelerini, bulunan en kısa
        çözüm yollarını ve bu yolları keşfeden oyuncuları inceleyebilirsiniz.
      </p>
      <h2>Çözüm Yolları Nasıl Belirleniyor?</h2>
      <p>
        Her çözüm yolu, oyuncuların doğal dil işleme algoritmalarımız kullanılarak bulduğu
        anlamsal bağlantı zincirlerinden oluşur. İki kelime arasındaki benzerlik skoru %26 ve
        üzerinde olduğunda bağlantı oluşur. En az kelimeyle hedefe ulaşan yol, o günün en kısa
        çözümü olarak kaydedilir.
      </p>
    </div>
  );

  if (!isHydrated || isLoading) {
    return (
      <div className="app-layout" style={{ overflowY: 'auto' }}>
        <StructuredData data={breadcrumbSchema} />
        <header className="app-header">
          <div className="app-header__left-actions">
            <a href="/" className="app-header__action-btn" title="Ana Sayfaya Dön">
              <ArrowLeft size={20} />
            </a>
          </div>
          <img src="/favicon.png" alt="KelimeLink Logo" className="app-header__logo" />
          <h1 className="app-header__title">KelimeLink</h1>
          <span className="app-header__subtitle">Arşiv</span>
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
        <main className="archive-main" style={{ alignItems: 'center' }}>
          <div className="archive-container">
            <h1>KelimeLink Günlük Çözümler Arşivi</h1>
            {seoIntro}
          </div>
          <div className="loading-screen" style={{ height: 'auto' }}>
            <Loader2 className="loading-spinner" />
            <p className="loading-text">Arşiv yükleniyor...</p>
          </div>
        </main>
        <footer className="app-footer">
          <div className="app-footer__content">
            <div className="app-footer__copyright">
              © 2026 KelimeLink. Tüm hakları saklıdır.
            </div>
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
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-layout" style={{ overflowY: 'auto' }}>
      <StructuredData data={breadcrumbSchema} />
      <header className="app-header">
        <div className="app-header__left-actions">
          <a href="/" className="app-header__action-btn" title="Ana Sayfaya Dön">
            <ArrowLeft size={20} />
          </a>
        </div>
        <img src="/favicon.png" alt="KelimeLink Logo" className="app-header__logo" />
        <h1 className="app-header__title">KelimeLink</h1>
        <span className="app-header__subtitle">Bulmaca Arşivi</span>
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

      <main className="archive-main">
        <div className="archive-container">
          <h1>KelimeLink Günlük Çözümler</h1>
          <p className="archive-description">
            Geçmiş günlere ait bulmacaları ve oyuncularımız tarafından bulunan en kısa çözüm yollarını aşağıda inceleyebilirsiniz.
          </p>

          {puzzles.length === 0 ? (
            <p>Geçmiş günlere ait bir kayıtlar yüklenemedi.</p>
          ) : (
            <div className="archive-list">
              {puzzles.map((puzzle) => (
                <article key={puzzle.date} className="archive-card">
                  <h2>{new Date(puzzle.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                  <p>
                    <strong>Hedef:</strong> <code>{puzzle.word_a}</code> kelimesinden <code>{puzzle.word_b}</code> kelimesine ulaşmak.
                  </p>
                  {puzzle.path ? (
                    <div>
                      <p><strong>En Kısa Çözüm Yolu:</strong></p>
                      <div className="archive-path">
                        {puzzle.path.split(',').map((w) => w.trim()).join(' ➔ ')}
                      </div>
                      {puzzle.player_name && (
                        <p className="archive-player" style={{ marginTop: '10px' }}>
                          <strong>Çözen Oyuncu:</strong> {puzzle.player_name}
                        </p>
                      )}
                      <p className="archive-explanation">
                        Bu çözüm yolu, {puzzle.player_name} tarafından doğal dil işleme algoritmalarımız (%26 ve üzeri benzerlik) kullanılarak bulunmuştur.
                        Anlamsal bağlar kurularak hedefe en hızlı şekilde bu yol üzerinden varılmıştır.
                      </p>
                    </div>
                  ) : (
                    <p><em>Bu bulmaca için henüz kaydedilmiş bir çözüm yolu bulunamadı.</em></p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer__content">
          <div className="app-footer__copyright">
            © 2026 KelimeLink. Tüm hakları saklıdır.
          </div>
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
        </div>
      </footer>
    </div>
  );
}
