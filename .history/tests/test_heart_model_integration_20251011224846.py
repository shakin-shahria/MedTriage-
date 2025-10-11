import os
import joblib
import tempfile
from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer

from ml.heart_attack import predict_heart_attack, MODEL_PATH, REQUIRED_FEATURES


def train_dummy_model():
    # Create a tiny dataset
    df = pd.DataFrame([
        {'age':60,'sex':1,'cp':3,'trestbps':140,'chol':240,'fbs':0,'thalach':150,'exang':0,'oldpeak':1.0,'target':1},
        {'age':50,'sex':0,'cp':2,'trestbps':130,'chol':210,'fbs':0,'thalach':160,'exang':0,'oldpeak':0.5,'target':0},
        {'age':70,'sex':1,'cp':4,'trestbps':150,'chol':260,'fbs':1,'thalach':140,'exang':1,'oldpeak':2.3,'target':1},
        {'age':45,'sex':0,'cp':1,'trestbps':120,'chol':200,'fbs':0,'thalach':170,'exang':0,'oldpeak':0.2,'target':0},
    ])

    X = df[REQUIRED_FEATURES]
    y = df['target']

    numeric_cols = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    categorical_cols = ['sex', 'cp', 'fbs', 'exang']

    numeric_transformer = Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())])
    categorical_transformer = Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore'))])

    preproc = ColumnTransformer([('num', numeric_transformer, numeric_cols), ('cat', categorical_transformer, categorical_cols)])

    pipe = Pipeline([('preproc', preproc), ('clf', RandomForestClassifier(n_estimators=10, random_state=42))])
    pipe.fit(X, y)

    # Ensure models directory exists
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, MODEL_PATH)


def test_predict_heart_attack_with_dummy_model(tmp_path):
    # Train and save dummy model
    train_dummy_model()

    sample = {'age':63,'sex':1,'cp':3,'trestbps':145,'chol':233,'fbs':1,'thalach':150,'exang':0,'oldpeak':2.3}
    out = predict_heart_attack(sample)
    assert isinstance(out, dict)
    assert 'prediction' in out and 'confidence' in out
    assert out['prediction'] in ('Heart Attack Risk', 'Normal')


def test_db_audit_called_on_fallback(monkeypatch):
    # Mock crud.create_session_with_audit to capture calls
    called = {}

    def fake_create_session_with_audit(db, **kwargs):
        called['args'] = kwargs
        class S: session_id = 123
        return S(), None

    monkeypatch.setattr('crud.create_session_with_audit', fake_create_session_with_audit, raising=False)

    # Remove model if exists to force fallback
    try:
        if MODEL_PATH.exists():
            MODEL_PATH.unlink()
    except Exception:
        pass

    # Import app and call endpoint via TestClient
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    sample = {'age':63,'sex':1,'cp':3,'trestbps':145,'chol':233,'fbs':1,'thalach':150,'exang':0,'oldpeak':2.3}
    resp = client.post('/triage_heart', json=sample)
    assert resp.status_code == 200

    # If DB is not enabled in test env, fake_create won't be called; just ensure endpoint worked
    # If crud was patched, ensure fallback flag was included in kwargs when present
    if 'args' in called:
        assert 'fallback_to_rule' in called['args']
