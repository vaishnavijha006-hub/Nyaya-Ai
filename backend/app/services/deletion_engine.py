class DeletionEngine:
    def __init__(self, db_client):
        self.db = db_client
        self.valid_transitions = {
            "REQUESTED": ["UNDER_REVIEW"],
            "UNDER_REVIEW": ["APPROVED", "REJECTED"],
            "APPROVED": ["PROCESSING"],
            "PROCESSING": ["COMPLETED", "FAILED"],
            "COMPLETED": [],
            "REJECTED": [],
            "FAILED": []
        }

    def transition_state(self, request_id: str, current_state: str, new_state: str):
        if current_state == new_state:
            return {"status": current_state, "message": "Idempotent transition"}
        
        allowed = self.valid_transitions.get(current_state, [])
        if new_state not in allowed:
            raise ValueError(f"Invalid state transition from {current_state} to {new_state}")
            
        # self.db.update("data_rights_requests", request_id, {"status": new_state})
        return {"status": new_state}

    def execute_deletion(self, user_id: str):
        # Identify data to be deleted vs retained
        # Integration with RESILIENCE/GOVERN for compliance records
        compliance_entities = ['payment_ledger', 'legal_decision_audits']
        
        # Simulation of retention logic
        for entity in compliance_entities:
            # self.db.execute("UPDATE data_retention_status SET status = 'RETAINED_FOR_COMPLIANCE' WHERE ...")
            pass
            
        # Delete non-compliant user data
        # self.db.execute("DELETE FROM user_profiles WHERE user_id = ?", user_id)
        
        return {"status": "DELETED", "retained_for_compliance": compliance_entities}
