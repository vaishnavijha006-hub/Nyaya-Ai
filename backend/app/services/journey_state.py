"""
journey_state.py — Legal Journey State Machine for Nyaya AI.

Manages per-session journey state across all stages:
  GATHER_DETAILS → REQUEST_DOCUMENTS → VERIFY_DOCUMENTS →
  LEGAL_ANALYSIS → CHECK_AID_ELIGIBILITY → ROUTE_AID →
  CASE_TYPE_ANALYSIS → ACTION_PLAN → COMPLETE

State is stored in-memory (suitable for single-process deployment).
For multi-process deployments, swap _SESSION_STORE for Redis.
"""

import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# ── Stage constants ────────────────────────────────────────────────────────────
STAGE_GATHER_DETAILS       = "GATHER_DETAILS"
STAGE_REQUEST_DOCUMENTS    = "REQUEST_DOCUMENTS"
STAGE_VERIFY_DOCUMENTS     = "VERIFY_DOCUMENTS"
STAGE_LEGAL_ANALYSIS       = "LEGAL_ANALYSIS"
STAGE_CHECK_ELIGIBILITY    = "CHECK_AID_ELIGIBILITY"
STAGE_ROUTE_AID            = "ROUTE_AID"
STAGE_CASE_TYPE_ANALYSIS   = "CASE_TYPE_ANALYSIS"
STAGE_ACTION_PLAN          = "ACTION_PLAN"
STAGE_COMPLETE             = "COMPLETE"

STAGE_ORDER = [
    STAGE_GATHER_DETAILS,
    STAGE_REQUEST_DOCUMENTS,
    STAGE_VERIFY_DOCUMENTS,
    STAGE_LEGAL_ANALYSIS,
    STAGE_CHECK_ELIGIBILITY,
    STAGE_ROUTE_AID,
    STAGE_CASE_TYPE_ANALYSIS,
    STAGE_ACTION_PLAN,
    STAGE_COMPLETE,
]

SESSION_TTL_MINUTES = 120

_lock = threading.Lock()
_SESSION_STORE: Dict[str, Dict[str, Any]] = {}


def _default_state() -> Dict[str, Any]:
    return {
        "stage": STAGE_GATHER_DETAILS,
        "owner_user_id": None,
        "intent": "UNKNOWN",
        "case_info": {},
        "documents_requested": [],
        "documents_uploaded": [],
        "documents_verified": False,
        "legal_analysis": {},
        "eligibility_profile": {},
        "eligibility_result": None,
        "eligibility_reasons": [],
        "dlsa_info": None,
        "lawyer_suggestions": [],
        "cluster_result": None,
        "pil_result": None,
        "lok_adalat_result": None,
        "pathway_recommendation": None,
        "triage_assessment": None,
        "case_package": None,
        "cluster_detection": None,
        "pattern_report": None,
        "pil_suitability": None,
        "pil_review_brief": None,
        "settlement_session": None,
        "pre_litigation_notice": None,
        "legal_aid_assessment": None,
        "adr_analysis": None,
        "delay_tracking": None,
        "action_plan": None,
        "follow_up_count": 0,
        "asked_questions": [],
        "conversation_history": [],
        "created_at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
        "updated_at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
    }


def _evict_expired() -> None:
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=SESSION_TTL_MINUTES)
    expired = [
        sid for sid, s in _SESSION_STORE.items()
        if datetime.fromisoformat(s.get("updated_at", datetime.now(timezone.utc).replace(tzinfo=None).isoformat())) < cutoff
    ]
    for sid in expired:
        del _SESSION_STORE[sid]


def get_state(session_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    from fastapi import HTTPException, status
    with _lock:
        _evict_expired()
        if session_id not in _SESSION_STORE:
            state = _default_state()
            state["owner_user_id"] = user_id
            _SESSION_STORE[session_id] = state
            logger.info(f"[journey_state] New session: {session_id} (Owner: {user_id})")
        else:
            state = _SESSION_STORE[session_id]
            owner = state.get("owner_user_id")
            if owner is not None and user_id is not None and user_id != owner:
                logger.warning(f"[Cross-User Denied] User '{user_id}' attempted to access session '{session_id}' owned by '{owner}'")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Cross-user access attempt denied."
                )
            if owner is None and user_id is not None:
                state["owner_user_id"] = user_id

        return dict(_SESSION_STORE[session_id])


def update_state(session_id: str, updates: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    from fastapi import HTTPException, status
    with _lock:
        if session_id not in _SESSION_STORE:
            state = _default_state()
            state["owner_user_id"] = user_id
            _SESSION_STORE[session_id] = state
        else:
            state = _SESSION_STORE[session_id]
            owner = state.get("owner_user_id")
            if owner is not None and user_id is not None and user_id != owner:
                logger.warning(f"[Cross-User Denied] User '{user_id}' attempted to update session '{session_id}' owned by '{owner}'")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Cross-user access attempt denied."
                )
            if owner is None and user_id is not None:
                state["owner_user_id"] = user_id

        for k, v in updates.items():
            if isinstance(v, dict) and isinstance(state.get(k), dict):
                state[k] = {**state[k], **v}
            else:
                state[k] = v
        state["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
        return dict(state)


def add_history_message(session_id: str, role: str, content: str) -> None:
    with _lock:
        if session_id not in _SESSION_STORE:
            _SESSION_STORE[session_id] = _default_state()
        history = _SESSION_STORE[session_id].get("conversation_history", [])
        history.append({"role": role, "content": content})
        # Keep last 20 turns
        _SESSION_STORE[session_id]["conversation_history"] = history[-20:]
        _SESSION_STORE[session_id]["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def get_history_str(session_id: str) -> str:
    with _lock:
        state = _SESSION_STORE.get(session_id, _default_state())
        history = state.get("conversation_history", [])
        return "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history[-8:]])


def advance_stage(session_id: str) -> str:
    with _lock:
        state = _SESSION_STORE.get(session_id, _default_state())
        current = state.get("stage", STAGE_GATHER_DETAILS)
        try:
            idx = STAGE_ORDER.index(current)
            next_stage = STAGE_ORDER[idx + 1] if idx + 1 < len(STAGE_ORDER) else STAGE_COMPLETE
        except ValueError:
            next_stage = STAGE_GATHER_DETAILS
        state["stage"] = next_stage
        state["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
        _SESSION_STORE[session_id] = state
        logger.info(f"[journey_state] {session_id}: {current} → {next_stage}")
        return next_stage


def set_stage(session_id: str, stage: str) -> None:
    with _lock:
        if session_id not in _SESSION_STORE:
            _SESSION_STORE[session_id] = _default_state()
        _SESSION_STORE[session_id]["stage"] = stage
        _SESSION_STORE[session_id]["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def reset_session(session_id: str) -> None:
    with _lock:
        _SESSION_STORE[session_id] = _default_state()
        logger.info(f"[journey_state] Session {session_id} reset.")

