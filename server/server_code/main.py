# -*- coding: utf-8-sig -*-
"""
KelimeLink FastAPI Sunucusu
Kelime vektörlerini bellekte tutar, kosinüs benzerliği hesaplar,
günlük bulmaca yönetimi yapar.
"""

import os
from datetime import date, datetime, timedelta, timezone
from contextlib import asynccontextmanager
from collections import OrderedDict
import logging
import time

from fastapi import FastAPI, HTTPException, Path, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from nlp_engine import (
    load_vectors,
    build_normalized_vectors,
    get_all_similarities_fast,
    pick_daily_pair,
    pick_practice_pair,
    batch_similarities,
)
from database import init_tables, get_daily_puzzle, save_daily_puzzle, record_solve, get_today_stats, save_custom_link_request

load_dotenv()

# ---------------------------------------------------------------------------
# Logging Configuration (TSI - UTC+3)
# ---------------------------------------------------------------------------
def tsi_time(*args):
    return datetime.now(timezone(timedelta(hours=3))).timetuple()

logging.Formatter.converter = tsi_time
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:     %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("kelimelink")

# Apply TSI formatter to uvicorn loggers as well
for name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
    _logger = logging.getLogger(name)
    _logger.propagate = False  # Prevent double logging through root logger
    for handler in _logger.handlers:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s:     %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))

# Filter to prevent duplicate logs for guess and solve (we log them manually)
class DuplicateLogFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        return "/api/guess" not in msg and "/api/solve" not in msg

logging.getLogger("uvicorn.access").addFilter(DuplicateLogFilter())

# ---------------------------------------------------------------------------
# Global constants
# ---------------------------------------------------------------------------
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "26"))
CSV_PATH = os.getenv("CSV_PATH", "../semantics_dataset/numberbatch_temiz.csv")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
GUESS_CACHE_MAX_SIZE = int(os.getenv("GUESS_CACHE_MAX_SIZE", "5000"))


# ---------------------------------------------------------------------------
# Lifespan: sunucu başlarken vektörleri yükle, tabloları oluştur
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Sunucu] Başlatılıyor...")
    # Tabloları oluştur
    try:
        init_tables()
    except Exception as e:
        logger.error(f"[Sunucu] DB tabloları oluşturulamadı: {e}")

    # Vektörleri yükle
    app.state.word_vectors = load_vectors(CSV_PATH)
    app.state.normalized_vectors = build_normalized_vectors(app.state.word_vectors)
    app.state.guess_cache = OrderedDict()
    logger.info(f"[Sunucu] {len(app.state.word_vectors)} kelime vektörü bellekte hazır.")
    yield
    logger.info("[Sunucu] Kapatılıyor...")


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
    word: str = Field(..., max_length=100)
    board_words: list[str] = Field(..., max_length=5000)
    username: str = Field(default="", max_length=20)


class SolveRequest(BaseModel):
    guess_count: int = Field(..., ge=1, le=100000)
    gamemode: str = Field(default="daily", max_length=50)
    username: str = Field(default="", max_length=20)
    path: list[str] = None


class RebuildRequest(BaseModel):
    word_a: str
    word_b: str
    guessed_words: list[str]


class CustomLinkReport(BaseModel):
    word_a: str
    word_b: str
    reason: str
    username: str = Field(default="", max_length=20)


def normalize_similarity_request(req: GuessRequest) -> tuple[str, list[str]]:
    word = req.word.strip().lower()
    board_words = [w.strip().lower() for w in req.board_words]
    return word, board_words


def build_similarity_response(word: str, board_words: list[str], word_vectors: dict):
    similarities = get_all_similarities_fast(word, board_words, word_vectors)
    links = [s for s in similarities if s["is_link"]]

    return {
        "word": word,
        "similarities": similarities,
        "links": links,
        "has_links": len(links) > 0,
    }


