from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import main


client = TestClient(main.app)


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

    # Inject a dummy crud object if main.crud is None so we can assert it was called
    dummy = Mock()
    def fake_create_session_with_audit(db, **kwargs):
        return (type('S', (), {'session_id': 999})(), None)
    dummy.create_session_with_audit = Mock(side_effect=fake_create_session_with_audit)

    with patch.object(main, 'crud', dummy):
        resp = client.post('/triage_heart', json=sample)
        assert resp.status_code == 200
        assert dummy.create_session_with_audit.called
        # Verify fallback_to_rule kwarg exists in the call
        call_kwargs = dummy.create_session_with_audit.call_args[1]
        assert 'fallback_to_rule' in call_kwargs
