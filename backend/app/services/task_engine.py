from typing import Dict, Any, List
from supabase import Client
import logging

logger = logging.getLogger(__name__)

async def create_task(supabase: Client, user_id: str, case_id: str, task_name: str, due_date: str = None) -> Dict[str, Any]:
    try:
        data = {
            "case_id": case_id,
            "user_id": user_id,
            "task_name": task_name,
            "task_status": "pending"
        }
        if due_date:
            data["due_date"] = due_date
        res = supabase.table("case_tasks").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return {}

async def update_task_status(supabase: Client, user_id: str, task_id: str, status: str) -> Dict[str, Any]:
    try:
        res = supabase.table("case_tasks").update({"task_status": status}).eq("id", task_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        return {}
