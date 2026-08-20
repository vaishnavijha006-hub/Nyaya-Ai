from typing import Dict, Any, List, Optional
from supabase import Client
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def evaluate_escalation_need(supabase: Client, user_id: str, case_id: str) -> Dict[str, Any]:
    """
    Evaluates and potentially triggers an escalation if criteria are met.
    """
    try:
        # Fetch case details to determine urgency and current escalation level
        case_res = supabase.table("cases").select("urgency, current_escalation_level").eq("id", case_id).eq("user_id", user_id).execute()
        if not case_res.data:
            return {"escalate": False, "reason": "Case not found"}
        
        case_details = case_res.data[0]
        current_level = case_details.get("current_escalation_level", 0)
        urgency = case_details.get("urgency", "LOW")
        
        if current_level < 3 and urgency == 'HIGH':
            new_level = current_level + 1
            escalation_reason = f"High urgency case escalated to level {new_level}."
            
            # Record escalation
            escalation_data = {
                "case_id": case_id,
                "user_id": user_id,
                "previous_level": current_level,
                "new_level": new_level,
                "reason": escalation_reason,
                "created_at": datetime.utcnow().isoformat()
            }
            supabase.table("case_escalations").insert(escalation_data).execute()
            
            # Update case
            supabase.table("cases").update({"current_escalation_level": new_level}).eq("id", case_id).eq("user_id", user_id).execute()
            
            return {
                "escalate": True,
                "new_level": new_level,
                "reason": escalation_reason
            }
        return {"escalate": False, "reason": "No escalation criteria met"}
    except Exception as e:
        logger.error(f"Error evaluating escalation: {e}")
        raise e

async def get_escalation_history(supabase: Client, user_id: str, case_id: str) -> List[Dict[str, Any]]:
    try:
        res = supabase.table("case_escalations").select("*").eq("case_id", case_id).eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data if res.data else []
    except Exception as e:
        logger.error(f"Error fetching escalation history: {e}")
        return []
