from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from ...services.appointment_engine import AppointmentEngine

router = APIRouter()
engine = AppointmentEngine()

class AppointmentRequest(BaseModel):
    user_id: str
    provider_id: str
    start_time: str
    end_time: str

@router.post("/schedule", response_model=Dict[str, Any])
async def schedule_appointment(request: AppointmentRequest):
    try:
        result = await engine.schedule_appointment(
            request.user_id, request.provider_id, request.start_time, request.end_time
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{appointment_id}", response_model=Dict[str, Any])
async def cancel_appointment(appointment_id: str):
    try:
        result = await engine.cancel_appointment(appointment_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
