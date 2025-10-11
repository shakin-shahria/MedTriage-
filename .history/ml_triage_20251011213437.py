from typing import List
import logging
import concurrent.futures
import threading
import time

try:
    from transformers import pipeline
except Exception:  # transformers may not be available or model download may fail
    pipeline = None

logger = logging.getLogger(__name__)


class MLClassifier:
    def __init__(self):
        self._classifier = None
        self._initialized = False

    def _init(self):
        if pipeline is None:
            raise RuntimeError("transformers pipeline is not available")
        # Intentionally separate initialization from on-demand classify calls.
        # _init should only be called explicitly at startup if you want to
        # pre-download the model. Calling it lazily during a request may
        # block (downloads) which we avoid in try_ml_triage.
        if self._classifier is None:
            # Use a zero-shot-classification pipeline with a small DistilBERT model fine-tuned for NLI
            # This will download a model on first run (internet required)
            self._classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")
            self._initialized = True

    def classify(self, text: str) -> List[tuple]:
        """Return list of (label, score) predictions.

        Example labels: ['High risk: Visit ER immediately', 'Medium risk: Telehealth', 'Low risk: Self-care']
        """
        if not self._initialized:
            raise RuntimeError("ML pipeline not initialized")

        labels = ["high risk", "medium risk", "low risk"]
        out = self._classifier(text, labels)
        # Return labels with scores in order
        return list(zip(out["labels"], out["scores"]))


_ml = MLClassifier()


def try_heart_attack_triage(data: dict):
    """Wrapper to call the heart-attack-specific predictor.

    Returns (prediction_label, confidence_float, matches_list, fallback_flag)
    On failure returns (None, 0.0, [], True)
    """
    try:
        # Lazy import of the heart attack predictor
        from ml.heart_attack import predict_heart_attack
        res = predict_heart_attack(data)
        # res is {'prediction':..., 'confidence':..., 'details':{...}}
        pred = res.get('prediction')
        conf = float(res.get('confidence', 0.0))
        details = res.get('details', {})
        matches = []
        if isinstance(details, dict):
            top = details.get('top_features') or []
            # top is list of (feature, importance)
            matches = [t[0] if isinstance(t, (list, tuple)) else t for t in top]
        return pred, conf, matches, False
    except Exception:
        # Fail gracefully; caller should fallback to rule-based logic
        return None, 0.0, [], True


def ml_triage(text: str):
    """Attempt ML-based triage; returns (risk, suggestion, conditions) or raises.

    This function is optional — it may raise if the ML model is unavailable.
    """
    preds = _ml.classify(text)
    # Pick highest scoring label
    if not preds:
        raise RuntimeError("no predictions from ML model")

    label, score = preds[0]
    # Parse the label to get risk and suggestion
    label_lower = label.lower()
    if "high" in label_lower:
        risk = "High"
        suggestion = "Visit ER immediately"
        conditions = ["Possibly severe condition"]
    elif "medium" in label_lower:
        risk = "Medium"
        suggestion = "Telehealth"
        conditions = ["Monitor symptoms"]
    elif "low" in label_lower:
        risk = "Low"
        suggestion = "Self-care"
        conditions = ["Mild condition"]
    else:
        # Fallback
        risk = "Medium"
        suggestion = "Telehealth"
        conditions = ["Undetermined"]
    
    # Return also the confidence score for thresholding in the caller
    return (risk, suggestion, conditions, float(score), [])


def try_ml_triage(text: str, timeout: float = 2.0, min_confidence: float = 0.4):
    """Try to run ml_triage but give up after `timeout` seconds.

    Returns (risk, suggestion, conditions) on success or raises RuntimeError on failure/timeout.
    """
    # Fast-path: if the ML classifier hasn't been initialized (i.e. model not
    # pre-loaded), don't attempt to initialize here because that would trigger
    # a potentially long model download during a request. Instead, fail fast so
    # the caller can fallback to rule-based logic.
    if not getattr(_ml, "_initialized", False):
        raise RuntimeError("ML model not initialized")

    # If the model is initialized, run it with a timeout guard to handle any
    # unexpected stalls in the classifier itself.
    result = None
    exc = None

    def target():
        nonlocal result, exc
        try:
            result = ml_triage(text)
        except Exception as e:
            exc = e

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout)
    if thread.is_alive():
        raise RuntimeError("ML triage timed out")
    if exc:
        raise exc
    if result is None:
        raise RuntimeError("ML triage failed")

    # result is a tuple (risk, suggestion, conditions, score)
    try:
        risk, suggestion, conditions, score, matches = result
    except Exception:
        raise RuntimeError("unexpected ML result format")

    # If the top prediction is below the confidence threshold, treat as failure
    if score < float(0.4):
        raise RuntimeError(f"ML confidence {score:.2f} below threshold 0.4")

    return risk, suggestion, conditions, score, matches
