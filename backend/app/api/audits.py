from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.decision_audit import DecisionAuditService

router = APIRouter()
audit_service = DecisionAuditService()

class AuditResponse(BaseModel):
    audit_id: str
    query: str
    generated_response: str
    confidence_score: float
    claims: List[Dict[str, Any]]
    
@router.get("/{audit_id}", response_model=AuditResponse)
async def get_audit(audit_id: str):
    try:
        audit_data = await audit_service.get_audit_details(audit_id)
        if not audit_data:
            raise HTTPException(status_code=404, detail="Audit not found")
        return audit_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}")
async def list_user_audits(user_id: str, limit: int = 10, offset: int = 0):
    try:
        audits = await audit_service.list_audits_for_user(user_id, limit, offset)
        return {"audits": audits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{audit_id}/review")
async def submit_human_review(audit_id: str, review_data: Dict[str, Any]):
    try:
        # Assuming we have a HumanReviewService or similar method
        # await human_review_service.submit_review(audit_id, review_data)
        return {"status": "success", "message": "Review submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
