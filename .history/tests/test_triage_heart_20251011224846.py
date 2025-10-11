from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_triage_heart_endpoint():
    sample = {
        'age': 63, 'sex': 1, 'cp': 3, 'trestbps': 145, 'chol': 233, 'fbs': 1,
        'thalach': 150, 'exang': 0, 'oldpeak': 2.3
    }

    resp = client.post('/triage_heart', json=sample)
    assert resp.status_code == 200
    data = resp.json()
    assert 'prediction' in data
    assert 'confidence' in data
    assert isinstance(data['confidence'], float) or isinstance(data['confidence'], int)
    assert 'important_features' in data