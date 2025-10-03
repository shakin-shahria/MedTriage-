#!/usr/bin/env python3
"""Generate a short-lived admin JWT for local development.

Usage:
  MEDTRIAGE_ADMIN_JWT_SECRET=supersecret python scripts/generate_admin_jwt.py

This prints a Bearer token you can copy into your Authorization header.
"""
import os
import jwt
from datetime import datetime, timedelta

secret = os.environ.get("MEDTRIAGE_ADMIN_JWT_SECRET")
if not secret:
    print("Please set MEDTRIAGE_ADMIN_JWT_SECRET env var")
    raise SystemExit(1)

payload = {
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(hours=1),
    "iat": datetime.utcnow(),
}

token = jwt.encode(payload, secret, algorithm="HS256")
print(token)
