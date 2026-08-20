from typing import Dict, Any, List, Optional
from supabase import Client
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

VALID_TRANSITIONS = {
    "initiation": ["REQUESTED", "cancelled"],
    "REQUESTED": ["provider_verification", "cancelled"],
    "provider_verification": ["PAID", "rejected"],
    "PAID": ["active", "refunded"],
    "active": ["resolved", "escalated"],
    "escalated": ["resolved", "closed"],
    "resolved": ["closed"],
    "cancelled": [],
    "rejected": [],
    "refunded": [],
    "closed": []
}

async def create_workflow(supabase: Client, user_id: str, case_id: str, stage: str = "initiation") -> Dict[str, Any]:
    try:
        data = {
            "case_id": case_id,
            "user_id": user_id,
            "current_stage": stage,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        res = supabase.table("case_workflows").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        return {}

async def get_workflow(supabase: Client, user_id: str, case_id: str) -> Optional[Dict[str, Any]]:
    try:
        res = supabase.table("case_workflows").select("*").eq("case_id", case_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error fetching workflow: {e}")
        return None

async def update_workflow(supabase: Client, user_id: str, case_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if "current_stage" in updates:
            new_stage = updates["current_stage"]
            curr_res = supabase.table("case_workflows").select("current_stage").eq("case_id", case_id).eq("user_id", user_id).execute()
            if curr_res.data:
                curr_stage = curr_res.data[0].get("current_stage", "initiation")
                allowed = VALID_TRANSITIONS.get(curr_stage, [])
                if new_stage not in allowed:
                    logger.error(f"Invalid transition from {curr_stage} to {new_stage}")
                    raise ValueError(f"Invalid state transition from {curr_stage} to {new_stage}")

        updates["updated_at"] = datetime.utcnow().isoformat()
        res = supabase.table("case_workflows").update(updates).eq("case_id", case_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error updating workflow: {e}")
        raise e
