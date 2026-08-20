from typing import Dict, Any, List
from supabase import Client
import logging

logger = logging.getLogger(__name__)

async def add_timeline_event(supabase: Client, user_id: str, case_id: str, event_type: str, description: str) -> Dict[str, Any]:
    try:
        data = {
            "case_id": case_id,
            "user_id": user_id,
            "event_type": event_type,
            "event_description": description
        }
        res = supabase.table("case_timeline").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error adding timeline event: {e}")
        return {}

async def get_case_timeline(supabase: Client, user_id: str, case_id: str) -> List[Dict[str, Any]]:
    try:
        res = supabase.table("case_timeline").select("*").eq("case_id", case_id).eq("user_id", user_id).order("created_at").execute()
        return res.data if res.data else []
    except Exception as e:
        logger.error(f"Error getting case timeline: {e}")
        return []
