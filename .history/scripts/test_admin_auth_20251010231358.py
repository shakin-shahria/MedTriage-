"""Quick test harness to call main.admin_sessions without running the server.

This script constructs simple request-like objects with headers and calls the
admin_sessions function to verify 401/403/200 behaviors.
"""
from types import SimpleNamespace
import os
from jose import jwt

import main


def make_bearer(token: str):
    return {"authorization": f"Bearer {token}"}


def make_request_with_headers(headers: dict):
    return SimpleNamespace(headers=headers)


def create_token(payload: dict, secret=None):
    secret = secret or os.environ.get("JWT_SECRET_KEY", "your-secret-key")
    return jwt.encode(payload, secret, algorithm="HS256")


def run_tests():
    # No token -> expect 401
    req = make_request_with_headers({})
    try:
        main.admin_sessions(request=req)
    except Exception as e:
        print("No token ->", type(e).__name__, getattr(e, 'status_code', ''), str(e))

    # Valid non-admin token -> expect 403
    non_admin_token = create_token({"sub": "2", "role": "user"})
    req = make_request_with_headers(make_bearer(non_admin_token))
    try:
        main.admin_sessions(request=req)
    except Exception as e:
        print("Non-admin token ->", type(e).__name__, getattr(e, 'status_code', ''), str(e))

    # Valid admin token -> may return 503 if DB_DISABLED or 200 with data
    admin_token = create_token({"sub": "1", "role": "admin"})
    req = make_request_with_headers(make_bearer(admin_token))
    try:
        out = main.admin_sessions(request=req)
        print("Admin token -> success, returned type:", type(out))
    except Exception as e:
        print("Admin token ->", type(e).__name__, getattr(e, 'status_code', ''), str(e))


if __name__ == '__main__':
    run_tests()
