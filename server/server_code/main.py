# -*- coding: utf-8-sig -*-
"""
KelimeLink FastAPI Sunucusu
"""

import os
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from collections import OrderedDict
import logging

from fastapi import FastAPI, HTTPException, Path, Query, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from config import (
    API_TITLE, API_DESCRIPTION, API_VERSION,
    SIMILARITY_THRESHOLD, CSV_PATH, CORS_ORIGINS, GUESS_CACHE_MAX_SIZE,
    ADMIN_API_KEY
)
from nlp_engine import (
    load_vectors,
    build_normalized_vectors,
    get_all_similarities_fast,
    pick_daily_pair,
    pick_practice_pair,
    batch_similarities,
)
from database import (
    init_tables, get_daily_puzzle, save_daily_puzzle, 
    record_solve, get_today_stats, save_custom_link_request, 
    get_all_custom_links, add_custom_link
)
import vs_manager

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

# Apply TSI formatter to uvicorn loggers
for name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
    _logger = logging.getLogger(name)
    _logger.propagate = False
    for handler in _logger.handlers:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s:     %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))

class DuplicateLogFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        return "/api/guess" not in msg and "/api/solve" not in msg

logging.getLogger("uvicorn.access").addFilter(DuplicateLogFilter())


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
async def verify_admin(x_api_key: str = Header(None)):
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Geçersiz API anahtarı.")
    return x_api_key


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Sunucu] Başlatılıyor...")
    try:
        init_tables()
    except Exception as e:
        logger.error(f"[Sunucu] DB tabloları oluşturulamadı: {e}")

    app.state.custom_links_dict = get_all_custom_links()
    app.state.word_vectors = load_vectors(CSV_PATH)
    app.state.normalized_vectors = build_normalized_vectors(app.state.word_vectors)
    app.state.guess_cache = OrderedDict()
    logger.info(f"[Sunucu] {len(app.state.word_vectors)} kelime vektörü bellekte hazır.")
    yield
    logger.info("[Sunucu] Kapatılıyor...")


app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vs_manager.router)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class GuessRequest(BaseModel):
    word: str = Field(..., max_length=100)
    board_words: list[str] = Field(..., max_length=5000)
    username: str = Field(default="", max_length=20)

class SolveRequest(BaseModel):
    guess_count: int = Field(..., ge=1, le=100000)
    gamemode: str = Field(default="daily", max_length=50)
    username: str = Field(default="", max_length=20)
    path: list[str] = Field(default_factory=list)

class RebuildRequest(BaseModel):
    word_a: str
    word_b: str
    guessed_words: list[str]

class CustomLinkReport(BaseModel):
    word_a: str
    word_b: str
    reason: str
    username: str = Field(default="", max_length=20)

class AddCustomLinkRequest(BaseModel):
    word_a: str
    word_b: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def normalize_word(word: str) -> str:
    return word.strip().lower()

def canonical_board_words(word: str, board_words: list[str], vectors: dict) -> tuple[str, ...]:
    return tuple(sorted({normalize_word(w) for w in board_words if normalize_word(w) != word and normalize_word(w) in vectors}))

def get_cached_similarity_response(request: Request, word: str, board_words: list[str]) -> dict:
    normalized_vectors = request.app.state.normalized_vectors
    cache = request.app.state.guess_cache
    cache_key = (word, canonical_board_words(word, board_words, normalized_vectors))

    cached = cache.get(cache_key)
    if cached is not None:
        cache.move_to_end(cache_key)
        return cached

    custom_links_dict = request.app.state.custom_links_dict
    similarities = get_all_similarities_fast(word, list(cache_key[1]), normalized_vectors, custom_links_dict)
    links = [s for s in similarities if s["is_link"]]
    
    response = {
        "word": word,
        "similarities": similarities,
        "links": links,
        "has_links": len(links) > 0,
    }
    
    cache[cache_key] = response
    cache.move_to_end(cache_key)
    if len(cache) > GUESS_CACHE_MAX_SIZE:
        cache.popitem(last=False)

    return response


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health(request: Request):
    return {"status": "ok", "words_loaded": len(request.app.state.word_vectors)}


@app.get("/api/daily-puzzle")
async def daily_puzzle(request: Request):
    word_vectors = request.app.state.word_vectors
    now = datetime.now(timezone.utc)
    today = now.date()
    next_puzzle_at = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

    puzzle = get_daily_puzzle(today)
    if puzzle:
        return {
            "date": today.isoformat(),
            "word_a": puzzle["word_a"],
            "word_b": puzzle["word_b"],
            "server_time": now.isoformat(),
            "next_puzzle_at": next_puzzle_at.isoformat(),
        }

    seed = int(today.strftime("%Y%m%d"))
    custom_links_dict = request.app.state.custom_links_dict
    word_a, word_b = pick_daily_pair(word_vectors, custom_links_dict, seed=seed)

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
    word_vectors = request.app.state.word_vectors
    custom_links_dict = request.app.state.custom_links_dict
    word_a, word_b = pick_practice_pair(word_vectors, custom_links_dict)
    return {"word_a": word_a, "word_b": word_b}


