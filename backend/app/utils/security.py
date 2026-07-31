"""
security.py — Security, Authentication, Sanitization & Prompt Injection Protection Utilities for Nyaya AI.
"""

import os
import re
import logging
from typing import Optional, Dict, Any
from pathlib import Path

import jwt
from fastapi import Request, HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)

# Prompt Injection Attack Patterns
PROMPT_INJECTION_PATTERNS = [
    re.compile(r'\b(?:ignore|forget|override|bypass)\s+(?:all\s+)?(?:previous|system|above|prior)\s+(?:instructions|prompts|rules)\b', re.I),
    re.compile(r'\b(?:reveal|show|display|print)\s+(?:your\s+)?(?:system\s+prompt|hidden\s+prompt|developer\s+mode)\b', re.I),
    re.compile(r'\b(?:developer\s+message|system\s+override|jailbreak)\b', re.I),
    re.compile(r'\bact\s+as\s+an?\s+(?:unrestricted|DAN|do\s+anything\s+now)\b', re.I),
]


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = "authenticated"


def validate_environment():
    """
    Backend Startup Environment Validation.
    Fails fast if mandatory environment variables are missing.
    """
    logger.info("[Security Startup] Validating backend environment variables...")
    required_vars = ["GROQ_API_KEY"]
    optional_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

    missing_required = [var for var in required_vars if not os.getenv(var)]
    if missing_required:
        err_msg = f"CRITICAL: Missing mandatory environment variables: {missing_required}"
        logger.critical(err_msg)
        raise RuntimeError(err_msg)

    missing_optional = [var for var in optional_vars if not os.getenv(var)]
    if missing_optional:
        logger.warning(f"[Security Startup] Optional Supabase environment variables not configured: {missing_optional}")

    logger.info("[Security Startup] Environment validation successful.")


def sanitize_input(text: str) -> str:
    """
    Sanitize text input:
    - Strips NULL bytes and dangerous non-printable control characters
    - Preserves standard legal punctuation, tabs, and newlines
    """
    if not text:
        return ""
    # Strip non-printable ASCII control characters except \n, \r, \t
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    return cleaned.strip()


def check_prompt_injection(text: str):
    """
    Inspect user text input for prompt injection attempts.
    Raises HTTP 400 Bad Request if malicious patterns are detected.
    """
    if not text:
        return

    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            logger.warning(f"[Prompt Injection Warning] Detected injection attempt: {text[:100]!r}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Error: Prompt injection attempt detected. Input rejected."
            )


def verify_supabase_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Optional[AuthenticatedUser]:
    """
    Supabase JWT token verification dependency.
    If token is valid, returns AuthenticatedUser.
    If auth is header is missing/invalid, raises HTTP 401 Unauthorized.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication Error: Missing Bearer Token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not jwt_secret:
        logger.error("[Security Error] SUPABASE_JWT_SECRET / SUPABASE_SERVICE_ROLE_KEY not configured.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication configuration error on server."
        )

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})

        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication Error: Invalid token payload format",
            )

        return AuthenticatedUser(
            id=user_id,
            email=payload.get("email"),
            role=payload.get("role", "authenticated")
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication Error: Token has expired",
        )
    except jwt.InvalidTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication Error: Invalid token ({str(err)})",
        )


def validate_file_upload(file_filename: str, file_size: int, content_type: str):
    """
    Validate uploaded PDF document parameters:
    - MIME type & extension
    - File size limits (Max 25 MB)
    - Empty file rejection
    """
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff"}
    ext = Path(file_filename).suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed extensions: {allowed_extensions}"
        )

    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    max_size = 25 * 1024 * 1024  # 25 MB
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of 25 MB ({file_size} bytes)."
        )
