from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from app.services.prevention_engine import prevention_engine

router = APIRouter(prefix="/prevention", tags=["prevention"])

class PreventionRequest(BaseModel):
    context_data: dict

@router.post("/")
async def run_prevention(request: PreventionRequest):
    try:
        result = prevention_engine.run_prevention_pipeline(request.context_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
