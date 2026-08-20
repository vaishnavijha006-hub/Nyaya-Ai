from typing import Dict, Any, List, Optional
from supabase import Client
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def add_case_update(supabase: Client, user_id: str, case_id: str, update_text: str, visibility: str = "private") -> Dict[str, Any]:
    try:
        data = {
            "case_id": case_id,
            "user_id": user_id,
            "update_text": update_text,
            "visibility": visibility,
            "created_at": datetime.utcnow().isoformat()
        }
        res = supabase.table("case_updates").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error adding case update: {e}")
        raise e

async def get_case_updates(supabase: Client, user_id: str, case_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    try:
        res = supabase.table("case_updates").select("*").eq("case_id", case_id).eq("user_id", user_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return res.data if res.data else []
    except Exception as e:
        logger.error(f"Error fetching case updates: {e}")
        return []

async def delete_case_update(supabase: Client, user_id: str, update_id: str) -> bool:
    try:
        res = supabase.table("case_updates").delete().eq("id", update_id).eq("user_id", user_id).execute()
        return len(res.data) > 0
    except Exception as e:
        logger.error(f"Error deleting case update: {e}")
        return False
