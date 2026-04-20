# KelimeLink

KelimeLink is a dynamic word association game, inspired by Linxicon and WikiRun, where you try to reach a target word from a starting point using semantic relationships.

[Türkçe açıklama için aşağıya kaydırın.](#türkçe-açıklama)

---

## 🎮 How to Play?

1.  **Identify Your Target:** The game provides you with a **Start** and a **Target** word.
2.  **Make Guesses:** Guess new words that will bridge the gap between these two words.
3.  **AI Evaluation:** Each word you type is evaluated by AI (Numberbatch dataset). If your word is semantically close enough to the existing words in the network, it is added to the graph.
4.  **Establish the Connection:** When you create a continuous path from the start word to the target word, you win!

---

## 🚀 Tech Stack

### Frontend
- **Framework:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Visualization:** Dynamic network graph with [D3-force](https://github.com/d3/d3-force) and [react-force-graph](https://github.com/vasturiano/react-force-graph).
- **Styling:** Custom CSS (Modern and responsive design).

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **NLP/Semantic Analysis:** Word vectors and similarity calculations using the [ConceptNet Numberbatch](https://github.com/commonsense/conceptnet-numberbatch) dataset.
- **Database:** PostgreSQL (For daily games and statistics).

---

<h1 id="türkçe-açıklama">KelimeLink (Türkçe)</h1>

KelimeLink, kelimeler arasındaki anlamsal ilişkileri kullanarak başlangıç noktasından hedef noktasına ulaşmaya çalıştığınız dinamik bir kelime oyunudur.

## 🎮 Oyun Nasıl Oynanır?

1.  **Hedefinizi Belirleyin:** Oyun size bir **Başlangıç** ve bir **Hedef** kelime verir.
2.  **Tahmin Yürütün:** Bu iki kelime arasında köprü kuracak yeni kelimeler tahmin edin.
3.  **Yapay Zeka Değerlendirmesi:** Yazdığınız her kelime, yapay zeka (Numberbatch veri seti) tarafından değerlendirilir. Eğer kelimeniz mevcut ağdaki kelimelerle yeterli anlamsal yakınlığa sahipse ağa eklenir.
4.  **Bağlantıyı Kurun:** Başlangıç kelimesinden hedef kelimeye kesintisiz bir yol oluşturduğunuzda oyunu kazanırsınız!

---

## 🚀 Teknik Özellikler

### Frontend (İstemci)
- **Framework:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Dil:** TypeScript
- **Görselleştirme:** [D3-force](https://github.com/d3/d3-force) ve [react-force-graph](https://github.com/vasturiano/react-force-graph) ile dinamik ağ grafiği.
- **Stil:** Özel CSS (Modern ve duyarlı tasarım).

### Backend (Sunucu)
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **NLP/Anlamsal Analiz:** [ConceptNet Numberbatch](https://github.com/commonsense/conceptnet-numberbatch) veri seti kullanılarak kelime vektörleri ve benzerlik hesaplamaları.
- **Veritabanı:** PostgreSQL (Günlük oyunlar ve istatistikler için).
