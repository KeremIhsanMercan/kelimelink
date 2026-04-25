import random
import string
import logging
import time
import asyncio
from typing import Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, HTTPException

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
        self.players: List[Player] = []
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
            "players": [p.username for p in self.players],
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
        if code not in rooms:
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

# Start cleanup task in the background
@router.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_rooms())


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
    return {"room_code": room_code, "word_a": word_a, "word_b": word_b}

@router.websocket("/api/ws/vs/{room_code}")
async def vs_websocket(websocket: WebSocket, room_code: str, username: str = "Anonim"):
    await websocket.accept()
    
    if room_code not in rooms:
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
    await room.broadcast(room.get_state_message())
    
    try:
        while True:
            data = await websocket.receive_json()
            room.last_activity = time.time()
            msg_type = data.get("type")
            
            if msg_type == "start_game":
                if room.status == "waiting" and len(room.players) >= 2:
                    room.status = "playing"
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
                    await room.broadcast(room.get_state_message())
                    await room.broadcast({"type": "rematch_requested"})
                    
    except (WebSocketDisconnect, Exception):
        if player in room.players:
            room.players.remove(player)
        if not room.players:
            if room_code in rooms: del rooms[room_code]
        else:
            await room.broadcast(room.get_state_message())
