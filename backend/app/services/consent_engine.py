from typing import Dict, Any, Optional
import uuid

class ConsentBypassError(Exception):
    pass

class ConsentEngine:
    def __init__(self, db=None):
        self.db = db
        # In-memory registry for testing deterministic blocking
        self._consent_registry: Dict[str, set] = {}

    async def check_consent(self, user_id: str, consent_type: str) -> bool:
        """
        Check if a user has granted a specific consent.
        """
        user_consents = self._consent_registry.get(user_id, set())
        return consent_type in user_consents

    def verify_consent_deterministically(self, user_id: str, consent_type: str):
        user_consents = self._consent_registry.get(user_id, set())
        if consent_type not in user_consents:
            raise ConsentBypassError(f"LLM attempted to bypass consent: {consent_type} not granted by {user_id}")
        return True

    async def request_consent(self, user_id: str, consent_type: str, metadata: Dict[str, Any] = None) -> bool:
        """
        Record a consent request or grant.
        """
        if user_id not in self._consent_registry:
            self._consent_registry[user_id] = set()
        self._consent_registry[user_id].add(consent_type)
        return True

    async def revoke_consent(self, user_id: str, consent_type: str) -> bool:
        """
        Revoke an existing consent.
        """
        if user_id in self._consent_registry:
            self._consent_registry[user_id].discard(consent_type)
        return True
