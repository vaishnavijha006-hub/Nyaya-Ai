from uuid import UUID
from backend.app.services.governance_engine import GovernanceEngine
from backend.app.services.privacy_access_engine import PrivacyAccessEngine
import datetime
import json

class LawyerCasePackageService:
    def __init__(self, db_client):
        self.db = db_client
        self.governance_engine = GovernanceEngine(db_client)
        self.privacy_engine = PrivacyAccessEngine(db_client)

    async def generate_package(self, lawyer_id: str, case_id: UUID) -> dict:
        # Check governance
        decision = await self.governance_engine.evaluate_action(
            user_id=lawyer_id,
            action_type="generate_case_package",
            context={"case_id": str(case_id)}
        )
        if not decision.get("allowed", False):
            raise Exception(f"Action denied by Governance Engine: {decision.get('reason')}")

        # Fetch case data
        case_data = self.db.table('cases').select('*').eq('id', str(case_id)).execute()
        
        # Log privacy access
        self.privacy_engine.log_access(
            user_id=lawyer_id,
            action="read_case_for_package",
            resource=f"case_{case_id}"
        )

        if not case_data.data:
            return {"error": "Case not found"}

        # Simulate package generation
        package_url = f"https://example.com/packages/{case_id}_{datetime.datetime.utcnow().timestamp()}.pdf"
        
        return {
            "case_id": str(case_id),
            "data": case_data.data[0],
            "package_url": package_url,
            "generated_at": datetime.datetime.utcnow().isoformat()
        }
