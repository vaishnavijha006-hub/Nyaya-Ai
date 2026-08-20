from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from supabase import Client
from app.core.dependencies import get_supabase, get_current_user
from app.services.case_timeline import get_case_timeline
from app.services.case_summary import generate_case_summary

router = APIRouter(prefix="/cases", tags=["cases"])

@router.get("/{case_id}/timeline")
async def fetch_case_timeline(
    case_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    return await get_case_timeline(supabase, user_id, case_id)

@router.get("/{case_id}/summary")
async def fetch_case_summary(
    case_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    return await generate_case_summary(supabase, user_id, case_id)
