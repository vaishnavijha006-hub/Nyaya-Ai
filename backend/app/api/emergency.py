from fastapi import APIRouter, Depends, HTTPException
from app.services.safety import SafetyService

router = APIRouter()

@router.post("/check")
async def check_emergency(request: dict):
    query = request.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query required")
    
    # In a real app, clients are injected
    safety_service = SafetyService()
    return await safety_service.process_query(query)
