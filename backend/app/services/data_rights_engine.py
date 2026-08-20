import uuid
from datetime import datetime

class DataRightsEngine:
    def __init__(self, db_client=None):
        self.db = db_client
        self._requests = {}
        self.valid_transitions = {
            "PENDING": ["PROCESSING", "REJECTED"],
            "PROCESSING": ["COMPLETED", "FAILED"],
            "COMPLETED": [],
            "REJECTED": [],
            "FAILED": ["PENDING"]
        }

    def create_request(self, user_id: str, request_type: str, details: dict):
        # Implement idempotency key if present in details
        idempotency_key = details.get("idempotency_key")
        if idempotency_key:
            for req in self._requests.values():
                if req.get("details", {}).get("idempotency_key") == idempotency_key:
                    return req # Return existing request for idempotency

        request_id = str(uuid.uuid4())
        data = {
            "id": request_id,
            "user_id": user_id,
            "request_type": request_type,
            "status": "PENDING",
            "details": details,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        self._requests[request_id] = data
        return data

    def transition_state(self, request_id: str, new_state: str):
        if request_id not in self._requests:
            raise ValueError("Request not found")
            
        current_state = self._requests[request_id]["status"]
        if current_state == new_state:
            return self._requests[request_id] # Idempotent transition
            
        if new_state not in self.valid_transitions.get(current_state, []):
            raise ValueError(f"Invalid state transition from {current_state} to {new_state}")
            
        self._requests[request_id]["status"] = new_state
        self._requests[request_id]["updated_at"] = datetime.utcnow().isoformat()
        return self._requests[request_id]

    def process_request(self, request_id: str):
        req = self.transition_state(request_id, "PROCESSING")
        # In a real system, route to proper engine. For now, simulate completion.
        return self.transition_state(request_id, "COMPLETED")

    def get_request_status(self, request_id: str):
        return self._requests.get(request_id)
