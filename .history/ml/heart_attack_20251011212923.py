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


def predict_heart_attack(data: dict):
    """Predict heart attack risk.

    Args:
        data: dict mapping feature names to values. Missing features will raise.

    Returns:
        prediction: 'Heart Attack Risk' or 'Normal'
        confidence: float (probability of class 1)
        details: dict with raw model outputs and feature input
    """
    model = _load_model()

    # Expect a single-row input
    df = pd.DataFrame([data])

    # Ensure columns expected by the model are present; the pipeline will raise if not
    probs = model.predict_proba(df)[:, 1]
    pred = model.predict(df)

    confidence = float(probs[0])
    label = 'Heart Attack Risk' if int(pred[0]) == 1 else 'Normal'

    return label, confidence, {'raw_prediction': int(pred[0]), 'probability': confidence}


if __name__ == '__main__':
    # Quick local test helper (requires training first)
    sample = {
        # Minimal sample with common UCI columns, values are placeholders
        'age': 63, 'sex': 1, 'cp': 3, 'trestbps': 145, 'chol': 233, 'fbs': 1,
        'restecg': 0, 'thalach': 150, 'exang': 0, 'oldpeak': 2.3, 'slope': 0,
        'ca': 0, 'thal': 1
    }
    try:
        print(predict_heart_attack(sample))
    except Exception as e:
        print('Error:', e)
