from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from app.services.case_memory import process_case_memory

router = APIRouter(prefix="/case_memory", tags=["case_memory"])

class MemoryRequest(BaseModel):
    case_id: str
    message: str

@router.post("/process")
async def process_memory_endpoint(req: MemoryRequest):
    """
    Process new message to update case memory.
    """
    try:
        result = await process_case_memory(req.case_id, req.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
