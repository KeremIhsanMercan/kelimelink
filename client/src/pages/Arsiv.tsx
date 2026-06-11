import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useHydration } from '../hooks/useHydration';
import ContentLayout from '../components/ContentLayout';
import '../index.css';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface ArchivePuzzle {
  date: string;
  word_a: string;
  word_b: string;
  path: string | null;
  player_name: string | null;
}

const SEO_DATA = {
  title: 'Günlük Çözümler Arşivi — KelimeLink Bulmaca Arşivi',
  description: 'KelimeLink günlük bulmaca arşivi. Geçmiş günlere ait kelime bağlantı bulmacalarını, en kısa çözüm yollarını ve rekortmen oyuncuları inceleyin.',
  path: '/arsiv',
  ogTitle: 'KelimeLink Bulmaca Arşivi — Günlük Çözümler',
  ogDescription: 'Geçmiş günlere ait KelimeLink bulmacalarını ve en kısa çözüm yollarını inceleyin.',
};

const BREADCRUMBS = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Bulmaca Arşivi', path: '/arsiv' },
];

export default function Archive() {
  const [puzzles, setPuzzles] = useState<ArchivePuzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isHydrated = useHydration();

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
    <>
      <p className="archive-description">
        KelimeLink her gün UTC gece yarısında yeni bir kelime çifti yayınlar. Tüm oyuncular aynı
        günlük bulmacayı çözer ve en kısa yolu bulan oyuncu günün rekortmeni olarak arşivlenir.
        Aşağıda geçmiş günlere ait bulmacaları, başlangıç ve hedef kelimelerini, bulunan en kısa
        çözüm yollarını ve bu yolları keşfeden oyuncuları inceleyebilirsiniz.
      </p>
      <h2>Çözüm Yolları Nasıl Belirleniyor?</h2>
      <p className="archive-description">
        Her çözüm yolu, oyuncuların doğal dil işleme algoritmalarımız kullanılarak bulduğu
        anlamsal bağlantı zincirlerinden oluşur. İki kelime arasındaki benzerlik skoru %26 ve
        üzerinde olduğunda bağlantı oluşur. En az kelimeyle hedefe ulaşan yol, o günün en kısa
        çözümü olarak kaydedilir.
      </p>
    </>
  );

  if (!isHydrated || isLoading) {
    return (
      <ContentLayout title="Bulmaca Arşivi" seo={SEO_DATA} breadcrumbs={BREADCRUMBS}>
        <div className="archive-container" style={{ maxWidth: '100%' }}>
          <h1>KelimeLink Günlük Çözümler</h1>
          {seoIntro}
          <div className="loading-screen" style={{ height: 'auto', marginTop: '40px' }}>
            <Loader2 className="loading-spinner" />
            <p className="loading-text">Arşiv yükleniyor...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Bulmaca Arşivi" seo={SEO_DATA} breadcrumbs={BREADCRUMBS}>
      <div className="archive-container" style={{ maxWidth: '100%' }}>
        <h1>KelimeLink Günlük Çözümler</h1>
        {seoIntro}

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
                  </div>
                ) : (
                  <p><em>Bu bulmaca için henüz kaydedilmiş bir çözüm yolu bulunamadı.</em></p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
