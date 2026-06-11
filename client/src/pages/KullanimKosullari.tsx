import ContentLayout from '../components/ContentLayout';

export default function KullanimKosullari() {
  return (
    <ContentLayout
      title="Kullanım Şartları"
      seo={{
        title: 'Kullanım Şartları — KelimeLink',
        description: 'KelimeLink Kullanım Şartları. Oyunun kuralları, fikri mülkiyet hakları ve hizmet sınırlandırmaları hakkında genel bilgilendirme.',
        path: '/kullanim-kosullari',
        ogTitle: 'KelimeLink Kullanım Şartları',
        ogDescription: 'KelimeLink oyununun kullanım şartları, kuralları ve hizmet sınırlandırmaları.',
      }}
      breadcrumbs={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Kullanım Şartları', path: '/kullanim-kosullari' },
      ]}
    >
      <h1>Kullanım Şartları</h1>
      <p className="content-page__date">Son Güncelleme: 2 Haziran 2026</p>

      <p>
        KelimeLink web sitesine (kelimelink.app) ve oyununa hoş geldiniz. 
        Sitemizi ziyaret ederek veya hizmetlerimizi kullanarak aşağıdaki kullanım şartlarını kabul 
        etmiş sayılırsınız. Lütfen bu metni dikkatle okuyunuz.
      </p>

      <h2>1. Hizmetin Kullanımı</h2>
      <p>
        KelimeLink, kullanıcılarına doğal dil işleme algoritmalarına dayalı bir kelime bulmaca oyunu 
        sunmaktadır. Oyun, bireysel ve ticari olmayan kullanımınız için tamamen ücretsiz olarak 
        sağlanmaktadır.
      </p>
      <ul>
        <li>Oyun mekaniklerini suistimal edecek, site sunucularına aşırı yük bindirecek veya işleyişi bozacak otomatik araçlar (botlar, kazıyıcılar vb.) kullanılamaz.</li>
        <li>Çok oyunculu modda (VS Modu) diğer kullanıcılara karşı saygılı olunması esastır. Oda isimleri veya kullanıcı adlarında küfür, hakaret ve saldırgan ifadeler kullanılamaz.</li>
      </ul>

      <h2>2. Fikri Mülkiyet Hakları</h2>
      <p>
        Sitede yer alan KelimeLink markası, logolar, tasarım ögeleri, oyun konsepti, arayüz kodu, 
        yazılı içerikler ve grafikler KelimeLink'e aittir veya lisanslanmıştır. 
        Bu içerikler, yazılı izin alınmaksızın doğrudan ticari amaçlarla kopyalanamaz veya yeniden yayınlanamaz.
      </p>
      <p>
        Oyunun arkasındaki kelime gömme teknolojisi, açık kaynaklı <a href="https://conceptnet.io/" target="_blank" rel="noopener noreferrer">ConceptNet Numberbatch</a> 
        veri tabanından güç almaktadır. Bu açık kaynaklı verinin kendi lisansları ayrıca geçerlidir.
      </p>

      <h2>3. Garanti Reddi (Disclaimer)</h2>
      <p>
        Hizmet "OLDUĞU GİBİ" ("AS IS") esasına göre sunulur. KelimeLink, oyunun kesintisiz, 
        hatasız çalışacağını veya belirli anlamsal bağlantıların (veya eksikliklerin) herkesin beklentisine 
        uygun olacağını garanti etmez. 
      </p>
      <p>
        Oyunda hesaplanan %26 ve üzeri benzerlik skorları, matematiksel dil modellerinin sonuçlarıdır. 
        Bu sonuçların her zaman kültürel olarak doğru veya mantıklı olacağına dair bir taahhüdümüz yoktur.
      </p>

      <h2>4. Sorumluluğun Sınırlandırılması</h2>
      <p>
        KelimeLink ekibi, web sitemizin kullanımından veya kullanılamamasından doğabilecek hiçbir 
        doğrudan veya dolaylı maddi/manevi zarardan sorumlu tutulamaz. Cihazınızda oluşan veri 
        kayıpları (örneğin tarayıcı geçmişinin silinmesi sonucu oyun istatistiklerinin kaybı) 
        tamamen kullanıcının kendi sorumluluğundadır.
      </p>

      <h2>5. Harici Bağlantılar ve Reklamlar</h2>
      <p>
        Sitemizde Google AdSense vb. ağlar tarafından sağlanan üçüncü taraf reklamlar ve dış 
        bağlantılar bulunabilir. Bu harici sitelerin içeriğinden veya gizlilik uygulamalarından 
        KelimeLink sorumlu değildir. Dış bağlantıları ziyaret etmek kendi riskinizdedir.
      </p>

      <h2>6. Şartlarda Değişiklik</h2>
      <p>
        KelimeLink, bu Kullanım Şartları metnini herhangi bir zamanda önceden haber vermeksizin 
        değiştirme hakkını saklı tutar. Yapılan değişiklikler web sitemizde yayınlandığı an yürürlüğe girer.
      </p>

      <h2>7. İletişim</h2>
      <p>
        Bu şartlarla ilgili sorularınız için bizimle iletişime geçebilirsiniz:
        <br />
        E-posta: <a href="mailto:krmhsnmrcn220@gmail.com">krmhsnmrcn220@gmail.com</a>
      </p>
    </ContentLayout>
  );
}
