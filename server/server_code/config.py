import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_TITLE = "KelimeLink API"
API_DESCRIPTION = "Türkçe kelime bağlantı bulmacası API'si"
API_VERSION = "1.0.0"

# Security
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "this-is-not-the-secret-key-lol")

# NLP Configuration
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "26"))
CSV_PATH = os.getenv("CSV_PATH", "../semantics_dataset/numberbatch_temiz.csv")
GUESS_CACHE_MAX_SIZE = int(os.getenv("GUESS_CACHE_MAX_SIZE", "5000"))

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kelimelink")
DB_MIN_CONNECTIONS = int(os.getenv("DB_MIN_CONNECTIONS", "0"))
DB_MAX_CONNECTIONS = int(os.getenv("DB_MAX_CONNECTIONS", "10"))

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
