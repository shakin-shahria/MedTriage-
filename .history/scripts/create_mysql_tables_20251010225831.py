#!/usr/bin/env python3
"""
Create database tables in the configured MySQL database using SQLAlchemy models.
Usage:

export MEDTRIAGE_DATABASE_URL='mysql+pymysql://user:pass@127.0.0.1/medtriage_db'
source venv/bin/activate
python3 scripts/create_mysql_tables.py

This is a convenience script for local dev; for production use proper migrations (Alembic).
"""
import os
from sqlalchemy import create_engine

DATABASE_URL = os.environ.get('MEDTRIAGE_DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError('Please set MEDTRIAGE_DATABASE_URL to your MySQL connection string')

# create engine and import models
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)

print('Connecting to', DATABASE_URL)

try:
    from models import Base
    print('Creating tables...')
    Base.metadata.create_all(bind=engine)
    print('Tables created (or already exist)')
except Exception as e:
    print('Failed to create tables:', e)
    raise
