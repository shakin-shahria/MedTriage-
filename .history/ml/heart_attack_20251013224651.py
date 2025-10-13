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
from sklearn.isotonic import IsotonicRegression

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "heart_attack_model.pkl"

_model = None
_calibrator = None


def _load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model file not found at {MODEL_PATH}. Train the model first using scripts/train_heart_model.py")
        _model = joblib.load(MODEL_PATH)
    return _model


def _load_or_fit_calibrator():
    """Load a saved calibrator if present, otherwise fit an IsotonicRegression
    calibrator on a small held-out portion of the bundled dataset and persist it.

    This is a pragmatic, post-hoc calibration step for demo purposes.
    """
    global _calibrator
    if _calibrator is not None:
        return _calibrator

    calib_path = MODEL_PATH.parent / 'heart_attack_calibrator.pkl'
    if calib_path.exists():
        try:
            _calibrator = joblib.load(calib_path)
            return _calibrator
        except Exception:
            # proceed to refit if load fails
            _calibrator = None

    # Fit calibrator using the local dataset (scripts/data/heart.csv)
    data_csv = Path(__file__).resolve().parents[1] / 'scripts' / 'data' / 'heart.csv'
    if not data_csv.exists():
        # No data to fit calibrator; leave _calibrator None
        return None

    try:
        df = pd.read_csv(data_csv)
        FEATURES = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'thalach', 'exang', 'oldpeak']
        X = df[FEATURES]
        y = df['target']

        # Use a simple split: keep last 20% as calibration set (deterministic)
        from sklearn.model_selection import train_test_split
        X_train, X_calib, y_train, y_calib = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        model = _load_model()
        # predict raw probabilities on calibration set
        probs = model.predict_proba(X_calib)[:, 1]

        # Fit isotonic regression (outputs calibrated probabilities)
        iso = IsotonicRegression(out_of_bounds='clip')
        iso.fit(probs, y_calib.values)
        _calibrator = iso
        try:
            joblib.dump(_calibrator, calib_path)
        except Exception:
            pass
        return _calibrator
    except Exception:
        return None


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
    raw_confidence = float(probs[0])

    # Apply calibrator if available
    try:
        calib = _load_or_fit_calibrator()
        if calib is not None:
            confidence = float(max(0.0, min(1.0, float(calib.predict([raw_confidence])[0]))))
        else:
            confidence = raw_confidence
    except Exception:
        confidence = raw_confidence
    label = 'Heart Attack Risk' if int(pred[0]) == 1 else 'Normal'

    details = {'raw_prediction': int(pred[0]), 'probability': confidence, 'raw_probability': raw_confidence}

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
