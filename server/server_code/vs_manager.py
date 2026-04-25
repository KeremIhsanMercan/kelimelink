import random
import string
import logging
import time
import asyncio
from typing import Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, HTTPException

import psycopg2
from database import (
    db_create_vs_room, db_get_vs_room, db_update_vs_room_status, 
    db_cleanup_vs_rooms, db_notify_room_update
)

logger = logging.getLogger("kelimelink")

router = APIRouter()

class Player:
    def __init__(self, websocket: WebSocket, username: str):
        self.websocket = websocket
        self.username = username

class Room:
    def __init__(self, room_code: str, word_a: str, word_b: str):
        self.room_code = room_code
        self.word_a = word_a
        self.word_b = word_b
        self.players: List[Player] = [] # Local connections
        self.all_players: List[str] = [] # Global list from DB
        self.status = "waiting" # waiting, playing, finished
        self.winner_info = None
        self.last_activity = time.time()

    async def broadcast(self, message: dict):
        self.last_activity = time.time()
        # Create a list of players to remove in case of failure
        failed_players = []
        for p in self.players:
            try:
                await p.websocket.send_json(message)
            except Exception:
                failed_players.append(p)
        
        for p in failed_players:
            if p in self.players:
                self.players.remove(p)

    def get_state_message(self):
        return {
            "type": "room_state",
            "room_code": self.room_code,
            "status": self.status,
            "word_a": self.word_a,
            "word_b": self.word_b,
            "players": self.all_players if self.all_players else [p.username for p in self.players],
            "winner_info": self.winner_info
        }

rooms: Dict[str, Room] = {}

class CreateRoomReq(BaseModel):
    word_a: Optional[str] = None
    word_b: Optional[str] = None

def generate_room_code():
    # Increase space to avoid collisions and potential loops
    chars = string.ascii_uppercase + string.digits
    for _ in range(100): # Limit attempts
        code = "".join(random.choices(chars, k=6))
        if code not in rooms and not db_get_vs_room(code):
            return code
    # Fallback if extremely crowded
    return "".join(random.choices(chars, k=8))

def validate_words(word_a: str, word_b: str, word_vectors, custom_links_dict):
    from nlp_engine import cosine_similarity, check_custom_link
    from config import SIMILARITY_THRESHOLD
    
    if word_a: word_a = word_a.strip().lower()
    if word_b: word_b = word_b.strip().lower()

    if word_a and word_b:
        if word_a not in word_vectors:
            return f"'{word_a}' sözlükte bulunamadı."
        if word_b not in word_vectors:
            return f"'{word_b}' sözlükte bulunamadı."
            
        custom_sim = check_custom_link(word_a, word_b, custom_links_dict)
        if custom_sim is not None:
            return "Girdiğiniz kelimeler zaten doğrudan bağlantılı."
            
        sim = cosine_similarity(word_vectors[word_a], word_vectors[word_b])
        if sim >= SIMILARITY_THRESHOLD:
            return "Girdiğiniz kelimeler zaten doğrudan bağlantılı."
    return None

async def handle_db_notification(room_code: str):
    """DB'den gelen bildirimi alıp yerel odaları günceller."""
    if room_code not in rooms:
        return
        
    db_room = db_get_vs_room(room_code)
    if db_room:
        room = rooms[room_code]
        room.word_a = db_room["word_a"]
        room.word_b = db_room["word_b"]
        room.status = db_room["status"]
        room.winner_info = db_room["winner_info"]
        room.all_players = db_room.get("players", [])
        await room.broadcast(room.get_state_message())

async def listen_for_updates():
    """Postgres LISTEN ile diğer workerlardan gelen bildirimleri dinler."""
    import select
    from database import get_pool
    
    while True:
        try:
            pool = get_pool()
            conn = pool.getconn()
            conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()
            cur.execute("LISTEN vs_room_updates;")
            logger.info("[VS] Worker dinlemeye başladı (LISTEN vs_room_updates)")
            
            while True:
                # Use non-blocking poll instead of select.select to avoid freezing the event loop
                conn.poll()
                while conn.notifies:
                    notify = conn.notifies.pop(0)
                    room_code = notify.payload
                    await handle_db_notification(room_code)
                
                await asyncio.sleep(0.5) # Check for notifications every 500ms
        except Exception as e:
            logger.error(f"[VS] Listen döngüsü hatası: {e}")
            await asyncio.sleep(5)
        finally:
            try: pool.putconn(conn)
            except: pass

# Room cleanup task
async def cleanup_rooms():
    while True:
        try:
            await asyncio.sleep(300) # Every 5 minutes
            now = time.time()
            to_delete = []
            for code, room in rooms.items():
                # Delete rooms with no players or no activity for 2 hours
                if not room.players or (now - room.last_activity > 7200):
                    to_delete.append(code)
            
            for code in to_delete:
                logger.info(f"[VS] Temizleniyor: Oda {code}")
                del rooms[code]
        except Exception as e:
            logger.error(f"[VS] Cleanup hatası: {e}")

# Start only local cleanup in the background (no DB access here)
@router.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_rooms())

_listen_task: Optional[asyncio.Task] = None

async def start_listening_task():
    global _listen_task
    if _listen_task is None or _listen_task.done():
        _listen_task = asyncio.create_task(listen_for_updates())
        logger.info("[VS] Neon-Dostu Dinleme Başlatıldı")

async def stop_listening_task():
    global _listen_task
    if _listen_task and not _listen_task.done():
        _listen_task.cancel()
        try: await _listen_task
        except asyncio.CancelledError: pass
        _listen_task = None
        logger.info("[VS] Neon-Dostu Dinleme Durduruldu (Veritabanı Uyuyabilir)")


