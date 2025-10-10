#!/usr/bin/env python3
"""
Add `role` column to `users` table if missing (SQLite-friendly ALTER TABLE workaround).
This script is safe to run in dev environment. For production DBs, run proper migrations.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get('MEDTRIAGE_DATABASE_URL') or 'sqlite:///./medtriage_dev.db'
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite:') else {})

with engine.connect() as conn:
    insp = None
    try:
        # Check if column exists
        res = conn.execute(text("PRAGMA table_info(users)")) if DATABASE_URL.startswith('sqlite:') else conn.execute(text("SHOW COLUMNS FROM users"))
        cols = [r[1] for r in res.fetchall()]
    except Exception as e:
        print('Could not inspect users table:', e)
        raise

    if 'role' in cols:
        print('Role column already exists; nothing to do')
    else:
        print('Adding role column to users table')
        if DATABASE_URL.startswith('sqlite:'):
            # SQLite: create a new table with the added column, copy data, drop old table, rename new
            conn.execute(text('PRAGMA foreign_keys=off'))
            conn.execute(text('BEGIN TRANSACTION'))
            try:
                conn.execute(text('CREATE TABLE users_new (id INTEGER PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, hashed_password VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL DEFAULT "user", created_at DATETIME)'))
                conn.execute(text('INSERT INTO users_new (id, username, email, hashed_password, created_at) SELECT id, username, email, hashed_password, created_at FROM users'))
                conn.execute(text('DROP TABLE users'))
                conn.execute(text('ALTER TABLE users_new RENAME TO users'))
                conn.execute(text('COMMIT'))
                print('Role column added (sqlite migration)')
            except Exception as e:
                conn.execute(text('ROLLBACK'))
                print('Failed to migrate sqlite users table:', e)
                raise
            finally:
                conn.execute(text('PRAGMA foreign_keys=on'))
        else:
            # For MySQL/Postgres: simple ALTER TABLE
            try:
                conn.execute(text('ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT "user"'))
                print('Role column added via ALTER TABLE')
            except Exception as e:
                print('Failed to add role column via ALTER TABLE:', e)
                raise
