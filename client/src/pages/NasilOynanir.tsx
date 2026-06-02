import { useEffect } from 'react';
import ContentLayout from '../components/ContentLayout';

export default function HowToPlay() {
  useEffect(() => {
    document.title = 'Nasıl Oynanır? — KelimeLink Oyun Rehberi';
    document.querySelector('meta[name="description"]')?.setAttribute('content',
      'KelimeLink nasıl oynanır? Detaylı oyun rehberi, ipuçları, strateji önerileri ve oyun modlarının açıklamaları. Kelime bağlantı bulmacasında ustalaşın!'
    );
  }, []);

  return (
    <ContentLayout title="Nasıl Oynanır?">
      <h1>KelimeLink Nasıl Oynanır? — Detaylı Oyun Rehberi</h1>

      <p>
        KelimeLink, iki kelime arasında anlamsal köprüler kurarak bağlantı oluşturduğunuz
        bir Türkçe kelime bulmacasıdır. Her bulmacada size bir <strong>başlangıç kelimesi</strong> ve
        bir <strong>hedef kelime</strong> verilir. Amacınız, bu iki kelime arasında anlam bakımından
        ilişkili kelimeler ekleyerek bir yol oluşturmaktır.
      </p>

      <h2>Temel Oyun Mekaniği</h2>
      <p>
        Oyun, kelimeler arasındaki anlamsal benzerliği ölçmek için yapay zeka tabanlı bir dil modeli kullanır.
        Eklediğiniz her kelime, tahtadaki diğer tüm kelimelerle karşılaştırılır. Eğer iki kelime arasındaki
        benzerlik skoru <strong>%26 veya üzerindeyse</strong>, aralarında otomatik olarak bir bağlantı oluşur.
      </p>
      <p>
        Benzerlik skoru, kelimelerin gerçek dünyadaki kullanım bağlamlarına dayanır. Örneğin "güneş" ve "sıcak"
        kelimeleri yüksek benzerlik gösterir çünkü günlük dilde sıkça birlikte kullanılırlar. Ancak "güneş" ve
        "kitap" gibi uzak kavramlar arasında doğrudan bir bağlantı oluşmaz, işte bu noktada sizin
        yaratıcılığınız devreye girer.
      </p>

      <h2>Adım Adım Oynama Rehberi</h2>
      <ol>
        <li>
          <strong>Kelime çiftini inceleyin:</strong> Ekranın sol tarafında başlangıç (mavi) ve hedef (kırmızı)
          kelimeler gösterilir. Bu iki kelime arasında bir yol kurmanız gerekir.
        </li>
        <li>
          <strong>Köprü kelime düşünün:</strong> Her iki kelimeyle de anlamsal olarak ilişkili olabilecek
          kelimeler bulmaya çalışın. Örneğin "deniz" ile "kuş" arasında "martı" iyi bir köprü olabilir.
        </li>
        <li>
          <strong>Kelimeyi girin:</strong> Sol paneldeki metin kutusuna kelimeyi yazıp "Ekle" butonuna basın
          veya Enter tuşuna basın.
        </li>
        <li>
          <strong>Bağlantıları takip edin:</strong> Eklenen kelime, grafik üzerinde bir düğüm olarak belirir.
          Bağlantı oluştuğu kelimelerle çizgilerle birleştirilir.
        </li>
        <li>
          <strong>Yolu tamamlayın:</strong> Başlangıç kelimesinden hedef kelimeye kesintisiz bir yol
          oluştuğunda bulmacayı çözmüş olursunuz!
        </li>
      </ol>

      <h2>Oyun Modları</h2>

      <h3>🗓️ Günlük Bulmaca</h3>
      <p>
        Her gün UTC gece yarısında yeni bir kelime çifti yayınlanır. Tüm oyuncular aynı bulmacayı çözer.
        Günlük bulmacada en az tahminle çözen oyuncu, o günün rekortmeni olarak gösterilir. Günlük bulmaca
        modunda ipucu kullanılamaz, bu modu gerçek bir meydan okuma olarak düşünün.
      </p>

      <h3>⚔️ Pratik Modu</h3>
      <p>
        Sınırsız sayıda rastgele kelime çifti ile antrenman yapabilirsiniz. Pratik modunda ipucu alma
        özelliği aktiftir, böylece zor durumda kaldığınızda sistemden yardım isteyebilirsiniz. İpuçları grafiğe eklediğiniz son kelimeye göre verilir.
        Algoritma uygun ipucu kelimesi bulamazsa yeni bir tahmin yapıp tekrar deneyebilirsiniz.
        Yeni stratejiler denemek ve kelime dağarcığınızı geliştirmek için idealdir.
      </p>

      <h3>👥 VS (Karşılaşma) Modu</h3>
      <p>
        Arkadaşlarınızla gerçek zamanlı olarak aynı bulmacayı çözmeye yarışın! Bir oda oluşturarak
        veya arkadaşınızın odasına katılarak oyun başlatabilirsiniz. Aynı kelime çiftini kim daha az
        tahminle çözerse o kazanır. Oda sahibi isterse başlangıç ve hedef kelimelerini belirleyebilir ya da istediği kelimeleri "yasaklı" olarak
        belirleyerek oyunu daha zorlu hale getirebilir.
      </p>

      <h2>Strateji İpuçları</h2>

      <h3>Başlangıç Stratejisi: "Ortadan Köprü" Tekniği</h3>
      <p>
        İki uzak kelime arasında doğrudan bağlantı kurmak yerine, her ikisinin de ortak bir
        kategorisiyle ilişkili bir "orta kelime" bulmaya çalışın. Örneğin "bilgisayar" ile "orman"
        arasında bir bağlantı kurmak istiyorsanız, "ağaç" kelimesi hem bilgisayarın "karar ağacı"
        bağlamında hem de ormanın doğal bağlamında ilişkili olabilir.
      </p>

      <h3>Kategori Zincirleri</h3>
      <p>
        Kelimeleri soyut kategoriler üzerinden birbirine bağlamayı deneyin. Somut nesneler,
        duygular, renkler, mevsimler, meslekler gibi geniş kategoriler sıklıkla güçlü semantik
        köprüler oluşturur.
      </p>

      <h3>Benzerlik Skorlarını Kullanın</h3>
      <p>
        Tahtadaki herhangi bir kelimeye tıklayarak o kelimenin diğer kelimelerle benzerlik
        skorlarını görebilirsiniz. %26'nın altında kalan bağlantılar oluşmaz, ancak %20-25
        aralığındaki skorlar size yakın kavramlar hakkında ipucu verebilir.
      </p>

      <h2>Sık Sorulan Sorular</h2>

      <h3>Benzerlik skoru nasıl hesaplanıyor?</h3>
      <p>
        KelimeLink, kelimeleri çok boyutlu vektörler olarak temsil eden bir dil modeli kullanır.
        İki kelimenin vektörleri arasındaki kosinüs benzerliği hesaplanarak yüzdelik bir skor elde edilir.
        Bu model, ConceptNet Numberbatch adlı açık kaynaklı bir bilgi tabanı üzerine kuruludur ve
        kelimelerin gerçek dünyadaki anlamsal ilişkilerini yansıtır.
      </p>

      <h3>Neden bazı kelimeler tanınmıyor?</h3>
      <p>
        KelimeLink'in sözlüğü, Türkçe'nin en yaygın kullanılan kelimelerini kapsar. Çok nadir
        kullanılan kelimeler veya birden fazla ek getirerek türetilmiş sözcükler sözlükte bulunmayabilir.
        Böyle bir durumla karşılaştığınızda farklı bir kelime denemenizi öneririz.
      </p>

      <h3>Beklediğim bağlantı neden oluşmadı?</h3>
      <p>
        Anlamsal benzerlik modeli, insan sezgisinden farklı sonuçlar üretebilir. Sizin için
        açıkça ilişkili olan iki kelime, modelin eğitim verisinde birlikte sık kullanılmamış
        olabilir. Böyle durumlarda bağlantı önerisi gönderebilirsiniz. Ekibimiz, istekleri sık sık inceleyerek özel
        bağlantılar ekliyor ve böylece oyun veritabanını her geçen gün genişletiyoruz.
      </p>

      <h3>İstatistiklerim nerede saklanıyor?</h3>
      <p>
        Oyun istatistikleriniz (çözülen bulmaca sayısı, ortalama tahmin sayısı, seri kayıtları)
        tarayıcınızın yerel depolama alanında (localStorage) tutulur. Bu veriler cihazınıza özeldir
        ve sunucularımıza kişisel bilgi olarak gönderilmez.
      </p>
    </ContentLayout>
  );
}
