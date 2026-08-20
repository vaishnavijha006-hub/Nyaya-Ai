import pytest
from app.services.data_rights_engine import DataRightsEngine
from app.services.deletion_engine import DeletionEngine

def test_data_rights_idempotency_and_state_machine():
    engine = DataRightsEngine()
    user_id = "user_456"
    details = {"idempotency_key": "unique_key_1"}
    
    # 1. Idempotent creation
    req1 = engine.create_request(user_id, "DELETE", details)
    req2 = engine.create_request(user_id, "DELETE", details)
    assert req1["id"] == req2["id"]
    assert req1["status"] == "PENDING"
    
    # 2. State Machine Transitions
    req_id = req1["id"]
    engine.transition_state(req_id, "PROCESSING")
    assert engine.get_request_status(req_id)["status"] == "PROCESSING"
    
    # Idempotent state transition
    engine.transition_state(req_id, "PROCESSING")
    assert engine.get_request_status(req_id)["status"] == "PROCESSING"
    
    # Invalid state transition should raise Error
    with pytest.raises(ValueError) as exc_info:
        engine.transition_state(req_id, "PENDING")
    assert "Invalid state transition" in str(exc_info.value)
    
    # Valid completion
    engine.transition_state(req_id, "COMPLETED")
    assert engine.get_request_status(req_id)["status"] == "COMPLETED"

def test_deletion_engine_idempotency():
    del_engine = DeletionEngine(None)
    request_id = "req_123"
    
    # Normal transition
    res1 = del_engine.transition_state(request_id, "REQUESTED", "UNDER_REVIEW")
    assert res1["status"] == "UNDER_REVIEW"
    
    # Idempotent transition
    res2 = del_engine.transition_state(request_id, "UNDER_REVIEW", "UNDER_REVIEW")
    assert res2["status"] == "UNDER_REVIEW"
    assert res2["message"] == "Idempotent transition"
    
    # Invalid transition
    with pytest.raises(ValueError):
        del_engine.transition_state(request_id, "REQUESTED", "APPROVED")
