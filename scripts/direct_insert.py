#!/usr/bin/env python3
import os
os.environ['MEDTRIAGE_DATABASE_URL'] = 'mysql+pymysql://medtriage_db:1234@127.0.0.1:3306/medtriage_db'
from db import SessionLocal
import crud

print('Opening DB session')
db = SessionLocal()
try:
    try:
        sess, audit = crud.create_session_with_audit(db, input_text='Direct insert test: chest pain', risk_level='high', predicted_conditions=['chest pain'], next_step='ER', confidence_score=0.9, endpoint='/direct', fallback_to_rule=False)
        print('Inserted session_id=', sess.session_id)
    except Exception as e:
        print('create_session_with_audit raised:', type(e), e)
        import traceback
        traceback.print_exc()
finally:
    db.close()

print('Done')
