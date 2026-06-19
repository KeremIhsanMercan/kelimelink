import { Moon, Sun, Home } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useRenderReady } from '../hooks/useRenderReady';
import { useSEO } from '../hooks/useSEO';
import StructuredData, { createBreadcrumbSchema } from './StructuredData';
import Footer from './Footer';
import NavMenu from './NavMenu';
import { useMemo } from 'react';

interface ContentLayoutProps {
  children: React.ReactNode;
  title?: string;
  seo: {
    title: string;
    description: string;
    path: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: { name: string; path: string }[];
}

export default function ContentLayout({
  children,
  title,
  seo,
  structuredData,
  breadcrumbs,
}: ContentLayoutProps) {
  const { isDark, toggleDarkMode } = useDarkMode();
  useRenderReady(); // Fire prerender event after paint
  useSEO(seo);

  // Combine structured data with breadcrumbs
  const allSchemas = useMemo(() => {
    const schemas: Record<string, unknown>[] = [];
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push(createBreadcrumbSchema(breadcrumbs));
    }
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        schemas.push(...structuredData);
      } else {
        schemas.push(structuredData);
      }
    }
    return schemas.length > 0 ? schemas : null;
  }, [structuredData, breadcrumbs]);

  return (
    <div className="app-layout" style={{ overflowY: 'auto' }}>
      {allSchemas && <StructuredData data={allSchemas} />}
      <header className="app-header">
        <div className="app-header__left-actions">
          <NavMenu />
          <a href="/" className="app-header__action-btn" title="Ana Sayfaya Dön">
            <Home size={20} />
          </a>
        </div>
        <img src="/favicon.png" alt="KelimeLink Logo" className="app-header__logo" />
        <h1 className="app-header__title">KelimeLink</h1>
        <span className="app-header__subtitle">{title || 'Kelime Bağlantı Bulmacası'}</span>
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

      <main className="content-page">
        <article className="content-page__article">
          {children}
        </article>
      </main>

      <Footer />
    </div>
  );
}

