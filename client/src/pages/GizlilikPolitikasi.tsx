import { useEffect } from 'react';
import ContentLayout from '../components/ContentLayout';

export default function GizlilikPolitikasi() {
  useEffect(() => {
    document.title = 'Gizlilik Politikası — KelimeLink';
    document.querySelector('meta[name="description"]')?.setAttribute('content',
      'KelimeLink Gizlilik Politikası. Çerez kullanımı, kişisel veriler, Google AdSense politikaları ve yerel veri depolama hakkında detaylı bilgilendirme.'
    );
  }, []);

  return (
    <ContentLayout title="Gizlilik Politikası">
      <h1>Gizlilik Politikası</h1>
      <p className="content-page__date">Son Güncelleme: 2 Haziran 2026</p>

      <p>
        KelimeLink ("biz", "bizim" veya "site") olarak gizliliğinize büyük önem veriyoruz.
        Bu Gizlilik Politikası, web sitemizi (kelimelink.app) ziyaret ettiğinizde veya KelimeLink
        oyununu oynadığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
      </p>

      <h2>1. Toplanan Veriler ve Kullanımı</h2>
      <p>
        KelimeLink, kullanıcılarına kayıt olma zorunluluğu getirmeden oynanabilen bir oyundur.
        Bu nedenle, isim, e-posta, telefon veya adres gibi doğrudan kişiyi tanımlayıcı verilerinizi
        istemeyiz veya kendi sunucularımızda saklamayız.
      </p>
      <p>
        Oyun ile olan etkileşiminiz ve oyun içi istatistikleriniz (oynanan oyun sayısı, başarı oranı,
        kullanılan kullanıcı adınız, tema tercihiniz vb.) yalnızca kendi cihazınızın tarayıcısında
        <strong> Yerel Depolama (Local Storage)</strong> kullanılarak saklanır. Bu veriler cihazınızı
        terk etmez.
      </p>

      <h2>2. Çerezler (Cookies) ve Üçüncü Taraf Hizmetleri</h2>
      <p>
        Web sitemizin çalışmasını sağlamak, kullanım analizi yapmak ve reklam gösterebilmek için
        bazı çerezler kullanılmaktadır. Sitemizi kullanarak bu çerezlerin kullanımını kabul etmiş olursunuz.
      </p>

      <h3>Google AdSense ve Reklam Çerezleri</h3>
      <p>
        KelimeLink, hizmetin ücretsiz kalabilmesi için Google AdSense programını kullanmaktadır.
        Google ve üçüncü taraf reklam sağlayıcıları, sitemize veya diğer web sitelerine yaptığınız
        önceki ziyaretlere dayalı olarak kişiselleştirilmiş reklamlar sunmak için çerezlerden
        (DoubleClick DART çerezi dahil) yararlanabilir.
      </p>
      <ul>
        <li>Google'ın reklam çerezlerini kullanımı, Google ve iş ortaklarının size internet üzerindeki ilgi alanlarınıza göre reklam göstermesini sağlar.</li>
        <li>Kullanıcılar, <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">Google Reklam Merkezi</a>'ni ziyaret ederek kişiselleştirilmiş reklamcılığı devre dışı bırakabilirler.</li>
        <li>Üçüncü taraf sağlayıcıların kişiselleştirilmiş reklamcılık amaçlı çerez kullanımını devre dışı bırakmak için <a href="https://aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a> adresini ziyaret edebilirsiniz.</li>
      </ul>

      <h3>Analiz Araçları</h3>
      <p>
        Sitemizin performansını ölçmek ve kullanıcı deneyimini iyileştirmek için
        <strong> Vercel Analytics</strong> ve <strong>Vercel Speed Insights </strong>
        kullanmaktayız. Bu araçlar, sayfaların yüklenme hızını, trafik yoğunluğunu ve teknik
        hataları tamamen anonimleştirilmiş bir biçimde toplar ve işler.
      </p>

      <h2>3. Veri Güvenliği</h2>
      <p>
        KelimeLink'te oynadığınız çok oyunculu (VS Modu) maçlar esnasında WebSocket üzerinden anlık
        veri aktarımı yapılır. Bu aktarım sırasında veriler sunucularımız üzerinden işlenir ancak
        kalıcı olarak saklanmaz. İletişimimiz güncel şifreleme (HTTPS/WSS) standartları kullanılarak
        korunmaktadır.
      </p>

      <h2>4. Politikadaki Değişiklikler</h2>
      <p>
        Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Herhangi bir değişiklik yapmamız
        durumunda, güncellenmiş politikayı bu sayfada yeni bir "Son Güncelleme" tarihi ile yayınlayacağız.
      </p>

      <h2>5. İletişim</h2>
      <p>
        Gizlilik Politikamız veya verilerinizin işlenmesiyle ilgili herhangi bir sorunuz varsa,
        bize <a href="mailto:krmhsnmrcn220@gmail.com">krmhsnmrcn220@gmail.com</a> adresi üzerinden
        ulaşabilirsiniz.
      </p>
    </ContentLayout>
  );
}
