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

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:test@localhost:5432/kelimelink")


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


def init_tables():
    """Gerekli tabloları oluşturur (yoksa)."""
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS daily_puzzles (
                id SERIAL PRIMARY KEY,
                puzzle_date DATE UNIQUE NOT NULL,
                word_a TEXT NOT NULL,
                word_b TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS global_stats (
                id SERIAL PRIMARY KEY,
                puzzle_date DATE UNIQUE NOT NULL,
                total_solves INT DEFAULT 0,
                total_guesses INT DEFAULT 0,
                min_guesses INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
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


def record_solve(today: date, guess_count: int):
    """Anonim çözüm kaydeder ve istatistikleri günceller."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO global_stats (puzzle_date, total_solves, total_guesses, min_guesses, updated_at)
            VALUES (%s, 1, %s, %s, NOW())
            ON CONFLICT (puzzle_date) DO UPDATE SET
                total_solves = global_stats.total_solves + 1,
                total_guesses = global_stats.total_guesses + EXCLUDED.total_guesses,
                min_guesses = CASE
                    WHEN global_stats.min_guesses = 0 THEN EXCLUDED.min_guesses
                    WHEN EXCLUDED.min_guesses < global_stats.min_guesses THEN EXCLUDED.min_guesses
                    ELSE global_stats.min_guesses
                END,
                updated_at = NOW()
            """,
            (today, guess_count, guess_count),
        )


def get_today_stats(today: date) -> dict:
    """Bugünün global istatistiklerini getirir."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT total_solves, total_guesses, min_guesses FROM global_stats WHERE puzzle_date = %s",
            (today,),
        )
        row = cur.fetchone()
        if row:
            row = dict(row)
            avg = round(row["total_guesses"] / row["total_solves"], 1) if row["total_solves"] > 0 else 0
            return {
                "total_solves": row["total_solves"],
                "average_guesses": avg,
                "min_guesses": row["min_guesses"],
            }
        return {"total_solves": 0, "average_guesses": 0, "min_guesses": 0}
