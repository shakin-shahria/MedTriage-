#!/usr/bin/env python3
"""Migration script to add role column to existing users."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from models import Base

# Use the same DATABASE_URL logic as main.py
DATABASE_URL = os.environ.get("MEDTRIAGE_DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./medtriage_dev.db"

print(f"Using database: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

# Add role column if it doesn't exist
with engine.connect() as conn:
    # For SQLite, we need to handle this differently
    if DATABASE_URL.startswith("sqlite"):
        # Check if role column exists
        result = conn.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]
        if 'role' not in columns:
            print("Adding role column to users table...")
            # SQLite doesn't support ALTER TABLE ADD COLUMN with DEFAULT in a simple way
            # We'll recreate the table
            conn.execute(text("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("""
                INSERT INTO users_new (id, username, email, hashed_password, created_at)
                SELECT id, username, email, hashed_password, created_at FROM users
            """))
            conn.execute(text("DROP TABLE users"))
            conn.execute(text("ALTER TABLE users_new RENAME TO users"))
            conn.execute(text("CREATE INDEX ix_users_username ON users (username)"))
            conn.execute(text("CREATE INDEX ix_users_email ON users (email)"))
            conn.execute(text("CREATE INDEX ix_users_id ON users (id)"))
            conn.commit()
            print("Migration completed!")
        else:
            print("Role column already exists.")
    else:
        # For MySQL/PostgreSQL
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' NOT NULL"))
            conn.commit()
            print("Migration completed!")
        except Exception as e:
            print(f"Column might already exist: {e}")

print("Migration script finished.")