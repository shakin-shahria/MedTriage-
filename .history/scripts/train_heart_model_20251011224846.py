"""
Train a heart attack classifier using the UCI Heart Disease dataset.

This script downloads the CSV, preprocesses, trains a RandomForest with
RandomizedSearchCV, evaluates, and saves a sklearn Pipeline to
../models/heart_attack_model.pkl along with a small JSON report.

Usage:
    python scripts/train_heart_model.py

Outputs:
    models/heart_attack_model.pkl
    models/heart_attack_report.json

This keeps the implementation simple and explainable for later API integration.
"""
import os
import json
import tempfile
from pathlib import Path
import urllib.request

import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib


DATA_URL = "https://raw.githubusercontent.com/anishn/Heart-Disease-UCI/master/heart.csv"
FALLBACK_URLS = [
    "https://raw.githubusercontent.com/plotly/datasets/master/heart.csv",
    "https://raw.githubusercontent.com/ageron/handson-ml2/master/datasets/heart/heart.csv",
]
ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "heart_attack_model.pkl"
REPORT_PATH = MODEL_DIR / "heart_attack_report.json"


def load_data(url=DATA_URL):
    # Prefer local copy if it exists (useful for offline dev/testing)
    local = Path(__file__).resolve().parent / 'data' / 'heart.csv'
    if local.exists():
        print(f"Loading local dataset from {local}")
        return pd.read_csv(local)

    # Try the primary URL, then fallbacks
    urls = [url] + FALLBACK_URLS
    last_err = None
    for u in urls:
        try:
            with urllib.request.urlopen(u, timeout=15) as resp:
                df = pd.read_csv(resp)
                print(f"Loaded data from: {u}")
                return df
        except Exception as e:
            print(f"Failed to load from {u}: {e}")
            last_err = e

    raise RuntimeError(f"Failed to download dataset from all known URLs. Last error: {last_err}")


def preprocess(df: pd.DataFrame):
    # Use only the requested features
    df = df.copy()
    # Target column in this dataset is 'target' (1 = disease, 0 = no disease)
    if 'target' not in df.columns:
        raise RuntimeError("expected 'target' column in dataset")

    FEATURES = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'thalach', 'exang', 'oldpeak']
    missing = [c for c in FEATURES + ['target'] if c not in df.columns]
    if missing:
        raise RuntimeError(f"Missing expected columns in dataset: {missing}")

    X = df[FEATURES].copy()
    y = df['target'].copy()

    # Define which are numeric and which are categorical for preprocessing
    numeric_cols = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    # Treat these as categorical (even if numeric codes): sex, cp, fbs, exang
    categorical_cols = ['sex', 'cp', 'fbs', 'exang']

    # Build preprocessing pipeline
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_cols),
            ('cat', categorical_transformer, categorical_cols)
        ], remainder='drop')

    return X, y, preprocessor


def train_and_evaluate(X_train, X_test, y_train, y_test, preprocessor):
    # Model pipeline
    pipe = Pipeline(steps=[('preproc', preprocessor), ('clf', RandomForestClassifier(random_state=42, n_jobs=-1))])

    # Hyperparameter search space (randomized)
    param_dist = {
        'clf__n_estimators': [50, 100, 200, 300],
        'clf__max_depth': [None, 5, 10, 20],
        'clf__min_samples_split': [2, 5, 10],
        'clf__min_samples_leaf': [1, 2, 4],
        'clf__bootstrap': [True, False]
    }

    search = RandomizedSearchCV(pipe, param_distributions=param_dist, n_iter=20, cv=5, scoring='roc_auc', random_state=42, verbose=1)
    search.fit(X_train, y_train)

    best = search.best_estimator_
    preds = best.predict(X_test)
    probs = best.predict_proba(X_test)[:, 1]

    metrics = {
        'accuracy': float(accuracy_score(y_test, preds)),
        'precision': float(precision_score(y_test, preds, zero_division=0)),
        'recall': float(recall_score(y_test, preds, zero_division=0)),
        'f1': float(f1_score(y_test, preds, zero_division=0)),
        'roc_auc': float(roc_auc_score(y_test, probs))
    }

    # Attempt to extract feature names and importances for explainability
    feature_info = None
    try:
        # Get transformed feature names (requires sklearn >=1.0)
        preproc = best.named_steps['preproc']
        clf = best.named_steps['clf']
        try:
            feature_names = preproc.get_feature_names_out()
        except Exception:
            # Fallback: construct simple names
            feature_names = [f"f{i}" for i in range(clf.feature_importances_.shape[0])]

        importances = clf.feature_importances_
        fi = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        feature_info = [{'feature': n, 'importance': float(v)} for n, v in fi]
    except Exception:
        feature_info = None

    return best, metrics, search, feature_info


def save_model(model, model_path=MODEL_PATH):
    joblib.dump(model, model_path)


def save_report(report: dict, path=REPORT_PATH):
    with open(path, 'w') as f:
        json.dump(report, f, indent=2)


def main():
    print("Loading data...")
    df = load_data()
    print(f"Data shape: {df.shape}")

    print("Preprocessing setup...")
    X, y, preprocessor = preprocess(df)

    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training model (this may take a few minutes)...")
    best_model, metrics, search, feature_info = train_and_evaluate(X_train, X_test, y_train, y_test, preprocessor)

    print("Saving model...")
    save_model(best_model)

    report = {
        'metrics': metrics,
        'best_params': search.best_params_,
        'cv_results_keys': list(search.cv_results_.keys()),
        'feature_importances': feature_info
    }
    print("Saving report...")
    save_report(report)

    print("Done. Model saved to:", MODEL_PATH)
    print("Report saved to:", REPORT_PATH)


if __name__ == '__main__':
    main()
