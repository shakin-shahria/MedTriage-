from sqlalchemy.orm import Session
import models
import re
from typing import Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


def _anonymize_text(text: str) -> str:
    if not text:
        return text
    # basic PII removal
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[REDACTED]", text)
    text = re.sub(r"\b\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}\b", "[REDACTED]", text)
    text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED]", text)
    return text


def create_session_with_audit(db: Session, *, input_text: str, risk_level: str, predicted_conditions: Optional[List[str]], next_step: str, confidence_score: Optional[float], endpoint: str, fallback_to_rule: bool):
    """Create a session row and a corresponding audit_log entry in a transaction."""
    clean_text = _anonymize_text(input_text)
    # Normalize risk_level into the RiskLevelEnum used by the ORM
    try:
        if isinstance(risk_level, str):
            rl = risk_level.lower()
            risk_enum = models.RiskLevelEnum(rl)
        elif isinstance(risk_level, models.RiskLevelEnum):
            risk_enum = risk_level
        else:
            # Fallback: coerce to string then enum
            risk_enum = models.RiskLevelEnum(str(risk_level).lower())
    except Exception:
        logger.exception("Invalid risk_level passed to create_session_with_audit, defaulting to 'low'")
        risk_enum = models.RiskLevelEnum.low

    # Ensure predicted_conditions is a list (JSON serializable)
    preds = predicted_conditions if (predicted_conditions is not None) else []

    sess = models.Session(
        input_text=clean_text,
        risk_level=risk_enum,
        predicted_conditions=preds,
        next_step=next_step,
        confidence_score=confidence_score,
    )
    db.add(sess)
    db.flush()  # assign session_id

    audit = models.AuditLog(
        session_id=sess.session_id,
        endpoint=endpoint,
        fallback_to_rule=fallback_to_rule,
    )
    db.add(audit)
    try:
        db.commit()
    except Exception:
        logger.exception("DB commit failed in create_session_with_audit")
        db.rollback()
        raise
    db.refresh(sess)
    return sess, audit
