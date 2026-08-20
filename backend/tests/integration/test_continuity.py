import pytest
from datetime import datetime, timedelta
from unittest.mock import patch
from app.services.continuity_monitor import ContinuityMonitor

@pytest.mark.asyncio
@patch("app.services.continuity_monitor.check_incidents")
@patch("app.services.continuity_monitor.calculate_health_score")
@patch("app.services.continuity_monitor.trigger_intervention")
async def test_continuity_stalled_workflow(mock_trigger, mock_health, mock_incidents):
    monitor = ContinuityMonitor(stall_threshold_hours=24)
    session_id = "sess_123"
    
    # Mock return values
    mock_incidents.return_value = {}
    mock_health.return_value = 80.0
    
    # Not stalled
    recent_time = (datetime.utcnow() - timedelta(hours=5)).isoformat()
    res1 = await monitor.evaluate(session_id, {"last_updated_at": recent_time})
    assert res1["status"] == "OK"
    
    # Stalled
    stalled_time = (datetime.utcnow() - timedelta(hours=30)).isoformat()
    res2 = await monitor.evaluate(session_id, {"last_updated_at": stalled_time})
    
    assert res2["status"] == "STALLED"
    assert "Workflow stalled" in res2["reason"]
    mock_trigger.assert_called_with(session_id, "STALLED_WORKFLOW")
