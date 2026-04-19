# -*- coding: utf-8-sig -*-
"""
KelimeLink FastAPI Sunucusu
Kelime vektörlerini bellekte tutar, kosinüs benzerliği hesaplar,
günlük bulmaca yönetimi yapar.
"""

import os
from datetime import date
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from nlp_engine import load_vectors, cosine_similarity, get_all_similarities, pick_daily_pair, pick_practice_pair
from database import init_tables, get_daily_puzzle, save_daily_puzzle, record_solve, get_today_stats

load_dotenv()

# ---------------------------------------------------------------------------
# Global: kelime vektörleri bellekte tutulacak
# ---------------------------------------------------------------------------
word_vectors: dict = {}

SIMILARITY_THRESHOLD = int(os.getenv("SIMILARITY_THRESHOLD", "27.5"))
CSV_PATH = os.getenv("CSV_PATH", "../semantics_dataset/numberbatch_temiz.csv")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")


# ---------------------------------------------------------------------------
# Lifespan: sunucu başlarken vektörleri yükle, tabloları oluştur
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global word_vectors
    print("[Sunucu] Başlatılıyor...")
    # Tabloları oluştur
    try:
        init_tables()
    except Exception as e:
        print(f"[Sunucu] DB tabloları oluşturulamadı: {e}")

    # Vektörleri yükle
    word_vectors = load_vectors(CSV_PATH)
    print(f"[Sunucu] {len(word_vectors)} kelime vektörü bellekte hazır.")
    yield
    print("[Sunucu] Kapatılıyor...")


app = FastAPI(
    title="KelimeLink API",
    description="Türkçe kelime bağlantı bulmacası API'si",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic modelleri
# ---------------------------------------------------------------------------
class GuessRequest(BaseModel):
    word: str
    board_words: list[str]


class SolveRequest(BaseModel):
    guess_count: int
    is_practice: bool = False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok", "words_loaded": len(word_vectors)}


@app.get("/api/daily-puzzle")
async def daily_puzzle():
    """
    Bugünün bulmacasını döndürür.
    Eğer bugün için bulmaca yoksa, yeni bir çift oluşturur.
    """
    today = date.today()

    # Veritabanından kontrol et
    puzzle = get_daily_puzzle(today)
    if puzzle:
        return {
            "date": today.isoformat(),
            "word_a": puzzle["word_a"],
            "word_b": puzzle["word_b"],
        }

    # Yeni çift oluştur (tarih bazlı seed ile tekrarlanabilir)
    seed = int(today.strftime("%Y%m%d"))
    word_a, word_b = pick_daily_pair(word_vectors, seed=seed)

    # Veritabanına kaydet
    try:
        save_daily_puzzle(today, word_a, word_b)
    except Exception as e:
        print(f"[Sunucu] Bulmaca kaydetme hatası: {e}")

    return {
        "date": today.isoformat(),
        "word_a": word_a,
        "word_b": word_b,
    }


@app.get("/api/practice-puzzle")
async def practice_puzzle():
    """
    Pratik modu için rastgele bir bulmaca döndürür.
    Her istek yeni bir çift oluşturur. DB'ye kaydedilmez.
    """
    word_a, word_b = pick_practice_pair(word_vectors)
    return {
        "word_a": word_a,
        "word_b": word_b,
    }


@app.post("/api/guess")
async def guess(req: GuessRequest):
    """
    Tahmin edilen kelimenin tahtadaki tüm kelimelerle benzerlik skorlarını hesaplar.
    """
    word = req.word.strip().lower()
    board_words = [w.strip().lower() for w in req.board_words]

    # Kelime vektörlerde var mı?
    if word not in word_vectors:
        raise HTTPException(
            status_code=404,
            detail=f"'{word}' kelimesi veritabanında bulunamadı.",
        )

    # Aynı kelime zaten tahtada mı?
    if word in board_words:
        raise HTTPException(
            status_code=400,
            detail=f"'{word}' zaten tahtada mevcut.",
        )

    # Tüm benzerlik skorlarını hesapla
    similarities = get_all_similarities(word, board_words, word_vectors)

    # Bağlantıları (linkler) filtrele
    links = [s for s in similarities if s["is_link"]]

    return {
        "word": word,
        "similarities": similarities,
        "links": links,
        "has_links": len(links) > 0,
    }


@app.post("/api/solve")
async def solve(req: SolveRequest):
    """Anonim çözüm kaydeder. Pratik mod ise sabit tarihe (2003-05-26) kaydeder."""
    target_date = date(2003, 5, 26) if req.is_practice else date.today()
    try:
        record_solve(target_date, req.guess_count)
    except Exception as e:
        print(f"[Sunucu] Çözüm kaydetme hatası: {e}")
        raise HTTPException(status_code=500, detail="İstatistik kaydedilemedi.")
    return {"status": "ok"}


@app.get("/api/stats")
async def stats():
    """Bugünün global istatistiklerini döndürür."""
    today = date.today()
    return get_today_stats(today)


class SimilarityRequest(BaseModel):
    word: str
    board_words: list[str]


@app.post("/api/similarities")
async def similarities(req: SimilarityRequest):
    """
    Herhangi bir kelimenin tahtadaki diğer kelimelerle benzerlik skorlarını hesaplar.
    Tahmin yerine, mevcut kelimelere tıklandığında kullanılır (başlangıç kelimeleri dahil).
    """
    word = req.word.strip().lower()
    board_words = [w.strip().lower() for w in req.board_words if w.strip().lower() != word]

    if word not in word_vectors:
        raise HTTPException(
            status_code=404,
            detail=f"'{word}' kelimesi veritabanında bulunamadı.",
        )

    similarities = get_all_similarities(word, board_words, word_vectors)
    links = [s for s in similarities if s["is_link"]]

    return {
        "word": word,
        "similarities": similarities,
        "links": links,
        "has_links": len(links) > 0,
    }


@app.get("/api/check-word/{word}")
async def check_word(word: str):
    """Bir kelimenin vektörlerde olup olmadığını kontrol eder."""
    word = word.strip().lower()
    exists = word in word_vectors
    return {"word": word, "exists": exists}
