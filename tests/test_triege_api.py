import sys
import pathlib
import pytest
from fastapi.testclient import TestClient

# Ensure project root is on sys.path so tests can import `main`
PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from main import app


client = TestClient(app)


@pytest.mark.parametrize(
    "payload,expected_risk,expected_suggestion",
    [
        ({"symptom": "Severe chest pain, shortness of breath"}, "High", "Visit ER immediately"),
        ({"symptom": "Mild headache for two days"}, "Low", "Self-care"),
        ({"symptom": "runny nose and cough"}, "Medium", "Telehealth"),
    ],
)
def test_triage_endpoint(payload, expected_risk, expected_suggestion):
    resp = client.post("/triage", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["risk"] == expected_risk
    assert body["suggestion"] == expected_suggestion
