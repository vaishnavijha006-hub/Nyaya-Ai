from typing import List, Dict, Any
from backend.app.services.governance_engine import GovernanceEngine
from backend.app.services.privacy_access_engine import PrivacyAccessEngine

class RepresentativeMatchingService:
    def __init__(self, db_client):
        self.db_client = db_client
        self.governance_engine = GovernanceEngine(db_client)
        self.privacy_engine = PrivacyAccessEngine(db_client)

    async def match_representatives(self, admin_user_id: str, plan_id: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Matches and nominates representatives for a collective action.
        """
        # Check governance
        decision = await self.governance_engine.evaluate_action(
            user_id=admin_user_id,
            action_type="match_representatives",
            context={"plan_id": plan_id}
        )
        if not decision.get("allowed", False):
            raise Exception(f"Action denied by Governance Engine: {decision.get('reason')}")

        # Log privacy access
        self.privacy_engine.log_access(
            user_id=admin_user_id,
            action="match_candidates_for_plan",
            resource=f"plan_{plan_id}"
        )

        # Logic to identify the best candidates based on score or criteria
        # Here we simulate by just taking the first two candidates.
        nominated = []
        for candidate in candidates[:2]: 
            rep_data = {
                "plan_id": plan_id,
                "user_id": candidate['user_id'],
                "role": "lead_petitioner",
                "status": "nominated"
            }
            result = self.db_client.table("collective_representatives").insert(rep_data).execute()
            if hasattr(result, 'data') and result.data:
                nominated.append(result.data[0])
            elif isinstance(result, dict) and "data" in result:
                nominated.append(result["data"][0])
                
        return nominated
