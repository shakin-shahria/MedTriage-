
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.mysql import JSON
from datetime import datetime
import enum

Base = declarative_base()


class RiskLevelEnum(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    input_text = Column(Text, nullable=False)
    risk_level = Column(Enum(RiskLevelEnum), nullable=False)
    predicted_conditions = Column(JSON, nullable=True)
    next_step = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable=False)
    endpoint = Column(String(50), nullable=False)
    fallback_to_rule = Column(Boolean, nullable=False, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