@router.post("/api/vs/create")
async def create_vs_room(req: CreateRoomReq, request: Request):
    word_a, word_b = req.word_a, req.word_b
    word_vectors = request.app.state.word_vectors
    custom_links_dict = request.app.state.custom_links_dict

    error = validate_words(word_a, word_b, word_vectors, custom_links_dict)
    if error:
        raise HTTPException(status_code=400, detail=error)

    if not word_a or not word_b:
        from nlp_engine import pick_practice_pair
        wa, wb = pick_practice_pair(word_vectors, custom_links_dict)
        if not word_a: word_a = wa
        if not word_b: word_b = wb
            
    room_code = generate_room_code()
    rooms[room_code] = Room(room_code, word_a.strip().lower(), word_b.strip().lower())
    
    # Save to DB for other workers and cleanup old rooms to avoid background loop
    try:
        db_cleanup_vs_rooms(hours=1)
        db_create_vs_room(room_code, word_a.strip().lower(), word_b.strip().lower()) 
    except Exception as e:
        logger.error(f"[VS] DB Oda oluşturma hatası: {e}")
    
    return {"room_code": room_code, "word_a": word_a, "word_b": word_b}

@router.websocket("/api/ws/vs/{room_code}")
async def vs_websocket(websocket: WebSocket, room_code: str, username: str = "Anonim"):
    await websocket.accept()
    
    if room_code not in rooms:
        # Check DB if room exists on another worker
        db_room = db_get_vs_room(room_code)
        if db_room:
            rooms[room_code] = Room(room_code, db_room["word_a"], db_room["word_b"])
            rooms[room_code].status = db_room["status"]
            rooms[room_code].winner_info = db_room["winner_info"]
            rooms[room_code].all_players = db_room.get("players", [])
        else:
            await websocket.send_json({"type": "error", "message": "Oda bulunamadı."})
            await websocket.close()
            return
        
    room = rooms[room_code]
    if len(room.players) >= 16:
        await websocket.send_json({"type": "error", "message": "Oda dolu."})
        await websocket.close()
        return
        
    player = Player(websocket, username)
    room.players.append(player)
    
    # Update DB player list and notify other workers
    from database import db_add_player_to_room
    db_add_player_to_room(room_code, username)
    db_notify_room_update(room_code)

    # Refresh all_players from DB to be sure
    updated_db_room = db_get_vs_room(room_code)
    if updated_db_room:
        room.all_players = updated_db_room.get("players", [])
    
    # Start listening to DB only if we have active players on this worker
    await start_listening_task()
    
    await room.broadcast(room.get_state_message())
    
    try:
        while True:
            data = await websocket.receive_json()
            room.last_activity = time.time()
            msg_type = data.get("type")
            
            if msg_type == "start_game":
                if room.status == "waiting" and len(room.players) >= 2:
                    room.status = "playing"
                    
                    # Update DB and notify others
                    db_update_vs_room_status(room_code, "playing")
                    db_notify_room_update(room_code)
                    
                    await room.broadcast({"type": "game_start"})
                    await room.broadcast(room.get_state_message())
                elif len(room.players) < 2:
                    await websocket.send_json({"type": "error", "message": "En az 2 oyuncu gerekiyor."})
                    
            elif msg_type == "solved":
                if room.status == "playing":
                    room.status = "finished"
                    room.winner_info = {
                        "username": username,
                        "guesses": data.get("guesses"),
                        "path": data.get("path"),
                        "nodes": data.get("nodes"),
                        "links": data.get("links")
                    }
                    # Update DB and notify others
                    db_update_vs_room_status(room_code, "finished", winner_info=room.winner_info)
                    db_notify_room_update(room_code)
                    
                    await room.broadcast({"type": "game_over", "winner_info": room.winner_info})
                    await room.broadcast(room.get_state_message())
            
            elif msg_type == "restart_game":
                if room.players and room.players[0].websocket == websocket:
                    word_a, word_b = data.get("word_a"), data.get("word_b")
                    word_vectors = websocket.app.state.word_vectors
                    custom_links_dict = websocket.app.state.custom_links_dict
                    
                    error = validate_words(word_a, word_b, word_vectors, custom_links_dict)
                    if error:
                        await websocket.send_json({"type": "error", "message": error})
                        continue
                    
                    if not word_a or not word_b:
                        from nlp_engine import pick_practice_pair
                        wa, wb = pick_practice_pair(word_vectors, custom_links_dict)
                        word_a, word_b = word_a or wa, word_b or wb
                    
                    room.status = "waiting"
                    room.winner_info = None
                    room.word_a, room.word_b = word_a.strip().lower(), word_b.strip().lower()
                    
                    # Update DB and notify others
                    db_update_vs_room_status(room_code, "waiting", word_a=room.word_a, word_b=room.word_b)
                    db_notify_room_update(room_code)
                    
                    await room.broadcast(room.get_state_message())
                    await room.broadcast({"type": "rematch_requested"})
                    
    except (WebSocketDisconnect, Exception):
        if player in room.players:
            room.players.remove(player)
        
        # Remove from DB and notify others
        from database import db_remove_player_from_room
        db_remove_player_from_room(room_code, username)
        db_notify_room_update(room_code)

        # Check if we should stop listening (no more active players on this worker)
        has_any_player = any(len(r.players) > 0 for r in rooms.values())
        if not has_any_player:
            await stop_listening_task()

        if not room.players:
            if room_code in rooms: del rooms[room_code]
        else:
            await room.broadcast(room.get_state_message())
