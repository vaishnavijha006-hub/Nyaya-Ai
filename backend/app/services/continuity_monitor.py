import logging
from datetime import datetime, timedelta
from .continuity_score import calculate_health_score
from .continuity_intervention import trigger_intervention
from .continuity_incident import check_incidents

logger = logging.getLogger(__name__)

class ContinuityMonitor:
    def __init__(self, stall_threshold_hours=24):
        self.stall_threshold = timedelta(hours=stall_threshold_hours)

    async def evaluate(self, session_id: str, case_info: dict) -> dict:
        logger.info(f"[ContinuityMonitor] Evaluating continuity for {session_id}")
        
        incidents = await check_incidents(session_id)
        if incidents and incidents.get("critical_incidents"):
            return {
                "status": "BLOCKED",
                "reason": f"Critical continuity incident: {incidents['critical_incidents'][0]['details']}"
            }
            
        last_updated_str = case_info.get("last_updated_at")
        if last_updated_str:
            last_updated = datetime.fromisoformat(last_updated_str)
            if datetime.utcnow() - last_updated > self.stall_threshold:
                await trigger_intervention(session_id, "STALLED_WORKFLOW")
                return {
                    "status": "STALLED",
                    "reason": f"Workflow stalled for more than {self.stall_threshold.total_seconds() / 3600} hours"
                }

        score = await calculate_health_score(session_id)
        if score < 50.0:
            await trigger_intervention(session_id, "LOW_HEALTH_SCORE")
            
        return {"status": "OK", "score": score}