def canonical_board_words(word: str, board_words: list[str], vectors: dict[str, object]) -> tuple[str, ...]:
    """Stable cache key from valid board words, independent from input ordering."""
    return tuple(sorted({w for w in board_words if w != word and w in vectors}))


def get_cached_similarity_response(request: Request, word: str, board_words: list[str]) -> dict:
    normalized_vectors = request.app.state.normalized_vectors
    cache: OrderedDict = request.app.state.guess_cache
    cache_key = (word, canonical_board_words(word, board_words, normalized_vectors))

    cached = cache.get(cache_key)
    if cached is not None:
        cache.move_to_end(cache_key)
        return cached

    response = build_similarity_response(word, list(cache_key[1]), normalized_vectors)
    cache[cache_key] = response
    cache.move_to_end(cache_key)

    if len(cache) > GUESS_CACHE_MAX_SIZE:
        cache.popitem(last=False)

    return response


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health(request: Request):
    return {"status": "ok", "words_loaded": len(request.app.state.word_vectors)}


@app.get("/api/daily-puzzle")
async def daily_puzzle(request: Request):
    """
    Bugünün bulmacasını döndürür.
    Eğer bugün için bulmaca yoksa, yeni bir çift oluşturur.
    """
    word_vectors = request.app.state.word_vectors
    now = datetime.now(timezone.utc)
    today = now.date()
    
    # Bir sonraki gece yarısı (UTC)
    next_puzzle_at = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Veritabanından kontrol et
    puzzle = get_daily_puzzle(today)
    if puzzle:
        return {
            "date": today.isoformat(),
            "word_a": puzzle["word_a"],
            "word_b": puzzle["word_b"],
            "server_time": now.isoformat(),
            "next_puzzle_at": next_puzzle_at.isoformat(),
        }

    # Yeni çift oluştur (tarih bazlı seed ile tekrarlanabilir)
    seed = int(today.strftime("%Y%m%d"))
    word_a, word_b = pick_daily_pair(word_vectors, seed=seed)

    # Veritabanına kaydet
    try:
        save_daily_puzzle(today, word_a, word_b)
    except Exception as e:
        logger.error(f"[Sunucu] Bulmaca kaydetme hatası: {e}")

    return {
        "date": today.isoformat(),
        "word_a": word_a,
        "word_b": word_b,
        "server_time": now.isoformat(),
        "next_puzzle_at": next_puzzle_at.isoformat(),
    }


@app.get("/api/practice-puzzle")
async def practice_puzzle(request: Request):
    """
    Pratik modu için rastgele bir bulmaca döndürür.
    Her istek yeni bir çift oluşturur. DB'ye kaydedilmez.
    """
    word_vectors = request.app.state.word_vectors
    word_a, word_b = pick_practice_pair(word_vectors)
    return {
        "word_a": word_a,
        "word_b": word_b,
    }


@app.post("/api/guess")
async def guess(req: GuessRequest, request: Request):
    """
    Tahmin edilen kelimenin tahtadaki tüm kelimelerle benzerlik skorlarını hesaplar.
    """
    word, board_words = normalize_similarity_request(req)
    word_vectors = request.app.state.word_vectors

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

    # Log the guess in the requested format
    client_host = request.client.host if request.client else "unknown"
    client_port = request.client.port if request.client else 0
    display_name = req.username.strip() if req.username and req.username.strip() else "Anonim"
    logger.info(f"{client_host}:{client_port} - \"POST /api/guess {display_name} {word} HTTP/1.1\" 200 OK")

    return get_cached_similarity_response(request, word, board_words)


