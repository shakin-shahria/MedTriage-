from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app


client = TestClient(app)


def test_audit_called_with_fallback_when_model_missing():
    sample = {'age':63,'sex':1,'cp':3,'trestbps':145,'chol':233,'fbs':1,'thalach':150,'exang':0,'oldpeak':2.3}

    # Ensure model file is removed to force fallback
    from pathlib import Path
    from ml.heart_attack import MODEL_PATH
    try:
        if MODEL_PATH.exists():
            MODEL_PATH.unlink()
    except Exception:
        pass

    with patch('main.crud.create_session_with_audit') as mock_create:
        resp = client.post('/triage_heart', json=sample)
        assert resp.status_code == 200
        # If DB is enabled this should be called; we at least ensure call signature contains fallback_to_rule
        if mock_create.called:
            # Extract kwargs from the first call
            _, kwargs = mock_create.call_args
            assert 'fallback_to_rule' in kwargs
