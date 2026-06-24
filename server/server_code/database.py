# -*- coding: utf-8-sig -*-
"""
PostgreSQL veritabanı bağlantısı ve işlemleri.
Günlük bulmaca çiftlerini ve anonim istatistikleri saklar.
"""

import os
from datetime import date, datetime
from contextlib import contextmanager
import psycopg2
import unicodedata
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
from config import DATABASE_URL, DB_MIN_CONNECTIONS, DB_MAX_CONNECTIONS

# Global connection pool
_pool = None

def get_pool():
    global _pool
    if _pool is None:
        try:
            _pool = ThreadedConnectionPool(
                DB_MIN_CONNECTIONS, 
                DB_MAX_CONNECTIONS, 
                DATABASE_URL
            )
        except Exception as e:
            print(f"[DB] Havuz oluşturulamadı: {e}")
            raise
    return _pool


@contextmanager
def get_cursor():
    """Bağlantı havuzundan bağlantı ve imleç yönetimi için context manager."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            conn.commit()
    except (psycopg2.OperationalError, psycopg2.InterfaceError):
        # Connection is dead, try to get a new one once
        conn.rollback()
        pool.putconn(conn, close=True)
        conn = pool.getconn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _column_exists(cur, table: str, column: str) -> bool:
    """Belirtilen tabloda sütunun var olup olmadığını kontrol eder."""
    cur.execute(
        "SELECT 1 FROM information_schema.columns WHERE table_name = %s AND column_name = %s;",
        (table, column),
    )
    return cur.fetchone() is not None


def _constraint_exists(cur, table: str, constraint_name: str) -> bool:
    """Belirtilen constraint'in var olup olmadığını kontrol eder."""
    cur.execute(
        "SELECT 1 FROM pg_constraint WHERE conrelid = %s::regclass AND conname = %s;",
        (table, constraint_name),
    )
    return cur.fetchone() is not None


def _drop_all_constraints_of_type(cur, table: str, con_type: str):
    """Belirtilen tipteki tüm constraint'leri kaldırır (u=unique, p=primary key)."""
    # SQL Injection prevention: Use a safer approach by avoiding string formatting directly for identifiers.
    # PostgreSQL doesn't allow identifiers as parameters, so we use a PL/pgSQL block with quote_ident.
    
    query = """
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = %s::regclass
                  AND contype = %s
            LOOP
                EXECUTE 'ALTER TABLE ' || quote_ident(%s) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
            END LOOP;
        END $$;
    """
    cur.execute(query, (table, con_type, table))


def init_tables():
    """Gerekli tabloları oluşturur (yoksa) ve mevcut tabloları migrate eder."""
    try:
        with get_cursor() as cur:
            # Schema definition
            cur.execute("""
                CREATE TABLE IF NOT EXISTS daily_puzzles (
                    puzzle_date DATE PRIMARY KEY,
                    word_a TEXT NOT NULL,
                    word_b TEXT NOT NULL
                );
                
                CREATE TABLE IF NOT EXISTS global_stats (
                    puzzle_date DATE NOT NULL,
                    gamemode TEXT NOT NULL DEFAULT 'daily',
                    total_solves INT DEFAULT 0,
                    total_guesses INT DEFAULT 0,
                    min_guesses INT DEFAULT 0,
                    min_guesses_username TEXT,
                    min_guesses_path TEXT,
                    PRIMARY KEY (puzzle_date, gamemode)
                );

                CREATE TABLE IF NOT EXISTS custom_link_requests (
                    id SERIAL PRIMARY KEY,
                    word_a TEXT NOT NULL,
                    word_b TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    username TEXT
                );

                CREATE TABLE IF NOT EXISTS custom_links (
                    id SERIAL PRIMARY KEY,
                    word_a TEXT NOT NULL,
                    word_b TEXT NOT NULL,
                    UNIQUE (word_a, word_b)
                );

                CREATE TABLE IF NOT EXISTS vs_rooms (
                    room_code TEXT PRIMARY KEY,
                    word_a TEXT NOT NULL,
                    word_b TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'waiting',
                    winner_info JSONB,
                    players JSONB DEFAULT '[]'::jsonb,
                    banned_words TEXT,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS leaderboard_streaks (
                    device_id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    max_streak INT NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS leaderboard_total_wins (
                    device_id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    total_wins INT NOT NULL DEFAULT 0
                );
            """)
    except Exception as e:
        print(f"[DB] Tablolar oluşturulurken hata (muhtemelen paralel işlem): {e}")

    # Migration logic
    _run_migrations()

    print("[DB] Tablolar ve veritabanı hazır.")


