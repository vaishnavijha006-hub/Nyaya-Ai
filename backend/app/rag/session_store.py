"""
session_store.py — Phase 10: In-Memory Session Registry for Nyaya AI.

Manages the lifecycle of temporary session-scoped Chroma collections.

Responsibilities:
    - Register new sessions (session_id → metadata)
    - Track expiry timestamps (30 minutes default)
    - Provide lookup for session retriever
    - Background cleanup thread deletes expired sessions automatically
    - Strict isolation: session_A can never read session_B's collection

Session collection naming:
    Chroma collection: session_<uuid>
    DB subdirectory:   session-vector-db/session_<uuid>

Thread-safety:
    _SESSIONS dict is protected by _LOCK (threading.Lock).
    Background thread runs every 60 seconds.

Zero external dependencies beyond stdlib + langchain_chroma.
"""

from __future__ import annotations

import logging
import shutil
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
SESSION_TTL_SECONDS: int = 30 * 60          # 30-minute TTL
CLEANUP_INTERVAL_SECONDS: int = 60          # cleanup sweep every 60 s
SESSION_DB_ROOT: Path = Path("session-vector-db")   # relative to backend/

# ── Session registry ──────────────────────────────────────────────────────────

@dataclass
class SessionMeta:
    session_id: str
    filename: str
    pages: int
    chunks: int
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(init=False)

    def __post_init__(self):
        self.expires_at = self.created_at + SESSION_TTL_SECONDS

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    @property
    def collection_name(self) -> str:
        return f"session_{self.session_id}"

    @property
    def db_path(self) -> Path:
        return SESSION_DB_ROOT / self.collection_name

    @property
    def expires_in_seconds(self) -> int:
        return max(0, int(self.expires_at - time.time()))


_SESSIONS: Dict[str, SessionMeta] = {}
_LOCK = threading.Lock()


# ── Public API ────────────────────────────────────────────────────────────────

def register_session(filename: str, pages: int, chunks: int) -> SessionMeta:
    """
    Create and register a new session. Returns the SessionMeta with a fresh UUID.
    Thread-safe.
    """
    sid = str(uuid.uuid4())
    meta = SessionMeta(session_id=sid, filename=filename, pages=pages, chunks=chunks)
    with _LOCK:
        _SESSIONS[sid] = meta
    logger.info(f"[session] Registered session {sid} for '{filename}' ({pages}p, {chunks}c), expires in {SESSION_TTL_SECONDS}s")
    return meta


def get_session(session_id: str) -> Optional[SessionMeta]:
    """
    Look up a session. Returns None if not found or already expired.
    Expired sessions are removed on lookup (lazy expiry).
    Thread-safe.
    """
    with _LOCK:
        meta = _SESSIONS.get(session_id)
        if meta is None:
            return None
        if meta.is_expired:
            logger.info(f"[session] Session {session_id} expired on lookup — deleting.")
            _delete_session_locked(session_id)
            return None
        return meta


def delete_session(session_id: str) -> bool:
    """
    Manually delete a session and its Chroma collection. Returns True if found.
    Thread-safe.
    """
    with _LOCK:
        if session_id not in _SESSIONS:
            return False
        _delete_session_locked(session_id)
        return True


def list_active_sessions() -> list[SessionMeta]:
    """Return all non-expired sessions. Thread-safe."""
    with _LOCK:
        return [m for m in _SESSIONS.values() if not m.is_expired]


# ── Internal helpers ──────────────────────────────────────────────────────────

def _delete_session_locked(session_id: str) -> None:
    """
    MUST be called with _LOCK held.
    Removes session from registry and deletes its DB directory.
    """
    meta = _SESSIONS.pop(session_id, None)
    if meta is None:
        return
    db_path = meta.db_path
    if db_path.exists():
        try:
            shutil.rmtree(db_path)
            logger.info(f"[session] Deleted DB directory: {db_path}")
        except Exception as e:
            logger.error(f"[session] Failed to delete DB directory {db_path}: {e}")


def _cleanup_loop() -> None:
    """Background daemon thread: sweeps expired sessions every CLEANUP_INTERVAL_SECONDS."""
    logger.info("[session] Background cleanup thread started.")
    while True:
        time.sleep(CLEANUP_INTERVAL_SECONDS)
        try:
            with _LOCK:
                expired = [sid for sid, m in _SESSIONS.items() if m.is_expired]
                for sid in expired:
                    logger.info(f"[session] Auto-expiring session {sid}")
                    _delete_session_locked(sid)
            if expired:
                logger.info(f"[session] Cleaned up {len(expired)} expired session(s).")
        except Exception as e:
            logger.error(f"[session] Cleanup sweep error: {e}")


# ── Start cleanup daemon (once, on module import) ──────────────────────────────
_cleanup_thread = threading.Thread(target=_cleanup_loop, daemon=True, name="session-cleanup")
_cleanup_thread.start()
