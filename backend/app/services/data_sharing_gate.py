from typing import Dict, Any
from sqlalchemy.orm import Session
from .consent_engine import ConsentEngine
from .governance_engine import GovernanceEngine

class DataSharingGate:
    def __init__(self, db: Session):
        self.db = db
        self.consent_engine = ConsentEngine(db)
        self.governance_engine = GovernanceEngine(db)

    async def authorize_sharing(self, user_id: str, destination: str, data: Dict[str, Any]) -> bool:
        """
        Gatekeep data sharing based on consent and governance policies.
        """
        # 1. Check if policy allows sharing to destination
        eval_result = await self.governance_engine.evaluate_action(
            user_id, f"share_data_{destination}", {"data_keys": list(data.keys())}
        )
        if not eval_result["allowed"]:
            return False

        # 2. Check if user consented to share data with this destination
        consent_granted = await self.consent_engine.check_consent(user_id, f"data_sharing_{destination}")
        if not consent_granted:
            return False

        # 3. Log data sharing event
        # ... log to data_sharing_events table
        
        return True