def _run_migrations():
    """Mevcut tabloları yeni şemaya uyumlu hale getirir."""
    # global_stats migration
    try:
        with get_cursor() as cur:
            cur.execute("ALTER TABLE global_stats ADD COLUMN IF NOT EXISTS gamemode TEXT NOT NULL DEFAULT 'daily';")
    except Exception as e:
        print(f"[DB] Migration Hata (gamemode): {e}")

    try:
        with get_cursor() as cur:
            if _column_exists(cur, "global_stats", "id"):
                _drop_all_constraints_of_type(cur, "global_stats", "p")
                cur.execute("ALTER TABLE global_stats DROP COLUMN IF EXISTS id;")
    except Exception as e:
        print(f"[DB] Migration Hata (global_stats id): {e}")

    try:
        with get_cursor() as cur:
            cur.execute("ALTER TABLE global_stats DROP COLUMN IF EXISTS updated_at;")
    except Exception as e:
        print(f"[DB] Migration Hata (updated_at): {e}")

    try:
        with get_cursor() as cur:
            _drop_all_constraints_of_type(cur, "global_stats", "u")
    except Exception as e:
        print(f"[DB] Migration Hata (global_stats unique constraints): {e}")

    try:
        with get_cursor() as cur:
            if not _constraint_exists(cur, "global_stats", "global_stats_pkey"):
                cur.execute("ALTER TABLE global_stats ADD PRIMARY KEY (puzzle_date, gamemode);")
    except Exception:
        # Hata durumunu yoksay (örneğin pkey zaten varsa)
        pass

    try:
        with get_cursor() as cur:
            for col in ["min_guesses_username", "min_guesses_path"]:
                cur.execute(f"ALTER TABLE global_stats ADD COLUMN IF NOT EXISTS {col} TEXT;")
    except Exception as e:
        print(f"[DB] Migration Hata (min_guesses): {e}")

    # daily_puzzles migration
    try:
        with get_cursor() as cur:
            if _column_exists(cur, "daily_puzzles", "id"):
                _drop_all_constraints_of_type(cur, "daily_puzzles", "p")
                _drop_all_constraints_of_type(cur, "daily_puzzles", "u")
                cur.execute("ALTER TABLE daily_puzzles DROP COLUMN IF EXISTS id;")
                cur.execute("ALTER TABLE daily_puzzles ADD PRIMARY KEY (puzzle_date);")
    except Exception as e:
        print(f"[DB] Migration Hata (daily_puzzles id): {e}")

    try:
        with get_cursor() as cur:
            cur.execute("ALTER TABLE daily_puzzles DROP COLUMN IF EXISTS created_at;")
    except Exception as e:
        print(f"[DB] Migration Hata (created_at): {e}")

    # custom_link_requests migration
    try:
        with get_cursor() as cur:
            cur.execute("ALTER TABLE custom_link_requests ADD COLUMN IF NOT EXISTS username TEXT;")
    except Exception as e:
        print(f"[DB] Migration Hata (custom_link_requests username): {e}")

    # vs_rooms migration
    try:
        with get_cursor() as cur:
            cur.execute("ALTER TABLE vs_rooms ADD COLUMN IF NOT EXISTS players JSONB DEFAULT '[]'::jsonb;")
    except Exception as e:
        print(f"[DB] Migration Hata (vs_rooms players): {e}")

    try:
        with get_cursor() as cur:
            cur.execute("ALTER TABLE vs_rooms ADD COLUMN IF NOT EXISTS banned_words TEXT;")
    except Exception as e:
        print(f"[DB] Migration Hata (vs_rooms banned_words): {e}")


