from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

# Use environment variable to configure DB URL. If not provided, default to SQLite
# for local development so sessions are visible without installing MySQL.
DATABASE_URL = os.environ.get("MEDTRIAGE_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("MEDTRIAGE_DATABASE_URL must be set to your MySQL connection string (no sqlite fallback). Example: mysql+pymysql://user:pass@127.0.0.1/medtriage_db")

logger.info(f"Using database URL: {DATABASE_URL}")

# Create engine with MySQL-appropriate options
if DATABASE_URL.startswith("sqlite:"):
    # Disallow sqlite in production mode; raise to avoid accidental local sqlite usage
    raise RuntimeError("SQLite is not supported in this configuration. Set MEDTRIAGE_DATABASE_URL to a MySQL URL.")
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auto-create tables if models are available (best-effort)
try:
    from models import Base

    Base.metadata.create_all(bind=engine)
except Exception:
    logger.exception("Could not auto-create DB tables; ensure schema.sql is applied in production")
