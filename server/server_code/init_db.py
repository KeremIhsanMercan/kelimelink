# -*- coding: utf-8-sig -*-
"""
Veritabanı başlatma scripti.
PostgreSQL'de 'kelimelink' veritabanını ve tablolarını oluşturur.
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:test@localhost:5432/kelimelink")


def create_database():
    """kelimelink veritabanını oluşturur (yoksa)."""
    # Veritabanı adını URL'den çıkar
    db_name = DATABASE_URL.rsplit("/", 1)[-1]
    # postgres veritabanına bağlan
    server_url = DATABASE_URL.rsplit("/", 1)[0] + "/postgres"

    try:
        conn = psycopg2.connect(server_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Veritabanı var mı kontrol et
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()

        if not exists:
            cur.execute(f'CREATE DATABASE "{db_name}" ENCODING \'UTF8\'')
            print(f"[DB] '{db_name}' veritabanı oluşturuldu.")
        else:
            print(f"[DB] '{db_name}' veritabanı zaten mevcut.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"[DB] Veritabanı oluşturma hatası: {e}")
        raise


def init():
    """Veritabanını ve tabloları oluşturur (mevcutları temizleyerek)."""
    create_database()
    
    # Tabloları temizle (sifirdan başlatmak için)
    from database import get_cursor, init_tables
    try:
        with get_cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS daily_puzzles CASCADE;")
            cur.execute("DROP TABLE IF EXISTS global_stats CASCADE;")
            print("[DB] Eski veriler temizlendi.")
    except Exception as e:
        print(f"[DB] Temizleme sirasinda hata olustu: {e}")

    # Tabloları oluştur
    init_tables()
    print("[DB] Başlatma tamamlandı.")


if __name__ == "__main__":
    init()