def get_daily_puzzle(today: date) -> dict | None:
    """Bugünün bulmacasını getirir."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT word_a, word_b FROM daily_puzzles WHERE puzzle_date = %s",
            (today,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def save_daily_puzzle(today: date, word_a: str, word_b: str):
    """Bugünün bulmacasını kaydeder."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO daily_puzzles (puzzle_date, word_a, word_b)
            VALUES (%s, %s, %s)
            ON CONFLICT (puzzle_date) DO NOTHING
            """,
            (today, word_a, word_b),
        )


def record_solve(today: date, guess_count: int, path_size: int, gamemode: str = "daily", username: str | None = None, path: str | None = None):
    """Çözüm kaydeder ve istatistikleri günceller."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO global_stats (puzzle_date, gamemode, total_solves, total_guesses, min_guesses, min_guesses_username, min_guesses_path)
            VALUES (%s, %s, 1, %s, %s, %s, %s)
            ON CONFLICT (puzzle_date, gamemode) DO UPDATE SET
                total_solves = global_stats.total_solves + 1,
                total_guesses = global_stats.total_guesses + EXCLUDED.total_guesses,
                min_guesses = CASE
                    WHEN global_stats.min_guesses = 0 THEN EXCLUDED.min_guesses
                    WHEN EXCLUDED.min_guesses < global_stats.min_guesses THEN EXCLUDED.min_guesses
                    ELSE global_stats.min_guesses
                END,
                min_guesses_username = CASE
                    WHEN global_stats.min_guesses = 0 THEN EXCLUDED.min_guesses_username
                    WHEN EXCLUDED.min_guesses < global_stats.min_guesses THEN EXCLUDED.min_guesses_username
                    ELSE global_stats.min_guesses_username
                END,
                min_guesses_path = CASE
                    WHEN global_stats.min_guesses = 0 THEN EXCLUDED.min_guesses_path
                    WHEN EXCLUDED.min_guesses < global_stats.min_guesses THEN EXCLUDED.min_guesses_path
                    ELSE global_stats.min_guesses_path
                END
            """,
            (today, gamemode, guess_count, path_size, username, path),
        )


def get_today_stats(today: date, gamemode: str = "daily") -> dict:
    """Bugünün global istatistiklerini getirir."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT total_solves, total_guesses, min_guesses, min_guesses_username, min_guesses_path FROM global_stats WHERE puzzle_date = %s AND gamemode = %s",
            (today, gamemode),
        )
        row = cur.fetchone()
        if row:
            row = dict(row)
            avg = round(row["total_guesses"] / row["total_solves"], 1) if row["total_solves"] > 0 else 0
            return {
                "total_solves": row["total_solves"],
                "average_guesses": avg,
                "min_guesses": row["min_guesses"],
                "min_guesses_username": row["min_guesses_username"],
                "min_guesses_path": row["min_guesses_path"],
            }
        return {"total_solves": 0, "average_guesses": 0, "min_guesses": 0, "min_guesses_username": None, "min_guesses_path": None}


def save_custom_link_request(word_a: str, word_b: str, reason: str, username: str = None):
    """Kullanıcının özel bağlantı isteğini kaydeder."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO custom_link_requests (word_a, word_b, reason, username)
            VALUES (%s, %s, %s, %s)
            """,
            (word_a, word_b, reason, username),
        )


def get_all_custom_links() -> dict[str, list[str]]:
    """Tüm aktif özel bağlantıları bir sözlük olarak döndürür."""
    links_dict = {}
    with get_cursor() as cur:
        cur.execute("SELECT word_a, word_b FROM custom_links")
        for row in cur.fetchall():
            # Normalize to NFC and lowercase to ensure consistency across systems
            wa = unicodedata.normalize('NFC', str(row["word_a"])).strip().lower()
            wb = unicodedata.normalize('NFC', str(row["word_b"])).strip().lower()
            if wa not in links_dict:
                links_dict[wa] = []
            links_dict[wa].append(wb)
    return links_dict


def add_custom_link(word_a: str, word_b: str):
    """Yeni bir özel bağlantı ekler."""
    # Normalize and lowercase before saving to DB
    word_a = unicodedata.normalize('NFC', word_a).strip().lower()
    word_b = unicodedata.normalize('NFC', word_b).strip().lower()
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO custom_links (word_a, word_b)
            VALUES (%s, %s)
            ON CONFLICT (word_a, word_b) DO NOTHING
            """,
            (word_a, word_b),
        )

# --- VS Mode DB Functions ---

def db_create_vs_room(room_code: str, word_a: str, word_b: str, banned_words: str | None = None):
    import json
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO vs_rooms (room_code, word_a, word_b, status, players, banned_words, last_activity)
            VALUES (%s, %s, %s, 'waiting', %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (room_code) DO UPDATE SET
                word_a = EXCLUDED.word_a,
                word_b = EXCLUDED.word_b,
                status = 'waiting',
                winner_info = NULL,
                banned_words = EXCLUDED.banned_words,
                last_activity = CURRENT_TIMESTAMP
            """,
            (room_code, word_a, word_b, json.dumps([]), banned_words),
        )

def db_get_vs_room(room_code: str) -> dict | None:
    import json
    with get_cursor() as cur:
        cur.execute(
            "SELECT room_code, word_a, word_b, status, winner_info, players, banned_words FROM vs_rooms WHERE room_code = %s",
            (room_code,),
        )
        row = cur.fetchone()
        if row:
            d = dict(row)
            if isinstance(d.get("players"), str):
                d["players"] = json.loads(d["players"])
            return d
        return None

