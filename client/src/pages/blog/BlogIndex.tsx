import ContentLayout from '../../components/ContentLayout';
import { createWebSiteSchema } from '../../components/StructuredData';
import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';

export default function BlogIndex() {
  const schema = useMemo(() => createWebSiteSchema(), []);

  return (
    <ContentLayout
      title="Blog"
      seo={{
        title: 'Blog — KelimeLink',
        description: 'Doğal dil işleme (NLP), yapay zeka, kelime oyunları tarihi ve Türkçe kelime kökenleri hakkında bilgilendirici yazılar.',
        path: '/blog',
        ogTitle: 'Blog — KelimeLink',
        ogDescription: 'Kelime oyunları ve yapay zeka teknolojileri hakkında yazılarımız.',
      }}
      structuredData={schema}
      breadcrumbs={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]}
    >
      <h1>KelimeLink Blog</h1>

      <p>
        Kelime oyunları dünyasına, yapay zeka ve Doğal Dil İşleme (NLP) teknolojilerine ve
        Türkçemizin zenginliğine dair hazırladığımız güncel yazılarımızı buradan takip edebilirsiniz.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>


        <a href="/blog/kelime-oyunlarinda-nlp" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <BookOpen size={20} style={{ transform: 'translateY(-5px)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>Kelime Oyunlarında NLP</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Yapay zeka ve doğal dil işleme (NLP) teknolojileri kelime oyunlarını nasıl dönüştürüyor?
          </p>
        </a>

        <a href="/blog/konseptnet-nasil-calisir" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <BookOpen size={20} style={{ transform: 'translateY(-5px)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>ConceptNet Nasıl Çalışır?</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8 }}>
            KelimeLink'in altyapısını oluşturan ConceptNet veritabanı ve Numberbatch kelime gömme (word embedding) modelleri hakkında detaylı inceleme.
          </p>
        </a>

        <a href="/blog/turkce-kelime-oyunlari-tarihi" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <BookOpen size={20} style={{ transform: 'translateY(-5px)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>Türkçe Kelime Oyunları Tarihi</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Kare bulmacalardan mobil uygulamalara, Türkiye'deki kelime oyunlarının yıllar içindeki evrimi.
          </p>
        </a>

        <a href="/blog/yapay-zeka-ve-kelime-ogrenimi" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <BookOpen size={20} style={{ transform: 'translateY(-5px)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>Yapay Zeka ve Kelime Öğrenimi</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8 }}>
            NLP tabanlı bulmacaların yeni kelimeler öğrenmeye ve dil becerilerini geliştirmeye bilimsel katkıları.
          </p>
        </a>

        <a href="/blog/linxicon-turkce" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <BookOpen size={20} style={{ transform: 'translateY(-5px)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>Linxicon Türkçe Var mı? KelimeLink ile Karşılaştırma</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Linxicon nedir, neden resmi Türkçe sürümü yok ve KelimeLink bu boşluğu nasıl dolduruyor? Benzerlikler ve farklar.
          </p>
        </a>
        <a href="/blog/contexto-turkce" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <BookOpen size={20} style={{ transform: 'translateY(-5px)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>Contexto ve Semantle ile Karşılaştırma</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Contexto, Semantle ve KelimeLink karşılaştırması. Semantik kelime oyunlarının Türkçe versiyonları hakkında bilmeniz gerekenler.
          </p>
        </a>
      </div>

    </ContentLayout>
  );
}
