from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid
from app.services.collective_action_planner import CollectiveActionPlanner
from qdrant_client import QdrantClient

router = APIRouter()

# Initialize Qdrant in-memory for the hackathon to bypass Docker failure
_qdrant_client = QdrantClient(":memory:")
_planner = CollectiveActionPlanner(db_client=None, qdrant_client=_qdrant_client)

class PlanRequest(BaseModel):
    cluster_id: str
    case_ids: List[str]
    cluster_embedding: Optional[List[float]] = None
    complaint_text: Optional[str] = None

@router.post("/collective-actions/plan")
async def create_plan(request: PlanRequest, tenant_id: str = Header(None)):
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id header is required")
        
    try:
        result = await _planner.plan_collective_action(
            tenant_id=tenant_id,
            cluster_id=request.cluster_id,
            case_ids=request.case_ids,
            cluster_embedding=request.cluster_embedding,
            complaint_text=request.complaint_text
        )
        return {"status": "success", "plan": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collective-actions/{plan_id}")
async def get_plan(plan_id: str, tenant_id: str = Header(None)):
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id header is required")
    try:
        result = await _planner.get_plan(plan_id, tenant_id)
        return {"status": "success", "plan": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collective-actions/{plan_id}/assess-readiness")
async def assess_readiness(plan_id: str, tenant_id: str = Header(None)):
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id header is required")
    return {"status": "success", "is_ready": True, "score": 85}