def db_update_vs_room_status(room_code: str, status: str, winner_info: dict | None = None, word_a: str | None = None, word_b: str | None = None, banned_words: str | None = None, update_banned_words: bool = False):
    import json
    with get_cursor() as cur:
        updates = ["status = %s", "last_activity = CURRENT_TIMESTAMP"]
        params = [status]
        if winner_info is not None:
            updates.append("winner_info = %s")
            params.append(json.dumps(winner_info))
        if word_a is not None:
            updates.append("word_a = %s")
            params.append(word_a)
        if word_b is not None:
            updates.append("word_b = %s")
            params.append(word_b)
        if update_banned_words:
            updates.append("banned_words = %s")
            params.append(banned_words)
        elif banned_words is not None:
            updates.append("banned_words = %s")
            params.append(banned_words)
        
        params.append(room_code)
        query = f"UPDATE vs_rooms SET {', '.join(updates)} WHERE room_code = %s"
        cur.execute(query, tuple(params))

def db_add_player_to_room(room_code: str, username: str):
    import json
    with get_cursor() as cur:
        # Using jsonb_set or || operator for efficient update
        # We also handle duplicate addition (ON CONFLICT not applicable here, so we do it in logic or set)
        cur.execute("SELECT players FROM vs_rooms WHERE room_code = %s", (room_code,))
        row = cur.fetchone()
        if not row: return
        players = row["players"]
        if isinstance(players, str): players = json.loads(players)
        
        if username not in players:
            players.append(username)
            cur.execute(
                "UPDATE vs_rooms SET players = %s, last_activity = CURRENT_TIMESTAMP WHERE room_code = %s",
                (json.dumps(players), room_code)
            )

def db_remove_player_from_room(room_code: str, username: str):
    import json
    with get_cursor() as cur:
        cur.execute("SELECT players FROM vs_rooms WHERE room_code = %s", (room_code,))
        row = cur.fetchone()
        if not row: return
        players = row["players"]
        if isinstance(players, str): players = json.loads(players)
        
        if username in players:
            players.remove(username)
            cur.execute(
                "UPDATE vs_rooms SET players = %s, last_activity = CURRENT_TIMESTAMP WHERE room_code = %s",
                (json.dumps(players), room_code)
            )

def db_cleanup_vs_rooms(hours: int = 2):
    with get_cursor() as cur:
        cur.execute(
            "DELETE FROM vs_rooms WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '%s hours'",
            (hours,),
        )

def db_notify_room_update(room_code: str):
    with get_cursor() as cur:
        cur.execute("SELECT pg_notify('vs_room_updates', %s)", (room_code,))


# --- Leaderboard Functions ---

def upsert_leaderboard_streak(device_id: str, username: str, max_streak: int):
    """Kullanıcının en uzun streak değerini günceller (INSERT ON CONFLICT DO UPDATE)."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO leaderboard_streaks (device_id, username, max_streak)
            VALUES (%s, %s, %s)
            ON CONFLICT (device_id) DO UPDATE SET
                username = EXCLUDED.username,
                max_streak = GREATEST(leaderboard_streaks.max_streak, EXCLUDED.max_streak)
            """,
            (device_id, username, max_streak),
        )


def upsert_leaderboard_total_wins(device_id: str, username: str, total_wins: int):
    """Kullanıcının toplam kazanma sayısını günceller (INSERT ON CONFLICT DO UPDATE)."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO leaderboard_total_wins (device_id, username, total_wins)
            VALUES (%s, %s, %s)
            ON CONFLICT (device_id) DO UPDATE SET
                username = EXCLUDED.username,
                total_wins = GREATEST(leaderboard_total_wins.total_wins, EXCLUDED.total_wins)
            """,
            (device_id, username, total_wins),
        )


def get_leaderboard() -> dict:
    """Tüm liderlik tablosu verilerini döndürür (her kategori top 5)."""
    with get_cursor() as cur:
        # Top 5 en uzun streak
        cur.execute(
            "SELECT username, max_streak FROM leaderboard_streaks ORDER BY max_streak DESC LIMIT 5"
        )
        streaks = [{"username": r["username"], "value": r["max_streak"]} for r in cur.fetchall()]

        # Top 5 en çok toplam kazanan
        cur.execute(
            "SELECT username, total_wins FROM leaderboard_total_wins ORDER BY total_wins DESC LIMIT 5"
        )
        total_wins = [{"username": r["username"], "value": r["total_wins"]} for r in cur.fetchall()]

        # Top 5 en çok gün şampiyonu (daily modda min_guesses_username)
        cur.execute(
            """
            SELECT min_guesses_username AS username, COUNT(*) AS champion_count
            FROM global_stats
            WHERE gamemode = 'daily'
              AND min_guesses_username IS NOT NULL
              AND min_guesses_username != ''
            GROUP BY min_guesses_username
            ORDER BY champion_count DESC
            LIMIT 5
            """
        )
        champions = [{"username": r["username"], "value": r["champion_count"]} for r in cur.fetchall()]

    return {
        "streaks": streaks,
        "champions": champions,
        "total_wins": total_wins,
    }
