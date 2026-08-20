from fastapi import APIRouter, Depends
from app.services.guard.guard_service import guard_service

router = APIRouter(prefix="/api/guard", tags=["GUARD Platform Reliability Engine"])

@router.get("/status")
async def get_status():
    return await guard_service.get_system_status()

@router.get("/metrics")
async def get_metrics():
    # Placeholder for retrieving API request metrics
    return {"metrics": []}

@router.get("/incidents")
async def get_incidents():
    # Placeholder for retrieving incidents
    return {"incidents": []}
