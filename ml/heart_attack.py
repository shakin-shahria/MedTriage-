"""
Lightweight prediction wrapper for the trained heart attack model.

Provides `predict_heart_attack(data: dict)` which accepts a dict of patient
features (matching the UCI Heart dataset columns) and returns a tuple:
    (label_str, confidence_float, details_dict)

Example input keys: ['age','sex','cp','trestbps','chol','fbs','restecg',...]

This module lazily loads the model from `models/heart_attack_model.pkl`.
"""
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "heart_attack_model.pkl"

_model = None


def _load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model file not found at {MODEL_PATH}. Train the model first using scripts/train_heart_model.py")
        _model = joblib.load(MODEL_PATH)
    return _model


REQUIRED_FEATURES = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'thalach', 'exang', 'oldpeak']


def predict_heart_attack(data: dict):
    """Predict heart attack risk.

    Args:
        data: dict mapping required feature names to values.

    Returns:
        dict: {
            'prediction': 'Heart Attack Risk'|'Normal',
            'confidence': float,
            'top_features': list of (feature, importance) tuples (optional),
        }
    """
    model = _load_model()

    # Input validation
    missing = [c for c in REQUIRED_FEATURES if c not in data]
    if missing:
        raise ValueError(f"Missing required input features: {missing}")

    df = pd.DataFrame([{k: data[k] for k in REQUIRED_FEATURES}])

    probs = model.predict_proba(df)[:, 1]
    pred = model.predict(df)

    confidence = float(probs[0])
    label = 'Heart Attack Risk' if int(pred[0]) == 1 else 'Normal'

    details = {'raw_prediction': int(pred[0]), 'probability': confidence}

    # Attempt to extract top-5 important features if available
    try:
        clf = model.named_steps['clf']
        preproc = model.named_steps['preproc']
        try:
            feature_names = preproc.get_feature_names_out()
        except Exception:
            # Fallback: use REQUIRED_FEATURES (not exact for one-hot)
            feature_names = REQUIRED_FEATURES

        importances = clf.feature_importances_
        fi = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:5]
        details['top_features'] = [(n, float(v)) for n, v in fi]
    except Exception:
        details['top_features'] = []

    return {'prediction': label, 'confidence': confidence, 'details': details}


if __name__ == '__main__':
    sample = {
        'age': 63, 'sex': 1, 'cp': 3, 'trestbps': 145, 'chol': 233, 'fbs': 1,
        'thalach': 150, 'exang': 0, 'oldpeak': 2.3
    }
    try:
        print(predict_heart_attack(sample))
    except Exception as e:
        print('Error:', e)