@app.post("/api/solve")
async def solve(req: SolveRequest, request: Request):
    """Anonim çözüm kaydeder. Gamemode parametresiyle farklı modları destekler."""
    now = datetime.now(timezone.utc)
    today = now.date()
    try:
        # Build path string for DB storage
        path_str_db = ", ".join(req.path) if req.path else None
        username = req.username.strip() if req.username else None

        record_solve(today, req.guess_count, req.gamemode, username=username, path=path_str_db)
        
        # Log the shortest path
        client_host = request.client.host if request.client else "unknown"
        client_port = request.client.port if request.client else 0
        
        path_items = list(req.path) if req.path else []
        if len(path_items) >= 2:
            path_items[0] = f"{path_items[0]} (word A)"
            path_items[-1] = f"{path_items[-1]} (word B)"
        
        path_str = " -> ".join(path_items) if path_items else "No path"
        display_name = req.username.strip() if req.username and req.username.strip() else "Anonim"
        logger.info(f"{client_host}:{client_port} - \"POST /api/solve {display_name} [{req.gamemode}] {path_str} HTTP/1.1\" 200 OK")
        
    except Exception as e:
        logger.error(f"[Sunucu] Çözüm kaydetme hatası: {e}")
        raise HTTPException(status_code=500, detail="İstatistik kaydedilemedi.")
    return {"status": "ok"}


@app.get("/api/stats")
async def stats(request: Request, gamemode: str = Query(default="daily", max_length=50)):
    """Bugünün global istatistiklerini döndürür. Gamemode parametresiyle filtrelenir."""
    now = datetime.now(timezone.utc)
    today = now.date()
    return get_today_stats(today, gamemode)


@app.post("/api/similarities")
async def similarities(req: GuessRequest, request: Request):
    """
    Herhangi bir kelimenin tahtadaki diğer kelimelerle benzerlik skorlarını hesaplar.
    Tahmin yerine, mevcut kelimelere tıklandığında kullanılır (başlangıç kelimeleri dahil).
    """
    word_vectors = request.app.state.word_vectors
    word, board_words = normalize_similarity_request(req)
    board_words = [w for w in board_words if w != word]

    if word not in word_vectors:
        raise HTTPException(
            status_code=404,
            detail=f"'{word}' kelimesi veritabanında bulunamadı.",
        )

    return get_cached_similarity_response(request, word, board_words)


@app.post("/api/rebuild-board")
async def rebuild_board(req: RebuildRequest, request: Request):
    """
    Tüm board'u tek seferde yeniden hesaplar.
    LocalStorage'dan yükleme yapılırken kullanılır.
    """
    word_vectors = request.app.state.word_vectors
    all_words = [req.word_a, req.word_b] + req.guessed_words
    
    # NLP motorundan toplu hesaplama iste
    result = batch_similarities(all_words, word_vectors)
    
    return result



@app.get("/api/check-word/{word}")
async def check_word(request: Request, word: str = Path(..., max_length=100)):
    """Bir kelimenin vektörlerde olup olmadığını kontrol eder."""
    word_vectors = request.app.state.word_vectors
    word = word.strip().lower()
    exists = word in word_vectors
    return {"word": word, "exists": exists}

@app.post("/api/custom-link-report")
async def custom_link_report(req: CustomLinkReport, request: Request):
    try:
        save_custom_link_request(req.word_a, req.word_b, req.reason, req.username)
        
        client_host = request.client.host if request.client else "unknown"
        client_port = request.client.port if request.client else 0
        display_name = req.username.strip() if req.username and req.username.strip() else "Anonim"
        logger.info(f"{client_host}:{client_port} - \"POST /api/custom-link-report {display_name} {req.word_a} {req.word_b} HTTP/1.1\" 200 OK")
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"[Sunucu] Özel bağlantı isteği kaydetme hatası: {e}")
        raise HTTPException(status_code=500, detail="Özel bağlantı isteği kaydedilemedi.")

# Serve static files (React frontend)
# Make sure the 'static' directory exists (it will be created by the Docker build)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    # Eğer hata bir API isteğinden geliyorsa
    if request.url.path.startswith("/api/"):
        # HTTPException'dan gelen asıl mesajı korumak için exc.detail kullanıyoruz
        return JSONResponse(
            status_code=404,
            content={"detail": getattr(exc, "detail", "Not Found")}
        )
    
    # API değilse (sayfa yenileme vb.) React index.html'i dön
    return FileResponse("static/index.html")