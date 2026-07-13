import ContentLayout from '../../components/ContentLayout';
import { createArticleSchema } from '../../components/StructuredData';
import { useMemo } from 'react';

export default function LinxiconTurkce() {
  const articleSchema = useMemo(() => createArticleSchema({
    title: 'Linxicon Türkçe Var mı? KelimeLink ile Karşılaştırma',
    description: 'Linxicon nedir, resmi Türkçe sürümü var mı ve KelimeLink hangi yönleriyle benziyor, hangi yönleriyle ayrışıyor? Detaylı karşılaştırma.',
    path: '/blog/linxicon-turkce',
    datePublished: '2026-07-13',
    dateModified: '2026-07-13',
  }), []);

  return (
    <ContentLayout
      title="Blog"
      seo={{
        title: 'Linxicon Türkçe Var mı? KelimeLink ile Karşılaştırma — KelimeLink Blog',
        description: 'Linxicon nedir, resmi Türkçe sürümü var mı ve KelimeLink ile farkları nelerdir? Linxicon alternatifi KelimeLink\'i keşfedin.',
        path: '/blog/linxicon-turkce',
        ogTitle: 'Linxicon Türkçe Var mı? KelimeLink ile Farkları',
        ogDescription: 'Linxicon\'un Türkçe sürümü yok — ama KelimeLink var. İki oyun arasındaki benzerlikler ve farklar.',
        ogType: "article",
      }}
      structuredData={articleSchema}
      breadcrumbs={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: 'Linxicon Türkçe', path: '/blog/linxicon-turkce' },
      ]}
    >
      <h1>Linxicon Türkçe Var mı? KelimeLink ile Karşılaştırma</h1>
      <p className="content-page__date">Yayın Tarihi: 13 Temmuz 2026</p>

      <p>
        İngilizce kelime oyunları dünyasında{' '}
        <a href="https://linxicon.com" target="_blank" rel="noopener noreferrer">Linxicon</a>,
        anlam bağlantılarına dayalı özgün yapısıyla kısa sürede geniş bir oyuncu kitlesine ulaştı.
        Peki Türkçe konuşanlar için ne var? Bu yazıda Linxicon'u yakından tanıyacak,
        neden resmi bir Türkçe sürümünün bulunmadığını ele alacak ve KelimeLink'in bu boşluğu nasıl doldurduğunu —
        hem benzerlikleri hem de köklü farklarıyla — aktaracağız.
      </p>

      <h2>Linxicon Nedir?</h2>
      <p>
        Linxicon, iki başlangıç kelimesi arasında anlamsal köprüler kurarak bağlantı zinciri oluşturmanızı
        isteyen İngilizce bir kelime oyunudur. Oyun tahtasına kelime yazdığınızda, sistem arka planda
        bu kelimenin İngilizce vektör temsilini hesaplar ve tablodaki diğer kelimelerle kosinüs benzerliğini
        (%41 eşiği üzeri) karşılaştırır. Yeterince benzer iki kelime arasında görsel bir bağlantı çizgisi oluşur;
        bu zincirleme bağlantı iki başlangıç kelimesini birleştirdiğinde oyun kazanılır.
      </p>
      <p>
        Anlamsal benzerlik hesaplaması için{' '}
        <strong>sentence-transformers/all-MiniLM-L6-v2</strong> modeli kullanılır.
        Oyun alanına en fazla 50 kelime eklenebilir; başka bir deyişle 50 kelime dolmadan kazanamazsanız
        oyun sona erer. 25. kelimeden itibaren başka oyuncuların kullandığı bir kelimeyi ipucu olarak
        görmek mümkündür.
      </p>

      <h2>Resmi Türkçe Sürümü Var mı?</h2>
      <p>
        Hayır, Linxicon'un resmi olarak duyurulmuş bir Türkçe sürümü bulunmuyor.
        Bunun arkasında birkaç teknik ve pratik neden sayılabilir:
      </p>
      <ul>
        <li>
          <strong>Model dil kısıtlaması:</strong> Linxicon'un kullandığı{' '}
          <em>sentence-transformers/all-MiniLM-L6-v2</em> modeli ağırlıklı olarak
          İngilizce metinler üzerinde eğitilmiştir. Türkçe kelimeleri bu modele beslemek,
          düşük kaliteli veya tutarsız benzerlik puanlarına yol açar.
        </li>
        <li>
          <strong>Ekagglütinative dil zorluğu:</strong> Türkçe, sondan eklemeli bir dildir.
          "Ev", "evde", "evdeki", "evdekilerin" gibi kökleri aynı olan kelimeler, İngilizce odaklı
          bir modelde birbirinden çok farklı vektörlere sahip olabilir; bu da oyun mekaniklerini kırar.
        </li>
        <li>
          <strong>Yerelleştirme maliyeti:</strong> Sadece çeviri yetmez. Türkçedeki eş seslilik gibi
          bu tarz bir bulmaca için çok önemli olan birçok dilbilimsel özellik göz önünde bulundurulmalıdır.
        </li>
      </ul>
      <p>
        Kısaca, Linxicon Türkçe'yi desteklemek için tasarlanmamış bir altyapı üzerine kurulu.
        Bu da Türkçe konuşanların oyunu İngilizce oynamak zorunda kalması anlamına geliyor.
      </p>

      <h2>KelimeLink Hangi Yönleriyle Linxicon'a Benziyor?</h2>
      <p>
        KelimeLink, Linxicon'dan ilham alınarak sıfırdan Türkçe için inşa edilmiştir.
        İki oyun arasında pek çok temel benzerlik bulunur:
      </p>
      <ul>
        <li>
          <strong>Çekirdek mekanik:</strong> Her iki oyunda da iki başlangıç kelimesini anlamsal köprülerle
          birleştirmeye çalışırsınız. Az kelimeyle bulmacayı çözmek ana hedeftir.
        </li>
        <li>
          <strong>Graf (ağ) görselleştirmesi:</strong> Kelimeler ve bağlantılar, düğümler ve kenarlardan
          oluşan interaktif bir ağ olarak görselleştirilir. Renk kodlaması hangi kelimenin hangi tarafa
          (başlangıç/hedef) bağlı olduğunu gösterir.
        </li>
        <li>
          <strong>Anlamsal benzerlik motoru:</strong> Her iki oyun da kelimeleri vektör uzayında
          temsil eder ve bağlantıyı kosinüs benzerliğiyle belirler.
        </li>
        <li>
          <strong>Günlük bulmaca formatı:</strong> Her gün tüm oyuncular için ortak bir kelime
          çifti yayınlanır; günün rekortmeni özel olarak kayıt altına alınır.
        </li>
        <li>
          <strong>Pratik modu:</strong> İki oyunda da pratik modunu kullanarak sınırsız sayıda
          bulmacayı deneyimleyebilirsiniz.
        </li>
      </ul>

      <h2>KelimeLink'i Linxicon'dan Ayıran Farklar</h2>

      <h3>🧠 Farklı NLP Modeli ve Dil Altyapısı</h3>
      <p>
        Linxicon, İngilizce merkezli <em>sentence-transformers/all-MiniLM-L6-v2</em> modelini kullanır
        ve bağlantı eşiği <strong>%41</strong>'dir.
      </p>
      <p>
        KelimeLink ise çok dilli{' '}
        <a href="https://conceptnet.io" target="_blank" rel="noopener noreferrer">ConceptNet Numberbatch</a>{' '}
        modeline dayanır. Bu model, yüzlerce dildeki kavram ilişkilerini birleştirerek
        her kelimeyi 300 boyutlu bir vektörle ifade eder ve Türkçe için güçlü semantik
        kapsama sunar. KelimeLink'teki bağlantı eşiği ise kapsamlı testler sonucunda
        <strong> %26</strong> olarak belirlenmiştir; bu eşik Türkçenin morfolojik
        zenginliğine daha uygun bir denge noktasıdır.
      </p>

      <h3>📖 Özel Türkçe Bağlantı Veritabanı</h3>
      <p>
        ConceptNet'in her zaman yakalayamadığı kültürel referanslar, deyimler ve
        Türkçe'ye özgü anlamsal ilişkiler için KelimeLink'in kendine ait bir
        <strong> özel bağlantı veritabanı</strong> bulunur. Oyuncular "Bağlantı Öner"
        özelliğiyle eksik bağlantıları bildirebilir; ekibimiz bunları inceleyerek modele ekler.
        Linxicon'da benzer bir topluluk katılım mekanizması yoktur.
      </p>

      <h3>⚔️ VS Modu (Gerçek Zamanlı Çok Oyunculu)</h3>
      <p>
        KelimeLink, arkadaşlarınızla aynı anda gerçek zamanlı olarak yarışmanıza olanak tanıyan
        <strong> VS modu</strong> sunar. Özel oda oluşturabilir, aynı kelime çiftini kimin
        daha hızlı çözeceğini test edebilirsiniz. Linxicon tek oyunculu bir deneyim olarak tasarlanmıştır.
      </p>

      <h3>🔢 Bağlantı Eşiği ve Kaybetme Koşulu</h3>
      <p>
        Linxicon'da 50 kelime dolmadan başarısız olursanız oyun biter — yani kaybedebilirsiniz.
        KelimeLink'te böyle bir kaybetme koşulu yoktur; pes etmediğiniz sürece denemeye devam
        edebilirsiniz.
      </p>

      <h3>💡 İpucu Sistemi</h3>
      <p>
        Linxicon'da ipucu, yalnızca 25. kelimeden sonra ve yalnızca başka bir oyuncunun daha önce
        kullandığı bir kelimeyi gösterir; pratik modda ipucu yoktur.
      </p>
      <p>
        KelimeLink'te ipucu sistemi çok daha gelişkindir: Normal ipucu, Süper İpucu ve "En İyi
        Alternatif" stratejileri sayesinde size hedefe giden en uygun kelimeyi önerir.
        Üstelik bu sistem yalnızca pratik modda aktiftir; günlük bulmacada bağımsız düşünme ön plandadır.
      </p>

      <h3>🌍 Dil ve Kültürel Odak</h3>
      <p>
        Linxicon İngilizce konuşan bir küresel kitleye hitap eder. KelimeLink ise
        doğrudan <strong>Türk kullanıcılar için</strong> optimize edilmiştir: Türkçe kelime dağarcığı,
        Türkçe karakter desteği, Türkçe içerik ve topluluk. Bu odaklanma,
        dil modelinin Türkçe kelimeleri daha tutarlı biçimde temsil etmesini sağlar.
      </p>

      <h2>Özet Karşılaştırma Tablosu</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Özellik</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Linxicon</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>KelimeLink</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Dil', 'İngilizce', 'Türkçe'],
              ['NLP Modeli', 'MiniLM-L6-v2', 'ConceptNet Numberbatch'],
              ['Bağlantı Eşiği', '%41', '%26'],
              ['Maksimum Kelime / Kaybetme', '50 kelime — kaybedebilirsiniz', 'Sınır yok — kaybetmek mümkün değil'],
              ['Günlük Bulmaca', '✓', '✓'],
              ['Çok Oyunculu (VS Modu)', '✗', '✓'],
              ['İpucu Sistemi', 'Tek tip (25. kelimeden sonra)', 'Normal / Süper / En İyi Alternatif'],
              ['Topluluk Bağlantı Önerisi', '✗', '✓'],
              ['Özel Kültürel Bağlantı DB', '✗', '✓'],
            ].map(([feature, linxicon, kelimelink], i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--color-surface)',
                }}
              >
                <td style={{ padding: '9px 14px', fontWeight: 500 }}>{feature}</td>
                <td style={{ padding: '9px 14px', opacity: 0.85 }}>{linxicon}</td>
                <td style={{ padding: '9px 14px', color: 'var(--primary-color)', fontWeight: 500 }}>{kelimelink}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Sonuç: Linxicon Alternatifi Olarak KelimeLink</h2>
      <p>
        Linxicon, İngilizce kelime anlam oyunlarını yeniden tanımlayan öncü bir proje.
        Ancak Türkçe konuşan oyuncular için ne resmi bir sürüm ne de yeterli dil desteği sunuyor.
      </p>
      <p>
        <strong>KelimeLink</strong>, yalnızca Linxicon'un Türkçe çevirisi değil;
        Türkçenin morfolojik yapısına, kültürel bağlamına ve oyuncu geri bildirimlerine göre
        özgün biçimde geliştirilmiş bir <strong>linxicon alternatifi</strong>dir.
        Farklı bir NLP altyapısı, topluluk odaklı bağlantı sistemi ve gerçek zamanlı VS modu ile
        Türkçe kelime oyunlarını yeni bir boyuta taşıyor.
      </p>
      <p>
        Henüz denemediyseniz,{' '}
        <a href="/">KelimeLink'i buradan oynamaya</a> başlayabilirsiniz.
      </p>
    </ContentLayout>
  );
}
