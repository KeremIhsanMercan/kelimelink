import { useEffect } from 'react';
import ContentLayout from '../components/ContentLayout';

export default function About() {
  useEffect(() => {
    document.title = 'Hakkında — KelimeLink Hikayesi ve Ekip';
    document.querySelector('meta[name="description"]')?.setAttribute('content',
      'KelimeLink\'in hikayesi, arkasındaki teknoloji ve ekip. Türkçe kelime bulmacası nasıl doğdu, hangi NLP teknolojileri kullanılıyor?'
    );
  }, []);

  return (
    <ContentLayout title="Hakkında">
      <h1>KelimeLink Hakkında</h1>

      <h2>Proje Hikayesi</h2>
      <p>
        KelimeLink, İngilizce kelime oyunu <a href="https://linxicon.com" target="_blank" rel="noopener noreferrer">Linxicon</a>'dan ilham alınarak
        Türkçe dili için sıfırdan tasarlanmış bir kelime bağlantı bulmacasıdır.
        Projenin temel motivasyonu, Türkçe konuşan oyuncuların kendi dillerinde
        benzer kalitede bir semantik kelime oyunu deneyimi yaşayabilmesini sağlamaktı.
      </p>
      <p>
        Çoğu Türkçe kelime oyunu, kelime tahmin etme veya harf dizme üzerine kuruludur.
        KelimeLink ise farklı bir yaklaşım benimser: kelimeler arasındaki <em>anlamsal ilişkileri</em> keşfetmeyi
        teşvik eder. Bu sayede oyuncular, dilin gizli bağlantılarını keşfederken hem eğlenir
        hem de kelime dağarcıklarını doğal yollarla genişletir.
      </p>

      <h2>Arkasındaki Teknoloji</h2>
      <p>
        KelimeLink, doğal dil işleme (NLP) alanındaki modern gelişmelerden yararlanır.
        Sistemin temelinde, kelimelerin anlamsal ilişkilerini sayısal vektörler olarak temsil eden
        bir <strong>kelime gömme (word embedding)</strong> modeli bulunur.
      </p>

      <h3>ConceptNet Numberbatch</h3>
      <p>
        Anlamsal benzerlik hesaplamaları için <a href="https://conceptnet.io" target="_blank" rel="noopener noreferrer">ConceptNet Numberbatch</a> kullanılmaktadır.
        ConceptNet, dünyanın en kapsamlı açık kaynaklı bilgi tabanlarından biridir ve yüzlerce dilde
        milyonlarca kavram ilişkisi içerir. Numberbatch ise bu bilgiyi, her kelimeyi 300 boyutlu bir
        vektörle temsil eden yoğun bir modele dönüştürür.
      </p>
      <p>
        Bu vektörler sayesinde herhangi iki kelime arasındaki semantik mesafe, kosinüs benzerliği formülüyle
        hesaplanabilir. Yüksek kosinüs benzerliği, iki kelimenin anlam bakımından yakın olduğunu gösterir.
      </p>

      <h3>Uygulama Mimarisi</h3>
      <p>
        KelimeLink, modern bir web mimarisi üzerine kuruludur:
      </p>
      <ul>
        <li><strong>Frontend:</strong> React ve TypeScript ile geliştirilmiş, Vite ile paketlenen tek sayfa uygulaması (SPA). Kelime ağı, HTML5 Canvas üzerinde gerçek zamanlı fizik simülasyonu ile görselleştirilir.</li>
        <li><strong>Backend:</strong> Python FastAPI sunucusu. Kelime vektörlerini bellekte tutar ve benzerlik hesaplamalarını milisaniyeler içinde gerçekleştirir.</li>
        <li><strong>Gerçek Zamanlı İletişim:</strong> VS modu için WebSocket tabanlı oda yönetim sistemi. Oyuncular arasında anlık senkronizasyon sağlar.</li>
        <li><strong>Veritabanı:</strong> Günlük bulmacalar, çözüm istatistikleri ve özel bağlantı önerileri PostgreSQL veritabanında saklanır.</li>
      </ul>

      <h2>Kelime Ağı Görselleştirmesi</h2>
      <p>
        Oyun tahtası, klasik bir liste veya ızgara yerine interaktif bir <strong>ağ yapısı</strong> olarak
        tasarlanmıştır. Her kelime bir düğüm, her anlamsal bağlantı ise bir kenar olarak gösterilir.
        Bu görselleştirme, d3-force fizik motorunu kullanarak düğümlerin birbirlerini iterek ve çekerek
        doğal bir düzen oluşturmasını sağlar.
      </p>
      <p>
        Başlangıç kelimesi mavi, hedef kelime kırmızı renkte gösterilir. Eklediğiniz kelimeler hangi
        taraftaki zincire dahil olduğuna göre renklendirilir: mavi tarafa bağlananlar mavi, kırmızı
        tarafa bağlananlar kırmızı, hiçbir tarafa bağlanmayan serbest düğümler ise gri olarak gösterilir.
      </p>

      <h2>Topluluk Katkısı</h2>
      <p>
        KelimeLink'in kelime bağlantı kalitesi, oyuncu topluluğunun geri bildirimleriyle sürekli
        gelişmektedir. Oyun içinden "Bağlantı Öner" özelliğini kullanarak, beklediğiniz ancak
        oluşmayan kelime bağlantılarını raporlayabilirsiniz. Ekibimiz bu önerileri düzenli olarak
        inceleyerek modele özel bağlantılar ekler.
      </p>
      <p>
        Bu süreç sayesinde, yapay zeka modelinin kapsamadığı kültürel referanslar, deyimler ve
        Türkçe'ye özgü anlamsal ilişkiler de oyuna dahil edilmektedir.
      </p>

      <h2>İletişim</h2>
      <p>
        KelimeLink ile ilgili soru, öneri ve geri bildirimleriniz için
        bize <a href="mailto:krmhsnmrcn220@gmail.com">bu mail</a> adresinden
        ulaşabilirsiniz.
      </p>
    </ContentLayout>
  );
}
