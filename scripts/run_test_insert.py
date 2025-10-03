#!/usr/bin/env python3
import os
import sys

# Use the same MySQL creds you've been using
# Use the PyMySQL driver explicitly to avoid requiring the MySQLdb C extension
os.environ['MEDTRIAGE_DATABASE_URL'] = 'mysql+pymysql://medtriage_db:1234@127.0.0.1:3306/medtriage_db'

from fastapi.testclient import TestClient

# Import the app after setting the env var so db.py picks it up
import main
from db import SessionLocal
from models import Session as SessionModel, AuditLog as AuditLogModel

def run_test():
    client = TestClient(main.app)

    print('Posting test triage...')
    resp = client.post('/triage', json={'symptom': 'Integration test: sudden dizziness and nausea'})
    print('POST status:', resp.status_code)
    print('POST body:', resp.json())

    # Give a short moment for DB commit (shouldn't be necessary, but safety)
    import time
    time.sleep(0.2)

    # Query the DB for latest rows
    db = SessionLocal()
    try:
        sessions = db.query(SessionModel).order_by(SessionModel.created_at.desc()).limit(5).all()
        print('\nLatest sessions:')
        for s in sessions:
            # risk_level may be Enum member
            try:
                rl = s.risk_level.name
            except Exception:
                rl = str(s.risk_level)
            print(f"session_id={s.session_id} input_text={s.input_text!r} risk_level={rl} next_step={s.next_step!r} confidence={s.confidence_score}")

        audits = db.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(5).all()
        print('\nLatest audits:')
        for a in audits:
            print(f"log_id={a.log_id} session_id={a.session_id} endpoint={a.endpoint} fallback={a.fallback_to_rule}")
    finally:
        db.close()

    print('\nDone')


if __name__ == '__main__':
    run_test()
