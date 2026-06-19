import ContentLayout from '../components/ContentLayout';
import { createWebSiteSchema } from '../components/StructuredData';
import { useMemo } from 'react';

export default function Iletisim() {
  const schema = useMemo(() => createWebSiteSchema(), []);

  return (
    <ContentLayout
      title="İletişim"
      seo={{
        title: 'İletişim — KelimeLink',
        description: 'KelimeLink ekibiyle iletişime geçin. Soru, öneri, hata bildirimi ve işbirlikleri için bize ulaşabilirsiniz.',
        path: '/iletisim',
        ogTitle: 'İletişim — KelimeLink',
        ogDescription: 'KelimeLink ekibiyle iletişime geçin. Soru, öneri ve işbirlikleri için bize ulaşın.',
      }}
      structuredData={schema}
      breadcrumbs={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'İletişim', path: '/iletisim' },
      ]}
    >
      <h1>İletişim</h1>

      <p>
        KelimeLink hakkında sorularınız, önerileriniz, hata bildirimleriniz veya işbirliği
        teklifleriniz için bizimle her zaman iletişime geçebilirsiniz. Oyunu geliştirmemize
        yardımcı olan her türlü geri bildirimi dikkate alıyoruz.
      </p>

      <h2>Bize Ulaşın</h2>
      <p>
        <a href="mailto:krmhsnmrcn220@gmail.com">E-posta adresimiz</a> üzerinden bize doğrudan yazabilirsiniz. Mesajlarınıza
        en kısa sürede (genellikle 24-48 saat içerisinde) dönüş yapmaya çalışıyoruz.
      </p>

      <h2>Sık Sorulan Sorular</h2>
      <p>
        Bize yazmadan önce, sorularınızın yanıtını belki de <strong><a href="/">Ana Sayfa</a></strong>'da yer alan
        "Sıkça Sorulan Sorular" bölümünde veya <a href="/nasil-oynanir">Nasıl Oynanır?</a> sayfamızda
        bulabilirsiniz. Eğer kelime bağlantıları ile ilgili "neden bağlanmadı" gibi bir itirazınız varsa,
        oyun içerisindeki kelime bildirme <strong>(+)</strong> butonunu kullanmanız işlemleri hızlandıracaktır.
      </p>

    </ContentLayout>
  );
}
