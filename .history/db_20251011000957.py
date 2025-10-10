from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

# Use environment variable to configure DB URL. If not provided, default to SQLite
# for local development so sessions are visible without installing MySQL.
DATABASE_URL = os.environ.get("MEDTRIAGE_DATABASE_URL")
if not DATABASE_URL:
    # default to a local sqlite file for convenience
    DATABASE_URL = "sqlite:///./medtriage_dev.db"

logger.info(f"Using database URL: {DATABASE_URL}")

# Choose engine options depending on DB type
if DATABASE_URL.startswith("sqlite:"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # MySQL / other DBs
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
