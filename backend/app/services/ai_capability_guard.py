from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .governance_engine import GovernanceEngine

class AICapabilityGuard:
    def __init__(self, db: Session):
        self.db = db
        self.governance_engine = GovernanceEngine(db)

    async def check_capability(self, user_id: str, capability: str, context: Dict[str, Any] = None) -> bool:
        """
        Check if the AI is authorized to use a specific capability (e.g., generate legal document).
        """
        eval_result = await self.governance_engine.evaluate_action(
            user_id, f"use_capability_{capability}", context or {}
        )
        return eval_result.get("allowed", False)
