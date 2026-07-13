import ContentLayout from '../../components/ContentLayout';
import { createArticleSchema } from '../../components/StructuredData';
import { useMemo } from 'react';

export default function BlogConceptNet() {
  const articleSchema = useMemo(() => createArticleSchema({
    title: 'ConceptNet Numberbatch: KelimeLink\'in Arkasındaki Bilgi Tabanı',
    description: 'ConceptNet Numberbatch nedir ve KelimeLink\'te kelime benzerlikleri nasıl hesaplanır? Kelime gömme vektörleri, kosinüs benzerliği ve semantik anlam hakkında teknik bir makale.',
    path: '/blog/konseptnet-nasil-calisir',
    datePublished: '2026-06-02',
    dateModified: '2026-06-02',
  }), []);

  return (
    <ContentLayout
      title="Blog"
      seo={{
        title: 'ConceptNet Numberbatch Nasıl Çalışır? — KelimeLink Blog',
        description: 'ConceptNet Numberbatch nedir ve KelimeLink\'te kelime benzerlikleri nasıl hesaplanır? Kelime gömme vektörleri, kosinüs benzerliği ve semantik anlam hakkında teknik bir makale.',
        path: '/blog/konseptnet-nasil-calisir',
        ogTitle: 'ConceptNet Numberbatch Nasıl Çalışır?',
        ogDescription: 'KelimeLink\'in arkasındaki kelime gömme teknolojisi, kosinüs benzerliği ve semantik analiz hakkında detaylı teknik makale.',
        ogType: "article",
      }}
      structuredData={articleSchema}
      breadcrumbs={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: 'ConceptNet Nasıl Çalışır?', path: '/blog/konseptnet-nasil-calisir' },
      ]}
    >
      <h1>ConceptNet Numberbatch: KelimeLink'in Arkasındaki Bilgi Tabanı</h1>
      <p className="content-page__date">Yayın Tarihi: 2 Haziran 2026</p>

      <p>
        KelimeLink oynarken girdiğiniz her kelime, arka planda karmaşık matematiksel hesaplamalardan geçer.
        Peki bir kelimeyi "güneş" yazdığınızda, "sıcak" ile bağlantı kurabileceğini ama "masa" ile
        kuramayacağını nasıl bilebiliyoruz? Bu makalede, KelimeLink'in temelini oluşturan ConceptNet
        Numberbatch teknolojisini detaylı olarak inceleyeceğiz.
      </p>

      <h2>ConceptNet Nedir?</h2>
      <p>
        <a href="https://conceptnet.io" target="_blank" rel="noopener noreferrer">ConceptNet</a>, MIT Media Lab ve
        Luminoso Technologies tarafından geliştirilen açık kaynaklı bir bilgi tabanıdır (knowledge graph).
        İnsan bilgisini yapılandırılmış bir formatta depolayan bu proje, 300'den fazla dilde milyonlarca
        kavram ve kavramlar arası ilişki içerir.
      </p>
      <p>
        ConceptNet'in diğer veritabanlarından farkı, sadece sözlük tanımları yerine <strong>sağduyu bilgisi
          (commonsense knowledge)</strong> barındırmasıdır. Örneğin ConceptNet şunları "bilir":
      </p>
      <ul>
        <li>"Yağmur yağdığında insanlar şemsiye kullanır" (NedensellikHakkında)</li>
        <li>"Köpek bir hayvan türüdür" (BirTürü)</li>
        <li>"Mutfak, evde yemek yapılan yerdir" (KullanımYeri)</li>
        <li>"Soğuk, sıcağın zıttıdır" (Karşıtı)</li>
      </ul>
      <p>
        Bu ilişkiler; Wiktionary, Open Multilingual Wordnet, oyunlaştırılmış veri toplama sistemleri
        ve uzman katkıları gibi çeşitli kaynaklardan derlenerek oluşturulmuştur.
      </p>

      <h2>Numberbatch: Kelimelerden Sayılara</h2>
      <p>
        Bilgisayarlar kelimeleri doğrudan anlayamaz, onlar için her şey sayıdır. "Numberbatch",
        ConceptNet'teki anlamsal ilişkileri sayısal vektörlere dönüştüren bir modeldir.
        Her kelime, 300 boyutlu bir sayı dizisi (vektör) olarak temsil edilir.
      </p>
      <p>
        Bu vektörler, kelimenin tüm anlamsal özelliklerini kompakt bir biçimde kodlar.
        Anlam bakımından yakın kelimeler, bu 300 boyutlu uzayda birbirine yakın konumlarda bulunur.
        Uzak kavramlar ise birbirinden uzak noktalarda yer alır. Bu yapıya <strong>"kelime gömme"
          (word embedding)</strong> denir.
      </p>
      <p>
        Numberbatch, diğer popüler kelime gömme modellerinden (Word2Vec, GloVe, FastText) farklı olarak
        sadece büyük metin veri setlerinden öğrenmez. ConceptNet'in yapılandırılmış bilgisini de
        modele entegre ederek, özellikle sağduyu gerektiren anlamsal ilişkilerde çok daha başarılı sonuçlar üretir.
      </p>

      <h2>Kosinüs Benzerliği: İki Kelime Ne Kadar Yakın?</h2>
      <p>
        İki kelimenin vektörleri elimizde olduğunda, aralarındaki "anlam mesafesini" ölçmek için
        <strong> kosinüs benzerliği</strong> formülünü kullanırız. Bu formül, iki vektör arasındaki
        açının kosinüsünü hesaplar:
      </p>
      <div className="content-page__formula">
        benzerlik(A, B) = (A · B) / (‖A‖ × ‖B‖)
      </div>
      <p>
        Sonuç -1 ile 1 arasında bir değer verir. KelimeLink'te bu değer yüzdelik olarak gösterilir:
      </p>
      <ul>
        <li><strong>%50 ve üzeri:</strong> Çok güçlü anlamsal ilişki (örn: "kedi" – "hayvan")</li>
        <li><strong>%26 – %50:</strong> Orta düzey ilişki — bağlantı oluşur (örn: "yağmur" – "şemsiye")</li>
        <li><strong>%10 – %25:</strong> Zayıf ilişki — bağlantı oluşmaz ama bir ipucu olabilir</li>
        <li><strong>%10 altı:</strong> Anlamsal olarak ilişkisiz kavramlar</li>
      </ul>

      <h2>Türkçe Kelime İşleme Zorlukları</h2>
      <p>
        Türkçe, sondan eklemeli (aglütinatif) bir dildir. Bu özellik, kelime gömme modellerinde
        özel zorluklar yaratır. Örneğin "ev", "evler", "evlerin", "evlerinizden" gibi
        biçimler aynı kök kelimeden türemesine rağmen, model bunları ayrı kelimeler olarak görebilir.
      </p>
      <p>
        KelimeLink, bu sorunu çeşitli ön-işleme adımlarıyla ele alır. Kelimelerin temel biçimleri
        (lemma) üzerinden çalışılır ve eklerin yarattığı varyasyonlar mümkün olduğunca normalize edilir.
        Buna rağmen bazı ek bağımlı anlam değişiklikleri modelin kapsamı dışında kalabilir.
      </p>

      <h2>Özel Bağlantı Sistemi</h2>
      <p>
        Hiçbir yapay zeka modeli mükemmel değildir. ConceptNet Numberbatch, birçok ilişkiyi doğru
        tespit etse de, kültürel referanslar, Türkçe'ye özgü deyimler ve güncel kavramlar
        konusunda eksik kalabilir. Bu nedenle KelimeLink, oyuncu geri bildirimlerine dayalı bir
        <strong> "özel bağlantı"</strong> sistemi kullanır.
      </p>
      <p>
        Oyuncular beklenen ancak oluşmayan bağlantıları raporlayabilir. Ekibimiz bu önerileri
        değerlendirerek, modelin matematiksel olarak tespit edemediği ancak Türkçe bilenler
        için açıkça ilişkili olan kelime çiftlerini özel bağlantılar olarak sisteme ekler.
        Bu sayede model, topluluğun kolektif dilsel bilgisiyle sürekli zenginleşir.
      </p>

      <h2>Sonuç</h2>
      <p>
        KelimeLink'in her basit görünen kelime bağlantısının arkasında, yapay zeka, dilbilim ve
        matematik alanlarının kesişiminde çalışan sofistike bir sistem bulunur. ConceptNet Numberbatch
        sayesinde kelimeler arasındaki anlam ilişkileri sayısal olarak ölçülebilir hale gelir ve
        bu da bir oyun mekaniğine dönüşür. Bir sonraki bulmacayı çözerken, her tahminizin arka
        planda 300 boyutlu bir uzayda hesaplandığını bilmek, deneyimi biraz daha ilginç kılabilir!
      </p>
    </ContentLayout>
  );
}
