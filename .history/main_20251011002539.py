from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from triage import classify_symptom
from ml_triage import ml_triage, try_ml_triage, _ml
import os
import logging
import time
from datetime import datetime, timedelta
from fastapi import Depends
from fastapi import Header, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
import json
import base64
import secrets
import hashlib
import secrets
from datetime import datetime, timedelta
from jose import JWTError, jwt
try:
    from db import get_db
    import crud
    DB_ENABLED = True
except Exception:
    # DB dependencies may be missing in lightweight test environments
    get_db = None
    crud = None
    DB_ENABLED = False

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{salt}:{hashlib.sha256((salt + password).encode()).hexdigest()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, hash_value = hashed_password.split(":", 1)
        return hashlib.sha256((salt + plain_password).encode()).hexdigest() == hash_value
    except ValueError:
        return False

# JWT settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def _extract_bearer_token_from_request(request: Optional[Request]):
    """Return the Bearer token string from the request Authorization header or None."""
    if request is None:
        return None
    auth_header = request.headers.get("authorization")
    if not auth_header:
        return None
    try:
        scheme, cred = auth_header.split(" ", 1)
        if scheme.lower() == "bearer":
            return cred
    except Exception:
        return None
    return None


def _verify_jwt_and_require_admin(token: str):
    """Verify a JWT (using app SECRET_KEY or optional admin jwt secret) and
    return payload if valid and role is admin. If token is valid but role is
    not admin, raise HTTPException(403). Return None if token invalid."""
    if not token:
        return None

    # First try the app secret
    payload = verify_token(token)
    if payload:
        if payload.get("role") == "admin":
            return payload
        # valid token but wrong role -> forbidden
        raise HTTPException(status_code=403, detail="Forbidden")

    # Next try an explicit admin JWT secret if provided (legacy support)
    jwt_secret = os.environ.get("MEDTRIAGE_ADMIN_JWT_SECRET")
    if jwt_secret:
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            if payload.get("role") == "admin":
                return payload
            raise HTTPException(status_code=403, detail="Forbidden")
        except Exception:
            return None

    return None


# Simple in-memory rate limiter state (per-IP). This is intentionally a small
# demonstration implementation. For production use a distributed rate limiter
# (Redis, Memcached) and enforce stronger policies.
_RATE_LIMIT_STATE: dict = {}

def _get_rate_limit_config():
    try:
        max_requests = int(os.environ.get("MEDTRIAGE_RATE_LIMIT_MAX", "60"))
    except Exception:
        max_requests = 60
    try:
        window = int(os.environ.get("MEDTRIAGE_RATE_LIMIT_WINDOW", "60"))
    except Exception:
        window = 60
    return max_requests, window


# Create the FastAPI app early so decorators (middleware/event handlers)
# can reference it. Previously `app` was declared after the middleware which
# caused a NameError at startup.
app = FastAPI(title="MedTriage - Symptom Checker (MVP)")


@app.middleware("http")
async def simple_rate_limiter(request, call_next):
    # Apply only to triage POST endpoints to avoid over-limiting other routes
    if request.method == "POST" and request.url.path in ("/triage", "/triage_ml"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        max_requests, window = _get_rate_limit_config()

        entry = _RATE_LIMIT_STATE.get(client_ip)
        if entry is None:
            entry = []
            _RATE_LIMIT_STATE[client_ip] = entry

        # remove timestamps outside the window
        cutoff = now - window
        while entry and entry[0] < cutoff:
            entry.pop(0)

        if len(entry) >= max_requests:
            # Rate limited
            return JSONResponse({"detail": "Too many requests"}, status_code=429)

        # record request
        entry.append(now)

    response = await call_next(request)
    return response


@app.on_event("startup")
def maybe_preload_ml():
    """Preload ML model at startup if MEDTRIAGE_PRELOAD_ML=1 is set.

    This keeps model downloads out of request paths and makes `/triage_ml`
    respond with ML predictions (once the model is loaded). Only enable
    this when you want the app to download models during process startup.
    """
    preload = os.environ.get("MEDTRIAGE_PRELOAD_ML", "0")
    if preload == "1":
        try:
            # Call the classifier init to download/load the model once at startup
            _ml._init()
            logger.info("ML model preloaded at startup")
        except Exception:
            logger.exception("Failed to preload ML model at startup; continuing with rule-based fallback")

# Development CORS - allow all origins so the simple local HTML client can POST
# Configure CORS origins via env var (comma-separated). Default to '*' for
# local development convenience.
cors_origins = os.environ.get("MEDTRIAGE_CORS_ORIGINS", "*")
if cors_origins.strip() == "*":
    allow_list = ["*"]
else:
    allow_list = [o.strip() for o in cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/browser_post.html", include_in_schema=False)
def serve_browser_post():
    html_path = Path(__file__).resolve().parent / "browser_post.html"
    return FileResponse(html_path)


class TriageRequest(BaseModel):
    symptom: str


class TriageResponse(BaseModel):
    risk: str
    suggestion: str
    conditions: list[str]
    score: Optional[float] = None
    matches: Optional[list[str]] = None
    session_id: Optional[int] = None


class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime


def get_current_user_id(request: Request) -> Optional[int]:
    """Extract user_id from JWT token if present, otherwise return None for anonymous users."""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    return int(user_id) if user_id else None


@app.post("/triage", response_model=TriageResponse)
def triage(req: TriageRequest, request: Request = None):
    # Basic input validation: prevent extremely long inputs
    if req.symptom and len(req.symptom) > 2000:
        return JSONResponse({"detail": "symptom text too long"}, status_code=413)

    risk, suggestion, conditions, score, matches = classify_symptom(req.symptom)
    
    # Get user_id if authenticated, otherwise None for anonymous
    user_id = get_current_user_id(request) if request else None
    
    # store session
    try:
        if DB_ENABLED:
            # create a generator and get the session, ensure we close the generator so
            # the `finally` in `get_db` runs and the session is closed.
            _gen = get_db()
            db = next(_gen)
            try:
                sess, _ = crud.create_session_with_audit(db, input_text=req.symptom, risk_level=risk, predicted_conditions=conditions, next_step=suggestion, confidence_score=score, endpoint="/triage", fallback_to_rule=False, user_id=user_id)
            finally:
                try:
                    _gen.close()
                except Exception:
                    pass
    except Exception:
        logger.exception("Failed to record session")

    # If session was created above, include session_id in response
    sess_id = None
    try:
        sess_id = sess.session_id  # type: ignore
    except Exception:
        sess_id = None

    return TriageResponse(risk=risk, suggestion=suggestion, conditions=conditions, score=score, matches=matches, session_id=sess_id)


@app.post("/triage_ml", response_model=TriageResponse)
def triage_ml(req: TriageRequest, request: Request = None):
    """Optional ML-powered triage endpoint.

    This will attempt to use a transformers zero-shot model. If the model is
    unavailable or fails, it falls back to the rule-based `classify_symptom`.
    """
    fallback = False
    # Basic input validation: prevent extremely long inputs
    if req.symptom and len(req.symptom) > 2000:
        return JSONResponse({"detail": "symptom text too long"}, status_code=413)

    try:
        # Attempt ML with a short timeout to avoid blocking the UI while a model downloads
        risk, suggestion, conditions, score, matches = try_ml_triage(req.symptom, timeout=2.0)
    except Exception:
        # Fallback to rule-based
        fallback = True
        risk, suggestion, conditions, score, matches = classify_symptom(req.symptom)

    # Get user_id if authenticated, otherwise None for anonymous
    user_id = get_current_user_id(request) if request else None
    
    # Audit log with fallback info
    try:
        if DB_ENABLED:
            _gen = get_db()
            db = next(_gen)
            try:
                sess, _ = crud.create_session_with_audit(db, input_text=req.symptom, risk_level=risk, predicted_conditions=conditions, next_step=suggestion, confidence_score=score, endpoint="/triage_ml", fallback_to_rule=fallback, user_id=user_id)
            finally:
                try:
                    _gen.close()
                except Exception:
                    pass
    except Exception:
        logger.exception("Failed to record ML session")

    sess_id = None
    try:
        sess_id = sess.session_id  # type: ignore
    except Exception:
        sess_id = None

    return TriageResponse(risk=risk, suggestion=suggestion, conditions=conditions, score=score, matches=matches, session_id=sess_id)


@app.post("/auth/register")
def register(user: UserRegister):
    if not DB_ENABLED:
        raise HTTPException(status_code=503, detail="Database not enabled")

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        from models import User, UserRoleEnum
        # Check if user exists
        existing = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username or email already registered")

        hashed_password = hash_password(user.password)
        # Simple admin assignment: if username contains 'admin', make them admin
        role = UserRoleEnum.admin if 'admin' in user.username.lower() else UserRoleEnum.user
        new_user = User(username=user.username, email=user.email, hashed_password=hashed_password, role=role)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User registered successfully", "user_id": new_user.id}
    finally:
        try:
            db_gen.close()
        except Exception:
            pass


@app.post("/auth/login")
def login(user: UserLogin):
    if not DB_ENABLED:
        raise HTTPException(status_code=503, detail="Database not enabled")

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        from models import User
        db_user = db.query(User).filter((User.username == user.username_or_email) | (User.email == user.username_or_email)).first()
        if not db_user or not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token({"sub": str(db_user.id), "role": db_user.role.value})
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        try:
            db_gen.close()
        except Exception:
            pass


@app.get("/auth/sessions")
def user_sessions(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not DB_ENABLED:
        raise HTTPException(status_code=503, detail="Database not enabled")

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        from models import Session as SessionModel
        # Get sessions for this user
        sessions = db.query(SessionModel).filter(SessionModel.user_id == int(user_id)).order_by(SessionModel.created_at.desc()).all()
        
        # Format the response
        result = []
        for s in sessions:
            # Deserialize predicted_conditions from JSON
            try:
                preds = json.loads(s.predicted_conditions) if s.predicted_conditions else []
            except (json.JSONDecodeError, TypeError):
                preds = []
                
            result.append({
                "session_id": s.session_id,
                "input_text": s.input_text,
                "risk_level": getattr(s.risk_level, 'name', str(s.risk_level)),
                "predicted_conditions": preds,
                "next_step": s.next_step,
                "confidence_score": s.confidence_score,
                "created_at": s.created_at.isoformat() if s.created_at else None
            })
        
        return result
    finally:
        try:
            db_gen.close()
        except Exception:
            pass


@app.get("/auth/profile")
def get_profile(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not DB_ENABLED:
        raise HTTPException(status_code=503, detail="Database not enabled")

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        from models import User
        db_user = db.query(User).filter(User.id == int(user_id)).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role.value,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None
        }
    finally:
        try:
            db_gen.close()
        except Exception:
            pass


@app.get("/admin/sessions")
def admin_sessions(limit: int = 20, page: Optional[int] = None, page_size: int = 20, risk: Optional[str] = None, x_admin_token: Optional[str] = Header(None), request: Request = None):
    """Return recent sessions with audit logs. Guarded by X-Admin-Token header.

    Set MEDTRIAGE_ADMIN_TOKEN env var to a secret value. If not set, defaults to
    'devtoken' to make local development easy.
    """
    # Prefer Authorization: Bearer <token> or X-Admin-Token header. If
    # MEDTRIAGE_ADMIN_TOKEN is set, require a Bearer token or X-Admin-Token that
    # matches it. If MEDTRIAGE_ADMIN_TOKEN is not set, fall back to Basic Auth
    # using MEDTRIAGE_ADMIN_USER / MEDTRIAGE_ADMIN_PASSWORD (keeps local dev easy).
    authorised = False
    expected_token = os.environ.get("MEDTRIAGE_ADMIN_TOKEN")

    # Check X-Admin-Token first (legacy) or Authorization: Bearer <token>
    token_candidate = x_admin_token or _extract_bearer_token_from_request(request)

    if expected_token:
        # Strict token check when env var is provided
        if token_candidate and secrets.compare_digest(token_candidate, expected_token):
            authorised = True
        else:
            # If a JWT is presented, verify it and ensure role==admin. If the
            # JWT is valid but role != admin, _verify_jwt_and_require_admin will
            # raise HTTPException(403). If token invalid, treat as not authorised.
            jwt_check = _verify_jwt_and_require_admin(token_candidate) if token_candidate else None
            if jwt_check:
                authorised = True
    else:
        # No admin token configured: allow Basic auth fallback for local dev
        basic_user = os.environ.get("MEDTRIAGE_ADMIN_USER")
        basic_pw = os.environ.get("MEDTRIAGE_ADMIN_PASSWORD")
        if basic_user and basic_pw and token_candidate is None:
            # Try Basic auth header explicitly
            auth_hdr = None
            if request is not None:
                auth_hdr = request.headers.get("authorization")
            if auth_hdr:
                try:
                    scheme, token = auth_hdr.split(" ", 1)
                    if scheme.lower() == "basic":
                        decoded = base64.b64decode(token).decode("utf-8")
                        username, password = decoded.split(":", 1)
                        user_ok = secrets.compare_digest(username, basic_user)
                        pw_ok = secrets.compare_digest(password, basic_pw)
                        authorised = user_ok and pw_ok
                except Exception:
                    authorised = False

        # If a bearer token was provided, validate it: valid admin JWT -> authorised.
        if not authorised and token_candidate:
            jwt_check = _verify_jwt_and_require_admin(token_candidate)
            if jwt_check:
                authorised = True

    if not authorised:
        # If token_candidate was a valid JWT but not admin, _verify_jwt_and_require_admin
        # would have already raised HTTPException(403). Here it's either missing or invalid.
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not DB_ENABLED:
        raise HTTPException(status_code=503, detail="Database not enabled in this environment")

    # fetch sessions and their audits
    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        # Import models locally to avoid startup import cycles
        from models import Session as SessionModel, AuditLog as AuditLogModel, RiskLevelEnum

        # Base query
        q = db.query(SessionModel)
        # optional risk filter
        if risk:
            try:
                # normalize and try enum match
                rnorm = str(risk).lower()
                risk_enum = RiskLevelEnum(rnorm)
                q = q.filter(SessionModel.risk_level == risk_enum)
            except Exception:
                # fallback: compare enum name/text
                q = q.filter(SessionModel.risk_level == risk)

        q = q.order_by(SessionModel.created_at.desc())

        # Pagination mode when page is provided
        if page is not None:
            # ensure sane page/page_size
            page = max(1, int(page))
            page_size = max(1, min(200, int(page_size)))
            total = q.count()
            items = q.offset((page - 1) * page_size).limit(page_size).all()
            out_items = []
            for s in items:
                audits = db.query(AuditLogModel).filter(AuditLogModel.session_id == s.session_id).order_by(AuditLogModel.timestamp.desc()).all()
                # attempt to fetch user info if available
                user_info = None
                try:
                    from models import User as UserModel
                    if getattr(s, 'user_id', None):
                        u = db.query(UserModel).filter(UserModel.id == int(s.user_id)).first()
                        if u:
                            user_info = {"user_id": u.id, "username": u.username, "user_email": u.email}
                except Exception:
                    user_info = None
                
                # Deserialize predicted_conditions from JSON
                try:
                    preds = json.loads(s.predicted_conditions) if s.predicted_conditions else []
                except (json.JSONDecodeError, TypeError):
                    preds = []
                    
                out_items.append({
                    "session_id": s.session_id,
                    "input_text": s.input_text,
                    "risk_level": getattr(s.risk_level, 'name', str(s.risk_level)),
                    "predicted_conditions": preds,
                    "next_step": s.next_step,
                    "confidence_score": s.confidence_score,
                    "created_at": s.created_at.isoformat() if s.created_at is not None else None,
                    "user": user_info,
                    "audits": [
                        {"log_id": a.log_id, "endpoint": a.endpoint, "fallback_to_rule": bool(a.fallback_to_rule), "timestamp": a.timestamp.isoformat() if a.timestamp is not None else None}
                        for a in audits
                    ]
                })
            return {"total": total, "page": page, "page_size": page_size, "items": out_items}

        # Legacy behaviour: limit-based list
        sessions = q.limit(limit).all()
        out = []
        for s in sessions:
            # find audits for this session
            audits = db.query(AuditLogModel).filter(AuditLogModel.session_id == s.session_id).order_by(AuditLogModel.timestamp.desc()).all()
            # attempt to fetch user info if available
            user_info = None
            try:
                from models import User as UserModel
                if getattr(s, 'user_id', None):
                    u = db.query(UserModel).filter(UserModel.id == int(s.user_id)).first()
                    if u:
                        user_info = {"user_id": u.id, "username": u.username, "user_email": u.email}
            except Exception:
                user_info = None
            
            # Deserialize predicted_conditions from JSON
            try:
                preds = json.loads(s.predicted_conditions) if s.predicted_conditions else []
            except (json.JSONDecodeError, TypeError):
                preds = []
                
            out.append({
                "session_id": s.session_id,
                "input_text": s.input_text,
                "risk_level": getattr(s.risk_level, 'name', str(s.risk_level)),
                "predicted_conditions": preds,
                "next_step": s.next_step,
                "confidence_score": s.confidence_score,
                "created_at": s.created_at.isoformat() if s.created_at is not None else None,
                "user": user_info,
                "audits": [
                    {"log_id": a.log_id, "endpoint": a.endpoint, "fallback_to_rule": bool(a.fallback_to_rule), "timestamp": a.timestamp.isoformat() if a.timestamp is not None else None}
                    for a in audits
                ]
            })
        return out
    finally:
        try:
            db_gen.close()
        except Exception:
            pass