@app.post("/api/guess")
async def guess(req: GuessRequest, request: Request):
    word = normalize_word(req.word)
    board_words = [normalize_word(w) for w in req.board_words]
    word_vectors = request.app.state.word_vectors

    if word not in word_vectors:
        raise HTTPException(status_code=404, detail=f"'{word}' kelimesi sözlükte bulunamadı.")
    if word in board_words:
        raise HTTPException(status_code=400, detail=f"'{word}' zaten tahtada mevcut.")

    # Logging
    client_host = request.client.host if request.client else "unknown"
    display_name = req.username.strip() if req.username and req.username.strip() else "Anonim"
    logger.info(f"{client_host} - \"POST /api/guess {display_name} {word} HTTP/1.1\" 200 OK")

    return get_cached_similarity_response(request, word, board_words)


@app.post("/api/solve")
async def solve(req: SolveRequest, request: Request):
    now = datetime.now(timezone.utc)
    today = now.date()
    try:
        path_str_db = ", ".join(req.path) if req.path else None
        username = req.username.strip() if req.username else None
        record_solve(today, req.guess_count, req.gamemode, username=username, path=path_str_db)
        
        # Logging
        client_host = request.client.host if request.client else "unknown"
        path_items = list(req.path) if req.path else []
        if len(path_items) >= 2:
            path_items[0] = f"{path_items[0]} (word A)"
            path_items[-1] = f"{path_items[-1]} (word B)"
        path_str = " -> ".join(path_items) if path_items else "No path"
        display_name = username or "Anonim"
        logger.info(f"{client_host} - \"POST /api/solve {display_name} [{req.gamemode}] {path_str} HTTP/1.1\" 200 OK")
    except Exception as e:
        logger.error(f"[Sunucu] Çözüm kaydetme hatası: {e}")
        raise HTTPException(status_code=500, detail="İstatistik kaydedilemedi.")
    return {"status": "ok"}


@app.get("/api/stats")
async def stats(gamemode: str = Query(default="daily", max_length=50)):
    today = datetime.now(timezone.utc).date()
    return get_today_stats(today, gamemode)


@app.post("/api/similarities")
async def similarities(req: GuessRequest, request: Request):
    word = normalize_word(req.word)
    board_words = [normalize_word(w) for w in req.board_words if normalize_word(w) != word]
    word_vectors = request.app.state.word_vectors

    if word not in word_vectors:
        raise HTTPException(status_code=404, detail=f"'{word}' kelimesi sözlükte bulunamadı.")

    return get_cached_similarity_response(request, word, board_words)


@app.post("/api/rebuild-board")
async def rebuild_board(req: RebuildRequest, request: Request):
    word_vectors = request.app.state.word_vectors
    custom_links_dict = request.app.state.custom_links_dict
    all_words = [req.word_a, req.word_b] + req.guessed_words
    return batch_similarities(all_words, word_vectors, custom_links_dict)


@app.get("/api/check-word/{word}")
async def check_word(request: Request, word: str = Path(..., max_length=100)):
    word_vectors = request.app.state.word_vectors
    word = normalize_word(word)
    return {"word": word, "exists": word in word_vectors}


@app.post("/api/custom-link-report")
async def custom_link_report(req: CustomLinkReport, request: Request):
    try:
        save_custom_link_request(req.word_a, req.word_b, req.reason, req.username)
        client_host = request.client.host if request.client else "unknown"
        display_name = req.username.strip() if req.username and req.username.strip() else "Anonim"
        logger.info(f"{client_host} - \"POST /api/custom-link-report {display_name} {req.word_a} {req.word_b} HTTP/1.1\" 200 OK")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"[Sunucu] Özel bağlantı isteği kaydetme hatası: {e}")
        raise HTTPException(status_code=500, detail="Özel bağlantı isteği kaydedilemedi.")


# ---------------------------------------------------------------------------
# Admin Endpoints (Protected)
# ---------------------------------------------------------------------------
@app.post("/api/admin/add-custom-link", dependencies=[Depends(verify_admin)])
async def api_add_custom_link(req: AddCustomLinkRequest, request: Request):
    word_a, word_b = normalize_word(req.word_a), normalize_word(req.word_b)
    try:
        add_custom_link(word_a, word_b)
        custom_links = request.app.state.custom_links_dict
        if word_a not in custom_links: custom_links[word_a] = []
        if word_b not in custom_links[word_a]: custom_links[word_a].append(word_b)
        return {"status": "ok", "message": f"{word_a} - {word_b} bağlantısı eklendi."}
    except Exception as e:
        logger.error(f"[Sunucu] Admin custom link hatası: {e}")
        raise HTTPException(status_code=500, detail="Bağlantı eklenemedi.")


@app.post("/api/admin/reload-custom-links", dependencies=[Depends(verify_admin)])
async def api_reload_custom_links(request: Request):
    try:
        request.app.state.custom_links_dict = get_all_custom_links()
        count = sum(len(v) for v in request.app.state.custom_links_dict.values())
        return {"status": "ok", "message": f"Bellekteki özel bağlantılar yenilendi. Kayıt: {count}"}
    except Exception as e:
        logger.error(f"[Sunucu] Admin reload hatası: {e}")
        raise HTTPException(status_code=500, detail="Bağlantılar yenilenemedi.")


# ---------------------------------------------------------------------------
# Static Files & 404 Handler
# ---------------------------------------------------------------------------
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"detail": getattr(exc, "detail", "Not Found")})
    return FileResponse("static/index.html")