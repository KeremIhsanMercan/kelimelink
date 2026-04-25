# -*- coding: utf-8-sig -*-
"""
PostgreSQL veritabanı bağlantısı ve işlemleri.
Günlük bulmaca çiftlerini ve anonim istatistikleri saklar.
"""

import os
from datetime import date, datetime
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kelimelink")


def get_connection():
    """Yeni bir veritabanı bağlantısı oluşturur."""
    return psycopg2.connect(DATABASE_URL)


@contextmanager
def get_cursor():
    """Bağlantı ve imleç yönetimi için context manager."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


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
    cur.execute("""
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = '{table}'::regclass
                  AND contype = '{con_type}'
            LOOP
                EXECUTE 'ALTER TABLE {table} DROP CONSTRAINT ' || r.conname;
            END LOOP;
        END $$;
    """.format(table=table, con_type=con_type))


def init_tables():
    """Gerekli tabloları oluşturur (yoksa) ve mevcut tabloları migrate eder."""
    with get_cursor() as cur:
        # ------------------------------------------------------------------
        # daily_puzzles: puzzle_date doğal primary key
        # ------------------------------------------------------------------
        cur.execute("""
            CREATE TABLE IF NOT EXISTS daily_puzzles (
                puzzle_date DATE PRIMARY KEY,
                word_a TEXT NOT NULL,
                word_b TEXT NOT NULL
            );
        """)

        # ------------------------------------------------------------------
        # global_stats: (puzzle_date, gamemode) bileşik primary key
        # ------------------------------------------------------------------
        cur.execute("""
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
        """)

        # ------------------------------------------------------------------
        # custom_link_requests: kullanıcıların bağlantı önerilerini tutar
        # ------------------------------------------------------------------
        cur.execute("""
            CREATE TABLE IF NOT EXISTS custom_link_requests (
                id SERIAL PRIMARY KEY,
                word_a TEXT NOT NULL,
                word_b TEXT NOT NULL,
                reason TEXT NOT NULL,
                username TEXT
            );        """)

        # ==================================================================
        # Migration: mevcut tabloları yeni şemaya uyumlu hale getir
        # ==================================================================

        # --- global_stats migration ---

        # 1. gamemode sütunu ekle (yoksa)
        if not _column_exists(cur, "global_stats", "gamemode"):
            cur.execute("ALTER TABLE global_stats ADD COLUMN gamemode TEXT NOT NULL DEFAULT 'daily';")
            print("[DB] Migration: global_stats.gamemode sütunu eklendi.")

        # 2. id sütununu kaldır (varsa) — önce PK constraint'i düşür
        if _column_exists(cur, "global_stats", "id"):
            _drop_all_constraints_of_type(cur, "global_stats", "p")
            cur.execute("ALTER TABLE global_stats DROP COLUMN id;")
            print("[DB] Migration: global_stats.id sütunu kaldırıldı.")

        # 3. updated_at sütununu kaldır (varsa)
        if _column_exists(cur, "global_stats", "updated_at"):
            cur.execute("ALTER TABLE global_stats DROP COLUMN updated_at;")
            print("[DB] Migration: global_stats.updated_at sütunu kaldırıldı.")

        # 4. Eski unique constraint'leri kaldır
        _drop_all_constraints_of_type(cur, "global_stats", "u")

        # 5. (puzzle_date, gamemode) primary key'i garantile
        if not _constraint_exists(cur, "global_stats", "global_stats_pkey"):
            cur.execute("ALTER TABLE global_stats ADD PRIMARY KEY (puzzle_date, gamemode);")
            print("[DB] Migration: global_stats PK (puzzle_date, gamemode) eklendi.")

        # 6. min_guesses_username sütunu ekle (yoksa)
        if not _column_exists(cur, "global_stats", "min_guesses_username"):
            cur.execute("ALTER TABLE global_stats ADD COLUMN min_guesses_username TEXT;")
            print("[DB] Migration: global_stats.min_guesses_username sütunu eklendi.")

        # 7. min_guesses_path sütunu ekle (yoksa)
        if not _column_exists(cur, "global_stats", "min_guesses_path"):
            cur.execute("ALTER TABLE global_stats ADD COLUMN min_guesses_path TEXT;")
            print("[DB] Migration: global_stats.min_guesses_path sütunu eklendi.")

        # --- daily_puzzles migration ---

        # 1. id sütununu kaldır (varsa) — önce PK constraint'i düşür
        if _column_exists(cur, "daily_puzzles", "id"):
            _drop_all_constraints_of_type(cur, "daily_puzzles", "p")
            _drop_all_constraints_of_type(cur, "daily_puzzles", "u")
            cur.execute("ALTER TABLE daily_puzzles DROP COLUMN id;")
            cur.execute("ALTER TABLE daily_puzzles ADD PRIMARY KEY (puzzle_date);")
            print("[DB] Migration: daily_puzzles.id kaldırıldı, PK puzzle_date oldu.")

        # 2. created_at sütununu kaldır (varsa)
        if _column_exists(cur, "daily_puzzles", "created_at"):
            cur.execute("ALTER TABLE daily_puzzles DROP COLUMN created_at;")
            print("[DB] Migration: daily_puzzles.created_at sütunu kaldırıldı.")

        # --- custom_link_requests migration ---
        if not _column_exists(cur, "custom_link_requests", "username"):
            cur.execute("ALTER TABLE custom_link_requests ADD COLUMN username TEXT;")
        
        if _column_exists(cur, "custom_link_requests", "created_at"):
            cur.execute("ALTER TABLE custom_link_requests DROP COLUMN created_at;")

    print("[DB] Tablolar hazır.")


def get_daily_puzzle(today: date) -> dict | None:
    """Bugünün bulmacasını getirir (varsa)."""
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
    print(f"[DB] Günlük bulmaca kaydedildi: {word_a} - {word_b}")


def record_solve(today: date, guess_count: int, gamemode: str = "daily", username: str | None = None, path: str | None = None):
    """Anonim çözüm kaydeder ve istatistikleri günceller. Yeni rekor ise kullanıcı adı ve yolu saklar."""
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
            (today, gamemode, guess_count, guess_count, username, path),
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
    print(f"[DB] Özel bağlantı isteği kaydedildi: {word_a} - {word_b} (User: {username})")
