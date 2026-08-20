from typing import Dict, Any, Optional
from supabase import Client
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def mark_resolution(supabase: Client, user_id: str, case_id: str, status: str, details: str) -> Dict[str, Any]:
    try:
        # Check if already resolved
        existing = supabase.table("case_resolutions").select("*").eq("case_id", case_id).eq("user_id", user_id).execute()
        
        if existing.data:
            # Update existing resolution
            data = {
                "resolution_status": status,
                "resolution_details": details,
                "updated_at": datetime.utcnow().isoformat()
            }
            res = supabase.table("case_resolutions").update(data).eq("case_id", case_id).eq("user_id", user_id).execute()
            return res.data[0] if res.data else {}
        else:
            # Insert new resolution
            data = {
                "case_id": case_id,
                "user_id": user_id,
                "resolution_status": status,
                "resolution_details": details,
                "resolved_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            res = supabase.table("case_resolutions").insert(data).execute()
            return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error marking resolution: {e}")
        raise e

async def get_resolution(supabase: Client, user_id: str, case_id: str) -> Optional[Dict[str, Any]]:
    try:
        res = supabase.table("case_resolutions").select("*").eq("case_id", case_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error fetching resolution: {e}")
        return None
